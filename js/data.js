/* Conteúdo do jogo: personagens, classes sociais, trilhas e missões.
   Para adicionar uma profissão nova, basta criar uma entrada em TRAILS
   (e, se quiser, um personagem em CHARACTERS apontando para ela). */

const CHARACTERS = [
  { id: 'lia',  name: 'Lia',  title: 'A Programadora',  trail: 'dev' },
  { id: 'nina', name: 'Nina', title: 'A Designer',      trail: 'design' },
  { id: 'maya', name: 'Maya', title: 'A Médica',        trail: 'saude' },
  { id: 'caio', name: 'Caio', title: 'O Chef',          trail: 'chef' },
  { id: 'teo',  name: 'Téo',  title: 'O Professor',     trail: 'prof' },
  { id: 'davi', name: 'Davi', title: 'O Empreendedor',  trail: 'empre' },
];

/* xpMult = bônus de "garra": quem começa com menos, evolui mais rápido. */
const CLASSES = {
  pobre: { name: 'Origem humilde', icon: '🪙', coins: 30,  allowance: 5,  xpMult: 1.25,
           desc: 'Poucas moedas, muita garra.', perk: '30 moedas · +25% XP (Garra)' },
  media: { name: 'Classe média',   icon: '💰', coins: 150, allowance: 15, xpMult: 1.10,
           desc: 'Um começo equilibrado.',      perk: '150 moedas · +10% XP' },
  rico:  { name: 'Família rica',   icon: '💎', coins: 600, allowance: 40, xpMult: 1.00,
           desc: 'Bolso cheio, sem atalhos no esforço.', perk: '600 moedas · XP normal' },
};

const RANKS = ['Aprendiz', 'Iniciante', 'Praticante', 'Profissional', 'Mestre'];

