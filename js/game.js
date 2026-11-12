/* Lógica do jogo: salvamento, criação de personagem, exploração, ferramentas,
   plantações, árvores, galinhas, moradores e amizade, missões, loja, baú,
   guarda-roupa, passagem dos dias e painéis. */

(() => {
  const SAVE_KEY = 'trilha-rpg-save-v4';
  const OLD_KEYS = ['trilha-rpg-save-v3', 'trilha-rpg-save-v2', 'trilha-rpg-save-v1'];   // versões com profissões
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, fn) => { const b = el('button', cls, text); b.type = 'button'; b.onclick = fn; return b; };

  let S = null, screen = 'title';

  /* =====================================================
     SALVAMENTO
     ===================================================== */
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, v) { try { localStorage.setItem(key, v); } catch { /* sem armazenamento: joga sem salvar */ } },
    del(key) { try { localStorage.removeItem(key); } catch { /* ignora */ } },
  };
  const save = () => { if (S) store.set(SAVE_KEY, JSON.stringify(S)); };
  const validSave = s => s && s.v === 4 && s.look && typeof s.name === 'string' && Array.isArray(s.inv) && s.farm && s.farm.tiles && s.coop && s.nature && s.quests && s.pos;

  function newState(look, name) {
    const seed = Math.floor(Math.random() * 1e9);
    const s = {
      v: 4, look, name, age: START_AGE, coins: START_COINS, day: 1, time: DAY_START, energy: 100,
      pos: { map: 'fora', x: 96, y: 166, dir: 'down' },
      inv: Array(INV_SIZE).fill(null), sel: 0, chest: Array(CHEST_SIZE).fill(null), can: 10,
      farm: { tiles: {} }, coop: { feed: 0, eggs: 0, hens: [] },
      nature: { trees: {}, rocks: {}, forage: {}, hat: false },
      friends: {}, daily: { talk: {}, gift: {} }, known: {}, scenes: {},
      quests: {}, world: { banco: false }, dummy: 0, intro: false, seed,
    };
    ['enxada', 'regador', 'machado', 'picareta', 'foice', 'espada'].forEach((id, i) => { s.inv[i] = { id, n: 1 }; });
    // a terra começa tomada por mato, galhos e pedras; perto da casa há um trecho limpo
    let sd = seed; const rnd = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let i = 0; i < World.GRID.cols * World.GRID.rows; i++) {
      const c = i % World.GRID.cols, r = Math.floor(i / World.GRID.cols), p = rnd();
      if ((c < 6 && r < 3) || p > 0.5) continue;
      s.farm.tiles[i] = { k: p < 0.22 ? 'weed' : p < 0.37 ? 'branch' : 'stone' };
    }
    VILLAGERS.forEach(v => { s.friends[v.id] = 0; s.known[v.id] = {}; });
    refreshForage(s);
    return s;
  }
  function refreshForage(s) {
    let sd = (s.seed + s.day * 7919) >>> 0; const rnd = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
    s.nature.forage = {};
    World.FORAGE.forEach((_, i) => { if (rnd() < 0.6) s.nature.forage[i] = ['amora', 'cogumelo', 'flor', 'flor'][Math.floor(rnd() * 4)]; });
  }

  /* Aparência e nome de um jogo de versão anterior, quando dá para aproveitar. */
  const OLD_HAIR = { liso: 'longoLiso', ondulado: 'longoOndulado', cacheado: 'longoCacheado', crespo: 'crespo', trancas: 'trancas', careca: 'careca' };
  const OLD_CHARS = { lia: ['f', 's2', 'longoLiso', 'azul'], nina: ['f', 's1', 'longoCacheado', 'rosa'], maya: ['f', 's4', 'longoLiso', 'preto'], caio: ['m', 's3', 'crespo', 'castanho'], teo: ['m', 's2', 'crespo', 'claro'], davi: ['m', 's1', 'curtoLiso', 'loiro'] };
  function oldCharacter(o) {
    if (!o || typeof o.name !== 'string' || !o.name.trim()) return null;
    const l = o.look || {}, pre = OLD_CHARS[o.charId];
    const look = Object.assign({}, DEFAULT_LOOK);
    if (pre) Object.assign(look, { gender: pre[0], skin: pre[1], hair: pre[2], hairColor: pre[3] });
    if (l.skin) Object.assign(look, { gender: ['f', 'm', 'n'].includes(l.body) ? l.body : look.gender, skin: l.skin, hair: OLD_HAIR[l.hair] || look.hair, hairColor: l.hairColor || look.hairColor });
    return { name: o.name.trim().slice(0, 14), look };
  }
  /* Lê o que há no navegador sem alterar nada: { state } | { old } | { broken } | {} */
  function inspectSaves() {
    const cur = store.get(SAVE_KEY);
    if (cur) { try { const s = JSON.parse(cur); if (validSave(s)) return { state: s }; } catch { /* aviso abaixo */ } return { broken: true }; }
    for (const key of OLD_KEYS) {
      const raw = store.get(key); if (!raw) continue;
      try { const c = oldCharacter(JSON.parse(raw)); if (c) return { old: c }; } catch { /* aviso abaixo */ }
      return { legacy: true };
    }
    return {};
  }
  function show(name) { screen = name; ['title', 'create', 'game'].forEach(n => { $('screen-' + n).hidden = n !== name; }); window.scrollTo(0, 0); }

  /* =====================================================
     TÍTULO
     ===================================================== */
  let DEMO = null;
  function initTitle() {
    S = null; show('title');
    if (!DEMO) { DEMO = newState(DEFAULT_LOOK, ''); [0, 1, 2].forEach(i => { DEMO.farm.tiles[i] = { k: 'soil', w: 1, crop: 'tomate', g: i + 2 }; }); DEMO.coop.hens = [{ name: '', well: 80 }, { name: '', well: 80 }]; }
    const found = inspectSaves(), notice = $('save-notice'), cont = $('btn-continue');
    notice.hidden = true; cont.hidden = true; cont.textContent = 'Continuar';
    if (found.state) { cont.hidden = false; cont.onclick = () => { S = found.state; startGame(); }; }
    else if (found.old) {
      notice.hidden = false;
      notice.replaceChildren(el('b', '', 'Jogo de uma versão anterior encontrado. '),
        el('span', '', `O jogo mudou de direção: agora é uma vida no campo, sem profissões nem contexto familiar. O progresso antigo (profissão, tarefas, dia e moedas) não tem como continuar, mas dá para começar a nova fazenda com ${found.old.name}, mantendo o nome e a aparência. O jogo antigo continua guardado neste navegador: nada é apagado.`));
      cont.hidden = false; cont.textContent = `Nova fazenda com ${found.old.name}`;
      cont.onclick = () => startCreation(found.old);
    } else if (found.broken || found.legacy) {
      notice.hidden = false;
      notice.replaceChildren(el('b', '', 'Não foi possível abrir o jogo salvo. '),
        el('span', '', found.legacy ? 'Existe um jogo de uma versão anterior neste navegador, mas ele não pôde ser lido. Ele continua guardado; você pode começar uma nova fazenda.'
          : 'O arquivo de progresso está danificado. Ele continua guardado e só será substituído se você iniciar um novo jogo.'));
    }
    $('btn-new').onclick = () => {
      if ((found.state || found.broken) && !confirm('Já existe uma fazenda salva neste navegador. Ao terminar de criar um novo personagem, ela será substituída. Deseja continuar?')) return;
      startCreation();
    };
  }

  /* =====================================================
     APARÊNCIA: criação e guarda-roupa usam as mesmas opções
     ===================================================== */
  function optionGrid(box, items, cur, set, extra) {
    const grid = el('div', 'opts' + (extra ? ' ' + extra : ''));
    items.forEach(it => {
      const b = el('button', 'opt' + (cur === it.id ? ' sel' : '')); b.type = 'button'; b.dataset.id = it.id;
      if (it.canvas) b.append(it.canvas);
      if (it.swatch) { const s = el('span', 'swatch'); s.style.background = it.swatch; b.append(s); }
      if (it.label) b.append(el('span', 't', it.label));
      if (it.swatch) b.setAttribute('aria-label', it.name || it.swatch);
      b.onclick = () => set(it.id);
      grid.append(b);
    });
    box.append(grid);
  }
  const colorItems = list => list.map(c => ({ id: c, swatch: c }));
  /* Seções de aparência. look = objeto editado; change = redesenha. */
  const LOOK_SECTIONS = {
    genero: (box, look, change) => optionGrid(box, Sprites.GENDERS.map(g => ({ id: g.id, label: g.name })), look.gender, id => { look.gender = id; change(); }),
    pele: (box, look, change) => optionGrid(box, Sprites.SKINS.map(s => ({ id: s.id, label: s.name, swatch: s.c[0] })), look.skin, id => { look.skin = id; change(); }, 'sw'),
    cabelo: (box, look, change) => optionGrid(box, Sprites.HAIRS.map(h => ({ id: h.id, label: h.name, canvas: Sprites.canvas(Object.assign({}, look, { hair: h.id, hat: null })) })), look.hair, id => { look.hair = id; change(); }, 'many'),
    corCabelo: (box, look, change) => optionGrid(box, Sprites.HAIR_COLORS.map(h => ({ id: h.id, label: h.name, swatch: h.c[0] })), look.hairColor, id => { look.hairColor = id; change(); }, 'sw'),
    cima: (box, look, change) => { optionGrid(box, Sprites.TOPS.map(o => ({ id: o.id, label: o.name, canvas: Sprites.canvas(Object.assign({}, look, { top: o.id })) })), look.top, id => { look.top = id; change(); }, 'many'); box.append(el('p', 'hint', 'Cor')); optionGrid(box, colorItems(Sprites.CLOTH_COLORS), look.topColor, id => { look.topColor = id; change(); }, 'colors'); },
    baixo: (box, look, change) => { optionGrid(box, Sprites.BOTTOMS.map(o => ({ id: o.id, label: o.name, canvas: Sprites.canvas(Object.assign({}, look, { bottom: o.id })) })), look.bottom, id => { look.bottom = id; change(); }); box.append(el('p', 'hint', 'Cor')); optionGrid(box, colorItems(Sprites.CLOTH_COLORS), look.bottomColor, id => { look.bottomColor = id; change(); }, 'colors'); },
    calcado: (box, look, change) => optionGrid(box, colorItems(Sprites.SHOE_COLORS), look.shoeColor, id => { look.shoeColor = id; change(); }, 'colors'),
  };

  const draft = {};
  let step = 0, previewTimer = 0;
  const STEPS = [
    { title: 'Gênero', hint: 'É só como você se apresenta. Todos os cabelos e roupas servem para qualquer gênero.', key: 'genero' },
    { title: 'Cor da pele', hint: 'Escolha o tom de pele.', key: 'pele' },
    { title: 'Cabelo', hint: 'Escolha o corte.', key: 'cabelo' },
    { title: 'Cor do cabelo', hint: () => (draft.look.hair === 'careca' ? 'Seu personagem é careca, então a cor não aparece.' : 'Escolha a cor do cabelo.'), key: 'corCabelo' },
    { title: 'Roupa de cima', hint: 'Peça e cor.', key: 'cima' },
    { title: 'Roupa de baixo', hint: 'Peça e cor. Combina com qualquer parte de cima.', key: 'baixo' },
    { title: 'Calçado', hint: 'Escolha a cor.', key: 'calcado' },
    { title: 'Qual é o seu nome?', hint: 'É assim que a vila vai te chamar. Depois, o guarda-roupa de casa permite mudar cabelo e roupas.', valid: () => draft.name.trim().length >= 2 },
  ];
  function startCreation(pre) {
    draft.look = Object.assign({}, DEFAULT_LOOK, pre ? pre.look : null); draft.name = pre ? pre.name : '';
    step = 0;
    const steps = $('steps'); steps.replaceChildren(); STEPS.forEach(() => steps.append(el('span')));
    show('create');
    clearInterval(previewTimer);
    let f = 0; previewTimer = setInterval(() => { f = (f + 1) % 8; updatePreview(f); }, 380);
    renderStep();
  }
  function updatePreview(f = 0) {
    const g = $('preview').getContext('2d'); g.clearRect(0, 0, Sprites.W, Sprites.H);
    Sprites.draw(g, draft.look, 0, 0, f % 2, ['down', 'left', 'up', 'right'][Math.floor(f / 2)]);
    $('preview-name').textContent = draft.name.trim() || '—';
  }
  function updateNav() {
    const st = STEPS[step];
    $('btn-back').textContent = step === 0 ? '◀ Título' : '◀ Voltar';
    $('btn-next').textContent = step === STEPS.length - 1 ? 'Começar ▶' : 'Avançar ▶';
    $('btn-next').disabled = st.valid ? !st.valid() : false;
  }
  function renderStep() {
    const st = STEPS[step];
    [...$('steps').children].forEach((s, i) => s.classList.toggle('on', i <= step));
    $('step-title').textContent = `${step + 1}. ${st.title}`;
    $('step-hint').textContent = typeof st.hint === 'function' ? st.hint() : st.hint;
    const box = $('step-content'); box.replaceChildren();
    if (st.key) LOOK_SECTIONS[st.key](box, draft.look, renderStep);
    else {
      const input = el('input'); input.type = 'text'; input.maxLength = 14; input.placeholder = 'Seu nome'; input.autocomplete = 'off'; input.value = draft.name; input.id = 'name-input';
      input.oninput = () => { draft.name = input.value; updatePreview(); updateNav(); };
      input.onkeydown = e => { if (e.key === 'Enter' && st.valid()) $('btn-next').click(); };
      box.append(input); setTimeout(() => input.focus(), 0);
    }
    updatePreview(); updateNav();
  }
  $('btn-back').onclick = () => { if (step === 0) { clearInterval(previewTimer); initTitle(); } else { step--; renderStep(); } };
  $('btn-next').onclick = () => {
    const st = STEPS[step];
    if (st.valid && !st.valid()) return;
    if (step < STEPS.length - 1) { step++; renderStep(); return; }
    clearInterval(previewTimer);
    S = newState(Object.assign({}, draft.look), draft.name.trim());
    save(); startGame();
  };

  /* =====================================================
     INVENTÁRIO
     ===================================================== */
  /* Coloca n itens no conjunto de espaços; devolve quantos NÃO couberam. */
  function addTo(arr, id, n) {
    for (const s of arr) { if (n && s && s.id === id && s.n < STACK) { const k = Math.min(n, STACK - s.n); s.n += k; n -= k; } }
    for (let i = 0; i < arr.length && n; i++) if (!arr[i]) { const k = Math.min(n, STACK); arr[i] = { id, n: k }; n -= k; }
    return n;
  }
  const canAdd = (id, n = 1) => addTo(S.inv.map(s => s && { id: s.id, n: s.n }), id, n) === 0;
  const count = id => S.inv.reduce((a, s) => a + (s && s.id === id ? s.n : 0), 0);
  function removeItem(id, n = 1) {
    for (let i = S.inv.length - 1; i >= 0 && n; i--) { const s = S.inv[i]; if (s && s.id === id) { const k = Math.min(n, s.n); s.n -= k; n -= k; if (!s.n) S.inv[i] = null; } }
    renderHotbar();
  }
  /* Ganha itens do mundo. Se não couber tudo, nada é pego e o jogador é avisado. */
  function gain(id, n = 1) {
    if (!canAdd(id, n)) { toast('Mochila cheia'); return false; }
    addTo(S.inv, id, n); floats.push({ icon: id, x: P.x, y: P.y, t0: performance.now() });
    toast(`+${n} ${ITEMS[id].name}`); renderHotbar();
    return true;
  }
  const equipped = () => S.inv[S.sel];
  const owns = id => count(id) > 0 || S.chest.some(s => s && s.id === id);

  /* =====================================================
     ESTADO DO MUNDO
     ===================================================== */
  let map = null;
  const P = { x: 0, y: 0, dir: 'down', moving: false, work: 0, tool: null, hop: 0 };
  const keys = {};
  let busy = false, near = null, lastSave = 0, clockAcc = 0, floats = [], dummyHit = 0, hens = [], hits = {};

  const hearts = id => Math.floor((S.friends[id] || 0) / 100);
  const addFriend = (id, pts) => { const before = hearts(id); S.friends[id] = Math.max(0, Math.min(FRIEND.max, (S.friends[id] || 0) + pts)); if (hearts(id) > before) toast(`${villagerById(id).name}: ${hearts(id)} coração(ões)`); };
  const clock = () => `${String(Math.floor(S.time / 60)).padStart(2, '0')}:${String(S.time % 60).padStart(2, '0')}`;
  const fmt = t => String(t).replace(/\{nome\}/g, S.name);

  /* Onde cada morador está agora: segue a rotina do dia, andando pelos caminhos. */
  function villagerAt(v, tm) {
    let idx = -1; v.sched.forEach((e, i) => { if (tm >= e[0]) idx = i; });
    const n = v.sched.length, wrap = idx < 0; if (wrap) idx = n - 1;
    const e = v.sched[idx];
    if (e[1] === 'loja') return { where: 'loja', x: World.get('loja').keeper[0], y: World.get('loja').keeper[1], dir: 'down' };
    const prev = v.sched[(idx - 1 + n) % n][1], start = prev === 'loja' ? [510, 160] : prev[prev.length - 1];
    const pts = [start, ...e[1]]; let d = wrap ? 1e9 : (tm - e[0]) * 18;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1], len = Math.hypot(dx, dy);
      if (d < len) return { where: 'fora', x: pts[i - 1][0] + dx * d / len, y: pts[i - 1][1] + dy * d / len, moving: true, dir: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up') };
      d -= len;
    }
    const last = pts[pts.length - 1]; return { where: 'fora', x: last[0], y: last[1], dir: 'down' };
  }
  function actors() {
    const tm = S.time + clockAcc / 700, list = [];
    VILLAGERS.forEach(v => {
      const p = villagerAt(v, tm);
      if (p.where !== map.id) return;
      list.push({ id: v.id, v, name: v.name, look: v.look, x: p.x, y: p.y, dir: p.dir, moving: p.moving, reach: p.where === 'loja' ? 40 : 22, bubble: questMark(v) ? '!' : null });
    });
    return list;
  }

  /* =====================================================
     INÍCIO E LAÇO PRINCIPAL
     ===================================================== */
  function startGame() {
    show('game');
    closeModal();
    enterMap(S.pos.map, S.pos.x, S.pos.y, S.pos.dir);
    spawnHens();
    startAutoQuests();
    renderHud(); renderHotbar();
    if (!S.intro) run(async () => {
      await say('narr', 'A carroça da manhã deixa você diante de uma casinha de telhado torto: o Sítio Beira-Rio, na Vila Aroeira.');
      await say('narr', `Você tem ${S.age} anos, uma mochila e uma carta do conselho da vila: o sítio estava abandonado, e decidiram confiá-lo a quem tivesse coragem de recomeçar. As ferramentas são usadas, doadas pelos moradores.`);
      await say('narr', 'Ande com as setas (ou W, A, S, D). Chegue perto de pessoas, portas e objetos e aperte E ou Espaço. As teclas 1 a 0 escolhem o item da barra; com uma ferramenta na mão, E usa a ferramenta no chão à sua frente.');
      await say('narr', 'Não há pressa nem fim: os dias passam quando você dorme. Para começar, siga a estrada para o leste e apresente-se no Armazém.');
      S.intro = true;
    });
  }
  function enterMap(id, x, y, dir) {
    map = World.get(id);
    P.x = x; P.y = y; P.dir = dir || 'down'; P.moving = false; P.work = 0; P.tool = null;
    if (!World.free(map, P.x, P.y) || dynBlocked(P.x, P.y)) { P.x = map.spawn.x; P.y = map.spawn.y; }
    S.pos = { map: id, x: Math.round(P.x), y: Math.round(P.y), dir: P.dir };
  }
  function travel(to, x, y, dir) {
    const wrap = $('scene-wrap'); wrap.classList.add('fade'); busy = true;
    setTimeout(() => { enterMap(to, x, y, dir); save(); wrap.classList.remove('fade'); busy = false; renderHud(); }, 220);
  }
  const blocked = () => busy || !$('modal').hidden || !$('summary').hidden || screen !== 'game';

  /* Obstáculos que mudam: entulho e árvores da fazenda, árvores e pedras do bosque. */
  function dynBlocked(x, y) {
    if (!map || map.id !== 'fora') return false;
    for (const [px, py] of [[x - 5, y - 6], [x + 4, y - 6], [x - 5, y - 1], [x + 4, y - 1]]) {
      const i = World.tileAt(px, py); if (i < 0) continue;
      const o = S.farm.tiles[i]; if (!o || o.k === 'soil') continue;
      if (o.k !== 'tree') return true;
      const q = World.tilePos(i); if (px > q.x + 3 && px < q.x + 13 && py > q.y + 6) return true;
    }
    for (let i = 0; i < World.NTREES.length; i++) { const [tx, ty] = World.NTREES[i]; if (Math.abs(x - tx) < 9 && y > ty - 7 && y < ty + 5) return true; }
    for (let i = 0; i < World.NROCKS.length; i++) { if (S.nature.rocks[i]) continue; const [tx, ty] = World.NROCKS[i]; if (Math.abs(x - tx) < 13 && y > ty - 12 && y < ty + 5) return true; }
    return false;
  }

  let lastT = 0;
  function loop(t) {
    requestAnimationFrame(loop);
    const dt = Math.min(50, t - lastT); lastT = t;
    if (screen === 'title') {
      const m = World.get('fora'), cx = 520 + Math.sin(t / 9000) * 380, cy = 250 + Math.cos(t / 7000) * 150;
      World.render($('title-canvas').getContext('2d'), { map: m, cam: World.camera(m, cx, cy), t, state: DEMO, hens: [{ x: 180, y: 430, kind: 0 }, { x: 220, y: 446, kind: 1, flip: 1 }],
        actors: VILLAGERS.map(v => ({ v, p: villagerAt(v, 660) })).filter(o => o.p.where === 'fora').map(o => ({ look: o.v.look, x: o.p.x, y: o.p.y, dir: o.p.dir })) });
      return;
    }
    if (screen !== 'game' || !S || !map) return;
    const list = actors();
    update(dt, t, list);
    draw(t, list);
  }

  function update(dt, t, list) {
    P.moving = false;
    const free = !blocked();
    if (free && !P.work) {
      let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      if (dx || dy) {
        P.dir = dx ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        const sp = 0.075 * dt * (dx && dy ? 0.72 : 1);
        const clear = (x, y) => World.free(map, x, y) && !dynBlocked(x, y);
        if (dx && clear(P.x + dx * sp, P.y)) { P.x += dx * sp; P.moving = true; }
        if (dy && clear(P.x, P.y + dy * sp)) { P.y += dy * sp; P.moving = true; }
      }
    }
    if (P.work && t > P.work) { P.work = 0; P.tool = null; }
    // o relógio só anda com o jogo livre (pausa em conversas, menus e cenas)
    if (free && S.time < 1439) { clockAcc += dt; if (clockAcc >= 700) { clockAcc -= 700; S.time++; if (S.time % 10 === 0) renderHud(); } }
    floats = floats.filter(f => t - f.t0 < 700);
    updateHens(dt, t);
    near = free && !P.work ? resolve(list) : null;
    const hint = $('hint'), text = near ? near.label : '';
    if (hint.dataset.t !== text) { hint.dataset.t = text; hint.hidden = !text; hint.replaceChildren(el('b', '', 'E'), el('span', '', text)); $('touch-act').classList.toggle('on', !!(near && near.act)); }
    if (t - lastSave > 2500) { lastSave = t; S.pos.x = Math.round(P.x); S.pos.y = Math.round(P.y); S.pos.dir = P.dir; save(); }
  }

  /* Cor do dia: manhã clara, fim de tarde dourado, noite azulada. */
  function tint() {
    const m = S.time, inside = map.id !== 'fora';
    if (m < 420) return inside ? null : 'rgba(255,190,120,.10)';
    if (m >= 1020 && m < 1140) return `rgba(255,140,60,${(inside ? 0.04 : 0.07) + (m - 1020) / 120 * 0.1})`;
    if (m >= 1140) return `rgba(22,26,88,${Math.min(inside ? 0.22 : 0.5, 0.17 + (m - 1140) / 150 * 0.33)})`;
    return null;
  }

  function draw(t, list) {
    const cam = World.camera(map, P.x, P.y), ctx = $('scene').getContext('2d');
    const me = { look: S.look, x: P.x, y: P.y, dir: P.dir, moving: P.moving, tool: P.tool, hop: P.hop && t < P.hop ? -Math.abs(Math.sin((P.hop - t) / 80)) * 4 : 0 };
    World.render(ctx, { map, cam, t, state: S, actors: [...list, me], hens: map.id === 'fora' ? hens : [], cursor: near && near.cursor, tint: tint(), floats, dummyHit });
    if (near && near.act) { const x = Math.round(P.x - cam.x), y = Math.round(P.y - cam.y) - 40 - Math.floor(t / 300) % 2; ctx.fillStyle = '#241a2c'; ctx.fillRect(x - 5, y, 10, 9); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 4, y + 1, 8, 7); ctx.fillStyle = '#241a2c'; ctx.fillRect(x - 2, y + 2, 4, 1); ctx.fillRect(x - 2, y + 4, 3, 1); ctx.fillRect(x - 2, y + 6, 4, 1); ctx.fillRect(x - 2, y + 2, 1, 5); }
  }

  /* =====================================================
     O QUE O BOTÃO DE AÇÃO FAZ AGORA
     ===================================================== */
  const front = () => { const d = { down: [0, 9], up: [0, -15], left: [-14, -4], right: [14, -4] }[P.dir]; return [P.x + d[0], P.y + d[1]]; };

  /* Devolve { label, act, cursor } para o que está ao alcance, ou null.
     Ordem: pessoas e galinhas → objetos próximos → o que há no chão à frente (conforme o item na mão). */
  function resolve(list) {
    let best = null, bd = 1e9;
    const offer = (x, y, r, label, act) => { const d = Math.hypot(x - P.x, (y - P.y) * 1.2); if (d <= r && d < bd) { bd = d; best = { label, act }; } };
    list.forEach(a => offer(a.x, a.y + 4, a.reach, 'Falar com ' + a.name, () => talkTo(a.v)));
    if (map.id === 'fora') {
      hens.forEach((h, i) => offer(h.x, h.y, 14, S.coop.hens[i].name, () => henMenu(i)));
      World.FORAGE.forEach(([x, y], i) => { const id = S.nature.forage[i]; if (id) offer(x, y, 15, 'Colher ' + ITEMS[id].name.toLowerCase(), () => { if (gain(id)) { delete S.nature.forage[i]; save(); } }); });
      if (S.nature.hat) offer(World.SPOT.hat[0], World.SPOT.hat[1], 15, 'Pegar o chapéu velho', () => { if (gain('chapeu_tome')) { S.nature.hat = false; save(); } });
    }
    map.objs.forEach(o => { const a = objAction(o); if (a) offer(o.x, o.y, o.r, a.label, a.act); });
    if (best) return best;
    return map.id === 'fora' ? groundAction() : null;
  }

  function objAction(o) {
    const it = equipped(), id = it && it.id;
    switch (o.kind) {
      case 'door': return { label: o.label, act: () => { const m = World.get(o.to); travel(o.to, m.spawn.x, m.spawn.y, 'up'); } };
      case 'exit': return { label: 'Sair', act: () => { const d = World.get('fora').doors[map.id]; travel('fora', d.x, d.y, 'down'); } };
      case 'text': return { label: o.label, act: () => run(() => say('narr', o.text)) };
      case 'bed': return { label: 'Dormir', act: bed };
      case 'chest': return { label: 'Abrir o baú', act: () => openModal('bau') };
      case 'wardrobe': return { label: 'Guarda-roupa e espelho', act: () => openModal('roupa') };
      case 'counter': return { label: 'Balcão do Armazém', act: shop };
      case 'water': return id === 'regador' ? { label: `Encher o regador (${S.can}/10)`, act: () => { useTool('regador', 0); S.can = 10; toast('Regador cheio'); renderHotbar(); save(); } }
        : { label: 'Lago', act: () => run(() => say('narr', 'Água limpa do lago. Com o regador na mão, dá para enchê-lo aqui.')) };
      case 'dummy': return id === 'espada' ? { label: 'Golpear o boneco', act: () => { if (!useTool('espada', 1)) return; dummyHit = performance.now() + 120; S.dummy++; toast(`Golpe certeiro! (${S.dummy})`); } }
        : { label: 'Boneco de treino', act: () => run(() => say('narr', 'Um boneco de palha para treinar. Equipe a espada e golpeie.')) };
      case 'bench': return { label: 'Banco da praça', act: () => run(() => say('narr', S.world.banco ? 'O banco da praça, firme de novo. Na madeira, um entalhe discreto: "consertado com a ajuda de ' + S.name + '".' : 'O banco da praça está quebrado: falta uma tábua e um dos pés cedeu.')) };
      case 'feeder': return { label: count('racao') ? `Colocar ração (${S.coop.feed} no comedouro)` : `Comedouro (${S.coop.feed} porções)`, act: feed };
      case 'nest': return { label: S.coop.eggs ? `Pegar ovos (${S.coop.eggs})` : 'Ninho', act: nest };
    }
    return null;
  }

  /* Ação no chão à frente, conforme o item selecionado. */
  function groundAction() {
    const [fx, fy] = front(), it = equipped(), id = it && it.id, kind = id && ITEMS[id].kind;
    const i = World.tileAt(fx, fy);
    if (i >= 0) {
      const o = S.farm.tiles[i], q = World.tilePos(i), cursor = { x: q.x, y: q.y, w: 16, h: 16 };
      const A = (label, act) => ({ label, act, cursor });
      if (o && o.k === 'soil' && o.crop && o.g >= CROPS[o.crop].days) return A('Colher ' + CROPS[o.crop].name.toLowerCase(), () => { const c = o.crop; if (!gain(c)) return; S.farm.tiles[i] = { k: 'soil' }; P.hop = performance.now() + 300; qEvent('harvest'); save(); });
      if (o && o.k === 'tree') {
        const T = TREES[o.sp];
        if (o.fruit) return A(`Colher ${ITEMS[T.fruit].name.toLowerCase()}s`, () => { if (!gain(T.fruit, T.n)) return; o.fruit = false; o.cool = 0; save(); });
        return A(T.name, () => run(() => say('narr', o.age < T.grow ? `${T.name} jovem: ${o.age} de ${T.grow} dias para ficar adulta. Árvores não precisam de rega.` : `${T.name} adulta. Os frutos voltam ${T.every - (o.cool || 0) <= 1 ? 'amanhã' : `em ${T.every - (o.cool || 0)} dias`}.`)));
      }
      if (kind === 'sapling') {
        const ok = !o && [-1, 0, 1].every(dr => [-1, 0, 1].every(dc => { const c = (i % World.GRID.cols) + dc, r = Math.floor(i / World.GRID.cols) + dr; const n = S.farm.tiles[r * World.GRID.cols + c]; return c < 0 || c >= World.GRID.cols || !n || n.k !== 'tree'; }));
        return ok ? A('Plantar ' + ITEMS[id].name.toLowerCase(), () => { removeItem(id); S.farm.tiles[i] = { k: 'tree', sp: ITEMS[id].tree, age: 0, fruit: false, cool: 0 }; P.hop = performance.now() + 300; toast('Muda plantada'); save(); })
          : A('Sem espaço para a muda', () => run(() => say('narr', 'Não há espaço aqui. A muda precisa de grama livre, sem terra arada, entulho ou outra árvore encostada.')));
      }
      if (id === 'enxada' && !o) return A('Arar a terra', () => { if (!useTool(id, 2)) return; S.farm.tiles[i] = { k: 'soil' }; qEvent('till'); save(); });
      if (id === 'regador' && o && o.k === 'soil' && !o.w) return A(`Regar (água: ${S.can}/10)`, () => { if (!S.can) return toast('Regador vazio: encha no lago'); if (!useTool(id, 1)) return; S.can--; o.w = 1; if (o.crop) qEvent('water'); renderHotbar(); save(); });
      if (kind === 'seed' && o && o.k === 'soil' && !o.crop) return A('Plantar ' + CROPS[ITEMS[id].crop].name.toLowerCase(), () => { removeItem(id); o.crop = ITEMS[id].crop; o.g = 0; P.hop = performance.now() + 250; qEvent('plant'); save(); });
      if (o && (o.k === 'branch' || o.k === 'stone' || o.k === 'weed')) {
        const need = { branch: 'machado', stone: 'picareta', weed: 'foice' }[o.k], name = { branch: 'Galho', stone: 'Pedra', weed: 'Mato' }[o.k];
        if (id !== need) return { label: `${name} (use ${need === 'foice' ? 'a foice' : need === 'machado' ? 'o machado' : 'a picareta'})`, cursor };
        return A({ branch: 'Cortar o galho', stone: 'Quebrar a pedra', weed: 'Cortar o mato' }[o.k], () => {
          const drop = { branch: 'madeira', stone: 'pedra' }[o.k];
          if (drop && !canAdd(drop)) return toast('Mochila cheia');
          if (!useTool(id, o.k === 'weed' ? 1 : 3)) return;
          delete S.farm.tiles[i]; if (drop) gain(drop); save();
        });
      }
      if (o && o.k === 'soil' && o.crop) return { label: `${CROPS[o.crop].name}: ${o.g} de ${CROPS[o.crop].days} dias${o.w ? ', regado' : ', precisa de água'}`, cursor };
      if (kind === 'seed' && !o) return { label: 'Are a terra antes de plantar', cursor };
    } else if (kind === 'sapling') return { label: 'Sem espaço para a muda', act: () => run(() => say('narr', 'Mudas só podem ser plantadas na terra da sua fazenda, em grama livre.')) };
    // bosque
    for (let n = 0; n < World.NTREES.length; n++) {
      const [x, y] = World.NTREES[n]; if (S.nature.trees[n] || Math.hypot(fx - x, fy - (y - 6)) > 15) continue;
      if (id !== 'machado') return { label: 'Árvore (use o machado)' };
      return { label: 'Cortar a árvore', act: () => { if (!canAdd('madeira', 3)) return toast('Mochila cheia'); if (!useTool(id, 3)) return; hits['t' + n] = (hits['t' + n] || 0) + 1; if (hits['t' + n] >= 3) { delete hits['t' + n]; S.nature.trees[n] = S.day + 4; gain('madeira', 3); save(); } else toast(`Tchac! (${hits['t' + n]}/3)`); } };
    }
    for (let n = 0; n < World.NROCKS.length; n++) {
      const [x, y] = World.NROCKS[n]; if (S.nature.rocks[n] || Math.hypot(fx - x, fy - (y - 5)) > 16) continue;
      if (id !== 'picareta') return { label: 'Rocha (use a picareta)' };
      return { label: 'Quebrar a rocha', act: () => { if (!canAdd('pedra', 2)) return toast('Mochila cheia'); if (!useTool(id, 3)) return; hits['r' + n] = (hits['r' + n] || 0) + 1; if (hits['r' + n] >= 2) { delete hits['r' + n]; S.nature.rocks[n] = S.day + 3; gain('pedra', 2); save(); } else toast('Crac! (1/2)'); } };
    }
    if (id === 'espada') return { label: 'Golpear', act: () => { useTool(id, 1); } };
    return null;
  }

  /* Anima a ferramenta e gasta energia. Devolve false se faltar energia. */
  function useTool(id, energy) {
    if (S.energy < energy) { toast('Sem energia. Durma para recuperar.'); return false; }
    S.energy -= energy;
    const now = performance.now(); P.tool = { id, t0: now }; P.work = now + 300;
    renderHud();
    return true;
  }

  /* =====================================================
     ENTRADA: TECLADO E TOQUE
     ===================================================== */
  const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
  const typing = e => /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
  window.addEventListener('keydown', e => {
    if (screen !== 'game') return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (typing(e)) return;
    if (/^Arrow|^ $/.test(e.key)) e.preventDefault();               // as setas e o espaço não rolam a página
    if (KEYMAP[e.key]) { keys[KEYMAP[e.key]] = true; return; }
    if (/^[0-9]$/.test(e.key) && !blocked()) { selectSlot(e.key === '0' ? 9 : +e.key - 1); return; }
    if (e.key === 'e' || e.key === 'E' || e.key === ' ' || e.key === 'Enter') { if (e.repeat) return; e.preventDefault(); action(); }
  });
  window.addEventListener('keyup', e => { if (KEYMAP[e.key]) keys[KEYMAP[e.key]] = false; });
  window.addEventListener('blur', () => { Object.keys(keys).forEach(k => { keys[k] = false; }); });
  document.querySelectorAll('[data-dir]').forEach(b => {
    const set = v => e => { e.preventDefault(); keys[b.dataset.dir] = v; };
    b.addEventListener('pointerdown', set(true)); ['pointerup', 'pointerleave', 'pointercancel'].forEach(n => b.addEventListener(n, set(false)));
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
  $('touch-act').addEventListener('click', () => action());
  function action() {
    if (onAdvance) return onAdvance();
    if (blocked() || P.work) return;
    if (near && near.act) near.act();
  }
  function selectSlot(i) { S.sel = i; renderHotbar(); }

  /* =====================================================
     DIÁLOGO
     ===================================================== */
  let onAdvance = null, typer = 0;
  function setSpeaker(who) {
    const sp = who === 'narr' ? { name: '', look: null } : who, pc = $('portrait');
    $('dlg-who').textContent = sp.name; $('dlg-who').hidden = !sp.name;
    pc.hidden = !sp.look;
    if (sp.look) { const g = pc.getContext('2d'); g.clearRect(0, 0, 20, 18); Sprites.draw(g, sp.look, 0, -1); }
    $('dlg-text').classList.toggle('narr', who === 'narr');
  }
  function say(who, text) {
    return new Promise(resolve => {
      text = fmt(text); setSpeaker(who);
      $('dlg-choices').replaceChildren(); $('dlg-form').hidden = true; $('dlg-more').hidden = false;
      const box = $('dlg-text'); let n = 0;
      clearInterval(typer);
      const finish = () => { clearInterval(typer); typer = 0; box.textContent = text; };
      typer = setInterval(() => { n += 2; box.textContent = text.slice(0, n); if (n >= text.length) finish(); }, 16);
      onAdvance = () => { if (typer) finish(); else { onAdvance = null; resolve(); } };
    });
  }
  function choose(labels) {
    return new Promise(resolve => {
      onAdvance = null; $('dlg-more').hidden = true;
      const box = $('dlg-choices'); box.replaceChildren();
      labels.forEach((label, i) => box.append(btn('btn', fmt(label), e => { e.stopPropagation(); box.replaceChildren(); resolve(i); })));
      box.firstChild.focus();
    });
  }
  /* Pede um texto curto (nome da galinha). Devolve o texto, ou o padrão se ficar vazio. */
  function askText(who, text, fallback) {
    return new Promise(resolve => {
      setSpeaker(who); clearInterval(typer); typer = 0; $('dlg-text').textContent = fmt(text);
      onAdvance = null; $('dlg-more').hidden = true; $('dlg-choices').replaceChildren();
      const form = $('dlg-form'), input = $('dlg-input'); form.hidden = false; input.value = ''; input.placeholder = fallback; input.focus();
      form.onsubmit = e => { e.preventDefault(); form.hidden = true; form.onsubmit = null; resolve((input.value.trim() || fallback).slice(0, 12)); };
    });
  }
  $('dialog').addEventListener('click', e => { if (!e.target.closest('button, input, form') && onAdvance) onAdvance(); });
  async function run(flow) {
    if (busy) return;
    busy = true; $('dialog').hidden = false; $('dock').hidden = true;
    try { await flow(); }
    finally { busy = false; onAdvance = null; $('dialog').hidden = true; $('dock').hidden = false; save(); renderHud(); renderHotbar(); }
  }
  async function sayAll(who, lines) { for (const l of lines) await say(who, l); }
  function toast(text) { const t = el('div', 'toast', text); $('toasts').append(t); while ($('toasts').children.length > 4) $('toasts').firstChild.remove(); setTimeout(() => t.remove(), 2300); }

  /* =====================================================
     MISSÕES
     ===================================================== */
  const qDone = id => S.quests[id] && S.quests[id].state === 'done';
  const qActive = () => Object.keys(QUESTS).filter(id => S.quests[id] && S.quests[id].state === 'active');
  const qUnlocked = id => { const q = QUESTS[id]; return !S.quests[id] && (!q.after || qDone(q.after)) && (!q.hearts || hearts(q.giver) >= q.hearts); };
  const startItemsFit = q => !q.start || Object.keys(q.start.items).every(id => canAdd(id, q.start.items[id]));
  function startQuest(id) {
    const q = QUESTS[id];
    S.quests[id] = { state: 'active', n: {} };
    if (q.start) Object.keys(q.start.items).forEach(k => gain(k, q.start.items[k]));
    if (id === 'chapeu') S.nature.hat = true;                 // o chapéu perdido aparece no bosque
    toast('Nova missão: ' + q.title);
  }
  function startAutoQuests() { Object.keys(QUESTS).forEach(id => { if (QUESTS[id].auto && qUnlocked(id)) startQuest(id); }); }
  /* Conta uma ação feita no mundo para as missões em andamento. */
  function qEvent(type) {
    qActive().forEach(id => {
      const c = QUESTS[id].goal.count; if (!c || !c[type]) return;
      const st = S.quests[id]; st.n[type] = Math.min(c[type], (st.n[type] || 0) + 1);
      if (QUESTS[id].selfDone && qReady(id)) completeQuest(id);
    });
    renderHud();
  }
  function qReady(id) {
    const g = QUESTS[id].goal, st = S.quests[id];
    if (g.count && !Object.keys(g.count).every(k => (st.n[k] || 0) >= g.count[k])) return false;
    if (g.deliver && !Object.keys(g.deliver).every(k => count(k) >= g.deliver[k])) return false;
    return true;
  }
  const qProgress = id => { const g = QUESTS[id].goal, st = S.quests[id] || { n: {} }; return [...Object.keys(g.count || {}).map(k => `${COUNT_LABEL[k]}: ${Math.min(st.n[k] || 0, g.count[k])}/${g.count[k]}`), ...Object.keys(g.deliver || {}).map(k => `${ITEMS[k].name}: ${Math.min(count(k), g.deliver[k])}/${g.deliver[k]}`)].join(' · '); };
  const rewardText = r => [r.coins && `${r.coins} moedas`, ...Object.keys(r.items || {}).map(k => `${r.items[k]} ${ITEMS[k].name}`), r.hen && 'uma galinha', r.friend && 'amizade'].filter(Boolean).join(', ');
  /* Conclui uma única vez: retira os itens entregues e dá a recompensa. */
  function completeQuest(id) {
    const st = S.quests[id], q = QUESTS[id];
    if (!st || st.state !== 'active' || !qReady(id)) return false;
    if (q.goal.deliver) Object.keys(q.goal.deliver).forEach(k => removeItem(k, q.goal.deliver[k]));
    st.state = 'done'; st.day = S.day;
    const r = q.reward || {};
    if (r.coins) { S.coins += r.coins; toast(`+${r.coins} moedas`); }
    Object.keys(r.items || {}).forEach(k => {               // o que não couber na mochila vai para o baú de casa
      const left = addTo(S.inv, k, r.items[k]); toast(`+${r.items[k]} ${ITEMS[k].name}`);
      if (left) { addTo(S.chest, k, left); toast('Mochila cheia: parte foi para o baú de casa'); }
    });
    if (r.friend) addFriend(q.giver, r.friend);
    if (r.friendTo && q.to) addFriend(q.to, r.friendTo);
    if (r.world) S.world[r.world] = true;
    toast('Missão concluída: ' + q.title);
    startAutoQuests(); save(); renderHud(); renderHotbar();
    return true;
  }
  /* O morador tem algo a tratar: missão nova, ou entrega pronta. */
  function questMark(v) {
    return Object.keys(QUESTS).some(id => { const q = QUESTS[id]; if (q.auto && !S.quests[id]) return false;
      if (S.quests[id] && S.quests[id].state === 'active') return !q.selfDone && (q.to || q.giver) === v.id && qReady(id);
      return q.giver === v.id && !q.auto && qUnlocked(id); });
  }
  function objective() {
    const id = qActive()[0]; if (!id) return '';
    const p = qProgress(id); return QUESTS[id].title + (p ? ` — ${p}` : '');
  }

  /* =====================================================
     MORADORES
     ===================================================== */
  function talkTo(v) {
    run(async () => {
      const who = { name: v.name, look: v.look };
      // 1) entrega de missão
      const turn = qActive().find(id => { const q = QUESTS[id]; return !q.selfDone && (q.to || q.giver) === v.id && qReady(id); });
      if (turn) {
        const q = QUESTS[turn], items = (q.reward && q.reward.items) || {};
        if (!Object.keys(items).every(k => canAdd(k, items[k]))) return say('narr', 'Sua mochila está cheia. Abra espaço para receber a recompensa e fale de novo.');
        await sayAll(who, q.done || ['Agradeço muito!']);
        if (q.reward && q.reward.hen) await newHen(who);
        completeQuest(turn);
        return;
      }
      // 2) missão nova
      const offer = Object.keys(QUESTS).find(id => QUESTS[id].giver === v.id && !QUESTS[id].auto && qUnlocked(id));
      if (offer) {
        const q = QUESTS[offer];
        await sayAll(who, q.offer);
        if (!startItemsFit(q)) return say('narr', 'Sua mochila está cheia. Abra espaço e fale de novo para aceitar.');
        startQuest(offer);
        return say('narr', `Missão aceita: ${q.title}. ${q.desc} Recompensa: ${rewardText(q.reward)}.`);
      }
      // no Armazém, Dona Celeste atende no balcão
      if (v.id === 'celeste' && map.id === 'loja' && await choose(['Comprar e vender', 'Conversar']) === 0) { setTimeout(() => openModal('loja'), 0); return; }
      // 3) cena de amizade (uma vez, com 3 corações)
      if (hearts(v.id) >= 3 && !S.scenes[v.id]) {
        const sc = v.scene, n = sc.n || 1;
        if (canAdd(sc.item, n)) { await sayAll(who, sc.lines); S.scenes[v.id] = true; gain(sc.item, n); return; }
      }
      // 4) presente, se há um produto na mão
      const it = equipped(), giftable = it && !ITEMS[it.id].kind && !S.daily.gift[v.id];
      if (giftable && await choose(['Conversar', `Dar ${ITEMS[it.id].name}`]) === 1) return give(v, who, it.id);
      // 5) conversa: a primeira do dia aumenta a amizade
      const pending = qActive().find(id => (QUESTS[id].to || QUESTS[id].giver) === v.id && !QUESTS[id].selfDone);
      if (!S.daily.talk[v.id]) {
        S.daily.talk[v.id] = true; addFriend(v.id, FRIEND.talk);
        const tier = Math.min(2, Math.floor(hearts(v.id) / 2));
        await say(who, v.talk[tier][S.day % v.talk[tier].length]);
      } else await say(who, v.again);
      if (pending) await say('narr', `Missão em andamento com ${v.name}: ${QUESTS[pending].desc} (${qProgress(pending) || 'em andamento'})`);
    });
  }
  async function give(v, who, id) {
    const kind = v.love.includes(id) ? 'love' : v.like.includes(id) ? 'like' : v.dislike.includes(id) ? 'dislike' : 'neutral';
    removeItem(id, 1); S.daily.gift[v.id] = true; S.known[v.id][id] = kind;
    addFriend(v.id, FRIEND[kind]);
    await say(who, v.gift[kind]);
    if (kind === 'love') toast(`${v.name} adorou!`);
  }

  /* =====================================================
     GALINHAS
     ===================================================== */
  const wellText = w => (w >= 75 ? 'radiante' : w >= 50 ? 'tranquila' : w >= 25 ? 'meio ressabiada' : 'tristonha');
  function spawnHens() {
    const Y = World.YARD;
    hens = S.coop.hens.map((h, i) => ({ x: Y.x0 + 20 + (i * 37) % (Y.x1 - Y.x0 - 30), y: Y.y0 + 12 + (i * 23) % (Y.y1 - Y.y0 - 16), tx: 0, ty: 0, wait: 500 + i * 400, kind: h.kind || 0, flip: false }));
    hens.forEach(h => { h.tx = h.x; h.ty = h.y; });
  }
  function updateHens(dt, t) {
    if (!map || map.id !== 'fora') return;
    const Y = World.YARD;
    hens.forEach((h, i) => {
      const dx = h.tx - h.x, dy = h.ty - h.y, d = Math.hypot(dx, dy);
      h.heart = S.coop.hens[i] && S.coop.hens[i].petT && t < S.coop.hens[i].petT;
      if (d > 1) { h.x += dx / d * 0.02 * dt; h.y += dy / d * 0.02 * dt; h.moving = true; h.flip = dx < 0; h.peck = false; return; }
      h.moving = false; h.wait -= dt; h.peck = h.wait < 900 && Math.floor(t / 220) % 2 === 0;
      if (h.wait <= 0) { h.wait = 1500 + Math.random() * 3500; h.tx = Y.x0 + Math.random() * (Y.x1 - Y.x0); h.ty = Y.y0 + Math.random() * (Y.y1 - Y.y0); }
    });
  }
  async function newHen(who) {
    const name = await askText(who || 'narr', 'Que nome você dá a ela?', ['Pipoca', 'Farofa', 'Canjica', 'Paçoca'][S.coop.hens.length % 4]);
    S.coop.hens.push({ name, well: 60, pet: 0, kind: S.coop.hens.length % 4 });
    spawnHens(); toast(`${name} chegou ao galinheiro`); save();
  }
  function henMenu(i) {
    run(async () => {
      const h = S.coop.hens[i];
      await say('narr', `${h.name} olha para você, curiosa.`);
      const c = await choose(['Fazer carinho', 'Ver como ela está', 'Trocar o nome', 'Deixar quieta']);
      if (c === 0) {
        if (h.pet === S.day) return say('narr', `${h.name} já ganhou carinho hoje, mas se aninha na sua mão mesmo assim.`);
        h.pet = S.day; h.well = Math.min(100, h.well + 8); h.petT = performance.now() + 2500;
        return say('narr', `Você faz carinho em ${h.name}. Ela fecha os olhos e cacareja baixinho.`);
      }
      if (c === 1) return say('narr', `${h.name} está ${wellText(h.well)}. ${S.coop.feed ? 'Há ração no comedouro para esta noite.' : 'O comedouro está vazio: sem ração, ela não bota e fica triste.'} Galinha alimentada bota um ovo, que aparece no ninho na manhã seguinte.`);
      if (c === 2) { h.name = await askText('narr', 'Qual é o novo nome?', h.name); return say('narr', `Agora ela se chama ${h.name}.`); }
    });
  }
  function feed() {
    if (!count('racao')) return run(() => say('narr', `O comedouro tem ${S.coop.feed} porção(ões). Você não tem ração na mochila: o Armazém vende.`));
    if (S.coop.feed >= 8) return toast('O comedouro está cheio');
    removeItem('racao', 1); S.coop.feed++; qEvent('feed'); toast(`Ração no comedouro: ${S.coop.feed}`); save();
  }
  function nest() {
    if (!S.coop.eggs) return run(() => say('narr', S.coop.hens.length ? 'O ninho está vazio. Com ração no comedouro, cada galinha bota um ovo durante a noite.' : 'Um ninho de palha, vazio. O galinheiro ainda não tem moradoras.'));
    let got = 0; while (S.coop.eggs && canAdd('ovo')) { addTo(S.inv, 'ovo', 1); S.coop.eggs--; got++; }
    if (!got) return toast('Mochila cheia');
    floats.push({ icon: 'ovo', x: P.x, y: P.y, t0: performance.now() }); toast(`+${got} Ovo${got > 1 ? 's' : ''}`); if (S.coop.eggs) toast('Mochila cheia: ficaram ovos no ninho');
    renderHotbar(); save();
  }

  /* =====================================================
     DIA: DORMIR
     ===================================================== */
  function bed() {
    run(async () => {
      await say('narr', S.time >= 1140 ? 'A cama está feita e a noite caiu.' : 'Ainda é dia, mas a cama está sempre pronta.');
      if (await choose(['Dormir até amanhã', 'Ainda não']) === 0) setTimeout(sleep, 0);
    });
  }
  /* Processa a noite uma única vez: é o único lugar onde plantas, árvores e galinhas avançam. */
  function sleep() {
    const notes = [];
    let grew = 0, ripe = 0, fruits = 0, eggs = 0, hungry = 0;
    for (const key in S.farm.tiles) {
      const o = S.farm.tiles[key];
      if (o.k === 'soil') { if (o.crop && o.w && o.g < CROPS[o.crop].days) { o.g++; grew++; if (o.g >= CROPS[o.crop].days) ripe++; } o.w = 0; }
      if (o.k === 'tree') { const T = TREES[o.sp]; o.age++; if (o.age >= T.grow && !o.fruit) { o.cool = (o.cool || 0) + 1; if (o.cool >= T.every) { o.fruit = true; o.cool = 0; fruits++; } } }
    }
    S.coop.hens.forEach(h => { if (S.coop.feed > 0) { S.coop.feed--; h.well = Math.min(100, h.well + 6); if (S.coop.eggs < S.coop.hens.length * 3) { S.coop.eggs++; eggs++; } } else { h.well = Math.max(0, h.well - 12); hungry++; } });
    const finished = S.day;
    S.day++; S.time = DAY_START; clockAcc = 0; S.energy = 100; S.daily = { talk: {}, gift: {} };
    [S.nature.trees, S.nature.rocks].forEach(m => Object.keys(m).forEach(k => { if (S.day >= m[k]) delete m[k]; }));
    refreshForage(S);
    const b = World.get('casa').objs.find(o => o.kind === 'bed');
    enterMap('casa', b.x + 20, b.y + 10, 'down');
    save();

    if (grew) notes.push(`${grew} planta(s) regada(s) cresceram${ripe ? `, e ${ripe} está(ão) pronta(s) para colher` : ''}.`);
    if (fruits) notes.push(`${fruits} árvore(s) amanheceram com frutos.`);
    if (eggs) notes.push(`As galinhas botaram ${eggs} ovo(s). Estão no ninho.`);
    if (hungry) notes.push(`${hungry} galinha(s) ficaram sem ração e não botaram.`);
    if (!notes.length) notes.push('Uma noite tranquila no sítio.');
    const box = $('summary-body'); box.replaceChildren(el('h3', '', `Dia ${finished} encerrado`));
    const ul = el('ul', 'list'); notes.forEach(n => ul.append(el('li', '', n))); box.append(ul, el('p', 'dim', 'Você acorda com a energia completa.'));
    const go = btn('btn primary', `Começar o dia ${S.day} ▶`, () => { $('summary').hidden = true; renderHud(); toast(`Dia ${S.day}`); }); go.id = 'summary-go';
    box.append(go); $('summary').hidden = false; go.focus(); renderHud(); renderHotbar();
  }

  /* =====================================================
     HUD E BARRA DE ITENS
     ===================================================== */
  function renderHud() {
    if (!S) return;
    const hud = $('hud'); hud.replaceChildren();
    const en = el('div', 'xp'), bar = el('div', 'bar' + (S.energy < 20 ? ' low' : '')), fill = el('i'); fill.style.width = S.energy + '%'; bar.append(fill);
    en.append(el('span', '', '⚡'), bar);
    hud.append(el('span', 'name', `Dia ${S.day}`), el('span', '', clock()), en, el('span', '', `🪙 ${S.coins}`));
    const o = objective();
    $('objective').replaceChildren(...(o ? [el('b', '', 'MISSÃO'), el('span', '', o)] : S.time >= 1260 ? [el('span', '', 'Já é tarde. A cama espera por você em casa.')] : []));
  }
  function slotNode(s, cls) {
    const b = el('button', 'slot ' + (cls || '')); b.type = 'button';
    if (s) { b.append(cloneIcon(s.id)); b.title = ITEMS[s.id].name; b.setAttribute('aria-label', ITEMS[s.id].name); if (s.id === 'regador') b.append(el('i', '', `${S.can}`)); else if (s.n > 1) b.append(el('i', '', String(s.n))); }
    return b;
  }
  function cloneIcon(id) { const c = el('canvas', 'pixel'); c.width = 16; c.height = 16; c.getContext('2d').drawImage(World.icon(id), 0, 0); return c; }
  function renderHotbar() {
    if (!S) return;
    const bar = $('hotbar'); bar.replaceChildren();
    for (let i = 0; i < HOTBAR; i++) { const b = slotNode(S.inv[i], i === S.sel ? 'sel' : ''); b.dataset.slot = i; b.append(el('u', '', String((i + 1) % 10))); b.onclick = () => selectSlot(i); bar.append(b); }
    const it = equipped(); $('equipped').textContent = it ? ITEMS[it.id].name : 'Mãos livres';
  }

  /* =====================================================
     PAINÉIS
     ===================================================== */
  let tab = 'mochila', picked = null;
  function openModal(t) { if (busy) return; $('modal').hidden = false; picked = null; renderTab(t); }
  function closeModal() { $('modal').hidden = true; if (S) { renderHotbar(); renderHud(); } }
  document.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => ($('modal').hidden ? openModal(b.dataset.tab) : renderTab(b.dataset.tab)); });
  $('modal-close').onclick = closeModal;
  $('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal(); });
  const closeBtn = () => { const b = btn('btn primary', 'Fechar', closeModal); b.style.marginTop = '12px'; return b; };
  const heartsNode = n => { const s = el('span', 'hearts'); for (let i = 0; i < 5; i++) s.append(el('i', i < n ? 'on' : '', '♥')); return s; };

  function grid(arr, onClick, selIdx) {
    const g = el('div', 'slots');
    arr.forEach((s, i) => { const b = slotNode(s, i === selIdx ? 'sel' : ''); b.dataset.i = i; b.onclick = () => onClick(i); g.append(b); });
    return g;
  }
  /* Move a pilha inteira de um conjunto para o outro, empilhando; o que não couber fica onde estava. */
  function moveStack(from, i, to) {
    const s = from[i]; if (!s) return;
    const left = addTo(to, s.id, s.n);
    if (left === s.n) return toast(to === S.inv ? 'Mochila cheia' : 'Baú cheio');
    if (left) { s.n = left; toast('Só coube uma parte'); } else from[i] = null;
    if (S.sel >= 0 && !S.inv[S.sel]) renderHotbar();
    save();
  }

  const TABS = {
    mochila(body) {
      body.append(el('h3', '', 'Mochila'), el('p', 'dim', 'Os 10 primeiros espaços são a barra de acesso rápido (teclas 1 a 0). Toque em um item e depois em outro espaço para mover.'));
      body.append(grid(S.inv, i => { if (picked === null) { if (S.inv[i]) picked = i; } else { [S.inv[picked], S.inv[i]] = [S.inv[i], S.inv[picked]]; picked = null; save(); } renderTab('mochila'); }, picked));
      const s = picked !== null && S.inv[picked];
      const info = el('div', 'item-info');
      if (s) {
        const it = ITEMS[s.id];
        info.append(el('b', '', `${it.name}${s.n > 1 ? ' × ' + s.n : ''}`), el('span', 'dim', it.desc + (it.sell ? ` Vende por ${it.sell} moedas.` : '')));
        if (it.kind === 'hat') info.append(btn('btn', S.look.hat === it.hat ? 'Tirar o chapéu' : 'Usar o chapéu', () => { S.look.hat = S.look.hat === it.hat ? null : it.hat; save(); renderTab('mochila'); }));
      } else info.append(el('span', 'dim', `Moedas: ${S.coins} · Energia: ${S.energy}/100 · Água no regador: ${S.can}/10`));
      body.append(info);
    },
    bau(body) {
      body.append(el('h3', '', 'Baú'), el('p', 'dim', 'Toque em um item para passar a pilha inteira para o outro lado.'));
      body.append(el('p', '', 'No baú'), grid(S.chest, i => { moveStack(S.chest, i, S.inv); renderTab('bau'); }));
      body.append(el('p', '', 'Na mochila'), grid(S.inv, i => { moveStack(S.inv, i, S.chest); renderTab('bau'); }));
    },
    diario(body) {
      body.append(el('h3', '', 'Missões em andamento'));
      const act = qActive(), ul = el('ul', 'list');
      if (!act.length) ul.append(el('li', 'dim', 'Nenhuma missão no momento. Converse com os moradores: quem tem um pedido aparece com um "!".'));
      act.forEach(id => { const q = QUESTS[id], li = el('li'); li.append(el('span', 'mt', q.title), el('span', 'dim', `Pedido de: ${villagerById(q.giver).name}${q.to ? ' · Entregar a: ' + villagerById(q.to).name : ''}`), el('span', '', q.desc)); const p = qProgress(id); if (p) li.append(el('span', 'ok', 'Progresso: ' + p)); li.append(el('span', 'dim', 'Recompensa: ' + rewardText(q.reward))); ul.append(li); });
      body.append(ul);
      const done = Object.keys(QUESTS).filter(qDone);
      if (done.length) { body.append(el('h3', '', 'Concluídas')); const dl = el('ul', 'list'); done.forEach(id => dl.append(el('li', 'done-task', `✔ ${QUESTS[id].title} (dia ${S.quests[id].day})`))); body.append(dl); }
    },
    amizades(body) {
      body.append(el('h3', '', 'Moradores'), el('p', 'dim', 'A primeira conversa do dia e um presente por dia aumentam a amizade. Cada morador tem seus gostos.'));
      const ul = el('ul', 'list');
      VILLAGERS.forEach(v => {
        const li = el('li', 'friend'), top = el('div', 'friend-top'), txt = el('div');
        txt.append(el('b', '', v.name), heartsNode(hearts(v.id)), el('span', 'dim', v.bio));
        top.append(Sprites.canvas(v.look), txt); li.append(top);
        li.append(el('span', 'dim', `Costuma ficar ${v.place}.`), el('span', '', `Hoje: conversa ${S.daily.talk[v.id] ? '✔' : '—'} · presente ${S.daily.gift[v.id] ? '✔' : '—'}`));
        const kn = Object.keys(S.known[v.id] || {});
        if (kn.length) li.append(el('span', 'ok', 'Você já sabe: ' + kn.map(k => `${ITEMS[k].name} (${{ love: 'adora', like: 'gosta', neutral: 'aceita', dislike: 'não gosta' }[S.known[v.id][k]]})`).join(', ')));
        ul.append(li);
      });
      body.append(ul);
      const reset = btn('btn ghost', 'Apagar esta fazenda e voltar ao título', () => { if (!confirm('Apagar a fazenda salva neste navegador e voltar ao título?')) return; store.del(SAVE_KEY); closeModal(); initTitle(); });
      reset.style.marginTop = '16px'; body.append(reset);
    },
    roupa(body) {
      const top = el('div', 'sheet-top'), pv = el('div', 'wardrobe-pv');
      ['down', 'left', 'up'].forEach(d => pv.append(Sprites.canvas(S.look, d)));
      top.append(pv, el('div', '', `${S.name}, ${S.age} anos`)); body.append(el('h3', '', 'Guarda-roupa e espelho'), top);
      const change = () => { save(); renderTab('roupa'); };
      [['Cabelo', 'cabelo'], ['Cor do cabelo', 'corCabelo'], ['Roupa de cima', 'cima'], ['Roupa de baixo', 'baixo'], ['Calçado', 'calcado']].forEach(([t, k]) => { body.append(el('h3', '', t)); LOOK_SECTIONS[k](body, S.look, change); });
      body.append(el('h3', '', 'Chapéu'));
      const mine = Sprites.HATS.filter(h => owns(Object.keys(ITEMS).find(k => ITEMS[k].hat === h.id)));
      optionGrid(body, [{ id: 'none', label: 'Sem chapéu' }, ...mine.map(h => ({ id: h.id, label: h.name, canvas: Sprites.canvas(Object.assign({}, S.look, { hat: h.id })) }))], S.look.hat || 'none', id => { S.look.hat = id === 'none' ? null : id; change(); }, 'many');
      if (!mine.length) body.append(el('p', 'dim', 'Você ainda não tem chapéus. O Armazém vende um, e amigos podem presentear outros.'));
    },
    loja(body) {
      body.append(el('h3', '', 'Armazém da Dona Celeste'), el('p', '', `Suas moedas: ${S.coins}`));
      const row = (id, name, unit, max, label, go, extra) => {
        const li = el('li'), meta = el('div', 'meta'), qty = el('b', 'qty', '1'), tot = el('span', '', '');
        let n = 1; const upd = () => { qty.textContent = n; tot.textContent = `${label} ${n} por ${n * unit} moedas`; ok.disabled = !max || (label === 'Comprar' && n * unit > S.coins); };
        const ok = btn('btn primary', 'Confirmar', () => go(n)); ok.dataset.item = id;
        const left = el('div', 'shop-item'); left.append(cloneIcon(extra || id), el('span', '', `${name} — ${unit} moedas cada`));
        meta.append(btn('btn', '−', () => { n = Math.max(1, n - 1); upd(); }), qty, btn('btn', '+', () => { n = Math.min(Math.max(1, max), n + 1); upd(); }), tot, ok);
        li.append(left, meta); upd(); return li;
      };
      body.append(el('h3', '', 'Comprar'));
      const buy = el('ul', 'list buy');
      SHOP.forEach(id => buy.append(row(id, ITEMS[id].name, ITEMS[id].price, 20, 'Comprar', n => {
        if (S.coins < n * ITEMS[id].price) return toast('Moedas insuficientes');
        if (!canAdd(id, n)) return toast('Mochila cheia');
        S.coins -= n * ITEMS[id].price; addTo(S.inv, id, n); toast(`+${n} ${ITEMS[id].name}`); save(); renderTab('loja');
      })));
      if (qDone('galinheiro') && S.coop.hens.length < MAX_HENS) buy.append(row('galinha', 'Galinha', HEN_PRICE, 1, 'Comprar', () => {
        if (S.coins < HEN_PRICE) return toast('Moedas insuficientes');
        S.coins -= HEN_PRICE; save(); closeModal(); run(() => newHen('narr'));
      }, 'ovo'));
      body.append(buy, el('h3', '', 'Vender'));
      const sell = el('ul', 'list sell'), ids = [...new Set(S.inv.filter(s => s && ITEMS[s.id].sell).map(s => s.id))];
      if (!ids.length) sell.append(el('li', 'dim', 'Você não tem nada para vender agora. Colheitas, ovos, frutos e o que achar no bosque têm preço.'));
      ids.forEach(id => sell.append(row(id, `${ITEMS[id].name} (você tem ${count(id)})`, ITEMS[id].sell, count(id), 'Vender', n => {
        n = Math.min(n, count(id)); if (!n) return;
        removeItem(id, n); S.coins += n * ITEMS[id].sell; toast(`+${n * ITEMS[id].sell} moedas`); save(); renderTab('loja');
      })));
      body.append(sell);
    },
  };
  const SPECIAL = ['bau', 'roupa', 'loja'];
  function renderTab(t) {
    tab = TABS[t] ? t : tab;
    $('tabs').querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('on', b.dataset.tab === tab); b.hidden = SPECIAL.includes(tab); });
    const body = $('modal-body'), sc = body.scrollTop; body.replaceChildren(); TABS[tab](body);
    if (SPECIAL.includes(tab)) body.append(closeBtn());
    body.scrollTop = sc; renderHotbar(); renderHud();
  }
  function shop() {
    const c = villagerById('celeste'), at = villagerAt(c, S.time);
    if (at.where !== 'loja') return run(() => say('narr', 'O balcão está vazio. Dona Celeste atende das 6h às 18h; depois disso, costuma estar na praça.'));
    talkTo(c);
  }

  /* Ganchos para testes automatizados e depuração. */
  window.__trilha = {
    get S() { return S; }, get P() { return P; }, get map() { return map; }, get near() { return near; }, get busy() { return blocked(); }, get hens() { return hens; }, save,
    villagerAt: id => villagerAt(villagerById(id), S.time), tile: i => World.tilePos(i),
    place(m, x, y, dir) { enterMap(m, x, y, dir || 'down'); P.x = x; P.y = y; },
  };

  initTitle();
  requestAnimationFrame(loop);
})();
