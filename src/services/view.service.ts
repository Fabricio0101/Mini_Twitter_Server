import { sql } from "../db";

export class ViewService {
  static async record(postId: number, userId: number) {
    await sql`
      INSERT INTO post_views ("postId", "userId")
      VALUES (${postId}, ${userId})
      ON CONFLICT ("postId", "userId") DO NOTHING
    `;
    return { viewed: true };
  }

  static async getCount(postId: number): Promise<number> {
    const [{ count }] = await sql`
      SELECT COUNT(*) as count FROM post_views WHERE "postId" = ${postId}
    `;
    return Number(count);
  }
}
