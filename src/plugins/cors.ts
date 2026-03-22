import { Elysia } from "elysia";

export const corsPlugin = new Elysia({ name: "cors-plugin" })
  .onRequest(({ request, set }) => {
    if (request.method === "OPTIONS") {
      set.headers["Access-Control-Allow-Origin"] = "*";
      set.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS";
      set.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
      set.status = 204;
      return "";
    }
  })
  .onAfterHandle(({ set }) => {
    set.headers["Access-Control-Allow-Origin"] = "*";
    set.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS";
    set.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
  });
