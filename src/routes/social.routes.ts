import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { createCors } from "../lib/cors";
import { RepostService } from "../services/repost.service";
import { FollowService } from "../services/follow.service";
import { FavoriteService } from "../services/favorite.service";
import { UserService } from "../services/user.service";
import { PostService } from "../services/post.service";
import { ViewService } from "../services/view.service";

export const socialRoutes = new Elysia({ prefix: "/social" })
  .use(createCors("social"))
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
        .post(
          "/repost/:postId",
          async ({ params: { postId }, jwt, headers: { authorization } }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;
            return RepostService.toggle(Number(postId), Number(payload.sub));
          },
          {
            params: t.Object({ postId: t.String() }),
            detail: { tags: ["Social"] },
          }
        )
        .post(
          "/follow/:userId",
          async ({ params: { userId }, jwt, headers: { authorization }, set }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;
            const result = await FollowService.toggle(Number(payload.sub), Number(userId));
            if ("error" in result) {
              set.status = 400;
            }
            return result;
          },
          {
            params: t.Object({ userId: t.String() }),
            detail: { tags: ["Social"] },
          }
        )
        .post(
          "/favorite/:postId",
          async ({ params: { postId }, jwt, headers: { authorization } }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;
            return FavoriteService.toggle(Number(postId), Number(payload.sub));
          },
          {
            params: t.Object({ postId: t.String() }),
            detail: { tags: ["Social"] },
          }
        )
        .get(
          "/favorites",
          async ({ query, jwt, headers: { authorization } }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;
            return FavoriteService.getUserFavorites(
              Number(payload.sub),
              Number(query.page || 1),
              Number(query.limit || 10)
            );
          },
          {
            query: t.Object({
              page: t.Optional(t.String()),
              limit: t.Optional(t.String()),
            }),
            detail: { tags: ["Social"] },
          }
        )
        .get(
          "/profile/:userId",
          async ({ params: { userId }, jwt, headers: { authorization } }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;
            const currentUserId = Number(payload.sub);
            const targetUserId = Number(userId);

            const user = await UserService.getPublicProfile(targetUserId);
            if (!user) {
              return { error: "Usuário não encontrado" };
            }

            const following = await FollowService.isFollowing(currentUserId, targetUserId);
            const followersCount = await FollowService.getFollowersCount(targetUserId);
            const followingCount = await FollowService.getFollowingCount(targetUserId);

            return {
              ...user,
              isFollowing: following,
              followersCount,
              followingCount,
              isOwnProfile: currentUserId === targetUserId,
            };
          },
          {
            params: t.Object({ userId: t.String() }),
            detail: { tags: ["Social"] },
          }
        )
        .get(
          "/user-posts/:userId",
          async ({ params: { userId }, query, jwt, headers: { authorization } }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;
            return PostService.getUserPosts(
              Number(userId),
              Number(payload.sub),
              Number(query.page || 1),
              Number(query.limit || 10)
            );
          },
          {
            params: t.Object({ userId: t.String() }),
            query: t.Object({
              page: t.Optional(t.String()),
              limit: t.Optional(t.String()),
            }),
            detail: { tags: ["Social"] },
          }
        )
        .post(
          "/view/:postId",
          async ({ params: { postId }, jwt, headers: { authorization } }) => {
            const token = authorization!.split(" ")[1];
            const payload = (await jwt.verify(token)) as any;
            return ViewService.record(Number(postId), Number(payload.sub));
          },
          {
            params: t.Object({ postId: t.String() }),
            detail: { tags: ["Social"] },
          }
        )
  );
