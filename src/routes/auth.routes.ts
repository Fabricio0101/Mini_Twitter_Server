import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { corsPlugin } from "../plugins/cors";
import { AuthService } from "../services/auth.service";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(corsPlugin)
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
  )
  .post(
    "/register",
    async ({ body, set }) => {
      try {
        const user = await AuthService.register(body.name, body.email, body.password);
        set.status = 201;
        return user;
      } catch (e) {
        set.status = 400;
        return { error: "Usuário já cadastrado ou dados inválidos" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 4 }),
      }),
      detail: { tags: ["Auth"] },
    }
  )
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const user = await AuthService.login(body.email, body.password);

      if (!user) {
        set.status = 401;
        return { error: "Credenciais inválidas" };
      }

      const token = await jwt.sign({
        sub: user.id.toString(),
        name: user.name,
      });

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          bio: user.bio || null,
          location: user.location || null,
          avatarUrl: user.avatarUrl || null,
          createdAt: user.createdAt || null,
          phone: user.phone || null,
          address: user.address || null,
          state: user.state || null,
          zipCode: user.zipCode || null,
          maritalStatus: user.maritalStatus || null,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
      detail: { tags: ["Auth"] },
    }
  )
  .post(
    "/logout",
    async ({ jwt, headers: { authorization }, set }) => {
      if (!authorization) {
        set.status = 401;
        return { error: "Não autorizado" };
      }

      const token = authorization.split(" ")[1];
      const payload = await jwt.verify(token);

      if (payload && typeof payload.exp === 'number') {
        await AuthService.blacklistToken(token, payload.exp);
      }

      return { success: true, message: "Logout realizado com sucesso. Token invalidado." };
    },
    {
      detail: { tags: ["Auth"], summary: "Realiza logout e invalida o token atual" },
    }
  );
