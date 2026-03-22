import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { cors } from "@elysiajs/cors";
import { ChatService } from "../services/chat.service";

export const chatRoutes = new Elysia()
  .use(cors())
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
  )
  .guard(
    {
      async beforeHandle({ jwt, set, headers: { authorization }, request }) {
        if (request.method === "OPTIONS") return;

        if (!authorization) {
          set.status = 401;
          return { error: "Não autorizado: Token não fornecido" };
        }
        const token = authorization.split(" ")[1];

        const { AuthService } = await import("../services/auth.service");
        if (await AuthService.isTokenBlacklisted(token)) {
          set.status = 401;
          return { error: "Não autorizado: Token invalidado" };
        }

        const payload = await jwt.verify(token);
        if (!payload) {
          set.status = 401;
          return { error: "Não autorizado: Token inválido ou expirado" };
        }
      },
    },
    (app) =>
      app
        .get(
          "/conversations",
          async ({ jwt, headers: { authorization } }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;
            return await ChatService.getConversations(Number(payload.sub));
          },
          { detail: { tags: ["Chat"] } }
        )
        .post(
          "/conversations",
          async ({ body, jwt, headers: { authorization }, set }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;
            const userId = Number(payload.sub);

            if (userId === body.otherUserId) {
              set.status = 400;
              return { error: "Não é possível criar uma conversa consigo mesmo" };
            }

            return await ChatService.getOrCreateConversation(userId, body.otherUserId);
          },
          {
            body: t.Object({ otherUserId: t.Number() }),
            detail: { tags: ["Chat"] },
          }
        )
        .get(
          "/conversations/:id/messages",
          async ({ params: { id }, query, jwt, headers: { authorization }, set }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;
            const userId = Number(payload.sub);

            if (!(await ChatService.isParticipant(id, userId))) {
              set.status = 403;
              return { error: "Acesso negado" };
            }

            return await ChatService.getMessages(id, query.limit ?? 50, query.offset ?? 0);
          },
          {
            params: t.Object({ id: t.Numeric() }),
            query: t.Object({
              limit: t.Optional(t.Numeric()),
              offset: t.Optional(t.Numeric()),
            }),
            detail: { tags: ["Chat"] },
          }
        )
        .put(
          "/conversations/:id/read",
          async ({ params: { id }, jwt, headers: { authorization }, set }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;
            const userId = Number(payload.sub);

            if (!(await ChatService.isParticipant(id, userId))) {
              set.status = 403;
              return { error: "Acesso negado" };
            }

            return await ChatService.markAsRead(id, userId);
          },
          {
            params: t.Object({ id: t.Numeric() }),
            detail: { tags: ["Chat"] },
          }
        )
        .get(
          "/users/all",
          async () => {
            const { sql } = await import("../db");
            return await sql`SELECT id, name, "avatarUrl" FROM users ORDER BY name ASC`;
          },
          { detail: { tags: ["Chat"] } }
        )
  );
