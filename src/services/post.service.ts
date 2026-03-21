import { sql } from "../db";

export class PostService {
  static async getAll(page: number = 1, limit: number = 10, search?: string, userId?: string) {
    const queryPage = isNaN(page) ? 1 : page;
    const offset = (queryPage - 1) * limit;

    const posts = search
      ? userId
        ? await sql`
            SELECT p.*, u.name as "authorName", u."avatarUrl" as "authorAvatarUrl",
              (SELECT COUNT(*) FROM likes WHERE "postId" = p.id) as "likesCount",
              (SELECT COUNT(*) FROM likes WHERE "postId" = p.id AND "userId" = ${userId}) as "likedByMe",
              (SELECT COUNT(*) FROM comments WHERE "postId" = p.id) as "commentsCount"
            FROM posts p
            JOIN users u ON p."authorId" = u.id
            WHERE p.title ILIKE ${"%" + search + "%"}
            ORDER BY p."createdAt" DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        : await sql`
            SELECT p.*, u.name as "authorName", u."avatarUrl" as "authorAvatarUrl",
              (SELECT COUNT(*) FROM likes WHERE "postId" = p.id) as "likesCount",
              0 as "likedByMe",
              (SELECT COUNT(*) FROM comments WHERE "postId" = p.id) as "commentsCount"
            FROM posts p
            JOIN users u ON p."authorId" = u.id
            WHERE p.title ILIKE ${"%" + search + "%"}
            ORDER BY p."createdAt" DESC
            LIMIT ${limit} OFFSET ${offset}
          `
      : userId
        ? await sql`
            SELECT p.*, u.name as "authorName", u."avatarUrl" as "authorAvatarUrl",
              (SELECT COUNT(*) FROM likes WHERE "postId" = p.id) as "likesCount",
              (SELECT COUNT(*) FROM likes WHERE "postId" = p.id AND "userId" = ${userId}) as "likedByMe",
              (SELECT COUNT(*) FROM comments WHERE "postId" = p.id) as "commentsCount"
            FROM posts p
            JOIN users u ON p."authorId" = u.id
            ORDER BY p."createdAt" DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        : await sql`
            SELECT p.*, u.name as "authorName", u."avatarUrl" as "authorAvatarUrl",
              (SELECT COUNT(*) FROM likes WHERE "postId" = p.id) as "likesCount",
              0 as "likedByMe",
              (SELECT COUNT(*) FROM comments WHERE "postId" = p.id) as "commentsCount"
            FROM posts p
            JOIN users u ON p."authorId" = u.id
            ORDER BY p."createdAt" DESC
            LIMIT ${limit} OFFSET ${offset}
          `;

    const [{ total }] = search
      ? await sql`SELECT COUNT(*) as total FROM posts p WHERE p.title ILIKE ${"%" + search + "%"}`
      : await sql`SELECT COUNT(*) as total FROM posts p`;

    return { posts, total: Number(total), page: queryPage, limit };
  }

  static async create(title: string, content: string, authorId: string, image?: string) {
    const [post] = await sql`
      INSERT INTO posts (title, content, "authorId", image)
      VALUES (${title}, ${content}, ${authorId}, ${image ?? null})
      RETURNING *
    `;
    return post;
  }

  static async getById(id: number) {
    const [post] = await sql`SELECT * FROM posts WHERE id = ${id}`;
    return post ?? null;
  }

  static async update(id: number, title: string, content: string, image?: string) {
    await sql`
      UPDATE posts SET title = ${title}, content = ${content}, image = ${image ?? null}
      WHERE id = ${id}
    `;
    return { success: true };
  }

  static async delete(id: number) {
    await sql`DELETE FROM posts WHERE id = ${id}`;
    return { success: true };
  }

  static async toggleLike(postId: number, userId: number) {
    const [existing] = await sql`
      SELECT id FROM likes WHERE "postId" = ${postId} AND "userId" = ${userId}
    `;

    if (existing) {
      await sql`DELETE FROM likes WHERE "postId" = ${postId} AND "userId" = ${userId}`;
      return { liked: false };
    }

    await sql`INSERT INTO likes ("postId", "userId") VALUES (${postId}, ${userId})`;
    return { liked: true };
  }
}
