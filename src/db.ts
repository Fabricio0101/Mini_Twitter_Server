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
}

initDB().catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});

export { sql };
