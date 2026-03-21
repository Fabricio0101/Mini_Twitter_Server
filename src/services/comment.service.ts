import { sql } from "../db";

export class CommentService {
  static async getByPostId(postId: number) {
    return await sql`
      SELECT c.*, u.name as "authorName", u."avatarUrl" as "authorAvatarUrl"
      FROM comments c
      JOIN users u ON c."userId" = u.id
      WHERE c."postId" = ${postId}
      ORDER BY c."createdAt" ASC
    `;
  }

  static async create(postId: number, userId: number, content: string) {
    const [comment] = await sql`
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
}
