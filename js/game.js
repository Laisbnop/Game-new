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
      act: null, prac: null, choices: {}, results: {},
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
  const fmt = t => String(t).replace(/\{nome\}/g, S.name).replace(/\{trilha\}/g, trail().name)
    .replace(/\{c:(\w+)\}/g, (_, k) => (S.choices[k] ? S.choices[k].label : '...'));
  const npcFor = place => (place === 'praca' ? Sprites.ORI : guardianLook());

  /* Próximo capítulo da história, se já estiver liberado pelo progresso. */
  function nextBeat() {
    const b = STORY_BEATS.find(x => !S.story.done[x.id]);
    return b && S.count >= b.at ? b : null;
  }

  function startGame() {
    show('game');
    if (!S.story) S.story = { done: {}, flags: [], income: 0, incomeLabel: '' };
    // campos criados depois (jogos salvos antes das atividades continuam valendo)
    S.choices = S.choices || {}; S.results = S.results || {};
    if (!S.act || S.done[S.act.id] || !actOf(S.act.id) || S.act.id !== currentId()) S.act = null;
    if (!S.prac || !actOf(S.prac.id)) S.prac = null;
    actSlot = null; $('activity').hidden = true; $('activity').replaceChildren(); $('actions').hidden = false;
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

  /* ---------- treinos do dia ---------- */
  const actOf = id => { const [t, st, i] = String(id).split('-'); return ACTIVITIES[t] && ACTIVITIES[t][+st] && ACTIVITIES[t][+st][+i]; };
  const doneIds = () => Object.keys(S.done).filter(id => S.done[id] && id.startsWith(S.trail + '-') && actOf(id));

  /* Até 3 atividades já concluídas da trilha, sorteadas pelo dia, para refazer como treino.
     force = trocar os treinos ainda pendentes (item da loja). */
  function ensureDaily(force) {
    const t = today(), old = S.daily;
    const fresh = !old || old.date !== t || !Array.isArray(old.ids);
    const salt = fresh ? 0 : (old.salt || 0) + (force ? 1 : 0);
    let seed = [...(t + S.trail + salt)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const pool = doneIds().sort().map(v => [rand(), v]).sort((a, b) => a[0] - b[0]).map(p => p[1]);
    let ids, done;
    if (fresh) {
      // formato antigo no mesmo dia: o que já foi recompensado hoje continua contado
      const carry = old && old.date === t && Array.isArray(old.done) ? old.done.filter(Boolean).length : 0;
      ids = pool.slice(0, 3); done = ids.map((_, i) => i < carry);
    } else {
      ids = old.ids.filter((_, i) => old.done[i] || !force); done = ids.map(id => !!old.done[old.ids.indexOf(id)]);
      if (force) pool.forEach(id => { if (ids.length < 3 && !ids.includes(id) && !old.ids.includes(id)) { ids.push(id); done.push(false); } });
      pool.forEach(id => { if (ids.length < 3 && !ids.includes(id)) { ids.push(id); done.push(false); } });
    }
    S.daily = { date: t, salt, ids, done };
    if (S.prac && (S.prac.date !== t || !ids.includes(S.prac.id) || done[ids.indexOf(S.prac.id)])) S.prac = null;
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
      $('dlg-choices').replaceChildren(); $('dlg-more').hidden = false;
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
    await say('ori', 'Cada missão é uma atividade que você realiza aqui na vila: fale comigo ou use o botão "Iniciar atividade".');
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
  const STATE_LABEL = { nova: 'Iniciar atividade', andamento: 'Continuar atividade', cumprida: 'Receber recompensa' };

  /* O Mestre Ori responde conforme o estado da missão atual e sempre oferece o próximo passo. */
  async function talk() {
    let open = null;
    await run(async () => {
      const b = nextBeat();
      if (S.place === 'casa') {
        if (b) return playBeat(b);
        return say('resp', SMALL_TALK[(S.count + S.days) % SMALL_TALK.length]);
      }
      if (S.finished) {
        await say('ori', 'Você percorreu toda a trilha de {trilha}. Os treinos do dia, em "Missões", mantêm a prática em forma.');
        if (b) await say('ori', 'E passe em casa: alguém quer falar com você.');
        return;
      }
      const id = currentId(), act = actOf(id), state = missionState(id);
      if (state === 'nova') {
        await say('ori', `Seu próximo passo na trilha: "${act.title}".`);
        await say('ori', `${act.intro} A atividade acontece na ${TEACHERS[S.trail].room}, com ${TEACHERS[S.trail].name}.`);
      } else if (state === 'andamento') {
        await say('ori', `Você parou na etapa ${S.act.step + 1} de ${ActivityUI.stepsOf(act, S.choices).length} de "${act.title}". É só continuar de onde parou.`);
      } else {
        await say('ori', `Você cumpriu o objetivo de "${act.title}"! Falta ver o resultado e receber a recompensa.`);
      }
      if (await choose([STATE_LABEL[state], 'Agora não']) === 0) { open = id; return; }
      await say('ori', b ? 'Tudo bem. Quando puder, passe em casa: alguém quer falar com você.' : 'Sem pressa. Quando quiser, use o botão da atividade ou fale comigo.');
    });
    if (open) openActivity('act', open);
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

  /* =====================================================
     ATIVIDADES
     ===================================================== */
  let actSlot = null;       // 'act' (missão da trilha) ou 'prac' (treino do dia) aberto na tela

  const currentIndex = () => (S.finished ? -1 : trail().stages[S.stage].missions.findIndex((_, k) => !S.done[mid(S.stage, k)]));
  function currentId() { const i = currentIndex(); return i < 0 ? null : mid(S.stage, i); }
  /* 'nova' | 'andamento' | 'cumprida' (todas as etapas feitas, recompensa ainda não recebida) */
  function missionState(id, slot = 'act') {
    const a = S[slot];
    if (!a || a.id !== id) return 'nova';
    return a.step >= ActivityUI.stepsOf(actOf(id), S.choices).length ? 'cumprida' : 'andamento';
  }

  function openActivity(slot, id) {
    if (busy || !actOf(id)) return;
    closeModal();
    if (slot === 'act' && (S.done[id] || id !== currentId())) return;              // só a missão atual da trilha
    if (slot === 'prac') { const i = S.daily.ids.indexOf(id); if (i < 0 || S.daily.done[i]) return; }
    if (!S[slot] || S[slot].id !== id) S[slot] = { id, step: 0, errors: 0, date: today() };
    save();
    actSlot = slot;
    Scene.start($('scene'), { place: 'room', room: S.trail, hero: S.look, npc: TEACHERS[S.trail].look });
    $('actions').hidden = true; $('dialog').hidden = true; $('activity').hidden = false;
    renderMain();
    ActivityUI.mount($('activity'), actOf(id), S[slot], {
      choices: S.choices, fmt, save, anim: n => Scene.play(n), teacher: TEACHERS[S.trail], practice: slot === 'prac',
      onExit: closeActivity, onComplete: () => showResult(slot),
    });
  }

  /* Sai da sala e volta ao cenário principal. O progresso da atividade fica salvo. */
  function closeActivity() {
    actSlot = null;
    $('activity').hidden = true; $('activity').replaceChildren(); $('actions').hidden = false;
    Scene.start($('scene'), { place: S.place, cls: S.cls, color: trail().color, hero: S.look, npc: npcFor(S.place) });
    save(); renderMain();
  }

  const rewardOf = slot => (slot === 'prac' ? { xp: 15, coins: 8 } : { xp: 40 + S.stage * 10, coins: 20 + S.stage * 5 });

  /* Todas as etapas cumpridas: mostra o resultado. A recompensa só sai no botão. */
  function showResult(slot) {
    const st = S[slot], act = actOf(st.id), host = $('activity'), r = rewardOf(slot);
    host.replaceChildren();
    const head = el('div', 'act-head'); head.append(el('span', 'act-title', act.title), el('span', 'act-step ok', 'Objetivo cumprido'));
    const nav = el('div', 'act-nav');
    const out = el('button', 'btn ghost', 'Sair'); out.type = 'button'; out.onclick = closeActivity;
    const get = el('button', 'btn primary act-main', 'Receber recompensa'); get.type = 'button'; get.onclick = () => claim(slot);
    nav.append(out, get);
    host.append(head, el('p', 'act-text', fmt(act.done)),
      el('p', 'dim', st.errors ? `Você precisou de ${st.errors} nova(s) tentativa(s) no caminho. Errar e corrigir faz parte.` : 'Você acertou tudo de primeira.'),
      el('p', 'act-reward', `Recompensa: +${r.xp} XP · +${r.coins} moedas${S.coffee ? ' (XP em dobro pelo café)' : ''}`), nav);
    renderMain();
  }

  /* Entrega a recompensa uma única vez: quem decide é o estado salvo, não o clique. */
  function claim(slot) {
    const st = S[slot];
    if (!st) return;
    const id = st.id, act = actOf(id), prac = slot === 'prac', r = rewardOf(slot), notes = [];
    const idx = prac ? S.daily.ids.indexOf(id) : -1;
    const already = prac ? (idx < 0 || S.daily.done[idx]) : !!S.done[id];
    S[slot] = null;
    if (already) { save(); return closeActivity(); }
    if (prac) S.daily.done[idx] = true; else S.done[id] = true;
    markActive();
    S.coins += r.coins;
    gainXp(r.xp);
    toast(`+${r.coins} moedas`);
    S.results[id] = { date: today(), errors: st.errors || 0, times: ((S.results[id] || {}).times || 0) + 1 };
    let entry = null;
    if (prac) {
      if (S.daily.done.length === 3 && S.daily.done.every(Boolean)) { S.coins += 20; toast('+20 moedas'); notes.push('Você fez os três treinos de hoje: bônus de 20 moedas.'); }
    } else {
      entry = { date: today(), mission: act.title, note: '' };
      S.diary.push(entry);
      const st0 = trail().stages[S.stage];
      if (st0.missions.every((_, k) => S.done[mid(S.stage, k)])) {
        S.coins += 100; toast('+100 moedas');
        if (S.stage + 1 < trail().stages.length) {
          S.stage++;
          notes.push(`Etapa "${st0.name}" concluída: +100 moedas. Seu novo título é ${rank()}, e a próxima etapa é "${trail().stages[S.stage].name}".`);
        } else {
          S.stage = trail().stages.length; S.finished = true;
          notes.push(`Trilha completa! Você é ${rank()} de ${trail().name}.`);
        }
      }
    }
    ensureDaily();
    save();

    const host = $('activity'); host.replaceChildren();
    const head = el('div', 'act-head'); head.append(el('span', 'act-title', act.title), el('span', 'act-step ok', 'Recompensa recebida'));
    host.append(head, el('p', 'act-reward', `+${r.xp} XP · +${r.coins} moedas`));
    notes.forEach(n => host.append(el('p', 'act-text', n)));
    host.append(el('p', 'act-text', 'Próximo objetivo: ' + nextObjective()));
    const back = el('button', 'btn primary act-main', 'Voltar à vila'); back.type = 'button'; back.onclick = closeActivity;
    back.disabled = true; setTimeout(() => { back.disabled = false; }, 600);      // um clique duplo não pula esta tela
    if (entry) {                                             // reflexão opcional: não substitui a atividade
      const form = el('form', 'dlg-form'), input = el('input', 'act-text-in'), keep = el('button', 'btn', 'Guardar');
      input.type = 'text'; input.maxLength = 200; input.placeholder = 'Opcional: anote uma reflexão no diário'; keep.type = 'submit';
      form.append(input, keep);
      form.onsubmit = e => { e.preventDefault(); const v = input.value.trim(); if (!v) return; entry.note = v; save(); form.replaceWith(el('p', 'ok', 'Reflexão guardada no diário.')); };
      host.append(form);
    }
    const nav = el('div', 'act-nav'); nav.append(el('span'), back); host.append(nav);
    renderMain();
  }

  function buy(item) {
    if (S.coins < item.price || (item.id === 'cafe' && S.coffee)) return;
    S.coins -= item.price;
    if (item.id === 'cafe') { S.coffee = true; toast('Café na mochila'); }
    if (item.id === 'livro') gainXp(60, false);
    if (item.id === 'troca') { ensureDaily(true); toast('Treinos trocados'); }
    save(); renderMain(); renderTab('loja');
  }

  /* =====================================================
     TELA PRINCIPAL
     ===================================================== */
  /* O que fazer agora, fora de uma atividade. */
  function nextObjective() {
    if (!S.introDone) return 'Converse com o Mestre Ori.';
    const id = currentId(), state = id && missionState(id), b = nextBeat();
    if (state === 'cumprida') return 'Receba a recompensa da atividade concluída.';
    if (state === 'andamento') return `Continue a atividade: ${actOf(id).title}.`;
    if (b) {
      if (S.place === 'casa') return 'Converse com quem está em casa.';
      return b.id === 'b1' ? 'Está ficando tarde. Volte para casa.' : 'Alguém em casa quer falar com você.';
    }
    if (id) return `Trilha: ${actOf(id).title}.`;
    return 'Faça os treinos do dia, em "Missões".';
  }
  function objective() {
    const open = actSlot && S[actSlot];
    return open ? `Atividade: ${actOf(open.id).title}` : nextObjective();
  }

  function renderMain() {
    const hud = $('hud'); hud.replaceChildren();
    const xp = el('div', 'xp');
    const bar = el('div', 'bar'), fill = el('i');
    fill.style.width = Math.min(100, S.xp / xpNeed(S.level) * 100) + '%'; bar.append(fill);
    xp.append(el('span', '', `Nv ${S.level}`), bar);
    hud.append(el('span', 'name', S.name), el('span', '', `${S.age} anos`), xp, el('span', '', `🪙 ${S.coins}`), el('span', '', `Dia ${S.days}`));

    $('objective').replaceChildren(el('b', '', 'OBJETIVO'), el('span', '', objective()));
    const beatHere = nextBeat(), id = currentId(), state = id && missionState(id);
    const go = $('act-go'), ms = $('act-mission');
    go.textContent = S.place === 'praca' ? 'Ir para casa' : 'Ir para a praça';
    go.className = 'btn' + (beatHere && S.place === 'praca' && state === 'nova' ? ' primary' : '');
    $('act-talk').className = 'btn' + (beatHere && S.place === 'casa' && state === 'nova' ? ' primary' : '');
    ms.hidden = !id || !S.introDone;
    if (id) { ms.textContent = STATE_LABEL[state]; ms.className = 'btn' + (state !== 'nova' || !beatHere ? ' primary' : ''); }
  }

  $('act-mission').onclick = () => { const id = currentId(); if (id) openActivity('act', id); };
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

  /* Linha de missão: mostra o estado e, se for a vez dela, o botão que abre a atividade. */
  function missionItem(text, reward, status, label, onOpen) {
    const li = el('li', status === 'feita' ? 'done' : ''), meta = el('div', 'meta');
    meta.append(el('span', '', reward));
    if (status === 'feita') meta.append(el('span', 'ok', '✔ Feita'));
    else if (status === 'bloqueada') meta.append(el('span', 'dim', 'Conclua a anterior'));
    else { const b = el('button', 'btn', label); b.onclick = onOpen; meta.append(b); }
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
      else {
        const cur = currentIndex();
        trail().stages[S.stage].missions.forEach((m, i) => {
          const id = mid(S.stage, i);
          const status = S.done[id] ? 'feita' : i === cur ? 'atual' : 'bloqueada';
          ul.append(missionItem(m, `+${40 + S.stage * 10} XP · +${20 + S.stage * 5} moedas`, status, STATE_LABEL[missionState(id)], () => openActivity('act', id)));
        });
      }
      body.append(ul);

      body.append(el('h3', '', 'Treinos do dia' + (S.streak ? ` — ${S.streak} dia(s) seguidos` : '')));
      if (!S.daily.ids.length) { body.append(el('p', 'dim', 'Conclua a primeira missão da trilha para liberar os treinos. Cada treino é uma atividade que você já fez, para praticar de novo.')); return; }
      const dl = el('ul', 'list');
      const PRAC = { nova: 'Treinar', andamento: 'Continuar', cumprida: 'Receber recompensa' };
      S.daily.ids.forEach((id, i) => dl.append(missionItem(actOf(id).title, '+15 XP · +8 moedas', S.daily.done[i] ? 'feita' : 'atual', PRAC[missionState(id, 'prac')], () => openActivity('prac', id))));
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
      rowOf('Jornada', `Dia ${S.days} · ${S.count} atividade(s) concluída(s)`);
      if (S.choices.curso) rowOf('Curso', S.choices.curso.label);
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
