import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleStripeWebhook } from "../stripe/webhook";
import { v2 as cloudinary } from "cloudinary"; // <--- Importe o Cloudinary

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Stripe webhook route - MUST be before express.json() for signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
  );
  
  // Configure body parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // --- NOVA ROTA: Assinatura de Upload do Cloudinary ---
  // Isso permite que o frontend faça upload direto sem expor sua API Secret
  app.get("/api/sign-upload", (req, res) => {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const folder = "christmas-cards"; // Pasta onde os arquivos ficarão no Cloudinary

      // Gera a assinatura segura
      const signature = cloudinary.utils.api_sign_request(
        {
          timestamp: timestamp,
          folder: folder,
        },
        process.env.CLOUDINARY_API_SECRET!
      );

      // Retorna os dados necessários para o frontend fazer o upload
      res.json({
        signature,
        timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        folder,
      });
    } catch (error) {
      console.error("Erro ao gerar assinatura Cloudinary:", error);
      res.status(500).json({ error: "Failed to sign upload" });
    }
  });
  
  // OAuth callback under /api/oauth/callback
  // (Se não for usar login, pode comentar/remover depois)
  registerOAuthRoutes(app);
  
  // tRPC API
  // Mantemos por enquanto para o Stripe, mas sem dependência do banco MySQL
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);