import { sql } from "../db";

export class FollowService {
  static async toggle(followerId: number, followingId: number) {
    if (followerId === followingId) {
      return { error: "Você não pode seguir a si mesmo" };
    }

    const [existing] = await sql`
      SELECT id FROM follows WHERE "followerId" = ${followerId} AND "followingId" = ${followingId}
    `;

    if (existing) {
      await sql`DELETE FROM follows WHERE "followerId" = ${followerId} AND "followingId" = ${followingId}`;
      return { following: false };
    }

    await sql`INSERT INTO follows ("followerId", "followingId") VALUES (${followerId}, ${followingId})`;
    return { following: true };
  }

  static async getFollowersCount(userId: number): Promise<number> {
    const [{ count }] = await sql`SELECT COUNT(*) as count FROM follows WHERE "followingId" = ${userId}`;
    return Number(count);
  }

  static async getFollowingCount(userId: number): Promise<number> {
    const [{ count }] = await sql`SELECT COUNT(*) as count FROM follows WHERE "followerId" = ${userId}`;
    return Number(count);
  }

  static async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const [existing] = await sql`
      SELECT id FROM follows WHERE "followerId" = ${followerId} AND "followingId" = ${followingId}
    `;
    return !!existing;
  }
}
