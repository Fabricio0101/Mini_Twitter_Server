import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { createCors } from "../lib/cors";
import { CommentService } from "../services/comment.service";
import { PostService } from "../services/post.service";

export const commentRoutes = new Elysia()
  .use(createCors("comment"))
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
  )
  .get(
    "/posts/:id/comments",
    async ({ params: { id }, set }) => {
      const post = await PostService.getById(id);
      if (!post) {
        set.status = 404;
        return { error: "Post não encontrado" };
      }
      return await CommentService.getByPostId(id);
    },
    {
      params: t.Object({ id: t.Numeric() }),
      detail: { tags: ["Comments"] },
    }
  )
  .guard(
    {
      async beforeHandle({ jwt, set, headers: { authorization } }) {
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
        .post(
          "/posts/:id/comments",
          async ({ params: { id }, body, jwt, headers: { authorization }, set }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;

            const post = await PostService.getById(id);
            if (!post) {
              set.status = 404;
              return { error: "Post não encontrado" };
            }

            const comment = await CommentService.create(id, payload.sub, body.content);
            return comment;
          },
          {
            params: t.Object({ id: t.Numeric() }),
            body: t.Object({ content: t.String({ minLength: 1 }) }),
            detail: { tags: ["Comments"] },
          }
        )
        .delete(
          "/comments/:id",
          async ({ params: { id }, jwt, headers: { authorization }, set }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;

            const comment = await CommentService.getById(id);
            if (!comment) {
              set.status = 404;
              return { error: "Comentário não encontrado" };
            }

            if (comment.userId.toString() !== payload.sub) {
              set.status = 403;
              return { error: "Acesso negado: Você não é o autor deste comentário" };
            }

            return await CommentService.delete(id);
          },
          {
            params: t.Object({ id: t.Numeric() }),
            detail: { tags: ["Comments"] },
          }
        )
  );
