import { sql } from "../db";

export class FavoriteService {
  static async toggle(postId: number, userId: number) {
    const [existing] = await sql`
      SELECT id FROM favorites WHERE "postId" = ${postId} AND "userId" = ${userId}
    `;

    if (existing) {
      await sql`DELETE FROM favorites WHERE "postId" = ${postId} AND "userId" = ${userId}`;
      return { favorited: false };
    }

    await sql`INSERT INTO favorites ("postId", "userId") VALUES (${postId}, ${userId})`;
    return { favorited: true };
  }

  static async getUserFavorites(userId: number, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const posts = await sql`
      SELECT p.id, p.title, p.content, p.image, p."createdAt",
        u.name as "authorName", u."avatarUrl" as "authorAvatarUrl",
        (SELECT COUNT(*) FROM likes WHERE "postId" = p.id) as "likesCount",
        (SELECT COUNT(*) FROM likes WHERE "postId" = p.id AND "userId" = ${userId}) as "likedByMe",
        (SELECT COUNT(*) FROM comments WHERE "postId" = p.id) as "commentsCount",
        (SELECT COUNT(*) FROM reposts WHERE "postId" = p.id) as "repostsCount",
        (SELECT COUNT(*) FROM favorites WHERE "postId" = p.id AND "userId" = ${userId}) as "favoritedByMe",
        CASE WHEN p."authorId" = ${userId} THEN true ELSE false END as "isOwner"
      FROM favorites f
      JOIN posts p ON f."postId" = p.id
      JOIN users u ON p."authorId" = u.id
      WHERE f."userId" = ${userId}
      ORDER BY f."createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [{ total }] = await sql`
      SELECT COUNT(*) as total FROM favorites WHERE "userId" = ${userId}
    `;

    return { posts, total: Number(total), page, limit };
  }
}
