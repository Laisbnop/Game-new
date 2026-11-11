/* Dados do jogo: contextos familiares, profissões, moradores e itens. */

/* Contexto socioeconômico = a realidade da FAMÍLIA do personagem aos 17 anos.
   Não dá bônus: muda a casa e a história (veja story.js). */
const CONTEXTS = {
  pobre: { name: 'Pobre',        card: 'Sua família vive com o orçamento apertado.',
           known: 'Sua família vive com o orçamento apertado. Em casa, tempo e dinheiro são contados.' },
  media: { name: 'Classe média', card: 'Sua família equilibra as contas mês a mês.',
           known: 'Sua família equilibra as contas mês a mês. Cada escolha de gasto significa abrir mão de outra.' },
  rico:  { name: 'Rico',         card: 'Sua família tem muitos recursos.',
           known: 'Sua família tem muitos recursos — e muitas expectativas sobre o seu futuro.' },
};

const START_AGE = 17;
const START_COINS = 20;        // dinheiro pessoal: igual para todo mundo
const DAY_START = 6 * 60;      // 06:00, em minutos
const RANKS = ['Aprendiz', 'Ajudante', 'Oficial', 'Profissional', 'Mestre'];

const L = (body, skin, hair, hairColor, top, bottom, extra) => Object.assign({ body, skin, hair, hairColor, outfit: [top, bottom] }, extra);

/* Profissões. place = mapa do local de trabalho; mentor = colega que orienta. */
const JOBS = {
  medico:     { name: 'Médico',           nameF: 'Médica',          area: 'Medicina',    icon: '🩺', place: 'hospital',    placeName: 'Hospital',            color: '#e05a4f',
                tools: 'maleta, termômetro e estetoscópio', mentor: { name: 'Enfermeira Bia', look: L('f', 's4', 'trancas', 'castanho', '#e8f4f4', '#4a8ab8') } },
  chef:       { name: 'Cozinheiro',       nameF: 'Cozinheira',      area: 'Cozinha',     icon: '🍳', place: 'restaurante', placeName: 'Restaurante da Vila', color: '#e0a23a',
                tools: 'avental, faca e colher de pau', mentor: { name: 'Chef Dandara', look: L('f', 's5', 'crespo', 'preto', '#f4f4f4', '#3a3a4a', { hat: 'chef' }) } },
  design:     { name: 'Designer',         nameF: 'Designer',        area: 'Design',      icon: '🎨', place: 'estudio',     placeName: 'Estúdio de Design',   color: '#d9628f',
                tools: 'prancheta, réguas e canetas', mentor: { name: 'Íris', look: L('f', 's3', 'ondulado', 'rosa', '#f2c53d', '#5a3a7a') } },
  pintor:     { name: 'Artista — pintor', nameF: 'Artista — pintora', area: 'Pintura',   icon: '🖌️', place: 'atelie',      placeName: 'Ateliê de Pintura',   color: '#8a5ad9',
                tools: 'pincéis, tintas e cavalete', mentor: { name: 'Mestre Caetano', look: L('m', 's4', 'cacheado', 'grisalho', '#3a6a8a', '#5a4a3a') } },
  ferreiro:   { name: 'Ferreiro',         nameF: 'Ferreira',        area: 'Ferraria',    icon: '⚒️', place: 'ferraria',    placeName: 'Ferraria',            color: '#7a7a8a',
                tools: 'martelo, tenaz e avental de couro', mentor: { name: 'Mestre Bruno', look: L('m', 's5', 'careca', 'preto', '#6a4a3a', '#3a3a3a') } },
  mecanico:   { name: 'Mecânico',         nameF: 'Mecânica',        area: 'Mecânica',    icon: '🔧', place: 'oficina',     placeName: 'Oficina Mecânica',    color: '#3f86d0',
                tools: 'caixa de ferramentas e macacão', mentor: { name: 'Dona Zefa', look: L('f', 's3', 'crespo', 'grisalho', '#3f6aa0', '#3a3a4a') } },
  feiticeiro: { name: 'Feiticeiro',       nameF: 'Feiticeira',      area: 'Magia',       icon: '🔮', place: 'torre',       placeName: 'Torre de Magia',      color: '#6a3fa0',
                tools: 'varinha, caldeirão e livro de runas', mentor: { name: 'Maga Selene', look: L('robe', 's2', 'liso', 'azul', '#3a4a9a', '#3a4a9a') } },
  fazendeiro: { name: 'Fazendeiro',       nameF: 'Fazendeira',      area: 'Fazenda',     icon: '🌱', place: 'vila',        placeName: 'Fazenda',             color: '#5aa84e',
                tools: 'enxada, regador e sementes', mentor: { name: 'Seu Chico', look: L('m', 's4', 'liso', 'grisalho', '#c8a050', '#5a6a3a') } },
  dev:        { name: 'Programador',      nameF: 'Programadora',    area: 'Programação', icon: '💻', place: 'guilda',      placeName: 'Guilda dos Códigos',  color: '#3aa6a0',
                tools: 'terminal e cartões de comando', mentor: { name: 'Kenji', look: L('n', 's2', 'careca', 'preto', '#3a4a6a', '#2a2a3a') } },
  prof:       { name: 'Professor',        nameF: 'Professora',      area: 'Ensino',      icon: '📚', place: 'escola',      placeName: 'Escola da Vila',      color: '#4a8a5a',
                tools: 'giz, livros e caderno de aula', mentor: { name: 'Diretor Paulo', look: L('m', 's6', 'crespo', 'grisalho', '#5aa84e', '#6a5038') } },
  empre:      { name: 'Comerciante',      nameF: 'Comerciante',     area: 'Comércio',    icon: '🧺', place: 'mercado',     placeName: 'Mercado',             color: '#c8683a',
                tools: 'balança, caixa de moedas e caderno de contas', mentor: { name: 'Dona Marta', look: L('f', 's1', 'cacheado', 'ruivo', '#8a5ad9', '#3a3a4a') } },
};
/* Profissões do jogo antigo que mudaram de nome. */
const OLD_JOBS = { saude: 'medico' };

