import { Elysia } from "elysia";

/**
 * Cria uma instância CORS independente com nome único.
 * Evita deduplicação do plugin @elysiajs/cors que usa
 * name: "@elysiajs/cors" (Elysia ignora plugins com nomes duplicados).
 */
export function createCors(scopeName: string) {
  return new Elysia({ name: `cors-${scopeName}` })
    .onRequest(({ request, set }) => {
      // Headers em TODAS as requests
      set.headers["Access-Control-Allow-Origin"] = "*";
      set.headers["Access-Control-Allow-Methods"] =
        "GET, POST, PUT, DELETE, PATCH, OPTIONS";
      set.headers["Access-Control-Allow-Headers"] =
        "Content-Type, Authorization";

      // Responder preflight imediatamente
      if (request.method === "OPTIONS") {
        set.status = 204;
        return "";
      }
    });
}
