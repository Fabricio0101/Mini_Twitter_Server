import { sql } from "./src/db";

const extraUsers = [
  { name: "Fernanda Souza", email: "fernanda@example.com", password: "password123" },
  { name: "Gabriel Martins", email: "gabriel@example.com", password: "password123" },
];

const extraPosts = [
  { title: "Primeiros passos com React", content: "Comecei a estudar React essa semana e estou impressionado com a quantidade de conteúdo disponível. Hooks mudaram minha vida!", image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop", authorIdx: 0, daysAgo: 15 },
  { title: "Café da manhã produtivo", content: "Acordei cedo hoje e já resolvi 3 bugs antes do almoço. Quem mais é team madrugada? ☕", image: null, authorIdx: 1, daysAgo: 14 },
  { title: "Review do meu setup", content: "Finalmente organizei meu setup de trabalho. Monitor ultrawide + teclado mecânico = produtividade máxima.", image: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=600&h=400&fit=crop", authorIdx: 0, daysAgo: 13 },
  { title: "Git rebase vs merge", content: "Depois de anos usando merge, finalmente entendi o poder do rebase interativo. O histórico fica muito mais limpo.", image: null, authorIdx: 1, daysAgo: 12 },
  { title: "Aprendendo sobre Docker", content: "Containerização é o futuro. Se você ainda não usa Docker nos seus projetos, comece agora!", image: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=600&h=400&fit=crop", authorIdx: 0, daysAgo: 11 },
  { title: "Minha stack favorita", content: "Next.js + TypeScript + Tailwind + Prisma. Essa combinação é imbatível para projetos full-stack modernos.", image: null, authorIdx: 1, daysAgo: 10 },
  { title: "Fim de semana de hackathon", content: "Participei de um hackathon incrível! Nosso time construiu um app de delivery em 48h. Foram as 48h mais intensas da minha vida.", image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop", authorIdx: 0, daysAgo: 9 },
  { title: "Por que Bun é o futuro", content: "Testei o Bun pra rodar meus testes e a diferença de velocidade é absurda. 10x mais rápido que o Node em alguns benchmarks.", image: null, authorIdx: 1, daysAgo: 8 },
  { title: "Astronomia e programação", content: "Sabia que a NASA usa Python pra processar dados do James Webb? Programação está literalmente nas estrelas. 🌟", image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&h=400&fit=crop", authorIdx: 0, daysAgo: 7 },
  { title: "Clean Code vale a pena?", content: "Li o livro do Uncle Bob de novo e percebi que muitas das práticas que ele ensina continuam extremamente relevantes.", image: null, authorIdx: 1, daysAgo: 6 },
  { title: "Feedback de code review", content: "Dar e receber feedback construtivo em code reviews é uma das skills mais importantes que um dev pode ter.", image: null, authorIdx: 0, daysAgo: 5 },
  { title: "API REST bem feita", content: "Endpoints bem nomeados, status codes corretos, paginação, filtros... Uma boa API faz toda a diferença no front-end.", image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=400&fit=crop", authorIdx: 1, daysAgo: 4 },
  { title: "Testes automatizados salvam vidas", content: "Quase deployei um bug crítico em produção hoje, mas minha suite de testes pegou. Sempre escrevam testes!", image: null, authorIdx: 0, daysAgo: 3 },
  { title: "Viagem para o Rio", content: "Trabalhando remotamente do Rio de Janeiro essa semana. A vista do Pão de Açúcar é inspiradora demais.", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600&h=400&fit=crop", authorIdx: 1, daysAgo: 2 },
  { title: "Dark mode ou light mode?", content: "Discussão séria: vocês preferem dark mode ou light mode? Eu sou team dark mode, meus olhos agradecem às 3 da manhã 😂", image: null, authorIdx: 0, daysAgo: 2 },
  { title: "Open source é lindo", content: "Meu primeiro PR foi aceito em um projeto open source grande hoje! Sensação incrível de contribuir pra comunidade.", image: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=600&h=400&fit=crop", authorIdx: 1, daysAgo: 1 },
];

async function seedExtra() {
  console.log("🌱 Adicionando posts extras...");

  const existingUsers = await sql`SELECT id, name FROM users`;
  console.log(`📋 ${existingUsers.length} usuários existentes`);

  const newUserIds: number[] = [];
  for (const u of extraUsers) {
    const [existing] = await sql`SELECT id FROM users WHERE email = ${u.email}`;
    if (existing) {
      newUserIds.push(existing.id);
    } else {
      const [row] = await sql`
        INSERT INTO users (name, email, password)
        VALUES (${u.name}, ${u.email}, ${u.password})
        RETURNING id
      `;
      newUserIds.push(row.id);
    }
  }
  console.log(`✅ ${newUserIds.length} usuários extras prontos`);

  const allUserIds = [...existingUsers.map((u: any) => u.id), ...newUserIds];

  for (const p of extraPosts) {
    await sql`
      INSERT INTO posts (title, content, image, "authorId", "createdAt")
      VALUES (${p.title}, ${p.content}, ${p.image}, ${newUserIds[p.authorIdx]}, NOW() - ${p.daysAgo + " days"}::interval)
    `;
  }
  console.log(`✅ ${extraPosts.length} posts extras criados`);

  const recentPosts = await sql`SELECT id FROM posts ORDER BY id DESC LIMIT ${extraPosts.length}`;
  let likesCount = 0;

  for (const post of recentPosts) {
    for (const userId of allUserIds) {
      if (Math.random() > 0.6) {
        await sql`
          INSERT INTO likes ("postId", "userId")
          VALUES (${post.id}, ${userId})
          ON CONFLICT DO NOTHING
        `;
        likesCount++;
      }
    }
  }
  console.log(`✅ ${likesCount} likes aleatórios adicionados`);

  console.log("🚀 Posts extras inseridos com sucesso!");
  process.exit(0);
}

seedExtra().catch((err) => {
  console.error("❌ Erro no seed-extra:", err);
  process.exit(1);
});
