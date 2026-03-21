import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { CloudinaryService } from "../services/cloudinary";

export const uploadRoutes = new Elysia({ prefix: "/upload" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
  )
  .post(
    "/",
    async ({ body, jwt, headers: { authorization }, set }) => {
      if (!authorization) {
        set.status = 401;
        return { error: "Não autorizado" };
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

      const file = body.file;

      if (!file) {
        set.status = 400;
        return { error: "Nenhum arquivo enviado" };
      }

      if (file.size > 5 * 1024 * 1024) {
        set.status = 400;
        return { error: "Arquivo muito grande. Limite: 5MB" };
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        set.status = 400;
        return { error: "Tipo de arquivo não permitido. Use: JPEG, PNG, WebP ou GIF" };
      }

      try {
        const folder = body.folder || "mini-twitter";
        const url = await CloudinaryService.upload(file, folder);
        return { url };
      } catch (error) {
        console.error("Upload error:", error);
        set.status = 500;
        return { error: "Erro ao fazer upload da imagem" };
      }
    },
    {
      body: t.Object({
        file: t.File(),
        folder: t.Optional(t.String()),
      }),
      detail: { tags: ["Upload"] },
    }
  );
