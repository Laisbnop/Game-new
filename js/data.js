/* Dados do jogo: itens, cultivos, árvores, moradores, missões e loja. */

const START_AGE = 17;
const START_COINS = 60;
const DAY_START = 6 * 60;          // 06:00, em minutos
const INV_SIZE = 20, HOTBAR = 10, CHEST_SIZE = 20, STACK = 99;

/* kind: tool | seed | sapling | hat | quest | item.  sell = preço de venda. */
const ITEMS = {
  enxada:   { name: 'Enxada',    kind: 'tool', desc: 'Prepara a terra para o plantio.' },
  regador:  { name: 'Regador',   kind: 'tool', desc: 'Rega a terra. Reabasteça no lago.' },
  machado:  { name: 'Machado',   kind: 'tool', desc: 'Corta galhos e árvores comuns.' },
  picareta: { name: 'Picareta',  kind: 'tool', desc: 'Quebra pedras pequenas.' },
  foice:    { name: 'Foice',     kind: 'tool', desc: 'Corta o mato.' },
  espada:   { name: 'Espada simples', kind: 'tool', desc: 'Velha, mas firme. Treine no boneco da fazenda.' },

  sem_rabanete: { name: 'Sementes de rabanete', kind: 'seed', crop: 'rabanete', price: 8,  desc: 'Cresce em 2 dias regados.' },
  sem_tomate:   { name: 'Sementes de tomate',   kind: 'seed', crop: 'tomate',   price: 15, desc: 'Cresce em 4 dias regados.' },
  sem_abobora:  { name: 'Sementes de abóbora',  kind: 'seed', crop: 'abobora',  price: 25, desc: 'Cresce em 6 dias regados.' },
  rabanete: { name: 'Rabanete', sell: 18, desc: 'Crocante e ardidinho.' },
  tomate:   { name: 'Tomate',   sell: 40, desc: 'Vermelho e suculento.' },
  abobora:  { name: 'Abóbora',  sell: 75, desc: 'Pesada e doce.' },

  muda_laranja: { name: 'Muda de laranjeira', kind: 'sapling', tree: 'laranja', price: 60, desc: 'Vira árvore em 5 dias. Dá frutos a cada 3.' },
  muda_goiaba:  { name: 'Muda de goiabeira',  kind: 'sapling', tree: 'goiaba',  price: 70, desc: 'Vira árvore em 6 dias. Dá frutos a cada 3.' },
  laranja: { name: 'Laranja', sell: 16, desc: 'Colhida do pé.' },
  goiaba:  { name: 'Goiaba',  sell: 20, desc: 'Perfumada.' },

  madeira: { name: 'Madeira', sell: 3, desc: 'De galhos e árvores comuns.' },
  pedra:   { name: 'Pedra',   sell: 3, desc: 'De pedras quebradas.' },
  racao:   { name: 'Ração',   price: 5, desc: 'Coloque no comedouro do galinheiro.' },
  ovo:     { name: 'Ovo',     sell: 14, desc: 'Fresquinho.' },
  amora:    { name: 'Amora silvestre', sell: 7, desc: 'Colhida no bosque.' },
  cogumelo: { name: 'Cogumelo',        sell: 9, desc: 'Encontrado à sombra das árvores.' },
  flor:     { name: 'Flor-do-campo',   sell: 6, desc: 'Simples e bonita.' },

  chapeu_palha:    { name: 'Chapéu de palha',    kind: 'hat', hat: 'palha',    price: 45, desc: 'Sombra para os dias de roça.' },
  boina:           { name: 'Boina',              kind: 'hat', hat: 'boina',    desc: 'Presente de Iara.' },
  chapeu_pescador: { name: 'Chapéu de pescador', kind: 'hat', hat: 'pescador', desc: 'Feito por Tomé.' },
  encomenda:   { name: 'Encomenda de tintas', kind: 'quest', desc: 'Para entregar a Iara.' },
  chapeu_tome: { name: 'Chapéu velho de Tomé', kind: 'quest', desc: 'Encontrado no bosque.' },
};

/* days = dias regados até a colheita. */
const CROPS = {
  rabanete: { name: 'Rabanete', days: 2, seed: 'sem_rabanete' },
  tomate:   { name: 'Tomate',   days: 4, seed: 'sem_tomate' },
  abobora:  { name: 'Abóbora',  days: 6, seed: 'sem_abobora' },
};
/* grow = dias até ficar adulta; every = intervalo entre colheitas; n = frutos por colheita. */
const TREES = {
  laranja: { name: 'Laranjeira', grow: 5, every: 3, n: 2, fruit: 'laranja' },
  goiaba:  { name: 'Goiabeira',  grow: 6, every: 3, n: 2, fruit: 'goiaba' },
};

