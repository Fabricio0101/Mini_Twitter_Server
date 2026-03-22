import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { authRoutes } from "./routes/auth.routes";
import { postRoutes } from "./routes/post.routes";
import { commentRoutes } from "./routes/comment.routes";
import { chatRoutes } from "./routes/chat.routes";
import { uploadRoutes } from "./routes/upload.routes";
import { userRoutes } from "./routes/user.routes";
import { wsHandler } from "./ws";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const elysia = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'Mini Twitter API',
        version: '1.0.0',
        description: 'API para uma mini rede social focada em simplicidade e segurança.'
      }
    }
  }))
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
  )
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        error: "Erro de validação",
        message: "Os dados enviados são inválidos ou estão incompletos.",
        details: error.all.map(e => ({
          field: e.path.substring(1),
          message: e.message
        }))
      };
    }

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: "Recurso não encontrado" };
    }

    console.error(error);
    return { error: "Erro interno do servidor", message: "Ocorreu um problema inesperado." };
  })
  .use(authRoutes)
  .use(postRoutes)
  .use(commentRoutes)
  .use(chatRoutes)
  .use(uploadRoutes)
  .use(userRoutes)
  .use(wsHandler);

const port = Number(process.env.PORT) || 3000;

const server = Bun.serve({
  port,
  websocket: elysia.websocket,
  async fetch(req, server) {
    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Let Elysia handle routing (including WS upgrades)
    const response = await elysia.handle(req);

    // Clone response with CORS headers
    const headers = new Headers(response.headers);
    for (const [k, v] of Object.entries(corsHeaders)) {
      headers.set(k, v);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
});

console.log(`🦊 Elysia is running at http://localhost:${port}`);
