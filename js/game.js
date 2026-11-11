/* Lógica do jogo: salvamento, criação de personagem, diálogos, história,
   missões e painéis. */

(() => {
  const SAVE_KEY = 'trilha-rpg-save-v2';
  const OLD_KEY = 'trilha-rpg-save-v1';          // versão com personagens prontos
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  let S = null;            // estado do jogo em andamento

  /* =====================================================
     SALVAMENTO
     ===================================================== */
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, v) { try { localStorage.setItem(key, v); } catch { /* sem armazenamento: joga sem salvar */ } },
    del(key) { try { localStorage.removeItem(key); } catch { /* ignora */ } },
  };
  const save = () => { if (S) store.set(SAVE_KEY, JSON.stringify(S)); };

  const validSave = s => s && s.v === 2 && s.look && typeof s.name === 'string' && TRAILS[s.trail] && CONTEXTS[s.cls] && s.story && s.daily !== undefined;

  /* Lê o que existe no navegador sem alterar nada.
     Retorna { state } | { old } (jogo da versão anterior, convertível) | { broken: 'atual'|'antigo' } | {} */
  function inspectSaves() {
    const cur = store.get(SAVE_KEY);
    if (cur) {
      try { const s = JSON.parse(cur); if (validSave(s)) return { state: s }; } catch { /* cai no aviso */ }
      return { broken: 'atual' };
    }
    const old = store.get(OLD_KEY);
    if (old) {
      try {
        const o = JSON.parse(old);
        if (o && typeof o.name === 'string' && TRAILS[o.trail] && CONTEXTS[o.cls]) return { old: o };
      } catch { /* cai no aviso */ }
      return { broken: 'antigo' };
    }
    return {};
  }

  const OLD_LOOKS = {
    lia:  { body: 'f', skin: 's2', hair: 'liso',     hairColor: 'azul' },
    nina: { body: 'f', skin: 's1', hair: 'cacheado', hairColor: 'rosa' },
    maya: { body: 'f', skin: 's4', hair: 'liso',     hairColor: 'preto' },
    caio: { body: 'm', skin: 's3', hair: 'crespo',   hairColor: 'castanho' },
    teo:  { body: 'm', skin: 's2', hair: 'crespo',   hairColor: 'claro' },
    davi: { body: 'm', skin: 's1', hair: 'liso',     hairColor: 'loiro' },
  };

  function newState(base) {
    return Object.assign({
      v: 2, look: null, name: '', age: START_AGE, trail: null,
      cls: null, destino: false, originKnown: true,
      level: 1, xp: 0, coins: START_COINS, stage: 0, done: {}, finished: false, count: 0,
      diary: [], daily: null, streak: 0, lastActive: null, lastLogin: null, days: 0, coffee: false,
      story: { done: {}, flags: [], income: 0, incomeLabel: '' },
      place: 'praca', introDone: false,
    }, base);
  }

  /* Converte um jogo da versão anterior. O antigo não é apagado. */
  function migrate(o) {
    const done = o.done && typeof o.done === 'object' ? o.done : {};
    return newState({
      look: OLD_LOOKS[o.charId] || OLD_LOOKS.lia, name: o.name, trail: o.trail, cls: o.cls,
      level: o.level || 1, xp: o.xp || 0, coins: o.coins || 0, stage: o.stage || 0, done,
      finished: !!o.finished, count: Object.keys(done).length,
      diary: Array.isArray(o.diary) ? o.diary : [], streak: o.streak || 0,
      lastActive: o.lastActive || null, coffee: !!o.coffee, introDone: true,
    });
  }

  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const dayDiff = (a, b) => Math.round((new Date(b + 'T00:00') - new Date(a + 'T00:00')) / 864e5);

  function show(name) {
    ['title', 'create', 'game'].forEach(n => { $('screen-' + n).hidden = n !== name; });
    window.scrollTo(0, 0);
  }

  /* =====================================================
     TÍTULO
     ===================================================== */
  function initTitle() {
    S = null;
    show('title');
    Scene.start($('title-canvas'), { place: 'praca', color: '#c2523a', npc: Sprites.ORI, hero: null });
    const found = inspectSaves();
    const notice = $('save-notice'), cont = $('btn-continue');
    notice.hidden = true; cont.hidden = true; cont.textContent = 'Continuar';

    if (found.state) {
      cont.hidden = false;
      cont.onclick = () => { S = found.state; startGame(); };
    } else if (found.old) {
      const o = found.old;
      notice.hidden = false;
      notice.replaceChildren(
        el('b', '', 'Jogo de uma versão anterior encontrado. '),
        el('span', '', `${o.name}, nível ${o.level || 1}, trilha de ${TRAILS[o.trail].name}. Dá para continuar: nome, trilha, nível, moedas, missões e diário são mantidos. A aparência será aproximada do personagem antigo e a história da família começa do início.`));
      cont.hidden = false; cont.textContent = 'Continuar jogo antigo';
      cont.onclick = () => { S = migrate(o); save(); startGame(); };
    } else if (found.broken) {
      notice.hidden = false;
      notice.replaceChildren(
        el('b', '', 'Não foi possível abrir o jogo salvo. '),
        el('span', '', found.broken === 'antigo'
          ? 'Existe um jogo de uma versão anterior neste navegador, mas ele não pôde ser aproveitado nesta versão. Ele continua guardado e só será apagado se você iniciar um novo jogo.'
          : 'O arquivo de progresso está danificado. Ele continua guardado e só será substituído se você iniciar um novo jogo.'));
    }

    $('btn-new').onclick = () => {
      if (found.state || found.old || found.broken) {
        if (!confirm('Já existe um jogo salvo neste navegador. Ao terminar de criar um novo personagem, o jogo anterior será apagado. Deseja continuar?')) return;
      }
      startCreation();
    };
  }

  /* =====================================================
     CRIAÇÃO DE PERSONAGEM
     ===================================================== */
  const draft = {};
  let step = 0, previewTimer = 0;

  const spriteCanvas = look => {
    const c = el('canvas', 'pixel'); c.width = Sprites.W; c.height = Sprites.H;
    Sprites.draw(c.getContext('2d'), look, 0, 0);
    return c;
  };
  const lookWith = patch => Object.assign({}, draft.look, patch);

  const STEPS = [
    { title: 'Gênero', hint: 'Muda apenas a roupa do personagem.',
      build: box => optionGrid(box, Sprites.BODIES.map(b => ({ id: b.id, label: b.name, canvas: spriteCanvas(lookWith({ body: b.id })) })),
        () => draft.look.body, id => { draft.look.body = id; }) },
    { title: 'Cor da pele', hint: 'Escolha o tom de pele.',
      build: box => optionGrid(box, Sprites.SKINS.map(s => ({ id: s.id, label: s.name, swatch: s.c[0] })),
        () => draft.look.skin, id => { draft.look.skin = id; }, 'sw') },
    { title: 'Tipo de cabelo', hint: 'Escolha o tipo de cabelo.',
      build: box => optionGrid(box, Sprites.HAIRS.map(h => ({ id: h.id, label: h.name, canvas: spriteCanvas(lookWith({ hair: h.id })) })),
        () => draft.look.hair, id => { draft.look.hair = id; }) },
    { title: 'Cor do cabelo', hint: () => draft.look.hair === 'careca' ? 'Seu personagem é careca, então a cor não aparece. Você pode voltar e trocar o cabelo.' : 'Escolha a cor do cabelo.',
      build: box => optionGrid(box, Sprites.HAIR_COLORS.map(h => ({ id: h.id, label: h.name, swatch: h.c[0] })),
        () => draft.look.hairColor, id => { draft.look.hairColor = id; }, 'sw') },
    { title: 'Qual é o seu nome?', hint: 'É assim que as pessoas vão te chamar.',
      valid: () => draft.name.trim().length >= 2,
      build: box => {
        const input = el('input'); input.type = 'text'; input.maxLength = 14; input.placeholder = 'Seu nome'; input.autocomplete = 'off';
        input.value = draft.name; input.id = 'name-input';
        input.oninput = () => { draft.name = input.value; updatePreview(); updateNav(); };
        input.onkeydown = e => { if (e.key === 'Enter' && STEPS[step].valid()) $('btn-next').click(); };
        box.append(input);
        setTimeout(() => input.focus(), 0);
      } },
    { title: 'Contexto socioeconômico', hint: 'É a realidade da sua família quando a história começa. Ela muda as situações que você vive, não o seu potencial.',
      valid: () => !!draft.context,
      build: box => optionGrid(box, [
        ...Object.entries(CONTEXTS).map(([id, c]) => ({ id, label: c.name, desc: c.card })),
        { id: 'destino', label: 'Deixar o destino decidir', desc: 'Você descobre sua realidade vivendo a história.' },
      ], () => draft.context, id => { draft.context = id; }, 'two') },
    { title: 'Trilha profissional', hint: 'Qualquer personagem pode seguir qualquer trilha.',
      valid: () => !!draft.trail,
      build: box => optionGrid(box, Object.entries(TRAILS).map(([id, t]) => ({ id, label: t.name, icon: t.icon })),
        () => draft.trail, id => { draft.trail = id; }) },
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
    Object.assign(draft, { look: { body: 'f', skin: 's3', hair: 'liso', hairColor: 'preto' }, name: '', context: null, trail: null });
    step = 0;
    const steps = $('steps'); steps.replaceChildren();
    STEPS.forEach(() => steps.append(el('span')));
    show('create');
    clearInterval(previewTimer);
    let f = 0;
    previewTimer = setInterval(() => { f ^= 1; updatePreview(f); }, 450);
    renderStep();
  }

  function updatePreview(frame = 0) {
    const g = $('preview').getContext('2d');
    g.clearRect(0, 0, Sprites.W, Sprites.H);
    Sprites.draw(g, draft.look, 0, 0, frame);
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
    st.build(box);
    updatePreview(); updateNav();
  }

  $('btn-back').onclick = () => { if (step === 0) { clearInterval(previewTimer); initTitle(); } else { step--; renderStep(); } };
  $('btn-next').onclick = () => {
    const st = STEPS[step];
    if (st.valid && !st.valid()) return;
    if (step < STEPS.length - 1) { step++; renderStep(); return; }
    clearInterval(previewTimer);
    const destino = draft.context === 'destino';
    const ids = Object.keys(CONTEXTS);
    S = newState({
      look: Object.assign({}, draft.look), name: draft.name.trim(), trail: draft.trail,
      // "Destino": a condição é definida aqui, uma única vez, e fica salva — mas oculta até a história revelar.
      cls: destino ? ids[Math.floor(Math.random() * ids.length)] : draft.context,
      destino, originKnown: !destino,
    });
    store.del(OLD_KEY);
    save();
    startGame();
  };

  /* =====================================================
     JOGO
     ===================================================== */
  const trail = () => TRAILS[S.trail];
  const xpNeed = lvl => 80 + lvl * 40;
  const rank = () => RANKS[Math.min(S.stage, RANKS.length - 1)];
  const mid = (stage, i) => `${S.trail}-${stage}-${i}`;
  const guardian = () => GUARDIANS[S.cls];
  const guardianLook = () => Object.assign({}, guardian().look, { skin: S.look.skin });
  const fmt = t => t.replace(/\{nome\}/g, S.name).replace(/\{trilha\}/g, trail().name);
  const npcFor = place => (place === 'praca' ? Sprites.ORI : guardianLook());

  /* Próximo capítulo da história, se já estiver liberado pelo progresso. */
  function nextBeat() {
    const b = STORY_BEATS.find(x => !S.story.done[x.id]);
    return b && S.count >= b.at ? b : null;
  }

  function startGame() {
    show('game');
    if (!S.story) S.story = { done: {}, flags: [], income: 0, incomeLabel: '' };
    Scene.start($('scene'), { place: S.place, cls: S.cls, color: trail().color, hero: S.look, npc: npcFor(S.place) });
    closeModal();
    const newDay = S.lastLogin !== today();
    ensureDaily();
    let pay = 0;
    if (newDay) {
      S.days++;
      if (S.lastLogin && S.story.income) { pay = S.story.income; S.coins += pay; }
      S.lastLogin = today();
    }
    save();
    renderMain();
    if (!S.introDone) run(intro);
    else if (newDay) run(async () => {
      await say('narr', `Dia ${S.days} da sua jornada.`);
      if (pay) { toast(`+${pay} moedas`); await say('narr', `Você recebeu ${pay} moedas: ${S.story.incomeLabel}.`); }
    });
  }

  /* ---------- missões do dia ---------- */
  function ensureDaily(force) {
    const t = today();
    if (!force && S.daily && S.daily.date === t) return;
    const salt = force ? (S.daily.salt || 0) + 1 : 0;
    // sorteio determinístico pelo dia: 2 da trilha + 1 geral
    let seed = [...(t + S.trail + salt)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const pick = (arr, n) => arr.map(v => [rand(), v]).sort((a, b) => a[0] - b[0]).slice(0, n).map(p => p[1]);
    const items = [...pick(trail().daily, 2), ...pick(DAILY_GENERIC, 1)];
    const old = force ? S.daily : null;                     // ao trocar, as já cumpridas ficam como estão
    S.daily = { date: t, salt, items: items.map((m, i) => (old && old.done[i] ? old.items[i] : m)), done: old ? old.done.slice() : [false, false, false] };
    if (S.lastActive && dayDiff(S.lastActive, t) > 1) S.streak = 0;
  }

  /* =====================================================
     CAIXA DE DIÁLOGO
     ===================================================== */
  let busy = false, onAdvance = null, typer = 0;

  function speaker(who) {
    if (who === 'ori') return { name: 'Mestre Ori', look: Sprites.ORI };
    if (who === 'resp') return { name: guardian().name, look: guardianLook() };
    return { name: '', look: null };
  }
  function setSpeaker(who) {
    const sp = speaker(who), pc = $('portrait');
    $('dlg-who').textContent = sp.name;
    $('dlg-who').hidden = !sp.name;
    pc.hidden = !sp.look;
    if (sp.look) { const g = pc.getContext('2d'); g.clearRect(0, 0, 20, 18); Sprites.draw(g, sp.look, 0, -1); }
    $('dlg-text').classList.toggle('narr', who === 'narr');
  }

  /* Mostra uma fala com efeito de digitação e espera o jogador avançar. */
  function say(who, text) {
    return new Promise(resolve => {
      text = fmt(text);
      setSpeaker(who);
      $('dlg-choices').replaceChildren(); $('dlg-form').hidden = true; $('dlg-more').hidden = false;
      const box = $('dlg-text');
      let n = 0;
      clearInterval(typer);
      const finish = () => { clearInterval(typer); typer = 0; box.textContent = text; };
      typer = setInterval(() => { n += 2; box.textContent = text.slice(0, n); if (n >= text.length) finish(); }, 16);
      onAdvance = () => { if (typer) finish(); else { onAdvance = null; resolve(); } };
    });
  }
  /* Mostra opções e devolve o índice escolhido. */
  function choose(labels) {
    return new Promise(resolve => {
      onAdvance = null; $('dlg-more').hidden = true;
      const box = $('dlg-choices'); box.replaceChildren();
      labels.forEach((label, i) => {
        const b = el('button', 'btn', fmt(label)); b.type = 'button';
        b.onclick = e => { e.stopPropagation(); box.replaceChildren(); resolve(i); };
        box.append(b);
      });
      box.firstChild.focus();
    });
  }
  /* Pede um texto; devolve { text } ou { button: índice }. */
  function ask(placeholder, buttons) {
    return new Promise(resolve => {
      onAdvance = null; $('dlg-more').hidden = true;
      const form = $('dlg-form'), input = $('dlg-input'), box = $('dlg-choices');
      form.hidden = false; input.value = ''; input.placeholder = placeholder;
      const end = r => { form.hidden = true; form.onsubmit = null; box.replaceChildren(); resolve(r); };
      form.onsubmit = e => { e.preventDefault(); if (input.value.trim()) end({ text: input.value.trim() }); };
      box.replaceChildren();
      buttons.forEach((label, i) => {
        const b = el('button', 'btn', label); b.type = 'button';
        b.onclick = e => { e.stopPropagation(); end({ button: i }); };
        box.append(b);
      });
      input.focus();
    });
  }

  $('dialog').addEventListener('click', e => { if (!e.target.closest('button, input, form') && onAdvance) onAdvance(); });
  document.addEventListener('keydown', e => {
    if (!onAdvance || $('screen-game').hidden) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAdvance(); }
  });

  /* Executa uma sequência de diálogo; enquanto roda, os botões de ação ficam ocultos. */
  async function run(flow) {
    if (busy) return;
    busy = true;
    $('dialog').hidden = false; $('actions').hidden = true;
    try { await flow(); }
    finally {
      busy = false; onAdvance = null;
      $('dialog').hidden = true; $('actions').hidden = false;
      save(); renderMain();
    }
  }

  function toast(text) {
    const t = el('div', 'toast', text);
    $('toasts').append(t);
    setTimeout(() => t.remove(), 2300);
  }

  /* =====================================================
     HISTÓRIA
     ===================================================== */
  async function intro() {
    await say('ori', 'Olá, {nome}! Eu sou o Mestre Ori. Cuido das trilhas de profissão desta vila.');
    await say('ori', 'Você tem 17 anos e escolheu a trilha de {trilha}. Ela é feita de passos de verdade: cursos, prática e projetos.');
    await say('ori', 'Cumpra cada missão na vida real e registre aqui. Em "Missões" você encontra a trilha e os hábitos do dia.');
    await say('ori', 'Já está ficando tarde. Vá para casa — amanhã a caminhada continua.');
    S.introDone = true;
  }

  function travel(to) {
    return new Promise(resolve => {
      let done = false;
      const end = () => { if (!done) { done = true; resolve(); } };
      Scene.travel(to, npcFor(to), end);
      setTimeout(end, 9000);                                // garantia caso a aba esteja em segundo plano
    });
  }

  async function goTo(to) {
    $('actions').hidden = true;
    await travel(to);
    S.place = to; save();
    $('actions').hidden = false;
    renderMain();
    const b = to === 'casa' && nextBeat();
    if (b) run(() => playBeat(b));
  }

  async function playBeat(b) {
    const data = STORY[S.cls][b.id];
    for (const [who, text] of data.lines) await say(who, text);
    if (data.choices) {
      const c = data.choices[await choose(data.choices.map(x => x.label))];
      S.story.flags.push(c.flag);
      if (c.coins) { S.coins = Math.max(0, S.coins + c.coins); toast(`${c.coins > 0 ? '+' : ''}${c.coins} moedas`); }
      if (c.income != null) { S.story.income = c.income; S.story.incomeLabel = fmt(c.incomeLabel); }
      S.diary.push({ date: today(), mission: `História — ${b.title}`, note: c.flag });
      S.story.done[b.id] = true;
      if (b.reveals) S.originKnown = true;
      save();
      for (const [who, text] of c.after) await say(who, text);
    } else {
      S.story.done[b.id] = true;
      if (b.reveals) S.originKnown = true;
    }
    gainXp(20, false);
    if (b.reveals) toast('Ficha atualizada');
  }

  const SMALL_TALK = [
    'Vai com calma, mas vai. Estou torcendo por você.',
    'Já comeu? Estudar de barriga vazia não rende.',
    'Me conta depois como foi o seu dia.',
  ];
  function talk() {
    run(async () => {
      const b = nextBeat();
      if (S.place === 'casa') {
        if (b) return playBeat(b);
        return say('resp', SMALL_TALK[(S.count + S.days) % SMALL_TALK.length]);
      }
      if (b) return say('ori', 'Tem alguém te esperando em casa, {nome}. Vá lá — a trilha não foge.');
      if (S.finished) return say('ori', 'Você percorreu toda a trilha de {trilha}. Mantenha os hábitos do dia: é assim que um mestre continua mestre.');
      const st = trail().stages[S.stage];
      const i = st.missions.findIndex((_, k) => !S.done[mid(S.stage, k)]);
      await say('ori', `Seu próximo passo na trilha: "${st.missions[i]}".`);
      await say('ori', 'Quando cumprir na vida real, abra "Missões" e registre. Sem pressa: é por você.');
    });
  }

  /* =====================================================
     PROGRESSO
     ===================================================== */
  function gainXp(base, useCoffee = true) {
    let amount = base;
    if (useCoffee && S.coffee) { amount *= 2; S.coffee = false; }
    S.xp += amount;
    let leveled = false;
    while (S.xp >= xpNeed(S.level)) { S.xp -= xpNeed(S.level); S.level++; leveled = true; }
    toast(`+${amount} XP`);
    if (leveled) toast(`Nível ${S.level}!`);
    Scene.celebrate();
  }
  function markActive() {
    const t = today();
    if (S.lastActive !== t) {
      S.streak = S.lastActive && dayDiff(S.lastActive, t) === 1 ? S.streak + 1 : 1;
      S.lastActive = t;
    }
    S.count++;
  }

  function trailMission(i) {
    closeModal();
    run(async () => {
      const st = trail().stages[S.stage], who = S.place === 'praca' ? 'ori' : 'narr';
      await say(who, `Missão: "${st.missions[i]}".`);
      setSpeaker(who);
      $('dlg-text').textContent = 'Conte em uma frase o que você fez ou aprendeu. O relato vai para o seu diário e vale +10 XP.';
      const r = await ask('Seu relato...', ['Concluir sem relato', 'Ainda não terminei']);
      if (r.button === 1) return say(who, 'Sem pressa. Volte quando terminar de verdade.');
      const note = r.text || '';
      S.done[mid(S.stage, i)] = true;
      S.diary.push({ date: today(), mission: st.missions[i], note: note.slice(0, 200) });
      markActive();
      const coins = 20 + S.stage * 5;
      S.coins += coins;
      Scene.visitGuild();
      gainXp(40 + S.stage * 10 + (note.length >= 10 ? 10 : 0));
      toast(`+${coins} moedas`);
      save();
      await say(who, note ? 'Relato guardado no diário. Mais um passo dado.' : 'Missão registrada. Mais um passo dado.');

      if (st.missions.every((_, k) => S.done[mid(S.stage, k)])) {
        S.coins += 100; toast('+100 moedas');
        if (S.stage + 1 < trail().stages.length) {
          S.stage++;
          await say(who, `Etapa "${st.name}" concluída! Seu novo título é ${rank()}. A próxima etapa é "${trail().stages[S.stage].name}".`);
        } else {
          S.stage = trail().stages.length; S.finished = true;
          await say(who, `Trilha completa! Você é ${rank()} de ${trail().name}. O que começou como jogo agora faz parte da sua história de verdade.`);
        }
      }
      if (nextBeat() && S.place === 'praca') await say('narr', 'Já está tarde. Alguém em casa quer falar com você.');
    });
  }

  function completeDaily(i) {
    if (S.daily.done[i]) return;
    S.daily.done[i] = true;
    markActive();
    S.coins += 8;
    gainXp(15);
    toast('+8 moedas');
    if (S.daily.done.every(Boolean)) { S.coins += 20; toast('Dia completo! +20 moedas'); }
    save(); renderMain(); renderTab('missoes');
  }

  function buy(item) {
    if (S.coins < item.price || (item.id === 'cafe' && S.coffee)) return;
    S.coins -= item.price;
    if (item.id === 'cafe') { S.coffee = true; toast('Café na mochila'); }
    if (item.id === 'livro') gainXp(60, false);
    if (item.id === 'troca') { ensureDaily(true); toast('Novas missões do dia'); }
    save(); renderMain(); renderTab('loja');
  }

  /* =====================================================
     TELA PRINCIPAL
     ===================================================== */
  function objective() {
    const b = nextBeat();
    if (!S.introDone) return 'Converse com o Mestre Ori.';
    if (b) {
      if (S.place === 'casa') return 'Converse com quem está em casa.';
      return b.id === 'b1' ? 'Está ficando tarde. Volte para casa.' : 'Alguém em casa quer falar com você.';
    }
    if (!S.finished) {
      const st = trail().stages[S.stage];
      return 'Trilha: ' + st.missions.find((_, k) => !S.done[mid(S.stage, k)]);
    }
    return 'Mantenha os hábitos do dia.';
  }

  function renderMain() {
    const hud = $('hud'); hud.replaceChildren();
    const xp = el('div', 'xp');
    const bar = el('div', 'bar'), fill = el('i');
    fill.style.width = Math.min(100, S.xp / xpNeed(S.level) * 100) + '%'; bar.append(fill);
    xp.append(el('span', '', `Nv ${S.level}`), bar);
    hud.append(el('span', 'name', S.name), el('span', '', `${S.age} anos`), xp, el('span', '', `🪙 ${S.coins}`), el('span', '', `Dia ${S.days}`));

    const obj = $('objective'); obj.replaceChildren(el('b', '', 'OBJETIVO'), el('span', '', objective()));
    const go = $('act-go');
    go.textContent = S.place === 'praca' ? 'Ir para casa' : 'Ir para a praça';
    go.className = 'btn' + (nextBeat() && S.place === 'praca' ? ' primary' : '');
    $('act-talk').className = 'btn' + (nextBeat() && S.place === 'casa' ? ' primary' : '');
  }

  $('act-go').onclick = () => { if (!busy) goTo(S.place === 'praca' ? 'casa' : 'praca'); };
  $('act-talk').onclick = talk;

  /* =====================================================
     PAINEL (missões, diário, loja, ficha)
     ===================================================== */
  let tab = 'missoes';
  function openModal(t) { if (busy) return; $('modal').hidden = false; renderTab(t); }
  function closeModal() { $('modal').hidden = true; }
  document.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => ($('modal').hidden ? openModal(b.dataset.tab) : renderTab(b.dataset.tab)); });
  $('modal-close').onclick = closeModal;
  $('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  function missionItem(text, reward, done, onDone) {
    const li = el('li', done ? 'done' : ''), meta = el('div', 'meta');
    meta.append(el('span', '', reward));
    if (done) meta.append(el('span', 'ok', '✔ Feita'));
    else { const b = el('button', 'btn', 'Concluir'); b.onclick = onDone; meta.append(b); }
    li.append(el('span', 'mt', text), meta);
    return li;
  }

  const TABS = {
    missoes(body) {
      body.append(el('h3', '', `Trilha: ${trail().name}`));
      const sb = el('div', 'stage-bar');
      trail().stages.forEach((st, i) => { const s = el('span', i < S.stage ? 'done' : i === S.stage ? 'cur' : '', `${i + 1}. ${st.name}`); sb.append(s); });
      body.append(sb);
      const ul = el('ul', 'list');
      if (S.finished) ul.append(el('li', '', `Trilha completa! Você é ${rank()} de ${trail().name}.`));
      else trail().stages[S.stage].missions.forEach((m, i) =>
        ul.append(missionItem(m, `+${40 + S.stage * 10} XP · +${20 + S.stage * 5} moedas`, !!S.done[mid(S.stage, i)], () => trailMission(i))));
      body.append(ul);

      body.append(el('h3', '', 'Missões do dia' + (S.streak ? ` — ${S.streak} dia(s) seguidos` : '')));
      const dl = el('ul', 'list');
      S.daily.items.forEach((m, i) => dl.append(missionItem(m, '+15 XP · +8 moedas', S.daily.done[i], () => completeDaily(i))));
      body.append(dl);
    },
    diario(body) {
      body.append(el('h3', '', 'Diário'));
      if (!S.diary.length) { body.append(el('p', 'dim', 'Seu diário está vazio. Relatos de missões e escolhas da história ficam guardados aqui.')); return; }
      const ul = el('ul', 'list');
      S.diary.slice().reverse().forEach(d => {
        const li = el('li');
        li.append(el('span', 'dim', d.date.split('-').reverse().join('/')), el('span', '', d.mission));
        if (d.note) li.append(el('span', 'ok', `"${d.note}"`));
        ul.append(li);
      });
      body.append(ul);
    },
    loja(body) {
      body.append(el('h3', '', 'Mochila'));
      body.append(el('p', '', `Seu dinheiro: ${S.coins} moedas`));
      body.append(el('p', 'dim', S.coffee ? '☕ Café forte — a próxima missão vale XP em dobro.' : 'Nenhum item guardado.'));
      body.append(el('h3', '', 'Loja'));
      const ul = el('ul', 'list');
      SHOP.forEach(item => {
        const li = el('li'), meta = el('div', 'meta');
        const b = el('button', 'btn', 'Comprar');
        b.disabled = S.coins < item.price || (item.id === 'cafe' && S.coffee);
        b.onclick = () => buy(item);
        meta.append(el('span', '', `${item.price} moedas`), b);
        li.append(el('span', '', `${item.icon} ${item.name}`), el('span', 'dim', item.desc), meta);
        ul.append(li);
      });
      body.append(ul);
    },
    ficha(body) {
      const top = el('div', 'sheet-top'), c = el('canvas', 'pixel'); c.width = Sprites.W; c.height = Sprites.H;
      Sprites.draw(c.getContext('2d'), S.look, 0, 0);
      const who = el('div'); who.append(el('h3', '', S.name), el('div', '', `${S.age} anos · ${rank()} de ${trail().name}`));
      top.append(c, who); body.append(top);

      const dl = el('dl', 'sheet');
      const rowOf = (k, v) => dl.append(el('dt', '', k), el('dd', '', v));
      rowOf('Nível', `${S.level} (XP ${S.xp}/${xpNeed(S.level)})`);
      rowOf('Jornada', `Dia ${S.days} · ${S.count} missão(ões) cumprida(s)`);
      rowOf('Dinheiro pessoal', `${S.coins} moedas`);
      if (S.story.income) rowOf('Renda', `+${S.story.income} moedas por dia de jogo (${S.story.incomeLabel})`);
      // A realidade da família só aparece aqui depois de descoberta na história.
      rowOf('Família', S.originKnown ? `${CONTEXTS[S.cls].name}. ${CONTEXTS[S.cls].known}` : 'Você ainda está descobrindo a realidade da sua família.');
      if (S.story.done.b1) rowOf('Responsável', `${guardian().name}, ${guardian().rel}`);
      body.append(dl);

      if (S.story.flags.length) {
        body.append(el('h3', '', 'Suas escolhas'));
        const ul = el('ul', 'list'); S.story.flags.forEach(f => ul.append(el('li', '', f))); body.append(ul);
      }
      const reset = el('button', 'btn ghost', 'Apagar progresso e recomeçar'); reset.style.marginTop = '16px';
      reset.onclick = () => {
        if (!confirm('Apagar todo o progresso deste navegador e voltar ao título?')) return;
        store.del(SAVE_KEY); store.del(OLD_KEY);
        closeModal(); initTitle();
      };
      body.append(reset);
    },
  };

  function renderTab(t) {
    tab = TABS[t] ? t : tab;
    [...$('tabs').querySelectorAll('[data-tab]')].forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    const body = $('modal-body'); body.replaceChildren();
    TABS[tab](body);
  }

  initTitle();
})();