const SHOP = ['sem_rabanete', 'sem_tomate', 'sem_abobora', 'muda_laranja', 'muda_goiaba', 'racao', 'chapeu_palha'];
const HEN_PRICE = 80, MAX_HENS = 4;

/* Aparência. Todas as opções valem para qualquer gênero. */
const mkLook = (skin, hair, hairColor, top, topColor, bottom, bottomColor, extra) =>
  Object.assign({ gender: 'n', skin, hair, hairColor, top, topColor, bottom, bottomColor, shoeColor: '#3a2a22', hat: null }, extra);
const DEFAULT_LOOK = mkLook('s3', 'longoLiso', 'preto', 'camiseta', '#3f86d0', 'calca', '#6a5038', { gender: 'f' });

/* Amizade: 100 pontos por coração, até 5. */
const FRIEND = { talk: 12, love: 45, like: 25, neutral: 12, dislike: -6, max: 500 };

/* Moradores. sched = [minuto do dia, caminho [[x,y],...]] no mapa externo (ou 'loja').
   talk[0|1|2] = falas com 0–1, 2–3 e 4–5 corações. */
const VILLAGERS = [
  { id: 'celeste', name: 'Dona Celeste', place: 'no Armazém, na vila',
    bio: 'Dona do Armazém. Prática, acolhedora e sabe de tudo o que se planta na região.',
    look: mkLook('s4', 'coque', 'grisalho', 'blusa', '#c8683a', 'saia', '#5a4a6a'),
    love: ['laranja', 'flor'], like: ['tomate', 'ovo', 'goiaba'], dislike: ['pedra', 'madeira'],
    sched: [[360, 'loja'], [1080, [[510, 160], [590, 186]]]],
    talk: [['Precisando de semente, é só falar. Rabanete é o mais rápido para começar.', 'O lago da sua fazenda serve para encher o regador. Planta sem água não cresce.', 'O Sítio Beira-Rio ficou parado tanto tempo... É bom ver fumaça naquela chaminé de novo.'],
      ['Guardei umas mudas boas para você. Árvore dá trabalho no começo e alegria por anos.', 'Sabe que a vila anda mais animada desde que você chegou?', 'Meu marido plantou a laranjeira da praça. Toda florada eu lembro dele.'],
      ['Você já é de casa. Quando eu me aposentar, quero o Armazém em boas mãos... só pensando alto.', 'Hoje sonhei com o sítio todo florido. Acordei e vi que já não é mais sonho.', 'Senta um pouco, toma um café. Freguês eu atendo depois.']],
    again: 'Já conversamos hoje, mas volte sempre: a porta fica aberta.',
    gift: { love: 'Ah! Isso me lembra coisas boas. Muito obrigada, de coração.', like: 'Que gentileza! Vai direto para a minha cozinha.', neutral: 'Obrigada por lembrar de mim.', dislike: 'Hum... vou guardar no depósito, quem sabe serve.' },
    scene: { lines: ['Olha, fiz questão de separar isto para você.', 'Era do meu marido. Chapéu bom tem que trabalhar, não ficar em gaveta.'], item: 'chapeu_palha' } },
  { id: 'honorio', name: 'Seu Honório', place: 'em frente à casa dele ou no banco da praça',
    bio: 'Carpinteiro aposentado. Resmunga de tudo, mas conserta o que encontra quebrado.',
    look: mkLook('s5', 'careca', 'grisalho', 'camisa', '#8a5e36', 'calca', '#3a3a4a'),
    love: ['goiaba', 'cogumelo'], like: ['madeira', 'abobora'], dislike: ['flor', 'amora'],
    sched: [[360, [[755, 160]]], [600, [[755, 164], [690, 166], [612, 212]]], [1020, [[690, 166], [755, 164], [755, 160]]]],
    talk: [['Hunf. Mais um jovem achando que roça é passeio. Vamos ver quanto dura.', 'Esse banco da praça está caindo aos pedaços. Ninguém mais conserta nada.', 'No meu tempo, machado se afiava todo dia.'],
      ['Vi sua plantação de longe. Não está... ruim.', 'Madeira boa é a do bosque, depois da ponte velha. Só não corte tudo de uma vez.', 'Você trabalha direito. Não conte a ninguém que eu disse isso.'],
      ['Fiz uma caixinha de ferramentas. Era para ser surpresa, mas eu não sei guardar segredo.', 'Você me lembra eu mesmo aos dezessete. Só que com mais educação.', 'Senta aí. Deixa eu contar como era esta vila quando o rio enchia.']],
    again: 'Já falei tudo o que tinha para falar hoje. Vá trabalhar.',
    gift: { love: 'Ora... como você sabia? Hunf. Obrigado.', like: 'Isso serve. Serve bem.', neutral: 'Tá, tá. Obrigado.', dislike: 'E o que eu faço com isso? Enfeito a janela?' },
    scene: { lines: ['Escuta. Eu não digo isso a qualquer um.', 'A vila precisava de alguém teimoso assim. Tome: sementes da minha horta antiga.'], item: 'sem_abobora', n: 4 } },
  { id: 'bia', name: 'Bia', place: 'perto da porteira da fazenda de manhã, na praça à tarde',
    bio: 'Cria galinhas desde pequena. Falante, curiosa e apaixonada por bicho.',
    look: mkLook('s2', 'rabo', 'ruivo', 'jardineira', '#3fa070', 'short', '#3a4a8a'),
    love: ['ovo', 'amora'], like: ['rabanete', 'flor', 'laranja'], dislike: ['pedra'],
    sched: [[360, [[515, 312]]], [510, [[460, 312], [460, 164], [428, 164]]], [840, [[460, 164], [596, 176]]], [1140, [[460, 164], [460, 312], [515, 312]]]],
    talk: [['Oi! Você é quem ficou com o sítio, né? Tem um galinheiro lá, sabia?', 'Galinha feliz bota melhor. É ciência! Quer dizer, é o que eu acho.', 'Se precisar de ração, a Dona Celeste vende.'],
      ['Como estão as meninas do galinheiro? Fez carinho hoje?', 'Eu dou nome para todas as minhas. A mais brava se chama Dona Encrenca.', 'Um dia eu quero ter cabras também. E um burrinho. E...'],
      ['Você virou a pessoa com quem eu mais converso. Não conta para as galinhas.', 'Guardei o primeiro ovo que você me deu. Brincadeira! Comi. Estava ótimo.', 'Quando eu tiver meu sítio, você me ajuda a montar?']],
    again: 'De novo por aqui? Que bom! Mas hoje eu já contei todas as novidades.',
    gift: { love: 'AAAH! Meu preferido! Você é demais!', like: 'Oba, adorei! Obrigada!', neutral: 'Ah, obrigada! Que fofo.', dislike: 'Uma... pedra? Tá, é uma pedra bonita, eu acho.' },
    scene: { lines: ['Olha o que eu trouxe! Sobrou ração do meu galinheiro.', 'Quem cuida bem de galinha tem a minha amizade.'], item: 'racao', n: 8 } },
  { id: 'tome', name: 'Tomé', place: 'na beira do rio de manhã, na praça à tarde',
    bio: 'Vive numa cabana no bosque. Fala pouco, observa muito e conhece cada trilha.',
    look: mkLook('s3', 'medio', 'castanho', 'camisa', '#5a7a5a', 'calca', '#5a4a3a'),
    love: ['amora', 'cogumelo'], like: ['laranja', 'ovo'], dislike: ['tomate'],
    sched: [[360, [[1056, 322]]], [780, [[1000, 180], [900, 166], [668, 180]]], [1080, [[900, 166], [1010, 150]]]],
    talk: [['...Bom dia.', 'O bosque dá amora e cogumelo. Cada dia num canto diferente.', 'Árvore cortada volta. Demora uns dias, mas volta.'],
      ['O rio estava claro hoje. Sinal de tempo firme.', 'Você pisa leve no bosque. Os bichos nem se assustam.', 'Quase ninguém vem até a cabana. Pode vir.'],
      ['Eu não sou de falar. Mas com você é fácil.', 'Achei um ninho de sabiá perto da sua cerca. Deixei quieto.', 'Quando chover forte, se abrigue na cabana. A porta não tem tranca.']],
    again: '...Já falamos hoje.',
    gift: { love: 'Isso é... do que eu mais gosto. Obrigado.', like: 'Bom. Obrigado.', neutral: 'Obrigado.', dislike: 'Hum. Não sou muito de tomate.' },
    scene: { lines: ['Fiz isto nas noites de chuva.', 'Protege do sol na beira do rio. É seu.'], item: 'chapeu_pescador' } },
  { id: 'iara', name: 'Iara', place: 'em casa de manhã, junto à fonte à tarde',
    bio: 'Pinta paisagens da vila. Distraída, gentil e sempre com tinta nos dedos.',
    look: mkLook('s6', 'longoCacheado', 'preto', 'blusa', '#8a5ad9', 'saia', '#e0a23a'),
    love: ['flor', 'goiaba'], like: ['amora', 'laranja', 'abobora'], dislike: ['madeira', 'racao'],
    sched: [[360, [[725, 312]]], [660, [[632, 312], [632, 224], [656, 204]]], [1140, [[632, 224], [632, 312], [725, 312]]]],
    talk: [['Ah, oi! Desculpa, eu estava olhando a luz na fonte. Você é do sítio?', 'Estou sempre sem tinta. E sem flor para pintar.', 'A vila tem umas cores que só aparecem de manhã cedinho.'],
      ['Pintei o seu sítio visto de longe. Ainda falta o telhado.', 'Sabia que a cor da goiaba madura não existe em nenhum tubo de tinta?', 'Você repara nas coisas. Pouca gente repara.'],
      ['Guardei um quadro para você. Não está pronto. Nunca está pronto.', 'Quando eu fico sem ideia, vou ver você trabalhar. Sempre volto com uma.', 'A vila ficou mais colorida. E não é por causa das minhas tintas.']],
    again: 'Já conversamos hoje, não foi? Perdão, eu me distraio.',
    gift: { love: 'Que cor! Que perfume! Vou pintar isto antes que mude.', like: 'Que delicadeza. Obrigada!', neutral: 'Obrigada, que gentil.', dislike: 'Ah... obrigada. Vou... achar um lugar para isso.' },
    scene: { lines: ['Terminei! Quer dizer, quase. Mas isto aqui é para você.', 'Todo artista precisa de uma boina. E todo amigo de artista também.'], item: 'boina' } },
];
const villagerById = id => VILLAGERS.find(v => v.id === id);

