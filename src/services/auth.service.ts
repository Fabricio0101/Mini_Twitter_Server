import { sql } from "../db";

export class AuthService {
  static async register(name: string, email: string, password: string) {
    const [user] = await sql`
      INSERT INTO users (name, email, password)
      VALUES (${name}, ${email}, ${password})
      RETURNING id, name, email
    `;
    return user as { id: number; name: string; email: string };
  }

  static async login(email: string, password: string) {
    const [user] = await sql`
      SELECT * FROM users WHERE email = ${email} AND password = ${password}
    `;
    return user ?? null;
  }

  static async blacklistToken(token: string, expiresAt: number) {
    const date = new Date(expiresAt * 1000).toISOString();
    await sql`
      INSERT INTO tokens_blacklist (token, "expiresAt")
      VALUES (${token}, ${date})
      ON CONFLICT DO NOTHING
    `;
  }

  static async isTokenBlacklisted(token: string) {
    const [result] = await sql`
      SELECT id FROM tokens_blacklist WHERE token = ${token}
    `;
    return !!result;
  }
}