/* Moradores que andam pela vila: fazem pedidos e conversam. (x, y) = posição dos pés no mapa da vila. */
const RESIDENTS = [
  { id: 'lucia',    name: 'Dona Lúcia',  x: 268, y: 206, spot: 'na rua de cima, em frente à casa azul',   look: L('f', 's2', 'cacheado', 'grisalho', '#c85a7a', '#5a4a6a'), talk: ['Meu jardim nunca esteve tão bonito. É o cuidado de todo dia.', 'Você já foi até a torre, do outro lado do rio? A vista é linda.'] },
  { id: 'antonio',  name: 'Seu Antônio', x: 356, y: 526, spot: 'na rua de baixo, perto da mercearia',     look: L('m', 's3', 'careca', 'castanho', '#e8e0c8', '#5a4030'), talk: ['Trabalho bem feito aparece, pode acreditar.', 'Se precisar de um lanche, o Mercado fica do outro lado da rua.'] },
  { id: 'nina',     name: 'Nina',        x: 440, y: 300, spot: 'na praça, ao lado da fonte',              look: L('f', 's1', 'cacheado', 'rosa', '#f2c53d', '#7a4a9a'), talk: ['Adoro desenhar a fonte. A água nunca fica igual.', 'O quadro de avisos da praça vive cheio de novidades.'] },
  { id: 'teo',      name: 'Téo',         x: 566, y: 318, spot: 'na praça, perto do quadro de avisos',     look: L('m', 's2', 'crespo', 'claro', '#5aa84e', '#6a5038'), talk: ['Dizem que a Maga Selene acende os lampiões com um estalar de dedos.', 'Li três livros esta semana. Quer uma indicação?'] },
  { id: 'maya',     name: 'Maya',        x: 700, y: 206, spot: 'na rua de cima, em frente à escola',      look: L('f', 's4', 'liso', 'preto', '#4a8ab8', '#3a4a6a'), talk: ['Levo meu irmão à escola todo dia. Ele adora a aula de ciências.', 'O hospital fica logo ali. Ainda bem que quase nunca preciso.'] },
  { id: 'davi',     name: 'Davi',        x: 690, y: 528, spot: 'na rua de baixo, perto do Mercado',       look: L('m', 's1', 'liso', 'loiro', '#2d3a66', '#2d3a66'), talk: ['Estou juntando moedas para abrir uma banca.', 'A ponte range, mas aguenta. Pode atravessar sem medo.'] },
  { id: 'raimundo', name: 'Raimundo',    x: 130, y: 352, spot: 'na rua principal, perto do restaurante',  look: L('m', 's5', 'crespo', 'grisalho', '#5a8a6a', '#4a4a3a'), talk: ['O cheiro do restaurante me prende aqui toda manhã.', 'Cuido dos jardins da vila desde menino.'] },
  { id: 'ze',       name: 'Zé',          x: 880, y: 352, spot: 'depois da ponte, no caminho da fazenda',  look: L('m', 's3', 'ondulado', 'castanho', '#b85a3a', '#4a4a5a'), talk: ['Minha bicicleta já deu a volta na vila mil vezes.', 'A terra daqui é boa. O que se planta, cresce.'] },
];
const residentById = id => RESIDENTS.find(r => r.id === id);

/* Itens que podem estar na mochila ou no baú. */
const ITEMS = {
  lanche:  { name: 'Lanche',        desc: 'Recupera 30 de energia.', price: 12 },
  vaso:    { name: 'Vaso de flor',  desc: 'Enfeita a sua casa.',     price: 30 },
  cenoura: { name: 'Cenoura',       desc: 'Colhida na fazenda.',     sell: 6 },
  tomate:  { name: 'Tomate',        desc: 'Colhido na fazenda.',     sell: 7 },
  abobora: { name: 'Abóbora',       desc: 'Colhida na fazenda.',     sell: 9 },
};
const CROPS = ['cenoura', 'tomate', 'abobora'];
