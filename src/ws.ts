import { Elysia, t } from "elysia";
import { jwt as jwtPlugin } from "@elysiajs/jwt";
import { ChatService } from "./services/chat.service";

const connections = new Map<number, any>();

export const wsHandler = new Elysia()
  .use(
    jwtPlugin({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
  )
  .ws("/ws/chat", {
    async open(ws) {
      const url = new URL(ws.data.request.url);
      const token = url.searchParams.get("token");

      if (!token) {
        ws.send(JSON.stringify({ type: "error", message: "Token não fornecido" }));
        ws.close();
        return;
      }

      const payload = await (ws.data as any).jwt.verify(token);
      if (!payload) {
        ws.send(JSON.stringify({ type: "error", message: "Token inválido" }));
        ws.close();
        return;
      }

      const userId = Number(payload.sub);
      (ws as any).userId = userId;
      connections.set(userId, ws);

      ws.send(JSON.stringify({ type: "connected", userId }));
    },

    async message(ws, data) {
      const userId = (ws as any).userId;
      if (!userId) return;

      try {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;

        if (parsed.type === "send_message") {
          const { conversationId, content } = parsed;

          if (!conversationId || !content) return;

          const isParticipant = await ChatService.isParticipant(conversationId, userId);
          if (!isParticipant) return;

          const message = await ChatService.createMessage(conversationId, userId, content);

          ws.send(JSON.stringify({ type: "message_received", message }));

          const conv = await ChatService.getConversationById(conversationId);
          if (conv) {
            const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
            const otherWs = connections.get(otherUserId);
            if (otherWs) {
              otherWs.send(JSON.stringify({ type: "message_received", message }));
            }
          }
        }

        if (parsed.type === "mark_read") {
          const { conversationId } = parsed;
          if (!conversationId) return;
          await ChatService.markAsRead(conversationId, userId);
        }
      } catch (e) {
        console.error("WS message error:", e);
      }
    },

    close(ws) {
      const userId = (ws as any).userId;
      if (userId) {
        connections.delete(userId);
      }
    },
  });

export { connections };