const TRAILS = {
  dev: {
    name: 'Programação', icon: '💻', color: '#3aa6a0', guild: 'Guilda dos Códigos',
    stages: [
      { name: 'Fundamentos', missions: [
        'Escolha um curso de lógica de programação e assista à primeira aula',
        'Escreva seu primeiro programa: um "Olá, mundo!"',
        'Resolva 3 exercícios de lógica (condições e repetições)' ] },
      { name: 'Primeiros projetos', missions: [
        'Conclua um módulo inteiro do seu curso',
        'Crie uma calculadora ou um jogo de adivinhação',
        'Crie uma conta no GitHub e publique seu primeiro projeto' ] },
      { name: 'Prática real', missions: [
        'Construa um projeto pequeno que resolva um problema seu',
        'Leia o código de outra pessoa e anote 3 coisas que aprendeu',
        'Peça para alguém testar seu projeto e corrija um problema' ] },
      { name: 'Rumo ao mercado', missions: [
        'Monte um portfólio com seus 3 melhores projetos',
        'Atualize seu currículo ou perfil profissional',
        'Candidate-se a uma vaga, estágio ou projeto freelance' ] },
    ],
    daily: [
      'Programe por 25 minutos sem distrações',
      'Resolva 1 desafio de programação',
      'Assista a 1 aula do seu curso',
      'Leia um artigo ou documentação sobre algo que você não conhece',
      'Explique para alguém (ou para um patinho) o que você aprendeu hoje',
    ],
  },
  design: {
    name: 'Design', icon: '🎨', color: '#d9628f', guild: 'Ateliê das Cores',
    stages: [
      { name: 'Fundamentos', missions: [
        'Escolha um curso de design e assista à primeira aula',
        'Estude os princípios: contraste, alinhamento, repetição e proximidade',
        'Monte uma paleta de cores e escolha 2 fontes que combinem' ] },
      { name: 'Ferramentas', missions: [
        'Conclua um módulo inteiro do seu curso',
        'Recrie uma tela ou cartaz que você admira, para treinar',
        'Crie um cartão de visitas ou post para um amigo' ] },
      { name: 'Prática real', missions: [
        'Faça o design completo de um projeto pessoal (3 telas ou peças)',
        'Mostre seu trabalho para 2 pessoas e anote o feedback',
        'Refaça uma peça aplicando o feedback recebido' ] },
      { name: 'Rumo ao mercado', missions: [
        'Monte um portfólio online com seus melhores trabalhos',
        'Escreva o estudo de caso de um projeto (problema → solução)',
        'Ofereça seu serviço para um cliente real ou candidate-se a uma vaga' ] },
    ],
    daily: [
      'Desenhe ou crie algo por 25 minutos',
      'Salve 3 referências visuais que te inspiram e diga por quê',
      'Assista a 1 aula do seu curso',
      'Repare no design de algo do seu dia (embalagem, app, placa) e pense em como melhorar',
      'Aprenda 1 atalho ou recurso novo da sua ferramenta',
    ],
  },
  saude: {
    name: 'Saúde', icon: '🩺', color: '#e05a4f', guild: 'Casa da Cura',
    stages: [
      { name: 'Descoberta', missions: [
        'Pesquise as carreiras da saúde e escolha a que mais combina com você',
        'Descubra o que é preciso para entrar: curso técnico, faculdade ou vestibular',
        'Converse com um profissional da área sobre a rotina dele' ] },
      { name: 'Base de estudos', missions: [
        'Monte um plano de estudos semanal e cumpra por 7 dias',
        'Revise um capítulo de biologia (corpo humano)',
        'Faça um curso gratuito de primeiros socorros' ] },
      { name: 'Prática real', missions: [
        'Faça um simulado ou prova antiga da área',
        'Participe de uma ação voluntária ou campanha de saúde',
        'Ensine a alguém o que aprendeu sobre primeiros socorros' ] },
      { name: 'Rumo à formação', missions: [
        'Inscreva-se no vestibular, processo seletivo ou curso técnico',
        'Organize seus documentos e prazos de inscrição',
        'Monte sua rotina de estudos para os próximos 3 meses' ] },
    ],
    daily: [
      'Estude biologia ou química por 25 minutos',
      'Resolva 5 questões de prova',
      'Beba água e faça 15 minutos de movimento — cuidar de si também conta',
      'Leia uma notícia confiável sobre saúde',
      'Revise as anotações de ontem por 10 minutos',
    ],
  },
  chef: {
    name: 'Gastronomia', icon: '🍳', color: '#e0a23a', guild: 'Cozinha do Reino',
    stages: [
      { name: 'Fundamentos', missions: [
        'Escolha um curso de culinária e assista à primeira aula',
        'Aprenda os cortes básicos e pratique com legumes',
        'Prepare uma receita simples seguindo tudo à risca' ] },
      { name: 'Técnicas', missions: [
        'Conclua um módulo inteiro do seu curso',
        'Domine um molho-base e um ponto de cozimento',
        'Cozinhe uma refeição completa para outra pessoa' ] },
      { name: 'Prática real', missions: [
        'Crie uma receita sua e anote medidas e passo a passo',
        'Calcule o custo de um prato por porção',
        'Peça opinião de 3 pessoas sobre um prato e melhore-o' ] },
      { name: 'Rumo ao mercado', missions: [
        'Monte um cardápio de 5 pratos com fotos',
        'Estude as regras de higiene e manipulação de alimentos',
        'Venda uma encomenda ou candidate-se a uma cozinha' ] },
    ],
    daily: [
      'Cozinhe uma refeição hoje',
      'Experimente um ingrediente ou tempero novo',
      'Assista a 1 aula do seu curso',
      'Organize e limpe sua bancada depois de cozinhar',
      'Anote uma receita que você quer testar na semana',
    ],
  },
  prof: {
    name: 'Educação', icon: '📚', color: '#5aa84e', guild: 'Escola da Vila',
    stages: [
      { name: 'Descoberta', missions: [
        'Escolha a matéria e a faixa etária que você quer ensinar',
        'Descubra a formação necessária (licenciatura, pedagogia, cursos)',
        'Converse com um professor sobre a rotina dele' ] },
      { name: 'Aprender a ensinar', missions: [
        'Comece um curso de didática e assista à primeira aula',
        'Monte um plano de aula de 20 minutos',
        'Explique um assunto para alguém e peça feedback' ] },
      { name: 'Prática real', missions: [
        'Dê uma aula ou monitoria para um colega, vizinho ou familiar',
        'Crie um material de apoio (resumo, exercício ou jogo)',
        'Grave um vídeo curto explicando um tema' ] },
      { name: 'Rumo à sala de aula', missions: [
        'Inscreva-se em um curso, vestibular ou programa de formação',
        'Monte um portfólio com seus planos de aula e materiais',
        'Ofereça aulas particulares ou voluntárias' ] },
    ],
    daily: [
      'Estude sua matéria por 25 minutos',
      'Ensine algo a alguém hoje',
      'Leia 10 páginas de um livro',
      'Assista a 1 aula do seu curso',
      'Escreva um resumo de 5 linhas do que estudou',
    ],
  },
  empre: {
    name: 'Empreendedorismo', icon: '🚀', color: '#8a5ad9', guild: 'Mercado Central',
    stages: [
      { name: 'A ideia', missions: [
        'Liste 5 problemas que você vê ao seu redor',
        'Escolha um problema e escreva sua ideia de solução em 3 frases',
        'Converse com 3 pessoas que têm esse problema' ] },
      { name: 'Planejamento', missions: [
        'Faça um curso gratuito de empreendedorismo (1º módulo)',
        'Calcule seus custos e defina um preço',
        'Descreva seu cliente ideal e onde encontrá-lo' ] },
      { name: 'Prática real', missions: [
        'Crie a versão mais simples do seu produto ou serviço',
        'Faça sua primeira venda (ou primeiro teste com cliente)',
        'Anote o que deu certo, o que deu errado e ajuste' ] },
      { name: 'Crescimento', missions: [
        'Crie uma página ou perfil para o seu negócio',
        'Organize um controle simples de entradas e saídas',
        'Pesquise como formalizar o negócio (MEI) e dê o primeiro passo' ] },
    ],
    daily: [
      'Trabalhe 25 minutos na sua ideia',
      'Anote todos os seus gastos de hoje',
      'Fale com 1 possível cliente',
      'Assista a 1 aula ou leia 1 artigo sobre negócios',
      'Observe um negócio do seu bairro e anote uma boa prática',
    ],
  },
};

/* Missões do dia que servem para qualquer trilha. */
const DAILY_GENERIC = [
  'Arrume seu espaço de estudo ou trabalho',
  'Durma pelo menos 7 horas esta noite',
  'Escreva suas 3 prioridades de amanhã',
  'Fique 30 minutos longe das redes sociais para focar',
  'Agradeça ou ajude alguém hoje',
  'Guarde uma moedinha: separe qualquer valor para o seu futuro',
  'Faça 15 minutos de caminhada ou alongamento',
];

const SHOP = [
  { id: 'cafe',  name: 'Café forte',      icon: '☕', price: 50,  desc: 'XP em dobro na próxima missão' },
  { id: 'livro', name: 'Livro raro',      icon: '📖', price: 120, desc: '+60 XP na hora' },
  { id: 'troca', name: 'Trocar diárias',  icon: '🎲', price: 30,  desc: 'Sorteia novas missões do dia' },
];
