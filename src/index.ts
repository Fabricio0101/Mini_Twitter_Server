import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { corsPlugin } from "./plugins/cors";
import { authRoutes } from "./routes/auth.routes";
import { postRoutes } from "./routes/post.routes";
import { commentRoutes } from "./routes/comment.routes";
import { chatRoutes } from "./routes/chat.routes";
import { uploadRoutes } from "./routes/upload.routes";
import { userRoutes } from "./routes/user.routes";
import { wsHandler } from "./ws";

const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'Mini Twitter API',
        version: '1.0.0',
        description: 'API para uma mini rede social focada em simplicidade e segurança.'
      }
    }
  }))
  .use(corsPlugin)
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
  .use(wsHandler)
  .listen(Number(process.env.PORT) || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
