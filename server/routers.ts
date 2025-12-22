import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import * as db from "./db"; // Mantemos apenas para músicas se ainda usar, ou removas se tudo for hardcoded
import { createCheckoutSession, retrieveCheckoutSession } from "./stripe/checkout";
import { getProductByPlan } from "./stripe/products";

// Configuração Cloudinary para leitura
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

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

  // Songs router (Pode manter ou deixar retornar vazio se estiver usando hardcoded no front)
  songs: router({
    list: publicProcedure.query(async () => {
      // Retorna vazio ou lista do DB se ainda tiver
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
        return []; // Retorna vazio se não tiver DB
      }
    }),
  }),

  // Files router - Mantido para compatibilidade, mas o front agora faz upload direto!
  files: router({
    upload: publicProcedure
      .input(z.object({
        file: z.string(),
        filename: z.string(),
        type: z.enum(["photo", "audio"]),
      }))
      .mutation(async ({ input }) => {
        // ... (Lógica antiga de upload backend, mantida caso precise de fallback)
        // Se não for usar, pode simplificar removendo
        const { file, filename, type } = input;
        const matches = file.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid file format" });
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        const ext = filename.split(".").pop() || (type === "photo" ? "jpg" : "mp3");
        const randomSuffix = nanoid(8);
        const fileKey = `christmas-cards/${type}s/${Date.now()}-${randomSuffix}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, mimeType);
        return { url, key: fileKey };
      }),
  }),

  // Cards router - REESCRITO PARA SERVERLESS
  cards: router({
    generateMessage: publicProcedure
      .input(z.object({
        recipientName: z.string().optional(),
        senderName: z.string().optional(),
        tone: z.enum(["warm", "funny", "formal", "poetic"]).default("warm"),
      }))
      .mutation(async ({ input }) => {
        // ... (Lógica de LLM mantida igual)
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
Keep the message between 50-150 words. Do not include "Dear" or signature - just the main message body.`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are a creative writer specializing in heartfelt greeting card messages." },
              { role: "user", content: prompt },
            ],
          });
          const content = response.choices[0]?.message?.content;
          return { message: (typeof content === 'string' ? content : "Merry Christmas!").trim() };
        } catch (error) {
          return { message: "Wishing you a Merry Christmas filled with joy, love, and wonderful memories!" };
        }
      }),

    // --- AQUI ESTÁ A CORREÇÃO PRINCIPAL ---
    create: publicProcedure
      .input(z.object({
        cloudinaryId: z.string(), // O ID do JSON no Cloudinary
        email: z.string().email(),
        plan: z.enum(["single", "family"]),
        creditCode: z.string().optional(),
        // Campos redundantes apenas para log ou email (opcionais na validação)
        templateId: z.number().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Sem banco de dados SQL aqui!
        // Apenas gerenciamos o pagamento.
        
        // 1. Se tiver código de crédito (Lógica simplificada ou removida se não tiver DB)
        /* Se você quiser manter sistema de crédito sem DB, precisaria validar contra
           uma lista hardcoded ou env var. Vou assumir fluxo de pagamento direto por enquanto.
           Se quiser usar cupons, recomendo usar "Stripe Promotion Codes".
        */

        // 2. Criar Sessão do Stripe
        const product = getProductByPlan(input.plan);
        const origin = ctx.req.headers.origin || ctx.req.headers.host || "http://localhost:3000";
        
        try {
          // Passamos o cloudinaryId como referência para o Stripe
          // Assim o webhook saberá qual arquivo liberar/enviar por email
          const { sessionId, checkoutUrl } = await createCheckoutSession({
            publicId: input.cloudinaryId, // Usamos o ID do Cloudinary como ID público
            plan: input.plan,
            email: input.email,
            origin: origin.startsWith("http") ? origin : `https://${origin}`,
            creditCode: undefined, // Removendo complexidade de crédito DB por agora
          });
          
          return {
            publicId: input.cloudinaryId,
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

    // --- ATUALIZADO PARA LER DO CLOUDINARY ---
    getByPublicId: publicProcedure
      .input(z.object({ publicId: z.string() }))
      .query(async ({ input }) => {
        // Agora "publicId" é na verdade o caminho do arquivo no Cloudinary
        // Ex: christmas-cards/raw/1734900000-xxxxx.json
        
        try {
          // Busca o JSON direto do Cloudinary
          // URL formato Raw: https://res.cloudinary.com/<cloud_name>/raw/upload/<public_id>
          const url = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/raw/upload/${input.publicId}`;
          
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Card not found" });
          }

          const cardData = await response.json();

          // Retorna no formato que o CardView espera
          return {
            id: 0, // Dummy ID
            publicId: input.publicId,
            templateId: cardData.templateId || 1,
            message: cardData.message || "",
            senderName: cardData.senderName,
            recipientName: cardData.recipientName,
            photoUrl: cardData.photoUrl,
            customSongUrl: cardData.songUrl, // Mapeia songUrl do JSON para customSongUrl
            songUrl: cardData.songUrl,
            viewCount: 0, // Sem DB não temos contador confiável, ou usamos Cloudinary analytics
          };

        } catch (error) {
          console.error("Error fetching card from Cloudinary:", error);
          throw new TRPCError({ code: "NOT_FOUND", message: "Card not found or expired" });
        }
      }),
  }),

  // Payments router (Adaptado)
  payments: router({
    verifySession: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const session = await retrieveCheckoutSession(input.sessionId);
        
        if (!session) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Payment session not found" });
        }
        
        // Recupera dados dos metadados do Stripe
        const publicId = session.metadata?.publicId; // Isso será o ID do Cloudinary
        
        return {
          status: session.payment_status === "paid" ? "completed" : "pending",
          publicId,
          remainingCards: 0,
          cardCount: 1,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;