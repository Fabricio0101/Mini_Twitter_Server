import { sql } from "../db";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
  phone: string | null;
  address: string | null;
  state: string | null;
  zipCode: string | null;
  maritalStatus: string | null;
}

interface UpdateProfileData {
  name?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  state?: string;
  zipCode?: string;
  maritalStatus?: string;
}

const ALLOWED_FIELDS = [
  "name", "bio", "location", "avatarUrl",
  "phone", "address", "state", "zipCode", "maritalStatus",
];

export class UserService {
  static async getById(id: number): Promise<UserProfile | null> {
    const [user] = await sql`
      SELECT id, name, email, bio, location, "avatarUrl", "createdAt",
             phone, address, state, "zipCode", "maritalStatus"
      FROM users WHERE id = ${id}
    `;
    return (user as UserProfile) ?? null;
  }

  static async getPublicProfile(id: number) {
    const [user] = await sql`
      SELECT id, name, bio, location, "avatarUrl", "createdAt"
      FROM users WHERE id = ${id}
    `;
    if (!user) return null;

    const [{ count: postsCount }] = await sql`
      SELECT COUNT(*) as count FROM posts WHERE "authorId" = ${id}
    `;

    return {
      ...user,
      postsCount: Number(postsCount),
    };
  }

  static async updateProfile(id: number, data: UpdateProfileData) {
    const updateData: Record<string, string> = {};

    for (const field of ALLOWED_FIELDS) {
      if ((data as any)[field] !== undefined) {
        updateData[field] = (data as any)[field];
      }
    }

    if (Object.keys(updateData).length === 0) return null;

    await sql`UPDATE users SET ${sql(updateData)} WHERE id = ${id}`;

    return UserService.getById(id);
  }

  static async changePassword(id: number, newPassword: string) {
    await sql`UPDATE users SET password = ${newPassword} WHERE id = ${id}`;
    return { success: true };
  }
}
