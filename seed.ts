import { sql } from "./src/db";

const users = [
  { name: "Alice Silva", email: "alice@example.com", password: "1234" },
  { name: "Bob Santos", email: "bob@example.com", password: "1234" },
  { name: "Charlie Oliveira", email: "charlie@example.com", password: "1234" },
  { name: "Diana Costa", email: "diana@example.com", password: "1234" },
  { name: "Eduardo Lima", email: "eduardo@example.com", password: "1234" },
];

const images = [
  "/posts/26-02-imagem-blog-2.png",
  "/posts/6877888601_6c22192bfa_z.jpg",
  "/posts/DSC_0016.jpg",
  "/posts/Navio-Petroleiro.jpg",
  "/posts/capas-crise-da-memoria-ram-por-que-os-precos-dispararam-e-como-isso-afeta-o-mundo-dos-games.png",
  "/posts/crise-economica-no-brasil...jpg",
  "/posts/decimo-terceiro-salario.jpg",
  "/posts/photo-1619410283995-43d9134e7656.jpeg",
  "/posts/codigo-html-de-programacao-de-desenvolvedor-sobrecarregado-estressado-em-laptop-e-varios-monitores-trabalhando-sob-estresse-apos-o-expediente-programador-de-aplicativos-masculino-sentindo-se-frustrado-e-cans.avif",
  "/posts/tamanho-pegnmontagem-2.avif",
];

const posts = [
  { title: "Por que blogs corporativos ainda são relevantes", content: "Muita gente acha que blog morreu, mas a verdade é que ele continua sendo uma das melhores estratégias de inbound marketing. Conteúdo de qualidade atrai visitantes qualificados e ajuda a construir autoridade no mercado.", image: images[0], authorIdx: 0 },
  { title: "Bom dia, equipe!", content: "Mais um dia de trabalho começa. Café na mão, foco na mente. Vamos fazer acontecer!", image: null, authorIdx: 1 },
  { title: "Fotografia: meu hobby favorito", content: "Essa foto capturou um momento lindo na natureza. Às vezes, precisamos parar e apreciar o mundo ao nosso redor. A fotografia me ensina isso todos os dias.", image: images[1], authorIdx: 2 },
  { title: "A beleza das paisagens naturais", content: "Tirei essa foto durante uma viagem no final de semana. A natureza tem um poder incrível de nos reconectar com o que é essencial.", image: images[2], authorIdx: 3 },
  { title: "TypeScript é essencial", content: "Depois de anos trabalhando com JavaScript puro, migrei para TypeScript e nunca mais voltei. A segurança de tipos economiza horas de debug.", image: null, authorIdx: 4 },
  { title: "Logística marítima: os gigantes do oceano", content: "Navios petroleiros são verdadeiras obras de engenharia. Cada um transporta milhões de barris e percorre rotas comerciais que movem a economia global.", image: images[3], authorIdx: 0 },
  { title: "A crise da memória RAM e o impacto nos games", content: "Com os preços da RAM disparando, gamers e entusiastas de hardware estão sentindo o impacto. Entenda por que isso acontece e como se adaptar.", image: images[4], authorIdx: 1 },
  { title: "Reflexão do dia", content: "Nem todo progresso é visível. Às vezes estamos crescendo por dentro, reorganizando pensamentos, aprendendo com os erros. Isso também é evolução.", image: null, authorIdx: 2 },
  { title: "Cenário econômico brasileiro em debate", content: "A economia brasileira enfrenta desafios complexos. Inflação, câmbio e juros altos formam um cenário que exige planejamento cuidadoso tanto de empresas quanto de pessoas físicas.", image: images[5], authorIdx: 3 },
  { title: "Décimo terceiro: como usar com sabedoria", content: "O décimo terceiro salário é uma oportunidade de ouro para quitar dívidas, montar uma reserva de emergência ou investir no futuro. Planeje antes de gastar!", image: images[6], authorIdx: 4 },
  { title: "Café e código: a combinação perfeita", content: "Nada como um bom café para dar aquele gás na hora de programar. Hoje a produtividade está em alta!", image: null, authorIdx: 0 },
  { title: "Setup minimalista de trabalho", content: "Um ambiente de trabalho bem organizado faz toda a diferença na produtividade. Meu setup atual é o mais limpo que já tive.", image: images[7], authorIdx: 1 },
  { title: "Burnout em desenvolvedores: vamos falar sobre isso", content: "A pressão por entregas, prazos apertados e a cultura de estar sempre disponível estão adoecendo profissionais de tecnologia. É importante reconhecer os sinais e buscar equilíbrio.", image: images[8], authorIdx: 2 },
  { title: "Estudando novas tecnologias", content: "Essa semana comecei a estudar Bun e Elysia. A performance é impressionante e a developer experience é muito boa. Recomendo!", image: null, authorIdx: 3 },
  { title: "Jogos e hardware: o combo perfeito", content: "Montar um PC gamer exige pesquisa e paciência, mas o resultado vale cada centavo investido. A diferença de performance é absurda.", image: images[9], authorIdx: 4 },
  { title: "Produtividade no home office", content: "Trabalhar de casa tem seus desafios. Distrações, isolamento e falta de rotina podem atrapalhar, mas com disciplina é possível manter o foco.", image: null, authorIdx: 0 },
  { title: "A importância do marketing de conteúdo", content: "Produzir conteúdo relevante e consistente é o que separa marcas medianas de marcas memoráveis. Invista em estratégia de conteúdo!", image: images[0], authorIdx: 1 },
  { title: "Fim de semana na natureza", content: "Desconectar dos eletrônicos e passar um tempo ao ar livre faz maravilhas pela saúde mental. Faça isso com mais frequência!", image: images[2], authorIdx: 2 },
  { title: "Deploy numa sexta-feira", content: "Dizem que nunca se faz deploy numa sexta. Eu fiz. E funcionou. De nada, equipe. Bom final de semana!", image: null, authorIdx: 3 },
  { title: "Economia pessoal começa com educação financeira", content: "Entender juros compostos, inflação e diversificação de investimentos deveria ser matéria obrigatória nas escolas.", image: images[5], authorIdx: 4 },
  { title: "O mercado de petróleo em 2025", content: "Com a transição energética ganhando força, o mercado de petróleo vive um momento de transformação. Quem se adaptar primeiro sai na frente.", image: images[3], authorIdx: 0 },
  { title: "Minhas leituras recentes", content: "Li três livros este mês sobre liderança e gestão de equipes. Recomendo 'O Manager de Alta Performance' do Andy Grove.", image: null, authorIdx: 1 },
  { title: "Preços de componentes: quando vai normalizar?", content: "GPUs, RAM e SSDs continuam com preços elevados. A situação melhorou, mas ainda estamos longe dos preços pré-pandemia.", image: images[4], authorIdx: 2 },
  { title: "Clean Code não é só sobre código bonito", content: "É sobre comunicação clara, manutenibilidade e respeito com quem vai ler seu código depois. Nomeie bem suas variáveis!", image: null, authorIdx: 3 },
  { title: "A arte de debugar com calma", content: "Quando um bug parece impossível, respire fundo. Muitas vezes a solução está na coisa mais simples que você não verificou.", image: images[8], authorIdx: 4 },
  { title: "Networking na área de tecnologia", content: "Participar de comunidades, eventos e contribuir em projetos open source abre portas que nenhum currículo consegue abrir.", image: null, authorIdx: 0 },
  { title: "Planejamento financeiro de fim de ano", content: "É época de repensar metas, avaliar gastos dos últimos meses e planejar o próximo ano com mais inteligência financeira.", image: images[6], authorIdx: 1 },
  { title: "Quando o setup fica pronto", content: "Depois de meses planejando, finalmente terminei meu setup de trabalho e estudo. Dual monitor, teclado mecânico e uma cadeira confortável fazem toda a diferença.", image: images[7], authorIdx: 2 },
  { title: "Domingo de descanso", content: "Hoje é dia de cozinhar, assistir série e não pensar em código. O descanso faz parte da produtividade.", image: null, authorIdx: 3 },
  { title: "Boas práticas em APIs REST", content: "Use verbos HTTP corretos, retorne status codes apropriados e documente seus endpoints. Sua API é um contrato com o frontend.", image: null, authorIdx: 4 },
];

