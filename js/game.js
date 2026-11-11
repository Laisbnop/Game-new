/* Lógica do jogo: salvamento, criação de personagem, exploração da vila
   (movimento, colisão, câmera, interação), tarefas de trabalho, ciclo do dia,
   história da família e painéis. */

(() => {
  const SAVE_KEY = 'trilha-rpg-save-v3';
  const OLD_KEYS = ['trilha-rpg-save-v2', 'trilha-rpg-save-v1'];   // versões anteriores (cursos e personagens prontos)
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  let S = null;            // estado salvo
  let screen = 'title';

  /* =====================================================
     SALVAMENTO
     ===================================================== */
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, v) { try { localStorage.setItem(key, v); } catch { /* sem armazenamento: joga sem salvar */ } },
    del(key) { try { localStorage.removeItem(key); } catch { /* ignora */ } },
  };
  const save = () => { if (S) store.set(SAVE_KEY, JSON.stringify(S)); };
  const validSave = s => s && s.v === 3 && s.look && typeof s.name === 'string' && JOBS[s.job] && CONTEXTS[s.cls] && s.pos && Array.isArray(s.tasks) && s.farm && s.world;

  function newState(base) {
    return Object.assign({
      v: 3, look: null, name: '', age: START_AGE, job: null, cls: null, destino: false, originKnown: true,
      level: 1, xp: 0, coins: START_COINS, count: 0,
      day: 1, time: DAY_START, energy: 100, pos: { map: 'casa', x: 44, y: 124, dir: 'down' },
      inv: {}, chest: {}, tasks: [], today: { done: [], coins: 0, xp: 0 },
      farm: { plots: Array.from({ length: World.PLOTS.length }, () => ({ s: 0, crop: null, w: false })) },
      herbsTaken: [], world: { posters: [], paintings: [], marks: {}, decor: [] },
      story: { done: {}, flags: [] }, diary: [], intro: false, seed: Math.floor(Math.random() * 1e9),
    }, base);
  }

  const OLD_LOOKS = {
    lia: { body: 'f', skin: 's2', hair: 'liso', hairColor: 'azul' }, nina: { body: 'f', skin: 's1', hair: 'cacheado', hairColor: 'rosa' },
    maya: { body: 'f', skin: 's4', hair: 'liso', hairColor: 'preto' }, caio: { body: 'm', skin: 's3', hair: 'crespo', hairColor: 'castanho' },
    teo: { body: 'm', skin: 's2', hair: 'crespo', hairColor: 'claro' }, davi: { body: 'm', skin: 's1', hair: 'liso', hairColor: 'loiro' },
  };
  /* Converte um jogo de versão anterior. O que não existe mais (cursos e missões antigas) fica de fora. */
  function migrate(o) {
    const job = OLD_JOBS[o.trail] || o.trail;
    const look = o.look && o.look.skin ? { body: o.look.body, skin: o.look.skin, hair: o.look.hair, hairColor: o.look.hairColor } : OLD_LOOKS[o.charId] || OLD_LOOKS.lia;
    const st = o.story && o.story.done ? { done: o.story.done, flags: Array.isArray(o.story.flags) ? o.story.flags : [] } : { done: {}, flags: [] };
    const s = newState({
      look, name: o.name, job, cls: o.cls, destino: !!o.destino, originKnown: o.originKnown !== false,
      level: o.level || 1, xp: o.xp || 0, coins: o.coins || 0, story: st, diary: Array.isArray(o.diary) ? o.diary.slice(-40) : [],
    });
    s.count = STORY_BEATS.filter(b => st.done[b.id]).reduce((m, b) => Math.max(m, b.at), 0);
    s.xp = Math.min(s.xp, xpNeed(s.level) - 1);
    return s;
  }

  /* Lê o que há no navegador sem alterar nada: { state } | { old } | { broken } | {} */
  function inspectSaves() {
    const cur = store.get(SAVE_KEY);
    if (cur) { try { const s = JSON.parse(cur); if (validSave(s)) return { state: s }; } catch { /* aviso abaixo */ } return { broken: true }; }
    for (const key of OLD_KEYS) {
      const raw = store.get(key); if (!raw) continue;
      try { const o = JSON.parse(raw); if (o && typeof o.name === 'string' && JOBS[OLD_JOBS[o.trail] || o.trail] && CONTEXTS[o.cls]) return { old: o }; } catch { /* aviso abaixo */ }
      return { broken: true, legacy: true };
    }
    return {};
  }

  function show(name) {
    screen = name;
    ['title', 'create', 'game'].forEach(n => { $('screen-' + n).hidden = n !== name; });
    window.scrollTo(0, 0);
  }

  /* =====================================================
     TÍTULO
     ===================================================== */
  const DEMO = { farm: { plots: World.PLOTS.map((_, i) => ({ s: i % 5, crop: CROPS[i % 3], w: i % 2 })) }, herbsTaken: [], world: { posters: [], paintings: [], marks: {}, decor: [] } };
  function initTitle() {
    S = null; show('title');
    const found = inspectSaves(), notice = $('save-notice'), cont = $('btn-continue');
    notice.hidden = true; cont.hidden = true; cont.textContent = 'Continuar';
    if (found.state) { cont.hidden = false; cont.onclick = () => { S = found.state; startGame(); }; }
    else if (found.old) {
      const o = found.old, job = JOBS[OLD_JOBS[o.trail] || o.trail];
      notice.hidden = false;
      notice.replaceChildren(el('b', '', 'Jogo de uma versão anterior encontrado. '),
        el('span', '', `${o.name}, nível ${o.level || 1}. O jogo mudou: agora você explora a vila e já começa trabalhando. Dá para continuar com o mesmo personagem — aparência, nome, profissão (${job.name}), contexto familiar, história já vivida, nível, moedas e diário são mantidos. Os cursos e as missões antigas deixaram de existir, e a rotina recomeça no dia 1. O jogo antigo não é apagado ao converter.`));
      cont.hidden = false; cont.textContent = 'Continuar com o personagem antigo';
      cont.onclick = () => { S = migrate(o); save(); startGame(); };
    } else if (found.broken) {
      notice.hidden = false;
      notice.replaceChildren(el('b', '', 'Não foi possível abrir o jogo salvo. '),
        el('span', '', found.legacy ? 'Existe um jogo de uma versão anterior neste navegador, mas ele não pôde ser aproveitado. Ele continua guardado e só será apagado se você iniciar um novo jogo.'
          : 'O arquivo de progresso está danificado. Ele continua guardado e só será substituído se você iniciar um novo jogo.'));
    }
    $('btn-new').onclick = () => {
      if ((found.state || found.old || found.broken) && !confirm('Já existe um jogo salvo neste navegador. Ao terminar de criar um novo personagem, o jogo anterior será apagado. Deseja continuar?')) return;
      startCreation();
    };
  }

  /* =====================================================
     CRIAÇÃO DE PERSONAGEM
     ===================================================== */
  const draft = {};
  let step = 0, previewTimer = 0;
  const jobName = (job, look) => (look.body === 'f' ? JOBS[job].nameF : JOBS[job].name);
  const spriteCanvas = look => { const c = el('canvas', 'pixel'); c.width = Sprites.W; c.height = Sprites.H; Sprites.draw(c.getContext('2d'), look, 0, 0); return c; };
  const lookWith = patch => Object.assign({}, draft.look, patch);

  const STEPS = [
    { title: 'Gênero', hint: 'Muda apenas a roupa do personagem.',
      build: box => optionGrid(box, Sprites.BODIES.map(b => ({ id: b.id, label: b.name, canvas: spriteCanvas(lookWith({ body: b.id })) })), () => draft.look.body, id => { draft.look.body = id; }) },
    { title: 'Cor da pele', hint: 'Escolha o tom de pele.',
      build: box => optionGrid(box, Sprites.SKINS.map(s => ({ id: s.id, label: s.name, swatch: s.c[0] })), () => draft.look.skin, id => { draft.look.skin = id; }, 'sw') },
    { title: 'Tipo de cabelo', hint: 'Escolha o tipo de cabelo.',
      build: box => optionGrid(box, Sprites.HAIRS.map(h => ({ id: h.id, label: h.name, canvas: spriteCanvas(lookWith({ hair: h.id })) })), () => draft.look.hair, id => { draft.look.hair = id; }) },
    { title: 'Cor do cabelo', hint: () => (draft.look.hair === 'careca' ? 'Seu personagem é careca, então a cor não aparece. Você pode voltar e trocar o cabelo.' : 'Escolha a cor do cabelo.'),
      build: box => optionGrid(box, Sprites.HAIR_COLORS.map(h => ({ id: h.id, label: h.name, swatch: h.c[0] })), () => draft.look.hairColor, id => { draft.look.hairColor = id; }, 'sw') },
    { title: 'Qual é o seu nome?', hint: 'É assim que os moradores vão te chamar.', valid: () => draft.name.trim().length >= 2,
      build: box => {
        const input = el('input'); input.type = 'text'; input.maxLength = 14; input.placeholder = 'Seu nome'; input.autocomplete = 'off'; input.value = draft.name; input.id = 'name-input';
        input.oninput = () => { draft.name = input.value; updatePreview(); updateNav(); };
        input.onkeydown = e => { if (e.key === 'Enter' && STEPS[step].valid()) $('btn-next').click(); };
        box.append(input); setTimeout(() => input.focus(), 0);
      } },
    { title: 'Contexto socioeconômico', hint: 'É a realidade da sua família quando a história começa. Ela muda a casa e as situações que você vive, não o seu potencial.', valid: () => !!draft.context,
      build: box => optionGrid(box, [...Object.entries(CONTEXTS).map(([id, c]) => ({ id, label: c.name, desc: c.card })), { id: 'destino', label: 'Deixar o destino decidir', desc: 'Você descobre sua realidade vivendo a história.' }], () => draft.context, id => { draft.context = id; }, 'two') },
    { title: 'Profissão', hint: 'Você já começa trabalhando nela, aos 17 anos, e aprende durante o serviço.', valid: () => !!draft.job,
      build: box => optionGrid(box, Object.keys(JOBS).map(id => ({ id, label: jobName(id, draft.look), icon: JOBS[id].icon, desc: JOBS[id].placeName })), () => draft.job, id => { draft.job = id; }, 'jobs') },
  ];

  function optionGrid(box, items, get, set, extra) {
    const grid = el('div', 'opts' + (extra ? ' ' + extra : ''));
    items.forEach(it => {
      const b = el('button', 'opt' + (get() === it.id ? ' sel' : '')); b.type = 'button'; b.dataset.id = it.id;
      if (it.canvas) b.append(it.canvas);
      if (it.swatch) { const s = el('span', 'swatch'); s.style.background = it.swatch; b.append(s); }
      if (it.icon) b.append(el('span', 'ico', it.icon));
      b.append(el('span', 't', it.label));
      if (it.desc) b.append(el('span', 'd', it.desc));
      b.onclick = () => { set(it.id); renderStep(); };
      grid.append(b);
    });
    box.append(grid);
  }
  function startCreation() {
    Object.assign(draft, { look: { body: 'f', skin: 's3', hair: 'liso', hairColor: 'preto' }, name: '', context: null, job: null });
    step = 0;
    const steps = $('steps'); steps.replaceChildren(); STEPS.forEach(() => steps.append(el('span')));
    show('create');
    clearInterval(previewTimer);
    let f = 0; previewTimer = setInterval(() => { f = (f + 1) % 8; updatePreview(f); }, 380);
    renderStep();
  }
  function updatePreview(f = 0) {
    const g = $('preview').getContext('2d'); g.clearRect(0, 0, Sprites.W, Sprites.H);
    Sprites.draw(g, draft.look, 0, 0, f % 2, ['down', 'left', 'up', 'right'][Math.floor(f / 2)]);   // gira e anda: mostra as quatro direções
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
    const box = $('step-content'); box.replaceChildren(); st.build(box);
    updatePreview(); updateNav();
  }
  $('btn-back').onclick = () => { if (step === 0) { clearInterval(previewTimer); initTitle(); } else { step--; renderStep(); } };
  $('btn-next').onclick = () => {
    const st = STEPS[step];
    if (st.valid && !st.valid()) return;
    if (step < STEPS.length - 1) { step++; renderStep(); return; }
    clearInterval(previewTimer);
    const destino = draft.context === 'destino', ids = Object.keys(CONTEXTS);
    S = newState({
      look: Object.assign({}, draft.look), name: draft.name.trim(), job: draft.job,
      // "Destino": a condição é definida aqui, uma única vez, e fica salva — mas oculta até a história revelar.
      cls: destino ? ids[Math.floor(Math.random() * ids.length)] : draft.context, destino, originKnown: !destino,
    });
    OLD_KEYS.forEach(store.del);
    save(); startGame();
  };

  /* =====================================================
     ESTADO DO MUNDO
     ===================================================== */
  const job = () => JOBS[S.job];
  const xpNeed = lvl => 60 + lvl * 40;
  const rank = () => RANKS[Math.min(RANKS.length - 1, Math.floor((S.level - 1) / 2))];
  const guardian = () => GUARDIANS[S.cls];
  const guardianLook = () => Object.assign({}, guardian().look, { skin: S.look.skin });
  const fmt = t => String(t).replace(/\{nome\}/g, S.name).replace(/\{oficio\}/g, job().area.toLowerCase());
  const clock = () => `${String(Math.floor(S.time / 60)).padStart(2, '0')}:${String(S.time % 60).padStart(2, '0')}`;
  const openTasks = () => S.tasks.filter(t => !t.done && t.step < t.steps.length);
  const curStep = t => t.steps[t.step];

  let map = null;                     // mapa atual
  const P = { x: 0, y: 0, dir: 'down', moving: false, work: 0, hop: 0 };
  const keys = {};
  let busy = false, panel = null, transient = [], target = null, near = null, lastSave = 0, clockAcc = 0;

  function nextBeat() { const b = STORY_BEATS.find(x => !S.story.done[x.id]); return b && S.count >= b.at ? b : null; }

  /* Quem está no mapa atual (moradores, colegas, visitantes das tarefas). */
  function actors() {
    const list = [];
    if (map.id === 'vila') {
      const away = new Set(S.tasks.filter(t => t.guest && t.day === S.day).map(t => t.by));
      RESIDENTS.forEach(r => { if (!away.has(r.id)) list.push({ id: r.id, name: r.name, look: r.look, x: r.x, y: r.y, dir: 'down', icon: S.world.marks[r.id] !== 'magic' ? S.world.marks[r.id] : null, magic: S.world.marks[r.id] === 'magic' }); });
      list.push({ id: 'ori', name: 'Mestre Ori', look: Sprites.ORI, x: 470, y: 318, dir: 'down' });
      const fm = JOBS.fazendeiro.mentor; list.push({ id: 'mentor:fazendeiro', name: fm.name, look: fm.look, x: 962, y: 394, dir: 'down' });
    } else if (map.id === 'casa') {
      list.push({ id: 'guardian', name: S.story.done.b1 ? guardian().name : 'Alguém da família', look: guardianLook(), x: map.mentor[0], y: map.mentor[1], dir: 'left', bubble: nextBeat() ? '!' : null });
    } else {
      const j = Object.keys(JOBS).find(k => JOBS[k].place === map.id);
      if (j) list.push({ id: 'mentor:' + j, name: JOBS[j].mentor.name, look: JOBS[j].mentor.look, x: map.mentor[0], y: map.mentor[1], dir: 'down' });
      S.tasks.filter(t => t.guest === map.id && t.day === S.day).forEach(t => {
        const r = residentById(t.by), pos = t.fx && t.fx.move ? t.fx.move : t.seat;
        list.push({ id: 'guest:' + t.id, guestOf: t.id, name: r.name, look: r.look, x: pos[0], y: pos[1], dir: 'down', heart: t.done || (t.fx && t.fx.heart), icon: t.fx && t.fx.plate ? 'plate' : null });
      });
    }
    return list;
  }

  /* =====================================================
     INÍCIO E LAÇO PRINCIPAL
     ===================================================== */
  function startGame() {
    show('game');
    closeModal(); closeMini(true);
    if (!S.tasks.length && !S.today.done.length) S.tasks = Tasks.generate(S);
    enterMap(S.pos.map, S.pos.x, S.pos.y, S.pos.dir);
    renderHud();
    if (!S.intro) run(async () => {
      await say('narr', `Dia ${S.day}. Você acorda em casa: hoje começa o seu trabalho em ${job().area.toLowerCase()}, aos ${S.age} anos.`);
      await say('narr', `Seu local de trabalho é: ${job().placeName}. Lá estão as suas ferramentas: ${job().tools}.`);
      await say('narr', 'Ande com as setas (ou W, A, S, D). Chegue perto de pessoas, portas e objetos e aperte E ou Espaço para interagir.');
      await say('narr', 'Em "Tarefas" ficam os compromissos do dia. A seta amarela na tela aponta para onde ir. À noite, volte para casa e durma na sua cama.');
      S.intro = true;
    });
  }

  function enterMap(id, x, y, dir) {
    map = World.get(id, S.cls);
    P.x = x; P.y = y; P.dir = dir || 'down'; P.moving = false;
    if (!World.free(map, P.x, P.y)) { P.x = map.spawn.x; P.y = map.spawn.y; }
    S.pos = { map: id, x: Math.round(P.x), y: Math.round(P.y), dir: P.dir };
    transient = [];
  }
  function travel(to, x, y, dir) {
    const wrap = $('scene-wrap'); wrap.classList.add('fade');
    busy = true;
    setTimeout(() => { enterMap(to, x, y, dir); save(); wrap.classList.remove('fade'); busy = false; renderHud(); }, 220);
  }

  const blocked = () => busy || panel || !$('modal').hidden || !$('summary').hidden || screen !== 'game';

  let lastT = 0;
  function loop(t) {
    requestAnimationFrame(loop);
    const dt = Math.min(50, t - lastT); lastT = t;
    if (screen === 'title') {
      const m = World.get('vila', 'media'), cx = 384 + Math.sin(t / 9000) * 380, cy = 224 + Math.cos(t / 7000) * 150;
      World.render($('title-canvas').getContext('2d'), { map: m, cam: World.camera(m, cx, cy), t, state: DEMO, actors: RESIDENTS.map(r => ({ look: r.look, x: r.x, y: r.y })) });
      return;
    }
    if (screen !== 'game' || !S || !map) return;
    const list = actors();
    update(dt, t, list);
    draw(t, list);
  }

  function update(dt, t, list) {
    P.moving = false;
    if (!blocked() && !P.work) {
      let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      if (dx || dy) {
        P.dir = dx ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        const sp = 0.075 * dt * (dx && dy ? 0.72 : 1);
        const clear = (x, y) => World.free(map, x, y) && !list.some(a => Math.abs(a.x - x) < 11 && Math.abs(a.y - y) < 7);
        if (dx && clear(P.x + dx * sp, P.y)) { P.x += dx * sp; P.moving = true; }
        if (dy && clear(P.x, P.y + dy * sp)) { P.y += dy * sp; P.moving = true; }
        clockAcc += dt;
      }
    }
    if (P.work && t > P.work) P.work = 0;
    if (clockAcc > 2600) { clockAcc = 0; if (S.time < 23 * 60 + 55) { S.time += 5; renderHud(); } }
    transient = transient.filter(f => t < f.until);
    // interação disponível mais próxima
    near = null;
    if (!blocked()) {
      let best = 1e9;
      // o que faz parte de uma tarefa em andamento tem prioridade sobre o que só está por perto
      const consider = (kind, ref, x, y, r, label, prio) => { const d = Math.hypot(x - P.x, (y - P.y) * 1.2); if (d <= r && d - (prio ? 1000 : 0) < best) { best = d - (prio ? 1000 : 0); near = { kind, ref, label }; } };
      map.objs.forEach(o => { const l = objLabel(o); if (l) consider('obj', o, o.x, o.y, o.r, l, !!(o.sid && stepAt(o.sid))); });
      list.forEach(a => { const hit = stepWith(a); consider('npc', a, a.x, a.y + 4, 20, hit ? hit.step.text : 'Falar com ' + a.name, !!hit); });
    }
    const hint = $('hint'), text = near ? near.label : '';
    if (hint.dataset.t !== text) { hint.dataset.t = text; hint.hidden = !text; hint.replaceChildren(el('b', '', 'E'), el('span', '', text)); $('touch-act').classList.toggle('on', !!text); }
    if (t - lastSave > 2500) { lastSave = t; if (Math.round(P.x) !== S.pos.x || Math.round(P.y) !== S.pos.y || S.pos.dir !== P.dir) { S.pos.x = Math.round(P.x); S.pos.y = Math.round(P.y); S.pos.dir = P.dir; save(); } }
  }

  /* Rótulo de interação de um objeto (ou nada, se agora não há o que fazer com ele). */
  function objLabel(o) {
    if (o.kind === 'herb') return S.herbsTaken[o.i] ? null : 'Colher erva-lua';
    if (o.kind === 'plot') {
      if (S.job !== 'fazendeiro') return 'Canteiro';
      const p = S.farm.plots[o.i];
      return p.s === 0 ? 'Arar a terra' : p.s === 1 ? 'Plantar' : p.s === 4 ? 'Colher' : p.w ? 'Canteiro regado' : 'Regar';
    }
    if (o.kind === 'station') { const s = stepAt(o.sid); return s ? s.step.text : o.label; }
    if (o.sid && stepAt(o.sid)) return stepAt(o.sid).step.text;
    return o.label;
  }

  function draw(t, list) {
    const cam = World.camera(map, P.x, P.y), ctx = $('scene').getContext('2d');
    target = findTarget(list);
    const markers = [];
    if (target && target.here) markers.push({ x: target.x, y: target.y - (target.tall ? 44 : 16) });
    const fx = transient.slice();
    if (map.id === 'oficina') { const tk = S.tasks.find(x => x.vehicle && x.day === S.day && !(x.done)) || S.tasks.find(x => x.vehicle && x.day === S.day); if (tk) fx.push({ type: 'vehicle', x: 122, y: 116, fixed: tk.fx && tk.fx.fixed }); }
    if (map.id === 'escola') { const tk = S.tasks.find(x => x.guest === 'escola' && x.day === S.day && x.step >= 2); if (tk) fx.push({ type: 'board', x: 84, y: 18, lines: [46, 70, 54, 62] }); }
    if (map.id === 'ferraria') fx.push({ type: 'glow', x: 62, y: 70, w: 24, h: 14 });
    list.forEach(a => { if (a.magic) fx.push({ type: 'spark', x: a.x, y: a.y - 8, top: true }); });
    const me = { look: S.look, x: P.x, y: P.y, dir: P.dir, moving: P.moving, work: !!P.work, hop: P.hop && t < P.hop ? -Math.abs(Math.sin((P.hop - t) / 80)) * 5 : 0 };
    World.render(ctx, { map, cam, t, state: S, actors: [...list, me], markers, fx });
    // seta na borda apontando para o objetivo fora da tela
    if (target && !target.here) arrow(ctx, target.x - cam.x, target.y - cam.y, t);
    else if (target && target.here && (target.x < cam.x || target.x > cam.x + World.VW || target.y < cam.y + 10 || target.y > cam.y + World.VH)) arrow(ctx, target.x - cam.x, target.y - cam.y, t);
    if (near) { const x = Math.round(P.x - cam.x), y = Math.round(P.y - cam.y) - 40 - Math.floor(t / 300) % 2; ctx.fillStyle = '#241a2c'; ctx.fillRect(x - 5, y, 10, 9); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 4, y + 1, 8, 7); ctx.fillStyle = '#241a2c'; ctx.fillRect(x - 2, y + 2, 4, 1); ctx.fillRect(x - 2, y + 4, 3, 1); ctx.fillRect(x - 2, y + 6, 4, 1); ctx.fillRect(x - 2, y + 2, 1, 5); }
  }
  function arrow(ctx, tx, ty, t) {
    const cx = World.VW / 2, cy = World.VH / 2, a = Math.atan2(ty - cy, tx - cx);
    const k = Math.min((World.VW / 2 - 12) / Math.abs(Math.cos(a) || 1e-6), (World.VH / 2 - 12) / Math.abs(Math.sin(a) || 1e-6));
    const x = cx + Math.cos(a) * k, y = cy + Math.sin(a) * k + Math.sin(t / 200);
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(a);
    ctx.fillStyle = '#241a2c'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-6, -7); ctx.lineTo(-6, 7); ctx.fill();
    ctx.fillStyle = '#ffd75e'; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-4, -4); ctx.lineTo(-4, 4); ctx.fill();
    ctx.restore();
  }

  /* Para onde o objetivo atual aponta, no mapa em que o jogador está. */
  function findTarget(list) {
    const goal = goalSpot(list);
    if (!goal) return null;
    if (goal.map === map.id) return Object.assign({ here: true }, goal);
    if (map.id !== 'vila') { const ex = map.objs.find(o => o.kind === 'exit'); return { x: ex.x, y: ex.y, here: true }; }
    const d = map.doors[goal.map]; return d ? { x: d.x, y: d.y - 6, here: true } : null;
  }
  function goalSpot(list) {
    const t = openTasks()[0];
    if (!t) {
      if (map.id === 'casa') { const b = map.objs.find(o => o.kind === 'bed'); return nextBeat() ? { map: 'casa', x: map.mentor[0], y: map.mentor[1], tall: 1 } : { map: 'casa', x: b.x, y: b.y }; }
      return { map: 'casa' };
    }
    const s = curStep(t);
    if (s.at) { const [m, sid] = s.at.split(':'); const mm = World.get(m, S.cls), o = mm.objs.find(q => q.sid === s.at || q.id === 'st:' + sid); return { map: m, x: o.x, y: o.y }; }
    if (s.npc === 'guest') { const pos = t.fx && t.fx.move ? t.fx.move : t.seat; return { map: t.guest, x: pos[0], y: pos[1], tall: 1 }; }
    if (s.npc) { const r = residentById(s.npc); return { map: 'vila', x: r.x, y: r.y, tall: 1 }; }
    if (s.t === 'gather') { let best = null; World.HERBS.forEach((h, i) => { if (S.herbsTaken[i]) return; const d = map.id === 'vila' ? Math.hypot(h.x - P.x, h.y - P.y) : i; if (!best || d < best.d) best = { d, x: h.x, y: h.y }; }); return best && { map: 'vila', x: best.x, y: best.y }; }
    if (s.t === 'farm') { const want = { till: 0, plant: 1, harvest: 4 }[s.act]; const i = S.farm.plots.findIndex(p => (s.act === 'water' ? (p.s === 2 || p.s === 3) && !p.w : p.s === want)); const q = World.PLOTS[i < 0 ? 0 : i]; return { map: 'vila', x: q.x + 8, y: q.y + 10 }; }
    return null;
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
    if (panel && Minigames.key(e)) return;
    if (KEYMAP[e.key]) { keys[KEYMAP[e.key]] = true; return; }
    if (e.key === 'e' || e.key === 'E' || e.key === ' ' || e.key === 'Enter') { if (e.repeat) return; e.preventDefault(); action(); }
  });
  window.addEventListener('keyup', e => { if (panel) Minigames.key(e); if (KEYMAP[e.key]) keys[KEYMAP[e.key]] = false; });
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
    if (near) interact(near);
  }

  /* =====================================================
     DIÁLOGO
     ===================================================== */
  let onAdvance = null, typer = 0;
  function setSpeaker(who) {
    const sp = who === 'narr' ? { name: '', look: null } : who === 'resp' ? { name: guardian().name, look: guardianLook() } : who;
    const pc = $('portrait');
    $('dlg-who').textContent = sp.name; $('dlg-who').hidden = !sp.name;
    pc.hidden = !sp.look;
    if (sp.look) { const g = pc.getContext('2d'); g.clearRect(0, 0, 20, 18); Sprites.draw(g, sp.look, 0, -1); }
    $('dlg-text').classList.toggle('narr', who === 'narr');
  }
  function say(who, text) {
    return new Promise(resolve => {
      text = fmt(text); setSpeaker(who);
      $('dlg-choices').replaceChildren(); $('dlg-more').hidden = false;
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
      labels.forEach((label, i) => { const b = el('button', 'btn', fmt(label)); b.type = 'button'; b.onclick = e => { e.stopPropagation(); box.replaceChildren(); resolve(i); }; box.append(b); });
      box.firstChild.focus();
    });
  }
  $('dialog').addEventListener('click', e => { if (!e.target.closest('button') && onAdvance) onAdvance(); });

  async function run(flow) {
    if (busy) return;
    busy = true; $('dialog').hidden = false; $('bar').hidden = true;
    try { await flow(); }
    finally { busy = false; onAdvance = null; $('dialog').hidden = true; $('bar').hidden = !!panel; save(); renderHud(); }
  }
  const speakerOf = name => { const r = RESIDENTS.find(x => x.name === name); return { name, look: r ? r.look : null }; };
  async function sayLines(lines) { for (const [who, text] of lines) await say(who === 'narr' || who === 'resp' ? who : speakerOf(who), text); }

  function toast(text) { const t = el('div', 'toast', text); $('toasts').append(t); setTimeout(() => t.remove(), 2300); }

  /* =====================================================
     INTERAÇÕES
     ===================================================== */
  /* Passo de tarefa que acontece neste ponto ou com esta pessoa (a primeira tarefa em andamento tem prioridade). */
  function stepAt(sid) { for (const t of openTasks()) { const s = curStep(t); if (s.at === sid) return { task: t, step: s }; } return null; }
  function stepWith(actor) {
    for (const t of openTasks()) { const s = curStep(t); if (!s.npc) continue; if ((s.npc === 'guest' && actor.guestOf === t.id) || s.npc === actor.id) return { task: t, step: s }; }
    return null;
  }
  const tired = () => S.energy < 5;
  const TIRED = 'Você está sem energia para trabalhar. Coma um lanche ou volte para casa e durma.';

  function interact(n) {
    if (n.kind === 'npc') return talkTo(n.ref);
    const o = n.ref;
    if (o.kind === 'door') return travel(o.to, World.get(o.to, S.cls).spawn.x, World.get(o.to, S.cls).spawn.y, 'up');
    if (o.kind === 'exit') { const d = World.get('vila', S.cls).doors[map.id]; return travel('vila', d.x, d.y, 'down'); }
    if (o.kind === 'bed') return bed();
    if (o.kind === 'chest') return openModal('bau');
    if (o.kind === 'plot') return farm(o);
    if (o.kind === 'herb') return herb(o);
    const hit = o.sid && stepAt(o.sid);
    if (hit) return doStep(hit.task, hit.step);
    if (o.kind === 'board') return showBoard();
    if (o.kind === 'gallery') return run(() => say('narr', S.world.paintings.length ? `No mural: ${S.world.paintings.slice(-2).map(p => `"${p.title}", de ${p.by}`).join(' e ')}.` : 'O mural de arte da praça está vazio, esperando uma obra.'));
    if (o.kind === 'text') return run(() => say('narr', o.text));
    return run(() => say('narr', stationIdle(o)));
  }
  function stationIdle(o) {
    const mine = job().place === map.id || (S.job === 'fazendeiro' && map.id === 'vila');
    return mine ? `${o.label}. Nenhuma tarefa sua precisa disto agora.` : `${o.label}. É onde o pessoal daqui trabalha.`;
  }

  function work(ms = 700) { P.work = performance.now() + ms; }
  function spend(energy, minutes) { S.energy = Math.max(0, S.energy - energy); S.time = Math.min(23 * 60 + 55, S.time + minutes); }

  /* Executa o passo atual de uma tarefa. Só avança quando a ação foi realmente feita. */
  function doStep(task, s) {
    if (tired()) return run(() => say('narr', TIRED));
    if (s.t === 'use') {
      work(900);
      if (s.steam) transient.push({ type: 'steam', x: 220, y: 70, top: true, until: performance.now() + 2200 });
      return run(async () => { await new Promise(r => setTimeout(r, 800)); applyFx(task, s); await advance(task, s.say); });
    }
    if (s.t === 'mini') return openMini(task, s);
  }
  function applyFx(task, s, out) {
    task.fx = task.fx || {};
    ['move', 'heart', 'fixed'].forEach(k => { if (s[k]) task.fx[k] = s[k]; });
    if (s.post && task.poster) { S.world.posters.push(task.poster); if (S.world.posters.length > 6) S.world.posters.shift(); }
    if (s.hang && task.painting) { S.world.paintings.push({ data: task.painting, title: s.hang, by: S.name }); if (S.world.paintings.length > 8) S.world.paintings.shift(); }
    if (out && out.items) task.poster = out;
    if (out && out.data) task.painting = out.data;
  }
  /* Passo cumprido: gasta energia e tempo, mostra a consequência e, no último, conclui a tarefa. */
  async function advance(task, line) {
    task.step++; task.prog = 0; spend(5, 20); P.work = 0;
    P.hop = performance.now() + 500;
    if (line) await say('narr', line);
    if (task.step >= task.steps.length) await complete(task);
    save(); renderHud();
  }
  async function complete(task) {
    if (task.done) return;                                   // recompensa uma única vez
    task.done = true; task.step = task.steps.length;
    if (task.heartEnd) { task.fx = task.fx || {}; task.fx.heart = 1; }
    S.coins += task.reward.coins; S.count++;
    S.today.done.push(task.title); S.today.coins += task.reward.coins; S.today.xp += task.reward.xp;
    gainXp(task.reward.xp); toast(`+${task.reward.coins} moedas`);
    S.diary.push({ date: `Dia ${S.day}`, mission: task.title, note: task.result });
    save();
    await say('narr', `Tarefa concluída! ${task.result}`);
    const rest = openTasks().length;
    await say('narr', rest ? `Próximo objetivo: ${objective()}` : nextBeat() ? 'Todas as tarefas de hoje estão feitas. Alguém em casa quer conversar com você.' : 'Todas as tarefas de hoje estão feitas. Explore a vila ou volte para casa e durma.');
  }
  function gainXp(n) {
    S.xp += n; let up = false;
    while (S.xp >= xpNeed(S.level)) { S.xp -= xpNeed(S.level); S.level++; up = true; }
    toast(`+${n} XP`); if (up) toast(`Nível ${S.level}!`);
  }

  /* ---------- painel de trabalho (minigame) ---------- */
  function openMini(task, s) {
    panel = { task, s };
    $('bar').hidden = true; $('work').hidden = false;
    Minigames.open($('work'), s.game, s.cfg, {
      work: () => work(500),
      fx: () => { P.hop = performance.now() + 250; },
      cancel: () => closeMini(),
      done: out => {
        if (!panel || panel.task !== task || curStep(task) !== s) return;       // resultado repetido não conta
        closeMini(true);
        applyFx(task, s, out);
        run(() => advance(task, s.say));
      },
    });
  }
  function closeMini(silent) {
    Minigames.close(); panel = null;
    $('work').hidden = true; $('work').replaceChildren(); $('bar').hidden = busy;
    if (!silent) toast('Você parou. O passo continua pendente.');
  }

  /* ---------- pessoas ---------- */
  function talkTo(a) {
    const hit = stepWith(a);
    if (hit) {
      if (tired()) return run(() => say('narr', TIRED));
      const { task, step: s } = hit;
      return run(async () => {
        if (s.t === 'give' && task.takes) {
          const have = CROPS.reduce((n, c) => n + (S.inv[c] || 0), 0);
          if (have < task.takes) return say('narr', `Você precisa de ${task.takes} itens da colheita na mochila para esta entrega.`);
          let left = task.takes; CROPS.forEach(c => { const k = Math.min(left, S.inv[c] || 0); if (k) { S.inv[c] -= k; left -= k; } });
        }
        await sayLines(s.lines);
        if (s.choice) {
          for (;;) {
            if (await choose(s.choice.opts) === s.choice.ans) break;
            await say('narr', s.choice.hint);
            await sayLines(s.lines);
          }
          await sayLines(s.choice.ok);
          task.fx = task.fx || {}; task.fx.heart = 1;
        }
        if (s.t === 'give') { if (s.icon === 'plate') { task.fx = task.fx || {}; task.fx.plate = 1; task.fx.heart = 1; } else if (s.icon) S.world.marks[a.id] = s.icon; }
        await advance(task);
      });
    }
    if (a.id === 'guardian') return run(async () => {
      const b = nextBeat();
      if (b) return playBeat(b);
      await say('resp', ['Vai com calma, mas vai. Estou torcendo por você.', 'Já comeu? Trabalhar de barriga vazia não rende.', 'Me conta depois como foi o seu dia.'][(S.day + S.count) % 3]);
    });
    if (a.id === 'ori') return run(async () => {
      await say(a, `Olá, ${S.name}! A vila fica melhor com o seu trabalho.`);
      await say(a, `Agora: ${objective()}`);
      await say(a, 'A seta amarela mostra o caminho. Se a energia acabar, um lanche do Mercado ou uma noite de sono resolvem.');
    });
    if (a.id === 'mentor:empre') return shop(a);
    if (a.id.startsWith('mentor:')) return run(async () => {
      const j = a.id.split(':')[1];
      if (j !== S.job) return say(a, `Este é o lugar de quem trabalha com ${JOBS[j].area.toLowerCase()}. Fique à vontade para olhar.`);
      const t = openTasks()[0];
      await say(a, t ? `Bom ter você aqui, ${S.name}. Hoje temos: ${openTasks().map(x => x.title).join('; ')}.` : 'Tudo em dia por hoje. Bom trabalho!');
      if (t) await say(a, `Dica: ${curStep(t).text}. Se errar, é só tentar de novo: ninguém nasce sabendo.`);
    });
    if (a.guestOf) return run(() => say(a, a.heart ? 'O atendimento aqui é muito bom.' : 'Estou esperando a minha vez.'));
    const r = residentById(a.id);
    if (r) return run(() => say(a, r.talk[(S.day + S.count) % r.talk.length]));
  }

  function shop(a) {
    run(async () => {
      await say(a, `Que bom ver você no Mercado! Você tem ${S.coins} moedas.`);
      const crops = CROPS.filter(c => S.inv[c]);
      const opts = [`Comprar lanche (${ITEMS.lanche.price} moedas)`, `Comprar vaso de flor (${ITEMS.vaso.price} moedas)`];
      if (crops.length) opts.push('Vender a colheita da mochila');
      opts.push('Nada, por enquanto');
      const c = await choose(opts);
      if (c <= 1) {
        const id = c ? 'vaso' : 'lanche';
        if (S.coins < ITEMS[id].price) return say(a, 'Faltam algumas moedas. Volte depois de um dia de trabalho!');
        S.coins -= ITEMS[id].price; S.inv[id] = (S.inv[id] || 0) + 1; toast(`${ITEMS[id].name} na mochila`);
        return say(a, c ? 'Fica lindo em casa. É só abrir a mochila lá dentro e colocar.' : 'Bom apetite! Use pela mochila quando a energia baixar.');
      }
      if (crops.length && c === 2) {
        let total = 0; crops.forEach(k => { total += S.inv[k] * ITEMS[k].sell; S.inv[k] = 0; });
        S.coins += total; S.today.coins += total; toast(`+${total} moedas`);
        return say(a, 'Colheita fresquinha! Vai sair rápido da banca.');
      }
      await say(a, 'Volte sempre!');
    });
  }

  async function playBeat(b) {
    const data = STORY[S.cls][b.id];
    await sayLines(data.lines);
    if (data.choices) {
      const c = data.choices[await choose(data.choices.map(x => x.label))];
      S.story.flags.push(c.flag);
      if (c.coins) { S.coins = Math.max(0, S.coins + c.coins); toast(`${c.coins > 0 ? '+' : ''}${c.coins} moedas`); }
      S.diary.push({ date: `Dia ${S.day}`, mission: `Em casa — ${b.title}`, note: c.flag });
      S.story.done[b.id] = true; if (b.reveals) S.originKnown = true;
      save();
      await sayLines(c.after);
    } else { S.story.done[b.id] = true; if (b.reveals) S.originKnown = true; }
    if (b.reveals) toast('Ficha atualizada');
  }

  /* ---------- fazenda e ervas ---------- */
  function farm(o) {
    if (S.job !== 'fazendeiro') return run(() => say('narr', 'Os canteiros da fazenda. Quem cuida deles é quem trabalha por lá.'));
    const p = S.farm.plots[o.i];
    let act = null;
    if (p.s === 0) act = 'till'; else if (p.s === 1) act = 'plant'; else if (p.s === 4) act = 'harvest'; else if (!p.w) act = 'water';
    if (!act) return toast('Já está regado. Agora é esperar a noite.');
    if (tired()) return run(() => say('narr', TIRED));
    const hit = openTasks().find(t => curStep(t).t === 'farm' && curStep(t).act === act);
    work(450); spend(2, 5);
    if (act === 'till') p.s = 1;
    if (act === 'plant') { const tk = openTasks().find(t => t.crop); p.s = 2; p.crop = tk ? tk.crop : CROPS[(S.day - 1) % CROPS.length]; p.w = false; }
    if (act === 'water') p.w = true;
    if (act === 'harvest') { S.inv[p.crop] = (S.inv[p.crop] || 0) + 1; toast(`+1 ${ITEMS[p.crop].name}`); p.s = 1; p.crop = null; p.w = false; }
    if (hit) { hit.prog++; if (hit.prog >= curStep(hit).n) return run(() => advance(hit, { till: 'Terra pronta para receber as sementes.', plant: 'Sementes na terra.', water: 'Tudo regado.', harvest: 'Colheita na mochila.' }[act])); }
    save(); renderHud();
  }
  function herb(o) {
    const hit = openTasks().find(t => curStep(t).t === 'gather');
    if (!hit) return run(() => say('narr', S.job === 'feiticeiro' ? 'Uma erva-lua. Você não precisa dela agora.' : 'Uma erva-lua, de brilho lilás. O pessoal da torre é que sabe usar.'));
    S.herbsTaken[o.i] = true; work(400); hit.prog++; toast(`Erva-lua ${hit.prog}/${curStep(hit).n}`);
    if (hit.prog >= curStep(hit).n) return run(() => advance(hit, 'Ervas colhidas. Agora, para a torre.'));
    save(); renderHud();
  }

  function showBoard() {
    const body = $('modal-body'); $('modal').hidden = false; $('tabs').hidden = true; body.replaceChildren();
    body.append(el('h3', '', 'Quadro de avisos da praça'));
    if (!S.world.posters.length) body.append(el('p', 'dim', 'Nenhum cartaz por enquanto. Só um bilhete: "Bem-vindos à vila!"'));
    const row = el('div', 'board-row');
    S.world.posters.slice(-3).forEach(p => {
      const d = el('div', 'mg-poster static'); d.style.background = p.bg; d.style.color = p.fg; d.style.fontFamily = p.font;
      p.items.forEach(it => { const n = el('div', 'pi ' + (it.k === 'art' ? 'art ' + p.art : it.k), it.k === 'title' ? p.texts[0] : it.k === 'line' ? p.texts[1] : ''); n.style.left = it.x * 100 + '%'; n.style.top = it.y * 100 + '%'; if (it.k === 'title') n.style.fontSize = [11, 15, 20][p.size] * 0.7 + 'px'; d.append(n); });
      row.append(d);
    });
    body.append(row, closeBtn());
  }
  const closeBtn = () => { const b = el('button', 'btn primary', 'Fechar'); b.onclick = closeModal; b.style.marginTop = '12px'; return b; };

  /* =====================================================
     DIA: DORMIR E ACORDAR
     ===================================================== */
  function bed() {
    run(async () => {
      const left = openTasks().length;
      await say('narr', left ? `Sua cama. Ainda há ${left} tarefa(s) em aberto: se dormir agora, elas continuam amanhã.` : 'Sua cama. O dia de trabalho está cumprido.');
      if (await choose(['Dormir e encerrar o dia', 'Ainda não']) === 0) setTimeout(sleep, 0);
    });
  }
  function sleep() {
    const pending = openTasks(), done = S.today.done.slice(), gain = Object.assign({}, S.today);
    let grew = 0;
    S.farm.plots.forEach(p => { if ((p.s === 2 || p.s === 3) && p.w) { p.s++; grew++; } p.w = false; });
    const finishedDay = S.day;
    S.day++; S.time = DAY_START; S.energy = 100; S.herbsTaken = []; S.world.marks = {};
    S.tasks = pending.map(t => Object.assign(t, { day: S.day }));
    S.tasks = S.tasks.concat(Tasks.generate(S));
    S.today = { done: [], coins: 0, xp: 0 };
    const b = World.get('casa', S.cls).objs.find(o => o.kind === 'bed');
    enterMap('casa', b.x + 20, b.y + 10, 'down');
    save();

    const box = $('summary-body'); box.replaceChildren();
    box.append(el('h3', '', `Dia ${finishedDay} encerrado`));
    const ul = el('ul', 'list');
    if (done.length) done.forEach(d => ul.append(el('li', 'ok', '✔ ' + d))); else ul.append(el('li', 'dim', 'Nenhuma tarefa concluída hoje.'));
    box.append(ul, el('p', '', `Ganhos do dia: ${gain.coins} moedas e ${gain.xp} XP. Nível ${S.level} — ${rank()}.`));
    if (grew) box.append(el('p', 'ok', `Na fazenda, ${grew} canteiro(s) cresceram durante a noite.`));
    if (pending.length) box.append(el('p', 'dim', `Continuam para amanhã: ${pending.map(t => t.title).join('; ')}.`));
    box.append(el('p', '', `Amanhã: ${S.tasks.filter(t => !pending.includes(t)).map(t => t.title).join('; ')}.`));
    const go = el('button', 'btn primary', `Começar o dia ${S.day} ▶`); go.id = 'summary-go';
    go.onclick = () => { $('summary').hidden = true; renderHud(); toast(`Dia ${S.day}`); };
    box.append(go); $('summary').hidden = false; go.focus();
    renderHud();
  }

  /* =====================================================
     HUD E OBJETIVO
     ===================================================== */
  function objective() {
    const t = openTasks()[0];
    if (t) { const s = curStep(t); return s.n > 1 ? `${s.text} (${t.prog}/${s.n})` : s.text; }
    if (nextBeat()) return map && map.id === 'casa' ? 'Converse com quem está em casa.' : 'Alguém em casa quer conversar com você.';
    return 'Dia cumprido. Volte para casa e durma na sua cama.';
  }
  function renderHud() {
    if (!S) return;
    const hud = $('hud'); hud.replaceChildren();
    const en = el('div', 'xp'), bar = el('div', 'bar' + (S.energy < 20 ? ' low' : '')), fill = el('i'); fill.style.width = S.energy + '%'; bar.append(fill);
    en.append(el('span', '', '⚡'), bar);
    hud.append(el('span', 'name', `Dia ${S.day}`), el('span', '', clock()), el('span', '', `🪙 ${S.coins}`), en);
    $('objective').replaceChildren(el('b', '', 'OBJETIVO'), el('span', '', objective()));
  }

  /* =====================================================
     PAINÉIS
     ===================================================== */
  let tab = 'tarefas';
  function openModal(t) { if (busy || panel) return; $('modal').hidden = false; renderTab(t); }
  function closeModal() { $('modal').hidden = true; }
  document.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => ($('modal').hidden ? openModal(b.dataset.tab) : renderTab(b.dataset.tab)); });
  $('modal-close').onclick = closeModal;
  $('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal(); });

  const itemRow = (id, n, label, fn) => { const li = el('li'), meta = el('div', 'meta'); meta.append(el('span', '', `${ITEMS[id].name} × ${n}`)); if (label) { const b = el('button', 'btn', label); b.onclick = fn; meta.append(b); } li.append(meta, el('span', 'dim', ITEMS[id].desc)); return li; };
  const held = bag => Object.keys(bag).filter(k => bag[k] > 0 && ITEMS[k]);

  const TABS = {
    tarefas(body) {
      body.append(el('h3', '', `Compromissos do dia ${S.day}`));
      if (!S.tasks.length) body.append(el('p', 'dim', 'Nada marcado. Durma para começar um novo dia.'));
      const ul = el('ul', 'list');
      S.tasks.forEach(t => {
        const li = el('li', t.done ? 'done-task' : '');
        li.append(el('span', 'mt', t.title), el('span', 'dim', `Pedido de: ${t.byName} · Onde: ${t.where}${t.day > parseInt(t.id.slice(1), 10) ? ' · pendente de ontem' : ''}`));
        const ol = el('ol', 'steps-list');
        t.steps.forEach((s, i) => { const st = i < t.step ? 'ok' : i === t.step && !t.done ? 'cur' : 'dim'; ol.append(el('li', st, (i < t.step ? '✔ ' : '') + s.text + (i === t.step && s.n > 1 ? ` (${t.prog}/${s.n})` : ''))); });
        li.append(ol);
        li.append(el('span', t.done ? 'ok' : 'dim', t.done ? `Resultado: ${t.result}` : `Progresso: ${t.step} de ${t.steps.length} passos · Recompensa: ${t.reward.coins} moedas e ${t.reward.xp} XP`));
        ul.append(li);
      });
      body.append(ul);
    },
    mochila(body) {
      body.append(el('h3', '', 'Mochila'), el('p', '', `Dinheiro: ${S.coins} moedas · Energia: ${S.energy}/100`), el('p', 'dim', `Ferramentas de trabalho: ${job().tools}.`));
      const ul = el('ul', 'list'), ids = held(S.inv);
      if (!ids.length) ul.append(el('li', 'dim', 'Nenhum item. O Mercado vende lanches e enfeites; a fazenda rende colheitas.'));
      ids.forEach(id => {
        if (id === 'lanche') ul.append(itemRow(id, S.inv[id], 'Comer', () => { S.inv.lanche--; S.energy = Math.min(100, S.energy + 30); toast('+30 de energia'); save(); renderHud(); renderTab('mochila'); }));
        else if (id === 'vaso') ul.append(itemRow(id, S.inv[id], map.id === 'casa' ? 'Colocar em casa' : null, () => { S.inv.vaso--; S.world.decor.push('vaso'); toast('A casa ficou mais bonita'); save(); renderTab('mochila'); }));
        else ul.append(itemRow(id, S.inv[id]));
      });
      body.append(ul);
    },
    bau(body) {
      body.append(el('h3', '', 'Baú de casa'), el('p', 'dim', 'Guarde aqui o que não quer carregar.'));
      const mk = (title, from, to, label) => { body.append(el('h3', '', title)); const ul = el('ul', 'list'), ids = held(from); if (!ids.length) ul.append(el('li', 'dim', 'Vazio.')); ids.forEach(id => ul.append(itemRow(id, from[id], label, () => { from[id]--; to[id] = (to[id] || 0) + 1; save(); renderTab('bau'); }))); body.append(ul); };
      mk('Na mochila', S.inv, S.chest, 'Guardar'); mk('No baú', S.chest, S.inv, 'Pegar');
    },
    diario(body) {
      body.append(el('h3', '', 'Diário'));
      if (!S.diary.length) { body.append(el('p', 'dim', 'Seu diário está vazio. Tarefas concluídas e escolhas da história ficam guardadas aqui.')); return; }
      const ul = el('ul', 'list');
      S.diary.slice().reverse().forEach(d => { const li = el('li'); li.append(el('span', 'dim', d.date), el('span', '', d.mission)); if (d.note) li.append(el('span', 'ok', d.note)); ul.append(li); });
      body.append(ul);
    },
    ficha(body) {
      const top = el('div', 'sheet-top'), c = spriteCanvas(S.look), who = el('div');
      who.append(el('h3', '', S.name), el('div', '', `${S.age} anos · ${jobName(S.job, S.look)} · ${rank()}`)); top.append(c, who); body.append(top);
      const dl = el('dl', 'sheet'), rowOf = (k, v) => dl.append(el('dt', '', k), el('dd', '', v));
      rowOf('Trabalho', `${job().placeName}`);
      rowOf('Nível', `${S.level} (XP ${S.xp}/${xpNeed(S.level)})`);
      rowOf('Jornada', `Dia ${S.day} · ${S.count} tarefa(s) concluída(s)`);
      rowOf('Dinheiro pessoal', `${S.coins} moedas`);
      // A realidade da família só aparece aqui depois de descoberta na história.
      rowOf('Família', S.originKnown ? `${CONTEXTS[S.cls].name}. ${CONTEXTS[S.cls].known}` : 'Você ainda está descobrindo a realidade da sua família.');
      if (S.story.done.b1) rowOf('Responsável', `${guardian().name}, ${guardian().rel}`);
      body.append(dl);
      if (S.story.flags.length) { body.append(el('h3', '', 'Suas escolhas')); const ul = el('ul', 'list'); S.story.flags.forEach(f => ul.append(el('li', '', f))); body.append(ul); }
      const reset = el('button', 'btn ghost', 'Apagar progresso e recomeçar'); reset.style.marginTop = '16px';
      reset.onclick = () => { if (!confirm('Apagar todo o progresso deste navegador e voltar ao título?')) return; store.del(SAVE_KEY); OLD_KEYS.forEach(store.del); closeModal(); initTitle(); };
      body.append(reset);
    },
  };
  function renderTab(t) {
    tab = TABS[t] ? t : tab;
    $('tabs').hidden = tab === 'bau';
    [...$('tabs').querySelectorAll('[data-tab]')].forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    const body = $('modal-body'); body.replaceChildren(); TABS[tab](body);
    if (tab === 'bau') body.append(closeBtn());
  }

  /* Ganchos para testes automatizados e depuração (não alteram o jogo). */
  window.__trilha = {
    get S() { return S; }, get P() { return P; }, get map() { return map; }, get near() { return near; }, get busy() { return blocked(); }, save,
    goal: () => goalSpot(actors()),
    /* Coloca o personagem em um ponto livre ao lado de (x, y), no mapa indicado. */
    warpNear(m, x, y) {
      enterMap(m, map.spawn.x, map.spawn.y, 'down');
      const mm = World.get(m, S.cls), list = actors();
      for (const [dx, dy] of [[0, 10], [0, 14], [-13, 8], [13, 8], [0, 18], [-15, 2], [15, 2], [0, -9], [-10, 14], [10, 14]]) {
        const px = x + dx, py = y + dy;
        if (World.free(mm, px, py) && !list.some(a => Math.abs(a.x - px) < 11 && Math.abs(a.y - py) < 7)) { P.x = px; P.y = py; return true; }
      }
      return false;
    },
  };

  initTitle();
  requestAnimationFrame(loop);
})();
