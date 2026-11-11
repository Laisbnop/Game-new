/* Lógica do jogo: criação de personagem, chat com o mestre, missões e progresso. */

(() => {
  const SAVE_KEY = 'trilha-rpg-save-v1';
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  let S = load();          // estado salvo
  let pending = null;      // missão de trilha aguardando o relato do jogador

  /* ---------- salvar / carregar ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || null; } catch { return null; }
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch { /* sem armazenamento: joga sem salvar */ }
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
    show('title');
    Scene.start($('title-canvas'), { charId: 'lia', cls: 'media', color: '#c2523a' });
    $('btn-continue').hidden = !S;
    $('btn-new').onclick = () => {
      if (S && !confirm('Já existe um jogo salvo. Começar um novo apaga o progresso. Continuar?')) return;
      startCreation();
    };
    $('btn-continue').onclick = startGame;
  }

  /* =====================================================
     CRIAÇÃO DE PERSONAGEM
     ===================================================== */
  const draft = { charId: null, name: '', cls: null, trail: null };
  let step = 0, rolling = false;

  function charCanvas(id) {
    const c = el('canvas', 'pixel'); c.width = 16; c.height = 20;
    Sprites.draw(c.getContext('2d'), id, 0, 0);
    return c;
  }

  function startCreation() {
    Object.assign(draft, { charId: null, name: '', cls: null, trail: null });
    step = 0;
    $('name-input').value = '';
    $('class-result').textContent = '';

    const steps = $('steps'); steps.replaceChildren();
    for (let i = 0; i < 4; i++) steps.append(el('span'));

    // personagens
    const cg = $('char-grid'); cg.replaceChildren();
    CHARACTERS.forEach(ch => {
      const b = el('button', 'card'); b.type = 'button'; b.dataset.id = ch.id;
      b.append(charCanvas(ch.id), el('span', 't', ch.name), el('span', 'd', ch.title),
               el('span', 'tag', TRAILS[ch.trail].icon + ' ' + TRAILS[ch.trail].name));
      b.onclick = () => { draft.charId = ch.id; draft.trail = ch.trail; renderStep(); };
      cg.append(b);
    });

    // classes
    const kg = $('class-grid'); kg.replaceChildren();
    const classCard = (id, icon, title, desc, perk) => {
      const b = el('button', 'card'); b.type = 'button'; b.dataset.id = id;
      b.append(el('span', 'ico', icon), el('span', 't', title), el('span', 'd', desc));
      if (perk) b.append(el('span', 'tag', perk));
      return b;
    };
    Object.entries(CLASSES).forEach(([id, c]) => {
      const b = classCard(id, c.icon, c.name, c.desc, c.perk);
      b.onclick = () => { if (rolling) return; draft.cls = id; $('class-result').textContent = ''; renderStep(); };
      kg.append(b);
    });
    const dice = classCard('acaso', '🎲', 'Deixar o acaso decidir', 'O destino escolhe por você.');
    dice.onclick = rollClass;
    kg.append(dice);

    // trilhas
    const tg = $('trail-grid'); tg.replaceChildren();
    Object.entries(TRAILS).forEach(([id, t]) => {
      const b = el('button', 'card'); b.type = 'button'; b.dataset.id = id;
      b.append(el('span', 'ico', t.icon), el('span', 't', t.name), el('span', 'd', t.guild), el('span', 'tag'));
      b.onclick = () => { draft.trail = id; renderStep(); };
      tg.append(b);
    });

    show('create');
    renderStep();
  }

  function rollClass() {
    if (rolling) return;
    rolling = true;
    const ids = Object.keys(CLASSES);
    const result = ids[Math.floor(Math.random() * ids.length)];
    const out = $('class-result');
    let n = 0;
    out.textContent = '🎲 Os dados estão rolando...';
    const tick = setInterval(() => {
      draft.cls = ids[n++ % ids.length];
      renderStep();
      if (n > 12 && draft.cls === result) {
        clearInterval(tick);
        rolling = false;
        out.textContent = `🎲 O acaso decidiu: ${CLASSES[result].name}! ${CLASSES[result].desc}`;
        renderStep();
      }
    }, 110);
  }

  function stepValid() {
    if (rolling) return false;
    return [!!draft.charId, draft.name.trim().length >= 2, !!draft.cls, !!draft.trail][step];
  }

  function renderStep() {
    document.querySelectorAll('.step').forEach(s => { s.hidden = +s.dataset.step !== step; });
    [...$('steps').children].forEach((s, i) => s.classList.toggle('on', i <= step));
    const mark = (grid, id) => [...$(grid).children].forEach(b => b.classList.toggle('sel', b.dataset.id === id));
    mark('char-grid', draft.charId);
    mark('class-grid', draft.cls);
    mark('trail-grid', draft.trail);

    if (step === 1 && draft.charId) {
      const g = $('name-preview').getContext('2d');
      g.clearRect(0, 0, 16, 20);
      Sprites.draw(g, draft.charId, 0, 0);
    }
    if (step === 3) {
      const own = CHARACTERS.find(c => c.id === draft.charId).trail;
      [...$('trail-grid').children].forEach(b => {
        b.querySelector('.tag').textContent = b.dataset.id === own ? '★ Afinidade +10% XP' : '';
      });
    }
    $('btn-back').textContent = step === 0 ? '◀ Título' : '◀ Voltar';
    $('btn-next').textContent = step === 3 ? 'Começar aventura ▶' : 'Avançar ▶';
    $('btn-next').disabled = !stepValid();
  }

  $('name-input').addEventListener('input', e => { draft.name = e.target.value; renderStep(); });
  $('name-input').addEventListener('keydown', e => { if (e.key === 'Enter' && stepValid()) $('btn-next').click(); });
  $('btn-back').onclick = () => { if (rolling) return; if (step === 0) initTitle(); else { step--; renderStep(); } };
  $('btn-next').onclick = () => {
    if (!stepValid()) return;
    if (step < 3) {
      step++; renderStep();
      if (step === 1) $('name-input').focus();
      return;
    }
    const cls = CLASSES[draft.cls];
    S = {
      charId: draft.charId, name: draft.name.trim(), cls: draft.cls, trail: draft.trail,
      level: 1, xp: 0, coins: cls.coins, stage: 0, done: {}, diary: [],
      daily: null, streak: 0, lastActive: null, lastLogin: null, coffee: false, log: [], finished: false,
    };
    save();
    startGame();
  };

  /* =====================================================
     JOGO
     ===================================================== */
  const trail = () => TRAILS[S.trail];
  const xpNeed = lvl => 80 + lvl * 40;
  const hasAffinity = () => CHARACTERS.find(c => c.id === S.charId).trail === S.trail;
  const rank = () => RANKS[Math.min(S.stage, RANKS.length - 1)];
  const mid = (stage, i) => `${S.trail}-${stage}-${i}`;

  function startGame() {
    show('game');
    Scene.start($('scene'), { charId: S.charId, cls: S.cls, color: trail().color });
    $('chat-log').replaceChildren();
    S.log.forEach(m => bubble(m.who, m.text));
    pending = null;

    const firstTime = !S.lastLogin;
    const newDay = S.lastLogin !== today();
    ensureDaily();

    if (firstTime) {
      npc(`Olá, <b>${esc(S.name)}</b>! Eu sou o Mestre Ori, guardião das trilhas desta vila.`);
      npc(`Você começa como <b>${esc(CLASSES[S.cls].name)}</b> com ${S.coins} moedas, na trilha de <b>${esc(trail().name)}</b>.`);
      npc('Funciona assim: as missões da <b>trilha</b> são passos reais rumo à profissão (cursos, projetos...). As <b>missões do dia</b> são pequenos hábitos. Cumpra na vida real, marque aqui e ganhe XP e moedas.');
      npc('Quando concluir algo, clique em "Concluir" na missão ou me conte aqui no chat. Vamos começar?');
    } else if (newDay) {
      const gift = CLASSES[S.cls].allowance;
      S.coins += gift;
      npc(`Bom te ver de novo, <b>${esc(S.name)}</b>! Novo dia, novas missões. Você recebeu ${gift} moedas de mesada.`);
    } else {
      npc(`De volta, <b>${esc(S.name)}</b>? Suas missões estão te esperando.`);
    }
    S.lastLogin = today();
    save();
    mainMenu();
    render();
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
    // ao trocar, as missões já cumpridas ficam como estão
    const old = force ? S.daily : null;
    S.daily = {
      date: t, salt,
      items: items.map((m, i) => (old && old.done[i] ? old.items[i] : m)),
      done: old ? old.done.slice() : [false, false, false],
    };
    if (S.lastActive && dayDiff(S.lastActive, t) > 1) S.streak = 0;
    save();
  }

  /* ---------- chat ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function bubble(who, text) {
    const m = el('div', 'msg ' + who);
    if (who === 'npc') m.innerHTML = text;      // só texto do jogo (já escapado); o do jogador usa textContent
    else m.textContent = text;
    const log = $('chat-log');
    log.append(m);
    log.scrollTop = log.scrollHeight;
  }
  function push(who, text) {
    S.log.push({ who, text });
    if (S.log.length > 60) S.log = S.log.slice(-60);
    bubble(who, text);
  }
  const npc = t => push('npc', t);
  const sys = t => push('sys', t);

  function quick(options) {
    const q = $('quick'); q.replaceChildren();
    options.forEach(([label, fn]) => {
      const b = el('button', 'btn', label); b.type = 'button';
      b.onclick = () => { push('me', label); fn(); save(); };
      q.append(b);
    });
  }
  function mainMenu() {
    quick([['Missões', sayMissions], ['Status', sayStatus], ['Loja', sayShop], ['Diário', sayDiary], ['Ajuda', sayHelp]]);
  }

  function sayMissions() {
    if (S.finished) { npc('Você já concluiu toda a trilha! Continue com as missões do dia para manter o ritmo.'); return mainMenu(); }
    const st = trail().stages[S.stage];
    const lines = st.missions.map((m, i) => `${S.done[mid(S.stage, i)] ? '✔' : '▫'} ${i + 1}. ${esc(m)}`);
    npc(`<b>Etapa ${S.stage + 1}: ${esc(st.name)}</b>\n${lines.join('\n')}\n\nDigite "feito 1" (ou 2, 3) quando concluir uma delas.`);
    mainMenu();
  }
  function sayStatus() {
    const mult = Math.round((CLASSES[S.cls].xpMult * (hasAffinity() ? 1.1 : 1) - 1) * 100);
    npc(`<b>${esc(S.name)}</b> — ${rank()} de ${esc(trail().name)}\nNível ${S.level} · XP ${S.xp}/${xpNeed(S.level)}\nMoedas: ${S.coins} · Sequência: ${S.streak} dia(s)\nOrigem: ${esc(CLASSES[S.cls].name)} · Bônus de XP: +${mult}%${S.coffee ? '\n☕ Café ativo: próxima missão vale em dobro' : ''}`);
    mainMenu();
  }
  function sayShop() {
    npc(`Bem-vindo à lojinha! Você tem <b>${S.coins} moedas</b>.\n` + SHOP.map(i => `${i.icon} ${i.name} — ${i.price} moedas: ${i.desc}`).join('\n'));
    quick([...SHOP.map(i => [`${i.icon} ${i.name} (${i.price})`, () => buy(i)]), ['Voltar', () => { npc('Até a próxima compra!'); mainMenu(); }]]);
  }
  function buy(item) {
    if (S.coins < item.price) { npc(`Faltam ${item.price - S.coins} moedas para isso. Missões rendem moedas!`); return mainMenu(); }
    if (item.id === 'cafe' && S.coffee) { npc('Você já tem um café ativo. Use-o antes de comprar outro.'); return mainMenu(); }
    S.coins -= item.price;
    if (item.id === 'cafe') { S.coffee = true; npc('☕ Café forte na mão! Sua próxima missão vale XP em dobro.'); }
    if (item.id === 'livro') { npc('📖 Você devorou o livro raro.'); gainXp(60, false); }
    if (item.id === 'troca') { ensureDaily(true); npc('🎲 Missões do dia sorteadas de novo. Confira o painel!'); }
    Scene.visit('home');
    mainMenu(); render();
  }
  function sayDiary() {
    if (!S.diary.length) npc('Seu diário ainda está vazio. Ao concluir missões da trilha, seus relatos ficam guardados aqui.');
    else npc('<b>Diário de aventuras</b>\n' + S.diary.slice(-6).map(d => `• ${esc(d.date)} — ${esc(d.mission)}${d.note ? `\n   "${esc(d.note)}"` : ''}`).join('\n'));
    mainMenu();
  }
  function sayHelp() {
    npc('Você pode clicar nos botões ou escrever para mim:\n• <b>missões</b> — ver a etapa atual da trilha\n• <b>feito 2</b> — concluir a missão 2 da trilha\n• <b>diárias</b> — ver as missões de hoje\n• <b>status</b>, <b>loja</b>, <b>diário</b>');
    mainMenu();
  }
  function sayDaily() {
    npc('<b>Missões de hoje</b>\n' + S.daily.items.map((m, i) => `${S.daily.done[i] ? '✔' : '▫'} ${esc(m)}`).join('\n') + '\n\nMarque no painel "Missões do dia" quando cumprir.');
    mainMenu();
  }

  /* ---------- progresso ---------- */
  function gainXp(base, useCoffee = true) {
    let amount = base * CLASSES[S.cls].xpMult * (hasAffinity() ? 1.1 : 1);
    if (useCoffee && S.coffee) { amount *= 2; S.coffee = false; }
    amount = Math.round(amount);
    S.xp += amount;
    let leveled = false;
    while (S.xp >= xpNeed(S.level)) { S.xp -= xpNeed(S.level); S.level++; leveled = true; }
    sys(`+${amount} XP`);
    if (leveled) sys(`★ SUBIU DE NÍVEL! Agora você é nível ${S.level} ★`);
    Scene.celebrate();
    return amount;
  }

  function markActive() {
    const t = today();
    if (S.lastActive !== t) {
      S.streak = S.lastActive && dayDiff(S.lastActive, t) === 1 ? S.streak + 1 : 1;
      S.lastActive = t;
    }
  }

  function askTrailMission(i) {
    if (S.finished) return;
    const st = trail().stages[S.stage];
    if (!st.missions[i]) { npc('Não encontrei essa missão. Digite "missões" para ver a lista.'); return; }
    if (S.done[mid(S.stage, i)]) { npc('Essa missão já foi concluída. Bora para a próxima!'); return; }
    pending = i;
    npc(`Missão: <b>${esc(st.missions[i])}</b>\nQue orgulho! Me conte em uma frase: o que você fez ou aprendeu? (um relato vale +10 XP de bônus)`);
    quick([['Concluir sem relato', () => completeTrailMission('')], ['Ainda não terminei', () => { pending = null; npc('Sem pressa. Volte quando terminar de verdade — é por você!'); mainMenu(); }]]);
    $('chat-input').focus();
  }

  function completeTrailMission(note) {
    const i = pending; pending = null;
    const st = trail().stages[S.stage];
    S.done[mid(S.stage, i)] = true;
    S.diary.push({ date: today(), mission: st.missions[i], note: note.slice(0, 200) });
    markActive();
    const coins = 20 + S.stage * 5;
    S.coins += coins;
    Scene.visit('guild');
    npc(note ? 'Excelente relato! Anotei no seu diário.' : 'Missão registrada!');
    gainXp(40 + S.stage * 10 + (note.trim().length >= 10 ? 10 : 0));
    sys(`+${coins} moedas`);

    if (st.missions.every((_, k) => S.done[mid(S.stage, k)])) {
      S.coins += 100;
      if (S.stage + 1 < trail().stages.length) {
        S.stage++;
        sys(`★ ETAPA CONCLUÍDA! Novo título: ${rank()} ★`);
        npc(`Você concluiu a etapa "${esc(st.name)}" e ganhou 100 moedas! A próxima é <b>${esc(trail().stages[S.stage].name)}</b>.`);
      } else {
        S.stage = trail().stages.length; S.finished = true;
        sys(`★★ TRILHA COMPLETA! Você é ${rank()} de ${trail().name}! ★★`);
        npc(`<b>${esc(S.name)}</b>, você percorreu toda a trilha de ${esc(trail().name)}. O que começou como jogo agora é a sua história de verdade. Estou orgulhoso!`);
      }
    }
    mainMenu(); render(); save();
  }

  function completeDaily(i) {
    if (S.daily.done[i]) return;
    S.daily.done[i] = true;
    markActive();
    S.coins += 8;
    Scene.visit('home');
    sys(`✔ ${S.daily.items[i]}`);
    gainXp(15);
    sys('+8 moedas');
    if (S.daily.done.every(Boolean)) {
      S.coins += 20;
      npc(`Todas as missões do dia cumpridas! Bônus de 20 moedas. Sequência: <b>${S.streak} dia(s)</b>. Volte amanhã!`);
    }
    render(); save();
  }

  /* ---------- texto livre ---------- */
  function handleText(raw) {
    const text = raw.trim();
    if (!text) return;
    push('me', text);
    if (pending !== null) { completeTrailMission(text); return; }

    const t = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const done = t.match(/(?:feito|feita|conclui|concluir|terminei|completei)\D*(\d)/);
    if (done) askTrailMission(+done[1] - 1);
    else if (/diari[ao]s|do dia|hoje|habito/.test(t)) sayDaily();
    else if (/miss|trilha|tarefa|curso|etapa/.test(t)) sayMissions();
    else if (/status|nivel|xp|moeda|perfil/.test(t)) sayStatus();
    else if (/loja|compr|item/.test(t)) sayShop();
    else if (/diario|relato/.test(t)) sayDiary();
    else if (/ajuda|help|como|comando/.test(t)) sayHelp();
    else if (/^(oi|ola|bom dia|boa tarde|boa noite|e ai)/.test(t)) { npc(`Olá, ${esc(S.name)}! Pronto para avançar na trilha hoje?`); mainMenu(); }
    else if (/feito|conclui|terminei|completei/.test(t)) { npc('Que ótimo! Qual missão você concluiu? Digite "feito 1", "feito 2" ou "feito 3" — ou clique em "Concluir" no painel.'); mainMenu(); }
    else if (/obrigad|valeu/.test(t)) { npc('Conte comigo sempre. A trilha é sua, eu só ilumino o caminho.'); mainMenu(); }
    else if (/cansad|desanim|dificil|nao consigo|desist/.test(t)) { npc('Todo mestre já foi aprendiz e já quis desistir. Escolha a menor missão do dia e faça só ela — um passo pequeno ainda é um passo.'); mainMenu(); }
    else { npc('Hmm, não entendi bem. Tente "missões", "diárias", "status", "loja" ou "ajuda".'); mainMenu(); }
    save();
  }

  $('chat-form').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('chat-input');
    handleText(input.value);
    input.value = '';
  });

  /* ---------- painéis ---------- */
  function render() {
    const hud = $('hud'); hud.replaceChildren();
    const xp = el('div', 'xp');
    const bar = el('div', 'bar'); const fill = el('i'); fill.style.width = Math.min(100, S.xp / xpNeed(S.level) * 100) + '%'; bar.append(fill);
    xp.append(el('span', '', `XP`), bar, el('span', '', `${S.xp}/${xpNeed(S.level)}`));
    hud.append(el('span', 'name', S.name), el('span', '', `Nv ${S.level} · ${rank()}`), xp,
               el('span', '', `🪙 ${S.coins}`), el('span', '', `${CLASSES[S.cls].icon} ${CLASSES[S.cls].name}`));

    $('trail-title').textContent = `Trilha: ${trail().name}`;
    const sb = $('stage-bar'); sb.replaceChildren();
    trail().stages.forEach((st, i) => {
      const s = el('span', i < S.stage ? 'done' : i === S.stage ? 'cur' : '', String(i + 1));
      s.title = st.name; sb.append(s);
    });

    const tm = $('trail-missions'); tm.replaceChildren();
    if (S.finished) {
      tm.append(el('li', '', `🏆 Trilha completa! Você é ${rank()} de ${trail().name}.`));
    } else {
      const st = trail().stages[S.stage];
      tm.append(el('li', 'ok', `Etapa ${S.stage + 1}: ${st.name}`));
      st.missions.forEach((m, i) => {
        const done = !!S.done[mid(S.stage, i)];
        const li = el('li', done ? 'done' : '');
        const meta = el('div', 'meta');
        meta.append(el('span', '', `+${40 + S.stage * 10} XP · +${20 + S.stage * 5} 🪙`));
        if (done) meta.append(el('span', 'ok', '✔ Feita'));
        else { const b = el('button', 'btn', 'Concluir'); b.onclick = () => { askTrailMission(i); save(); }; meta.append(b); }
        li.append(el('span', 'mt', m), meta);
        tm.append(li);
      });
    }

    $('streak').textContent = S.streak ? `🔥 ${S.streak}` : '';
    const dm = $('daily-missions'); dm.replaceChildren();
    S.daily.items.forEach((m, i) => {
      const done = S.daily.done[i];
      const li = el('li', done ? 'done' : '');
      const meta = el('div', 'meta');
      meta.append(el('span', '', '+15 XP · +8 🪙'));
      if (done) meta.append(el('span', 'ok', '✔ Feita'));
      else { const b = el('button', 'btn', 'Concluir'); b.onclick = () => completeDaily(i); meta.append(b); }
      li.append(el('span', 'mt', m), meta);
      dm.append(li);
    });
  }

  $('btn-reset').onclick = () => {
    if (!confirm('Apagar todo o progresso e recomeçar?')) return;
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ignora */ }
    S = null;
    initTitle();
  };

  initTitle();
})();