async function seed() {
  console.log("🌱 Populando o banco de dados...");

  await sql`DELETE FROM likes`;
  await sql`DELETE FROM posts`;
  await sql`DELETE FROM users`;
  await sql`ALTER SEQUENCE users_id_seq RESTART WITH 1`;
  await sql`ALTER SEQUENCE posts_id_seq RESTART WITH 1`;
  await sql`ALTER SEQUENCE likes_id_seq RESTART WITH 1`;

  const userIds: number[] = [];
  for (const u of users) {
    const [row] = await sql`
      INSERT INTO users (name, email, password)
      VALUES (${u.name}, ${u.email}, ${u.password})
      RETURNING id
    `;
    userIds.push(row.id);
  }
  console.log(`✅ ${userIds.length} usuários criados`);

  for (const p of posts) {
    await sql`
      INSERT INTO posts (title, content, "authorId", image)
      VALUES (${p.title}, ${p.content}, ${userIds[p.authorIdx]}, ${p.image})
    `;
  }
  console.log(`✅ ${posts.length} posts criados`);

  const allPosts = await sql`SELECT id FROM posts ORDER BY id`;
  let likesCount = 0;

  for (let i = 0; i < allPosts.length; i++) {
    const postId = allPosts[i].id;
    if (i % 2 === 0) { await sql`INSERT INTO likes ("postId", "userId") VALUES (${postId}, ${userIds[0]})`; likesCount++; }
    if (i % 3 === 0) { await sql`INSERT INTO likes ("postId", "userId") VALUES (${postId}, ${userIds[1]})`; likesCount++; }
    if (i % 4 === 0) { await sql`INSERT INTO likes ("postId", "userId") VALUES (${postId}, ${userIds[2]})`; likesCount++; }
    if (i % 5 === 0) { await sql`INSERT INTO likes ("postId", "userId") VALUES (${postId}, ${userIds[3]})`; likesCount++; }
  }
  console.log(`✅ ${likesCount} likes adicionados`);

  console.log("🚀 Banco de dados populado com sucesso!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
