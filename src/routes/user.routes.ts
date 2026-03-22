import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { createCors } from "../lib/cors";
import { UserService } from "../services/user.service";

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(createCors("user"))
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
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
          return { error: "Token invalidado" };
        }

        const payload = await jwt.verify(token);
        if (!payload) {
          set.status = 401;
          return { error: "Token inválido ou expirado" };
        }
      },
    },
    (app) =>
      app
        .get(
          "/me",
          async ({ jwt, headers: { authorization } }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;

            const user = await UserService.getById(Number(payload.sub));
            if (!user) {
              return { error: "Usuário não encontrado" };
            }

            return user;
          },
          {
            detail: { tags: ["Users"] },
          }
        )
        .put(
          "/me",
          async ({ body, jwt, headers: { authorization }, set }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;

            const updated = await UserService.updateProfile(Number(payload.sub), body);
            if (!updated) {
              set.status = 400;
              return { error: "Nenhum campo para atualizar" };
            }

            return updated;
          },
          {
            body: t.Object({
              name: t.Optional(t.String({ minLength: 2 })),
              bio: t.Optional(t.String()),
              location: t.Optional(t.String()),
              avatarUrl: t.Optional(t.String()),
              phone: t.Optional(t.String()),
              address: t.Optional(t.String()),
              state: t.Optional(t.String()),
              zipCode: t.Optional(t.String()),
              maritalStatus: t.Optional(t.String()),
            }),
            detail: { tags: ["Users"] },
          }
        )
        .put(
          "/me/password",
          async ({ body, jwt, headers: { authorization }, set }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;

            if (body.newPassword !== body.confirmPassword) {
              set.status = 400;
              return { error: "As senhas não coincidem" };
            }

            if (body.newPassword.length < 4) {
              set.status = 400;
              return { error: "A senha deve ter pelo menos 4 caracteres" };
            }

            return await UserService.changePassword(Number(payload.sub), body.newPassword);
          },
          {
            body: t.Object({
              newPassword: t.String({ minLength: 4 }),
              confirmPassword: t.String({ minLength: 4 }),
            }),
            detail: { tags: ["Users"] },
          }
        )
  );