/* Missões.
   goal.count  = ações a realizar (till, plant, water, harvest, feed, clear)
   goal.deliver = itens a entregar a "to" (padrão: quem pediu); são retirados da mochila
   goal.talk   = basta conversar com "to"
   start.items = itens recebidos ao aceitar · after = missão anterior · hearts = corações mínimos com quem pede
   auto = começa sozinha · selfDone = conclui sozinha ao cumprir (as de aprendizado). */
const QUESTS = {
  chegada:  { giver: 'celeste', title: 'Boas-vindas à vila', auto: true, desc: 'Siga a estrada para o leste até a vila, entre no Armazém e clique em Dona Celeste para conversar.',
    goal: { talk: 1 }, done: ['Então é você quem veio cuidar do Sítio Beira-Rio! A vila inteira estava esperando.', 'Leve estas sementes de rabanete: é presente de boas-vindas. Brotam rápido.'],
    reward: { items: { sem_rabanete: 6 }, friend: 20 } },
  plantio:  { giver: 'celeste', title: 'A primeira plantação', after: 'chegada', auto: true, selfDone: true,
    desc: 'Na sua fazenda: are 3 canteiros com a enxada, plante as sementes e regue. Escolha o item na barra e clique (ou toque) na terra ao seu lado.',
    goal: { count: { till: 3, plant: 3, water: 3 } }, reward: { coins: 20 } },
  colheita: { giver: 'celeste', title: 'A primeira colheita', after: 'plantio', auto: true, selfDone: true,
    desc: 'Regue todos os dias e durma na sua cama: as plantas crescem à noite. Colha 3 cultivos maduros e venda ou guarde.',
    goal: { count: { harvest: 3 } }, reward: { coins: 30, items: { sem_tomate: 3 } } },
  galinheiro: { giver: 'bia', title: 'O galinheiro vazio', after: 'chegada',
    offer: ['O galinheiro do sítio está vazio há anos! Isso não pode ficar assim.', 'Leve esta ração e coloque 2 porções no comedouro. Depois me chame: tenho uma galinha que precisa de um lar.'],
    desc: 'Coloque 2 porções de ração no comedouro do galinheiro da fazenda e volte a falar com Bia.',
    start: { items: { racao: 5 } }, goal: { count: { feed: 2 } },
    done: ['Comedouro cheio! Perfeito. Então... esta aqui é para você.', 'Ela é mansa e curiosa. Cuida bem dela, tá?'], reward: { hen: 1, friend: 40 } },
  primeiro_ovo: { giver: 'bia', title: 'O primeiro ovo', after: 'galinheiro',
    offer: ['Galinha alimentada bota um ovo por dia, que aparece no ninho na manhã seguinte.', 'Me traz o primeiro ovo? Quero ver se ela se adaptou.'],
    desc: 'Mantenha ração no comedouro, durma e pegue o ovo no ninho. Entregue 1 ovo a Bia.',
    goal: { deliver: { ovo: 1 } }, done: ['Olha que ovo lindo! Ela está feliz, dá para ver.'], reward: { coins: 40, friend: 60 } },

  banco: { giver: 'honorio', title: 'O banco da praça', hearts: 1,
    offer: ['Aquele banco da praça vai derrubar alguém. Eu consertava, mas o braço já não ajuda no machado.', 'Me arrume 6 de madeira e 4 de pedra que eu dou um jeito.'],
    desc: 'Junte 6 de madeira (galhos e árvores do bosque) e 4 de pedra, e entregue a Seu Honório.',
    goal: { deliver: { madeira: 6, pedra: 4 } }, done: ['Hunf. Material bom. Amanhã esse banco aguenta até dança.', 'Fique com isto. Não é esmola, é pagamento.'],
    reward: { coins: 60, friend: 100, world: 'banco' } },
  chapeu: { giver: 'tome', title: 'O chapéu perdido', hearts: 1,
    offer: ['Perdi meu chapéu no bosque. O vento levou para os lados do sul.', 'Se encontrar... eu agradeço.'],
    desc: 'Procure o chapéu de Tomé no bosque, ao sul do rio, e devolva a ele.',
    goal: { deliver: { chapeu_tome: 1 } }, done: ['É ele. Velho assim e ainda me serve.', 'Obrigado por procurar.'], reward: { coins: 30, friend: 100, items: { amora: 3 } } },
  flores: { giver: 'iara', title: 'Flores para a tela', hearts: 1,
    offer: ['Quero pintar um buquê, mas não consigo sair de perto da tela.', 'Você me traria 3 flores-do-campo? Elas nascem no bosque.'],
    desc: 'Colha 3 flores-do-campo no bosque e entregue a Iara.',
    goal: { deliver: { flor: 3 } }, done: ['Perfeitas! Olha esse amarelo. Vou começar agora mesmo.'], reward: { coins: 35, friend: 100 } },
  encomenda: { giver: 'celeste', title: 'Encomenda de tintas', hearts: 1, to: 'iara',
    offer: ['Chegaram as tintas da Iara, e eu não posso largar o balcão.', 'Você leva para mim? Ela fica perto da fonte à tarde.'],
    desc: 'Leve a encomenda de tintas até Iara.', start: { items: { encomenda: 1 } },
    goal: { deliver: { encomenda: 1 } }, done: ['Minhas tintas! Eu já estava misturando café para fazer marrom.', 'Diga à Dona Celeste que ela salvou um quadro.'], reward: { coins: 25, friend: 100, friendTo: 20, items: { sem_tomate: 4 } } },
  omelete: { giver: 'bia', title: 'Ovos para a festa', hearts: 2, after: 'primeiro_ovo',
    offer: ['Vou fazer um bolo enorme para a vila e minhas galinhas entraram em greve!', 'Você consegue 3 ovos para mim?'],
    desc: 'Entregue 3 ovos a Bia.', goal: { deliver: { ovo: 3 } }, done: ['Salvou o bolo! Vou guardar o maior pedaço para você.'], reward: { coins: 80, friend: 100 } },
};

