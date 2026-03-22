import { sql } from "../db";

export class CommentService {
  /**
   * Lista apenas comentários raiz (sem parentId) de um post
   * com likesCount, likedByMe e repliesCount.
   */
  static async getByPostId(postId: number, currentUserId?: number) {
    return await sql`
      SELECT
        c.*,
        u.name as "authorName",
        u."avatarUrl" as "authorAvatarUrl",
        COALESCE(cl_count.count, 0)::int AS "likesCount",
        ${currentUserId
          ? sql`CASE WHEN my_like."userId" IS NOT NULL THEN true ELSE false END`
          : sql`false`
        } AS "likedByMe",
        COALESCE(reply_count.count, 0)::int AS "repliesCount"
      FROM comments c
      JOIN users u ON c."userId" = u.id
      LEFT JOIN (
        SELECT "commentId", COUNT(*)::int AS count
        FROM comment_likes
        GROUP BY "commentId"
      ) cl_count ON cl_count."commentId" = c.id
      ${currentUserId
        ? sql`LEFT JOIN comment_likes my_like ON my_like."commentId" = c.id AND my_like."userId" = ${currentUserId}`
        : sql``
      }
      LEFT JOIN (
        SELECT "parentId", COUNT(*)::int AS count
        FROM comments
        WHERE "parentId" IS NOT NULL
        GROUP BY "parentId"
      ) reply_count ON reply_count."parentId" = c.id
      WHERE c."postId" = ${postId} AND c."parentId" IS NULL
      ORDER BY c."createdAt" ASC
    `;
  }

  /**
   * Lista respostas de um comentário.
   */
  static async getReplies(parentId: number, currentUserId?: number) {
    return await sql`
      SELECT
        c.*,
        u.name as "authorName",
        u."avatarUrl" as "authorAvatarUrl",
        COALESCE(cl_count.count, 0)::int AS "likesCount",
        ${currentUserId
          ? sql`CASE WHEN my_like."userId" IS NOT NULL THEN true ELSE false END`
          : sql`false`
        } AS "likedByMe",
        0 AS "repliesCount"
      FROM comments c
      JOIN users u ON c."userId" = u.id
      LEFT JOIN (
        SELECT "commentId", COUNT(*)::int AS count
        FROM comment_likes
        GROUP BY "commentId"
      ) cl_count ON cl_count."commentId" = c.id
      ${currentUserId
        ? sql`LEFT JOIN comment_likes my_like ON my_like."commentId" = c.id AND my_like."userId" = ${currentUserId}`
        : sql``
      }
      WHERE c."parentId" = ${parentId}
      ORDER BY c."createdAt" ASC
    `;
  }

  static async create(postId: number, userId: number, content: string, parentId?: number) {
    const [comment] = parentId
      ? await sql`
          INSERT INTO comments (content, "postId", "userId", "parentId")
          VALUES (${content}, ${postId}, ${userId}, ${parentId})
          RETURNING *
        `
      : await sql`
          INSERT INTO comments (content, "postId", "userId")
          VALUES (${content}, ${postId}, ${userId})
          RETURNING *
        `;
    return comment;
  }

  static async getById(id: number) {
    const [comment] = await sql`SELECT * FROM comments WHERE id = ${id}`;
    return comment ?? null;
  }

  static async delete(id: number) {
    await sql`DELETE FROM comments WHERE id = ${id}`;
    return { success: true };
  }

  /**
   * Curtir ou descurtir um comentário (toggle).
   */
  static async toggleLike(commentId: number, userId: number) {
    const [existing] = await sql`
      SELECT id FROM comment_likes
      WHERE "commentId" = ${commentId} AND "userId" = ${userId}
    `;

    if (existing) {
      await sql`DELETE FROM comment_likes WHERE id = ${existing.id}`;
      return { liked: false };
    }

    await sql`
      INSERT INTO comment_likes ("commentId", "userId")
      VALUES (${commentId}, ${userId})
    `;
    return { liked: true };
  }
}
