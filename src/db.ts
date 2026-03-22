import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      bio TEXT,
      location TEXT,
      "avatarUrl" TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      phone TEXT,
      address TEXT,
      state TEXT,
      "zipCode" TEXT,
      "maritalStatus" TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      "authorId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS likes (
      id SERIAL PRIMARY KEY,
      "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE("postId", "userId")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tokens_blacklist (
      id SERIAL PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "parentId" INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE comments ADD COLUMN IF NOT EXISTS "parentId" INTEGER REFERENCES comments(id) ON DELETE CASCADE
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS comment_likes (
      id SERIAL PRIMARY KEY,
      "commentId" INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE("commentId", "userId")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      "user1Id" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "user2Id" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "lastMessageAt" TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE("user1Id", "user2Id")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      "conversationId" INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      "senderId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "readAt" TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reposts (
      id SERIAL PRIMARY KEY,
      "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE("postId", "userId")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS follows (
      id SERIAL PRIMARY KEY,
      "followerId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "followingId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE("followerId", "followingId")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS favorites (
      id SERIAL PRIMARY KEY,
      "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE("postId", "userId")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS post_views (
      id SERIAL PRIMARY KEY,
      "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE("postId", "userId")
    )
  `;
}

initDB().catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});

export { sql };
