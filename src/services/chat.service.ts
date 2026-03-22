import { sql } from "../db";

export class ChatService {
  static async getConversations(userId: number) {
    return await sql`
      SELECT
        c.id,
        c."lastMessageAt",
        CASE
          WHEN c."user1Id" = ${userId} THEN c."user2Id"
          ELSE c."user1Id"
        END as "otherUserId",
        u.name as "otherUserName",
        u."avatarUrl" as "otherUserAvatarUrl",
        (
          SELECT content FROM messages
          WHERE "conversationId" = c.id
          ORDER BY "createdAt" DESC LIMIT 1
        ) as "lastMessage",
        (
          SELECT COUNT(*)::int FROM messages
          WHERE "conversationId" = c.id
          AND "senderId" != ${userId}
          AND "readAt" IS NULL
        ) as "unreadCount"
      FROM conversations c
      JOIN users u ON u.id = CASE
        WHEN c."user1Id" = ${userId} THEN c."user2Id"
        ELSE c."user1Id"
      END
      WHERE c."user1Id" = ${userId} OR c."user2Id" = ${userId}
      ORDER BY c."lastMessageAt" DESC
    `;
  }

  static async getOrCreateConversation(user1Id: number, user2Id: number) {
    const smallId = Math.min(user1Id, user2Id);
    const bigId = Math.max(user1Id, user2Id);

    const [existing] = await sql`
      SELECT * FROM conversations
      WHERE "user1Id" = ${smallId} AND "user2Id" = ${bigId}
    `;

    if (existing) return existing;

    const [created] = await sql`
      INSERT INTO conversations ("user1Id", "user2Id")
      VALUES (${smallId}, ${bigId})
      RETURNING *
    `;
    return created;
  }

  static async getMessages(conversationId: number, limit = 50, offset = 0) {
    return await sql`
      SELECT m.*, u.name as "senderName", u."avatarUrl" as "senderAvatarUrl"
      FROM messages m
      JOIN users u ON m."senderId" = u.id
      WHERE m."conversationId" = ${conversationId}
      ORDER BY m."createdAt" ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  static async createMessage(conversationId: number, senderId: number, content: string) {
    const [message] = await sql`
      INSERT INTO messages ("conversationId", "senderId", content)
      VALUES (${conversationId}, ${senderId}, ${content})
      RETURNING *
    `;

    await sql`
      UPDATE conversations SET "lastMessageAt" = NOW()
      WHERE id = ${conversationId}
    `;

    const [full] = await sql`
      SELECT m.*, u.name as "senderName", u."avatarUrl" as "senderAvatarUrl"
      FROM messages m
      JOIN users u ON m."senderId" = u.id
      WHERE m.id = ${message.id}
    `;

    return full;
  }

  static async markAsRead(conversationId: number, userId: number) {
    await sql`
      UPDATE messages SET "readAt" = NOW()
      WHERE "conversationId" = ${conversationId}
      AND "senderId" != ${userId}
      AND "readAt" IS NULL
    `;
    return { success: true };
  }

  static async getConversationById(id: number) {
    const [conv] = await sql`SELECT * FROM conversations WHERE id = ${id}`;
    return conv ?? null;
  }

  static async isParticipant(conversationId: number, userId: number) {
    const [conv] = await sql`
      SELECT id FROM conversations
      WHERE id = ${conversationId}
      AND ("user1Id" = ${userId} OR "user2Id" = ${userId})
    `;
    return !!conv;
  }
}
