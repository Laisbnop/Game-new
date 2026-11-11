/* Tarefas de trabalho de cada profissão.

   Cada tarefa informa quem pediu, onde é feita e os passos. Tipos de passo:
     use    – usar um ponto do cenário (E perto dele)
     mini   – realizar uma interação de trabalho em um ponto (veja minigames.js)
     talk   – conversar com alguém (pode ter uma escolha)
     give   – entregar o resultado a alguém
     gather – colher itens espalhados pela vila
     farm   – ações nos canteiros (arar, plantar, regar, colher)
   "at" = 'mapa:ponto'. "npc" = id de morador, ou 'guest' para o visitante da
   tarefa (paciente, cliente, aluno), que aparece no local de trabalho. */

const Tasks = (() => {
  const rngOf = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
  const shuffle = (rand, arr) => arr.map(v => [rand(), v]).sort((a, b) => a[0] - b[0]).map(p => p[1]);

  const use = (at, text, say, extra) => Object.assign({ t: 'use', at, text, say }, extra);
  const mini = (at, text, game, cfg, say) => ({ t: 'mini', at, text, game, cfg, say });
  const talk = (npc, text, lines, choice) => ({ t: 'talk', npc, text, lines, choice });
  const give = (npc, text, lines, icon) => ({ t: 'give', npc, text, lines, icon });

  /* Onde o visitante fica em cada local (por ordem de chegada). */
  const SEATS = {
    hospital: [[27, 136], [53, 136], [79, 136]], restaurante: [[82, 140], [198, 140], [118, 126]],
    escola: [[71, 130], [163, 130], [118, 140]], mercado: [[118, 122], [150, 126], [182, 122]],
  };

  const CASES = [
    { complaint: 'Estou com o corpo quente e uma moleza danada.', r: { termometro: ['temperatura alta', 1], estetoscopio: ['respiração tranquila', 0], lupa: ['pele sem marcas', 0] }, care: 'Chá de hortelã-lua', items: ['Chá de hortelã-lua', 'Cobertor leve'] },
    { complaint: 'Não paro de tossir desde ontem.', r: { termometro: ['temperatura normal', 0], estetoscopio: ['peito chiando um pouco', 1], lupa: ['pele sem marcas', 0] }, care: 'Xarope de mel-do-vale', items: ['Xarope de mel-do-vale'] },
    { complaint: 'Caí da bicicleta e ralei o joelho.', r: { termometro: ['temperatura normal', 0], estetoscopio: ['respiração tranquila', 0], lupa: ['arranhão no joelho', 1] }, care: 'Pomada de calêndula e curativo', items: ['Pomada de calêndula', 'Curativo'] },
    { complaint: 'Torci o pé descendo a escada.', r: { termometro: ['temperatura normal', 0], estetoscopio: ['respiração tranquila', 0], lupa: ['tornozelo inchado', 1] }, care: 'Compressa de folha-fria e repouso', items: ['Compressa de folha-fria', 'Faixa'] },
  ];
  const CARES = CASES.map(c => c.care);
  const MED_SHELF = ['Chá de hortelã-lua', 'Xarope de mel-do-vale', 'Pomada de calêndula', 'Curativo', 'Compressa de folha-fria', 'Faixa', 'Cobertor leve', 'Algodão'];

  const DISHES = [
    { name: 'sopa de abóbora', ing: ['Abóbora', 'Cebola', 'Sal'] }, { name: 'torta de maçã', ing: ['Maçã', 'Farinha', 'Manteiga'] },
    { name: 'peixe grelhado com ervas', ing: ['Peixe', 'Limão', 'Ervas'] }, { name: 'macarrão ao molho', ing: ['Macarrão', 'Tomate', 'Alho'] },
    { name: 'omelete de queijo', ing: ['Ovos', 'Queijo', 'Manteiga'] },
  ];
  const PANTRY = ['Abóbora', 'Cebola', 'Sal', 'Maçã', 'Farinha', 'Manteiga', 'Peixe', 'Limão', 'Ervas', 'Macarrão', 'Tomate', 'Alho', 'Ovos', 'Queijo'];

  const POSTERS = [
    { what: 'um cartaz para a feira de sábado', texts: ['FEIRA DA VILA', 'Sábado, na praça'], art: 'star' },
    { what: 'um cartaz da festa da colheita', texts: ['FESTA DA COLHEITA', 'Domingo, às 16h'], art: 'sun' },
    { what: 'um aviso da aula aberta da escola', texts: ['AULA ABERTA', 'Na Escola da Vila'], art: 'book' },
    { what: 'um anúncio do pão quentinho', texts: ['PÃO QUENTINHO', 'Toda manhã'], art: 'bread' },
    { what: 'um convite para o baile na praça', texts: ['BAILE NA PRAÇA', 'Sexta à noite'], art: 'note' },
  ];
  const THEMES = ['o pôr do sol no rio', 'as flores da praça', 'a torre de magia à noite', 'um campo de abóboras', 'o gato que dorme na fonte'];
  const PAINTS = ['Vermelho', 'Laranja', 'Amarelo', 'Verde', 'Azul', 'Roxo', 'Rosa', 'Marrom'];

  const FORGE = [
    { name: 'uma enxada', mats: ['Barra de ferro', 'Cabo de madeira'] }, { name: 'uma ferradura', mats: ['Barra de ferro', 'Carvão'] },
    { name: 'a chave do portão', mats: ['Lingote de bronze', 'Carvão'] }, { name: 'uma panela', mats: ['Chapa de cobre', 'Rebites'] },
    { name: 'um martelo', mats: ['Bloco de aço', 'Cabo de madeira'] },
  ];
  const ORES = ['Barra de ferro', 'Cabo de madeira', 'Carvão', 'Lingote de bronze', 'Chapa de cobre', 'Rebites', 'Bloco de aço', 'Areia'];

  const BIKE = [
    { name: 'Roda dianteira', x: 4, y: 38, w: 32, h: 56, round: 1, fix: 'Câmara de ar', issue: 'pneu murcho e rachado' },
    { name: 'Roda traseira', x: 64, y: 38, w: 32, h: 56, round: 1, fix: 'Câmara de ar', issue: 'pneu murcho e rachado' },
    { name: 'Corrente', x: 38, y: 66, w: 26, h: 12, fix: 'Corrente nova', issue: 'elos enferrujados' },
    { name: 'Freio', x: 28, y: 24, w: 12, h: 14, fix: 'Pastilha de freio', issue: 'pastilha gasta' },
    { name: 'Selim', x: 58, y: 12, w: 18, h: 10, fix: 'Selim novo', issue: 'couro rasgado' },
    { name: 'Guidão', x: 18, y: 6, w: 20, h: 10, fix: 'Manopla', issue: 'manopla solta' },
  ];
  const PARTS = ['Chave inglesa', 'Câmara de ar', 'Corrente nova', 'Pastilha de freio', 'Selim novo', 'Manopla', 'Óleo', 'Parafusos'];

  const SPELLS = [
    { what: 'uma poção de brilho para o jardim', done: 'o jardim agora cintila' }, { what: 'um encanto para o lampião nunca apagar', done: 'o lampião brilha sem parar' },
    { what: 'uma poção para a horta crescer forte', done: 'a horta ganhou um brilho verde' }, { what: 'um amuleto de boa sorte', done: 'o amuleto solta faíscas douradas' },
  ];
  const BOT_JOBS = ['regar os canteiros', 'varrer a praça', 'carregar caixas', 'acender os lampiões', 'entregar cartas'];
  const BOT_MAPS = [[['S..', '.#G'], 5], [['S.#', '..G'], 5], [['S#..', '...G'], 6], [['..G', '.#.', 'S..'], 6], [['S.#.', '.#..', '...G'], 7], [['S..#', '.#..', '...G'], 7]];

  const LESSONS = [
    { topic: 'frações', mats: ['Pizza de papel', 'Giz', 'Régua'], ask: 'Não entendi por que metade é maior que um quarto.', opts: ['Corte a pizza: em 2 pedaços, cada um fica maior do que em 4.', 'Porque é a regra.', 'Decore: 2 vem antes de 4.'], ans: 0 },
    { topic: 'o ciclo da água', mats: ['Cartaz do rio', 'Giz', 'Copo de água'], ask: 'Para onde vai a água da poça quando ela seca?', opts: ['Some para sempre.', 'O calor do sol a transforma em vapor, que sobe e forma as nuvens.', 'Vai embora andando.'], ans: 1 },
    { topic: 'rimas e poemas', mats: ['Livro de poemas', 'Giz', 'Folhas'], ask: 'O que é uma rima?', opts: ['Uma palavra muito comprida.', 'Um tipo de desenho.', 'Palavras que terminam com som parecido, como "vila" e "fila".'], ans: 2 },
    { topic: 'o mapa da vila', mats: ['Mapa da vila', 'Giz', 'Bússola'], ask: 'Como eu sei onde fica o norte?', opts: ['A bússola aponta para o norte; no nosso mapa, é o lado da floresta.', 'Chutando.', 'O norte muda todo dia.'], ans: 0 },
  ];
  const SCHOOL = ['Pizza de papel', 'Giz', 'Régua', 'Cartaz do rio', 'Copo de água', 'Livro de poemas', 'Folhas', 'Mapa da vila', 'Bússola', 'Apito'];
  const GOODS = ['Pão', 'Queijo', 'Mel', 'Sabão', 'Vela', 'Cesto', 'Geleia', 'Lenha'];

  /* Geradores: (rand, quem pediu, índice no dia, estado) → tarefa */
  const GEN = {
    medico(rand, r, i) {
      const c = pick(rand, CASES);
      return { title: `Atender ${r.name}`, guest: 'hospital', steps: [
        use('hospital:recepcao', `Chame ${r.name} na recepção`, `${r.name}, pode vir até a maca.`, { move: [150, 106] }),
        mini('hospital:maca', `Avalie ${r.name} na maca`, 'exam', { title: 'Atendimento', patient: r.name, complaint: c.complaint, readings: c.r, cares: CARES, care: c.care }, `Cuidado indicado: ${c.care}.`),
        mini('hospital:armario', 'Pegue os itens no armário de cuidados', 'collect', { title: 'Armário de cuidados', text: `Separe o que ${c.care.toLowerCase()} pede.`, need: c.items, shelf: MED_SHELF }),
        use('hospital:maca', `Aplique o cuidado em ${r.name}`, `${r.name}: "Já estou me sentindo melhor. Agradeço o cuidado!"`, { heart: 1, anim: 1 }),
        use('hospital:mesa', 'Registre o atendimento na mesa', 'Ficha preenchida e guardada.'),
      ], result: `${r.name} recebeu ${c.care.toLowerCase()} e saiu do hospital melhor.` };
    },
    chef(rand, r) {
      const d = pick(rand, DISHES);
      return { title: `Preparar ${d.name} para ${r.name}`, guest: 'restaurante', steps: [
        talk('guest', `Anote o pedido de ${r.name}, na mesa`, [[r.name, `Hoje eu quero ${d.name}. Capricha!`]]),
        mini('restaurante:despensa', 'Busque os ingredientes na despensa', 'collect', { title: 'Despensa', text: `Receita de ${d.name}.`, need: d.ing, shelf: PANTRY }),
        mini('restaurante:tabua', 'Corte os ingredientes na tábua', 'timing', { title: 'Tábua de corte', text: 'Corte no ritmo: acione quando o marcador estiver na faixa clara.', verb: 'Cortar', hits: 4, anim: 'chop' }),
        mini('restaurante:fogao', 'Cozinhe no fogão', 'hold', { title: 'Fogão', text: 'Controle o fogo até o ponto certo.', verb: 'Aquecer', anim: 'cook' }),
        give('guest', `Sirva o prato a ${r.name}`, [[r.name, 'Que cheiro bom! Está uma delícia.']], 'plate'),
      ], result: `${r.name} comeu ${d.name} e elogiou a cozinha.` };
    },
    design(rand, r) {
      const p = pick(rand, POSTERS);
      return { title: `Criar ${p.what} para ${r.name}`, steps: [
        talk(r.id, `Converse com ${r.name} sobre o pedido (${r.spot})`, [[r.name, `Preciso de ${p.what}. Tem que dar para ler de longe e mostrar o título, a ilustração e a data.`], [r.name, 'O resto é com você: confio no seu olhar.']]),
        mini('estudio:prancheta', 'Crie o cartaz na prancheta do estúdio', 'compose', { title: 'Prancheta de criação', text: `Pedido de ${r.name}: ${p.what}.`, texts: p.texts, art: p.art }),
        use('vila:board', 'Pendure o cartaz no quadro de avisos da praça', 'Cartaz pendurado! Quem passa pela praça já para para olhar.', { post: 1 }),
      ], result: `O cartaz "${p.texts[0]}" está no quadro de avisos da praça.` };
    },
    pintor(rand, r) {
      const th = pick(rand, THEMES);
      return { title: `Pintar um quadro para ${r.name}`, steps: [
        mini('atelie:tintas', 'Separe as tintas na estante do ateliê', 'collect', { title: 'Estante de tintas', text: `Encomenda de ${r.name}: "${th}". Escolha as tintas que quiser.`, shelf: PAINTS, free: 3 }),
        mini('atelie:cavalete', 'Pinte a tela no cavalete', 'paint', { title: 'Cavalete', text: `Tema sugerido: ${th}. Use pelo menos 3 cores e preencha metade da tela.`, minColors: 3, minFill: 0.5 }),
        use('vila:gallery', 'Exponha o quadro no mural de arte da praça', 'Quadro exposto! A praça ganhou uma obra nova.', { hang: th }),
        give(r.id, `Avise ${r.name} (${r.spot})`, [[r.name, 'Já vi de longe! Ficou do jeito que eu sonhava, só que melhor.']], null),
      ], result: `Seu quadro "${th}" está exposto na praça e no ateliê.` };
    },
    ferreiro(rand, r) {
      const o = pick(rand, FORGE);
      return { title: `Forjar ${o.name} para ${r.name}`, steps: [
        mini('ferraria:minerios', 'Separe os materiais nas caixas', 'collect', { title: 'Caixas de minério', text: `Encomenda: ${o.name}.`, need: o.mats, shelf: ORES }),
        mini('ferraria:forja', 'Aqueça o metal na forja', 'hold', { title: 'Forja', text: 'Aqueça até o metal ficar alaranjado, sem passar do ponto.', verb: 'Soprar o fole', anim: 'heat' }),
        mini('ferraria:bigorna', 'Molde a peça na bigorna', 'timing', { title: 'Bigorna', text: 'Martele no ritmo. Golpe fora do ponto não conta, mas não estraga a peça.', verb: 'Martelar', hits: 5, anim: 'hammer', speed: 380 }),
        use('ferraria:tina', 'Tempere a peça na tina de água', 'Tssss! O vapor sobe e a peça endurece.', { steam: 1, anim: 1 }),
        give(r.id, `Entregue a encomenda a ${r.name} (${r.spot})`, [[r.name, 'Que acabamento! Isso vai durar anos.']], 'tool'),
      ], result: `${r.name} recebeu a encomenda (${o.name}), forjada por você.` };
    },
    mecanico(rand, r) {
      const worn = shuffle(rand, [0, 2, 3, 4, 5]).slice(0, 2), thing = pick(rand, ['bicicleta', 'bicicleta de entregas', 'bicicleta de passeio']);
      const parts = BIKE.map((p, i) => Object.assign({}, p, { worn: worn.includes(i) }));
      const need = ['Chave inglesa', ...new Set(worn.map(i => BIKE[i].fix))];
      return { title: `Consertar a ${thing} de ${r.name}`, vehicle: 1, steps: [
        mini('oficina:veiculo', `Inspecione a ${thing}`, 'inspect', { title: 'Inspeção', text: `A ${thing} de ${r.name} está falhando. Encontre as peças gastas.`, parts }),
        mini('oficina:ferramentas', 'Busque ferramenta e peças na bancada', 'collect', { title: 'Bancada de ferramentas', text: 'Pegue o que o conserto pede.', need, shelf: PARTS }),
        mini('oficina:veiculo', 'Troque as peças gastas', 'timing', { title: 'Conserto', text: 'Aperte os parafusos no ponto certo.', verb: 'Apertar', hits: 4, anim: 'wrench' }),
        use('oficina:veiculo', `Teste a ${thing}`, 'As rodas giram livres e o freio responde. Funcionando!', { fixed: 1, anim: 1 }),
        give(r.id, `Devolva a ${thing} a ${r.name} (${r.spot})`, [[r.name, 'Está melhor do que nova! Agradeço demais.']], 'bike'),
      ], result: `A ${thing} de ${r.name} voltou a rodar pela vila.` };
    },
    feiticeiro(rand, r) {
      const s = pick(rand, SPELLS);
      return { title: `Preparar ${s.what} para ${r.name}`, steps: [
        { t: 'gather', n: 2, text: 'Colha 2 ervas-lua pela vila (flores lilases que brilham)' },
        mini('torre:caldeirao', 'Prepare a poção no caldeirão', 'timing', { title: 'Caldeirão', text: 'Mexa a poção no compasso certo.', verb: 'Mexer', hits: 4, anim: 'potion', speed: 460 }),
        mini('torre:circulo', 'Faça o encantamento no círculo de runas', 'runes', { title: 'Círculo de runas', text: 'As runas acendem em sequência. Repita na mesma ordem.', len: 4 }),
        give(r.id, `Leve o encanto a ${r.name} (${r.spot})`, [[r.name, 'Olha só isso! A vila inteira vai querer um.']], 'magic'),
      ], result: `Encanto entregue a ${r.name}: ${s.done}.` };
    },
    dev(rand, r) {
      const [map, max] = pick(rand, BOT_MAPS), job = pick(rand, BOT_JOBS);
      return { title: `Programar um autômato para ${r.name}`, steps: [
        mini('guilda:terminal', 'Escreva o programa no terminal', 'robot', { title: 'Terminal de comandos', text: `${r.name} precisa de um autômato para ${job}. Monte a rota até o destino, desviando dos obstáculos.`, map, max }),
        use('guilda:automato', 'Carregue o programa no autômato', 'O autômato pisca, apita e repete a rota sem errar.', { anim: 1 }),
        give(r.id, `Leve o autômato a ${r.name} (${r.spot})`, [[r.name, `Ele já sabe ${job}? Que maravilha!`]], 'bot'),
      ], result: `O autômato de ${r.name} já está trabalhando: ${job}.` };
    },
    prof(rand, r) {
      const l = pick(rand, LESSONS);
      return { title: `Dar a aula sobre ${l.topic}`, guest: 'escola', steps: [
        mini('escola:estante', 'Separe o material da aula na estante', 'collect', { title: 'Estante de materiais', text: `Aula de hoje: ${l.topic}.`, need: l.mats, shelf: SCHOOL }),
        mini('escola:lousa', 'Escreva a aula na lousa', 'timing', { title: 'Lousa', text: 'Escreva com capricho, uma linha de cada vez.', verb: 'Escrever', hits: 4, anim: 'write', speed: 460 }, 'A lousa ficou clara e organizada.'),
        talk('guest', `Tire a dúvida de ${r.name}, na carteira`, [[r.name, l.ask]], { opts: l.opts, ans: l.ans, hint: `${r.name} continua com a mesma cara de dúvida. Tente explicar de outro jeito.`, ok: [[r.name, 'Ahhh! Agora entendi!']] }),
      ], result: `${r.name} entendeu ${l.topic} depois da sua explicação.` };
    },
    empre(rand, r) {
      const goods = shuffle(rand, GOODS).slice(0, 3), item = pick(rand, goods), price = 3 + Math.floor(rand() * 6), paid = pick(rand, [10, 20].filter(v => v > price));
      return { title: `Abastecer a banca e atender ${r.name}`, guest: 'mercado', steps: [
        mini('mercado:estoque', 'Busque as mercadorias no estoque', 'collect', { title: 'Estoque', text: 'Lista de reposição de hoje.', need: goods, shelf: GOODS }),
        use('mercado:banca', 'Arrume as mercadorias na banca', 'Banca arrumada, preços à vista.', { anim: 1 }),
        mini('mercado:banca', `Atenda ${r.name} na banca`, 'sell', { title: 'Banca de vendas', customer: r.name, item, shelf: goods, price, paid }, `${r.name}: "Troco certinho. Volto amanhã!"`),
      ], heartEnd: 1, result: `Você vendeu ${item.toLowerCase()} a ${r.name} e deu o troco certo.` };
    },
  };

  /* Fazenda: as tarefas dependem do estado dos canteiros. */
  function farmTasks(rand, S, people, n) {
    const plots = S.farm.plots, crop = CROPS[(S.day - 1) % CROPS.length], out = [];
    const ready = plots.filter(p => p.s === 4).length, empty = plots.filter(p => p.s < 2).length, growing = plots.filter(p => p.s === 2 || p.s === 3).length;
    const k = Math.min(3, empty);
    if (k) out.push({ title: `Plantar ${k} canteiros de ${ITEMS[crop].name.toLowerCase()}`, by: null, crop, steps: [
      { t: 'farm', act: 'till', n: k, text: `Prepare a terra de ${k} canteiros (E em cada um)` },
      { t: 'farm', act: 'plant', n: k, text: `Plante ${ITEMS[crop].name.toLowerCase()} nos canteiros preparados` },
    ], result: `${k} canteiros plantados. As sementes brotam com rega e o passar dos dias.` });
    const w = Math.min(6, growing + k);
    if (w) out.push({ title: 'Regar as plantações', by: null, steps: [{ t: 'farm', act: 'water', n: w, text: `Regue ${w} canteiros plantados` }], result: 'Terra molhada: as plantas crescem durante a noite.' });
    if (ready >= 2) { const r = people[out.length % people.length]; out.push({ title: `Colher e entregar a ${r.name}`, by: r.id, steps: [
      { t: 'farm', act: 'harvest', n: 2, text: 'Colha 2 canteiros prontos' },
      give(r.id, `Entregue a colheita a ${r.name} (${r.spot})`, [[r.name, 'Fresquinho assim, só da sua horta!']], 'veg'),
    ], takes: 2, result: `${r.name} recebeu a colheita do dia.` }); }
    else out.push({ title: 'Cuidar das galinhas', by: null, steps: [
      use('vila:celeiro', 'Pegue ração no celeiro', 'Um saco de milho no ombro.'),
      use('vila:galinheiro', 'Encha o cocho das galinhas', 'As galinhas correm para o cocho, cacarejando.', { anim: 1 }),
    ], result: 'Galinhas alimentadas e satisfeitas.' });
    return out.slice(0, n);
  }

  /* Tarefas novas do dia. Pendentes de dias anteriores continuam; o total fica em até 3. */
  function generate(S) {
    const rand = rngOf((S.seed + S.day * 977) >>> 0);
    const pending = S.tasks.filter(t => !t.done);
    const n = Math.max(1, (S.day === 1 ? 2 : 3) - pending.length);
    const people = shuffle(rand, RESIDENTS);
    const list = S.job === 'fazendeiro' ? farmTasks(rand, S, people, n) : Array.from({ length: n }, (_, i) => Object.assign(GEN[S.job](rand, people[i], i, S), { by: people[i].id }));
    const reward = t => ({ coins: 14 + t.steps.length * 3, xp: 20 + t.steps.length * 4 });
    const seats = {};
    return list.map((t, i) => {
      const who = t.by ? residentById(t.by) : null;
      const task = Object.assign(t, { id: `d${S.day}-${i}`, day: S.day, step: 0, prog: 0, done: false, byName: who ? who.name : JOBS[S.job].mentor.name, where: JOBS[S.job].placeName, reward: reward(t) });
      if (t.guest) { const k = pending.filter(p => p.guest === t.guest).length + (seats[t.guest] = (seats[t.guest] || 0) + 1) - 1; task.seat = SEATS[t.guest][k % 3]; }
      return task;
    });
  }

  return { generate };
})();
