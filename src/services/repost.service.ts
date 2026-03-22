import { sql } from "../db";

export class RepostService {
  static async toggle(postId: number, userId: number) {
    const [existing] = await sql`
      SELECT id FROM reposts WHERE "postId" = ${postId} AND "userId" = ${userId}
    `;

    if (existing) {
      await sql`DELETE FROM reposts WHERE "postId" = ${postId} AND "userId" = ${userId}`;
      return { reposted: false };
    }

    await sql`INSERT INTO reposts ("postId", "userId") VALUES (${postId}, ${userId})`;
    return { reposted: true };
  }

  static async getCount(postId: number): Promise<number> {
    const [{ count }] = await sql`SELECT COUNT(*) as count FROM reposts WHERE "postId" = ${postId}`;
    return Number(count);
  }
}