const COUNT_LABEL = { till: 'canteiros arados', plant: 'sementes plantadas', water: 'canteiros regados', harvest: 'cultivos colhidos', feed: 'porções no comedouro' };

/* Objetos que exigem vários golpes. hp = golpes necessários; energy = energia por golpe;
   tools = ferramentas que funcionam; drop = o que rende ao quebrar; fx = tipo de lasca. */
const RESIST = {
  weed:   { name: 'Mato',   verb: 'Cortar',   tools: ['foice', 'espada'], hp: 1, energy: 1, fx: 'leaf' },
  branch: { name: 'Galho',  verb: 'Cortar',   tools: ['machado'],  hp: 2, energy: 2, drop: ['madeira', 1], fx: 'wood' },
  stone:  { name: 'Pedra',  verb: 'Quebrar',  tools: ['picareta'], hp: 3, energy: 2, drop: ['pedra', 1],   fx: 'stone' },
  stump:  { name: 'Toco',   verb: 'Quebrar',  tools: ['machado'],  hp: 4, energy: 2, drop: ['madeira', 2], fx: 'wood' },
  trunk:  { name: 'Árvore', verb: 'Cortar',   tools: ['machado'],  hp: 5, energy: 2, drop: ['madeira', 3], fx: 'wood' },
  rock:   { name: 'Rocha',  verb: 'Quebrar',  tools: ['picareta'], hp: 5, energy: 2, drop: ['pedra', 2],   fx: 'stone' },
};
const TOOL_NAME = { machado: 'o machado', picareta: 'a picareta', foice: 'a foice', espada: 'a espada', enxada: 'a enxada', regador: 'o regador' };
