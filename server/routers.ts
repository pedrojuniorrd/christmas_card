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
import { v2 as cloudinary } from "cloudinary";

// Configuração Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

  songs: router({
    list: publicProcedure.query(async () => {
      try {
        const songs = await db.getActiveSongs();
        return songs.map(song => ({
          id: song.id,
          title: song.title,
          artist: song.artist,
          duration: song.duration,
          fileUrl: song.fileUrl,
          isPremium: song.isPremium,
        }));
      } catch (e) {
        return [];
      }
    }),
  }),

  files: router({
    getUploadSignature: publicProcedure
      .mutation(async () => {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = "christmas-cards";
        const signature = cloudinary.utils.api_sign_request(
          { timestamp, folder },
          process.env.CLOUDINARY_API_SECRET!
        );
        return {
          timestamp,
          folder,
          signature,
          apiKey: process.env.CLOUDINARY_API_KEY,
          cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        };
      }),

    upload: publicProcedure
      .input(z.object({
        file: z.string(),
        filename: z.string(),
        type: z.enum(["photo", "audio"]),
      }))
      .mutation(async ({ input }) => {
        return { url: "", key: "" }; 
      }),
  }),

  cards: router({
    generateMessage: publicProcedure
      .input(z.object({
        recipientName: z.string().optional(),
        senderName: z.string().optional(),
        tone: z.enum(["warm", "funny", "formal", "poetic"]).default("warm"),
      }))
      .mutation(async ({ input }) => {
         return { message: "Merry Christmas!" };
      }),

    create: publicProcedure
      .input(z.object({
        cloudinaryId: z.string(),
        email: z.string().email(),
        plan: z.enum(["single", "family"]),
        creditCode: z.string().nullable().optional(), 
        templateId: z.number().optional(),
        message: z.string().optional(),
        currency: z.enum(["BRL", "USD"]).default("BRL"),
      }))
      .mutation(async ({ input, ctx }) => {
        const product = getProductByPlan(input.plan);
        const origin = ctx.req.headers.origin || ctx.req.headers.host || "http://localhost:3000";
        const finalOrigin = origin.includes("localhost") ? origin : `https://${origin.replace(/^https?:\/\//, '')}`;
        const realAmount = input.currency === "BRL" ? 1000 : 500;

        try {
          const { sessionId, checkoutUrl } = await createCheckoutSession({
            publicId: input.cloudinaryId,
            plan: input.plan,
            email: input.email,
            origin: finalOrigin,
            creditCode: input.creditCode, 
            currency: input.currency,
          });
          
          return {
            publicId: input.cloudinaryId,
            paymentUrl: checkoutUrl,
            amount: realAmount,
            cards: product.cardCount,
          };
        } catch (error: any) {
          console.error("❌ ERRO NO STRIPE (ROUTER):", error);
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR", 
            message: error.message || "Erro desconhecido ao processar pagamento" 
          });
        }
      }),

    getByPublicId: publicProcedure
      .input(z.object({ publicId: z.string() }))
      .query(async ({ input }) => {
          const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
          const url = `https://res.cloudinary.com/${cloudName}/raw/upload/${input.publicId}`;
          const response = await fetch(url);
          if (!response.ok) throw new TRPCError({ code: "NOT_FOUND", message: "Card not found" });
          const cardData = await response.json();
          return {
            id: 0,
            publicId: input.publicId,
            templateId: cardData.templateId || 1,
            message: cardData.message || "",
            senderName: cardData.senderName,
            recipientName: cardData.recipientName,
            photoUrl: cardData.photoUrl,
            customSongUrl: cardData.songUrl,
            songUrl: cardData.songUrl,
            viewCount: 0,
          };
      }),
  }),

  payments: router({
    verifySession: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const session = await retrieveCheckoutSession(input.sessionId);
        
        if (!session) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        }
        
        return {
          status: session.payment_status === "paid" ? "completed" : "pending",
          publicId: session.metadata?.publicId,
          remainingCards: 0,
          cardCount: 1,
          // --- CORREÇÃO AQUI: Adicionamos o creditCode no retorno ---
          creditCode: session.metadata?.creditCode || null,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;