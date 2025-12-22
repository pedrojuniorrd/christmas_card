import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import * as db from "./db";
import { createCheckoutSession, retrieveCheckoutSession } from "./stripe/checkout";
import { getProductByPlan } from "./stripe/products";

// Generate a secure, non-sequential public ID
function generatePublicId(): string {
  return nanoid(12);
}

// Generate a credit code
function generateCreditCode(): string {
  return nanoid(8).toUpperCase();
}

// Default expiration date: January 15th of next year
function getDefaultExpirationDate(): Date {
  const now = new Date();
  const year = now.getMonth() >= 11 ? now.getFullYear() + 1 : now.getFullYear();
  return new Date(year, 0, 15, 23, 59, 59);
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Songs router
  songs: router({
    list: publicProcedure.query(async () => {
      const songs = await db.getActiveSongs();
      return songs.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        fileUrl: song.fileUrl,
        isPremium: song.isPremium,
      }));
    }),
  }),

  // Files router
  files: router({
    upload: publicProcedure
      .input(z.object({
        file: z.string(),
        filename: z.string(),
        type: z.enum(["photo", "audio"]),
      }))
      .mutation(async ({ input }) => {
        const { file, filename, type } = input;
        
        const matches = file.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid file format" });
        }
        
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        
        const maxSize = type === "photo" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
        if (buffer.length > maxSize) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: `File too large. Max size: ${maxSize / 1024 / 1024}MB` 
          });
        }
        
        const ext = filename.split(".").pop() || (type === "photo" ? "jpg" : "mp3");
        const randomSuffix = nanoid(8);
        const fileKey = `christmas-cards/${type}s/${Date.now()}-${randomSuffix}.${ext}`;
        
        const { url } = await storagePut(fileKey, buffer, mimeType);
        
        return { url, key: fileKey };
      }),
  }),

  // Cards router
  cards: router({
    generateMessage: publicProcedure
      .input(z.object({
        recipientName: z.string().optional(),
        senderName: z.string().optional(),
        tone: z.enum(["warm", "funny", "formal", "poetic"]).default("warm"),
      }))
      .mutation(async ({ input }) => {
        const { recipientName, senderName, tone } = input;
        
        const toneDescriptions = {
          warm: "warm, heartfelt, and sincere",
          funny: "lighthearted, humorous, and playful",
          formal: "respectful, elegant, and traditional",
          poetic: "poetic, beautiful, and touching",
        };
        
        const prompt = `Generate a Christmas greeting message that is ${toneDescriptions[tone]}. 
${recipientName ? `The message is for someone named ${recipientName}.` : ""}
${senderName ? `The message is from ${senderName}.` : ""}
Keep the message between 50-150 words. Do not include "Dear" or signature - just the main message body.
Make it personal and touching, suitable for a Christmas card.`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are a creative writer specializing in heartfelt greeting card messages." },
              { role: "user", content: prompt },
            ],
          });
          
          const content = response.choices[0]?.message?.content;
          const message = typeof content === 'string' ? content : "Wishing you a Merry Christmas filled with joy, love, and wonderful memories. May this holiday season bring you peace and happiness!";
          
          return { message: message.trim() };
        } catch (error) {
          console.error("LLM error:", error);
          return { 
            message: "Wishing you a Merry Christmas filled with joy, love, and wonderful memories. May this holiday season bring you peace and happiness!" 
          };
        }
      }),

    create: publicProcedure
      .input(z.object({
        templateId: z.number(),
        message: z.string().min(1).max(500),
        senderName: z.string().max(100).optional(),
        recipientName: z.string().max(100).optional(),
        songId: z.number().optional(),
        customSongUrl: z.string().optional(),
        photoUrl: z.string().optional(),
        email: z.string().email(),
        plan: z.enum(["single", "family"]),
        creditCode: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const publicId = generatePublicId();
        const expiresAt = getDefaultExpirationDate();
        
        // Check if using credit code
        if (input.creditCode) {
          const credit = await db.getCardCreditByCode(input.creditCode);
          if (!credit) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired credit code" });
          }
          
          await db.createCard({
            publicId,
            templateId: input.templateId,
            message: input.message,
            senderName: input.senderName || null,
            recipientName: input.recipientName || null,
            songId: input.songId || null,
            customSongUrl: input.customSongUrl || null,
            photoUrl: input.photoUrl || null,
            paymentStatus: "completed",
            isActive: true,
            expiresAt,
            creatorEmail: input.email,
          });
          
          await db.decrementCardCredit(input.creditCode);
          
          const updatedCredit = await db.getCardCreditByCode(input.creditCode);
          
          return { 
            publicId, 
            remainingCards: updatedCredit?.remainingCards || 0,
            creditCode: input.creditCode,
          };
        }
        
        // Create card with pending payment
        await db.createCard({
          publicId,
          templateId: input.templateId,
          message: input.message,
          senderName: input.senderName || null,
          recipientName: input.recipientName || null,
          songId: input.songId || null,
          customSongUrl: input.customSongUrl || null,
          photoUrl: input.photoUrl || null,
          paymentStatus: "pending",
          isActive: false,
          expiresAt,
          creatorEmail: input.email,
        });
        
        // Create Stripe checkout session
        const product = getProductByPlan(input.plan);
        const origin = ctx.req.headers.origin || ctx.req.headers.host || "http://localhost:3000";
        const creditCode = product.cardCount > 1 ? generateCreditCode() : undefined;
        
        try {
          const { sessionId, checkoutUrl } = await createCheckoutSession({
            publicId,
            plan: input.plan,
            email: input.email,
            origin: origin.startsWith("http") ? origin : `https://${origin}`,
            creditCode,
          });
          
          // Update card with session info
          await db.updateCardPayment(publicId, sessionId || "", "stripe");
          
          return {
            publicId,
            paymentUrl: checkoutUrl,
            amount: product.priceInCents,
            cards: product.cardCount,
          };
        } catch (error) {
          console.error("Stripe checkout error:", error);
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR", 
            message: "Failed to create payment session" 
          });
        }
      }),

    getByPublicId: publicProcedure
      .input(z.object({ publicId: z.string() }))
      .query(async ({ input }) => {
        const card = await db.getCardWithSong(input.publicId);
        
        if (!card) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Card not found or expired" });
        }
        
        await db.incrementCardViewCount(input.publicId);
        
        return {
          id: card.id,
          publicId: card.publicId,
          templateId: card.templateId,
          message: card.message,
          senderName: card.senderName,
          recipientName: card.recipientName,
          photoUrl: card.photoUrl,
          customSongUrl: card.customSongUrl,
          songUrl: card.songUrl,
          viewCount: card.viewCount + 1,
        };
      }),
  }),

  // Payments router
  payments: router({
    verifySession: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        // Try to get from Stripe first
        const session = await retrieveCheckoutSession(input.sessionId);
        
        if (!session) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Payment session not found" });
        }
        
        const metadata = session.metadata || {};
        const publicId = metadata.publicId;
        const creditCode = metadata.creditCode;
        const cardCount = parseInt(metadata.cardCount || "1");
        
        let remainingCards = 0;
        if (creditCode) {
          const credit = await db.getCardCreditByCode(creditCode);
          remainingCards = credit?.remainingCards || 0;
        }
        
        return {
          status: session.payment_status === "paid" ? "completed" : "pending",
          publicId,
          creditCode: creditCode || undefined,
          remainingCards,
          cardCount,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
