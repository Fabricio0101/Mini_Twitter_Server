import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { createCors } from "../lib/cors";
import { PostService } from "../services/post.service";

export const postRoutes = new Elysia({ prefix: "/posts" })
  .use(createCors("post"))
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
  )
  .get(
    "/",
    async ({ query, jwt, headers: { authorization } }) => {
      const page = query.page ? parseInt(query.page as string) : 1;
      const search = query.search as string | undefined;

      let userId: string | undefined;
      if (authorization) {
        try {
          const token = authorization.split(" ")[1];
          const payload = await jwt.verify(token) as any;
          if (payload) userId = payload.sub;
        } catch {}
      }

      return await PostService.getAll(page, 10, search, userId);
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        search: t.Optional(t.String()),
      }),
      detail: { tags: ["Posts"] },
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
          return { error: "Não autorizado: Este token foi invalidado (logout realizado)" };
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
          "/",
          async ({ body, jwt, headers: { authorization }, set }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;

            if (body.image && body.image.length > 5 * 1024 * 1024) {
              set.status = 400;
              return { error: "Imagem muito grande: Limite de 5MB" };
            }

            return await PostService.create(body.title, body.content, payload.sub, body.image);
          },
          {
            body: t.Object({
              title: t.String({ minLength: 3 }),
              content: t.String({ minLength: 1 }),
              image: t.Optional(t.String()),
            }),
            detail: { tags: ["Posts"] },
          }
        )
        .put(
          "/:id",
          async ({ params: { id }, body, jwt, set, headers: { authorization } }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;
            const userId = payload.sub;

            const post = await PostService.getById(id);

            if (!post) {
              set.status = 404;
              return { error: "Post não encontrado" };
            }

            if (post.authorId.toString() !== userId) {
              set.status = 403;
              return { error: "Acesso negado: Você não é o autor deste post" };
            }

            if (body.image && body.image.length > 5 * 1024 * 1024) {
              set.status = 400;
              return { error: "Imagem muito grande: Limite de 5MB" };
            }

            return await PostService.update(id, body.title, body.content, body.image);
          },
          {
            params: t.Object({
              id: t.Numeric(),
            }),
            body: t.Object({
              title: t.String({ minLength: 3 }),
              content: t.String({ minLength: 1 }),
              image: t.Optional(t.String()),
            }),
            detail: { tags: ["Posts"] },
          }
        )
        .delete(
          "/:id",
          async ({ params: { id }, jwt, set, headers: { authorization } }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;
            const userId = payload.sub;

            const post = await PostService.getById(id);

            if (!post) {
              set.status = 404;
              return { error: "Post não encontrado" };
            }

            if (post.authorId.toString() !== userId) {
              set.status = 403;
              return { error: "Acesso negado: Você não é o autor deste post" };
            }

            return await PostService.delete(id);
          },
          {
            params: t.Object({
              id: t.Numeric(),
            }),
            detail: { tags: ["Posts"] },
          }
        )
        .post(
          "/:id/like",
          async ({ params: { id }, jwt, headers: { authorization }, set }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;
            const userId = payload.sub;

            const post = await PostService.getById(id);
            if (!post) {
              set.status = 404;
              return { error: "Post não encontrado" };
            }

            return await PostService.toggleLike(id, userId);
          },
          {
            params: t.Object({
              id: t.Numeric(),
            }),
            detail: { tags: ["Posts"] },
          }
        )
  );
