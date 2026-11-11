/* Interações de trabalho. Cada uma abre em um painel logo abaixo do cenário,
   enquanto o personagem trabalha no local. Nenhuma se resolve sozinha: o jogo
   confere o que foi feito. Errar mostra uma orientação e permite tentar de novo.

   Minigames.open(host, kind, cfg, api)
     api = { done(result), cancel(), work(on), fx(name) }
   Teclas: E ou Espaço acionam o botão principal; setas servem às runas. */

const Minigames = (() => {
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, fn) => { const b = el('button', cls, text); b.type = 'button'; b.onclick = fn; return b; };
  let live = null;                   // { key(e), stop() } do minigame aberto

  /* Pequena cena animada da ação (cortar, mexer, martelar...). */
  function stage(kind) {
    const c = el('canvas', 'pixel mg-stage'); c.width = 64; c.height = 40;
    const g = c.getContext('2d');
    let hit = 0, level = 0, raf = 0;
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
    const draw = t => {
      raf = requestAnimationFrame(draw);
      const k = Math.max(0, 1 - (t - hit) / 260), swing = Math.sin(k * Math.PI);
      R(0, 0, 64, 40, '#0a1040'); R(0, 30, 64, 10, '#6a4a30'); R(0, 30, 64, 2, '#8a6a48');
      if (kind === 'chop') { R(14, 26, 36, 4, '#d8b078'); R(20, 22, 22 - Math.min(18, level * 3), 4, '#f08030'); for (let i = 0; i < level; i++) R(42 - i * 3, 22, 2, 4, '#f8a050'); const y = 6 + swing * 12; R(40 - Math.min(18, level * 3), y, 3, 12, '#e0e0e8'); R(39 - Math.min(18, level * 3), y - 5, 5, 5, '#5a3a22'); }
      if (kind === 'stir' || kind === 'potion') { const liq = kind === 'potion' ? '#58d878' : '#c8642a'; R(16, 16, 32, 14, '#3a3a44'); R(18, 16, 28, 4, liq); const sx = 32 + Math.sin(t / 140) * (4 + swing * 8); R(sx, 2, 2, 16, '#b88448'); for (let i = 0; i < 3; i++) { const s = ((t / 500) + i / 3) % 1; R(24 + i * 8 + Math.sin(s * 6) * 2, 14 - s * 12, 2, 2, kind === 'potion' ? '#b8f8c8' : '#ffffff'); } }
      if (kind === 'hammer') { R(18, 22, 28, 5, '#5a5a66'); R(24, 27, 16, 3, '#4a4a56'); R(22, 19, 18, 3, level > 2 ? '#c8c8d8' : '#f08030'); const a = swing * 16; R(44 - a, 4 + a * 0.9, 4, 14, '#8a5e36'); R(40 - a, 2 + a * 0.9, 12, 6, '#9a9aa8'); if (k > 0.5) for (let i = 0; i < 4; i++) R(26 + i * 4, 16 - i % 2 * 3, 1, 1, '#ffe066'); }
      if (kind === 'heat') { R(14, 8, 36, 22, '#8a6a5a'); R(18, 14, 28, 14, '#2a1a12'); const f = 4 + level * 10; R(20, 28 - f, 24, f, '#e04a1a'); R(24, 28 - f * 0.7, 16, f * 0.7, '#f8a030'); R(29, 28 - f * 0.4, 6, f * 0.4, '#ffe066'); R(28, 18, 20, 3, level > 0.5 ? '#ffb060' : '#9a9aa8'); }
      if (kind === 'wrench') { [14, 44].forEach(x => { for (let d = 0; d < 24; d++) { const a = d / 24 * 6.283 + (kind === 'wrench' ? level * 0.6 : 0); R(x + 3 + Math.cos(a) * 8, 20 + Math.sin(a) * 8, 2, 2, '#d8d8e0'); } R(x + 2, 19, 3, 3, '#3a3a44'); }); R(18, 14, 30, 2, '#c8483a'); const a = swing * 8; R(30, 4 + a, 3, 12, '#9a9aa8'); R(28, 2 + a, 7, 4, '#9a9aa8'); }
      if (kind === 'write') { R(6, 4, 52, 24, '#2f5a44'); for (let i = 0; i < Math.min(4, level); i++) R(10, 8 + i * 5, 20 + (i * 13) % 20, 1, '#f4f4f4'); if (k > 0) R(10 + (level % 4) * 6, 8 + Math.min(3, level) * 5, 8, 1, '#ffffff'); }
      if (kind === 'water') { R(8, 26, 48, 4, '#4a3018'); for (let i = 0; i < 4; i++) { R(14 + i * 11, 20, 2, 6, '#58b858'); R(12 + i * 11, 20, 2, 2, '#58b858'); } if (k > 0) for (let i = 0; i < 6; i++) R(12 + i * 8, 8 + (1 - k) * 14, 1, 3, '#8fd0f0'); }
      if (kind === 'cook') { R(14, 18, 36, 12, '#b8b8c4'); R(18, 12, 28, 8, '#7a7a8a'); R(20, 12, 24, 3, level > 0.55 ? '#c8842a' : '#e8d8a0'); R(18, 26, 28, 2, `rgba(232,138,58,${0.3 + level * 0.7})`); for (let i = 0; i < 3; i++) { const s = ((t / 500) + i / 3) % 1; R(24 + i * 7, 10 - s * 9 * (0.3 + level), 2, 2, '#ffffff'); } }
    };
    raf = requestAnimationFrame(draw);
    return { c, hit() { hit = performance.now(); }, set(v) { level = v; }, stop() { cancelAnimationFrame(raf); } };
  }

  function frame(host, title, text) {
    host.replaceChildren();
    const head = el('div', 'mg-head'); head.append(el('span', 'mg-title', title));
    const body = el('div', 'mg-body'), fb = el('div', 'mg-fb'); fb.setAttribute('aria-live', 'polite');
    host.append(head, el('div', 'mg-text', text || ''), body, fb);
    return { body, fb, say(t, cls) { fb.className = 'mg-fb ' + (cls || ''); fb.textContent = t; } };
  }
  const nav = (api, mainLabel, onMain) => { const n = el('div', 'mg-nav'); const m = btn('btn primary mg-main', mainLabel, onMain); n.append(btn('btn ghost', 'Parar', () => api.cancel()), m); return { n, m }; };

  const GAMES = {
    /* Buscar itens: pegar exatamente o que o pedido lista. cfg: { title, text, need: [nomes], shelf: [nomes], free?: mínimo } */
    collect(host, cfg, api) {
      const ui = frame(host, cfg.title, cfg.text);
      const got = new Set(), need = cfg.need || [];
      const list = el('div', 'mg-need'), grid = el('div', 'mg-shelf');
      const draw = () => { list.replaceChildren(el('span', 'dim', cfg.free ? `Escolha pelo menos ${cfg.free}:` : 'Pedido:')); need.forEach(n => list.append(el('b', got.has(n) ? 'ok' : '', (got.has(n) ? '✔ ' : '') + n))); if (cfg.free) [...got].forEach(n => list.append(el('b', 'ok', '✔ ' + n))); };
      cfg.shelf.forEach((name, i) => {
        const b = btn('mg-item', name, () => {
          if (cfg.free) { got.has(name) ? got.delete(name) : got.add(name); b.classList.toggle('sel', got.has(name)); draw(); m.disabled = got.size < cfg.free; return; }
          if (!need.includes(name)) { b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 350); return ui.say(`${name} não está no pedido.`, 'err'); }
          got.add(name); b.classList.add('sel'); b.disabled = true; draw(); api.fx('pick');
          if (need.every(n => got.has(n))) api.done([...got]);
        });
        b.dataset.i = i; b.dataset.name = name; grid.append(b);
      });
      const { n, m } = nav(api, 'Levar', () => api.done([...got]));
      m.hidden = !cfg.free; m.disabled = true;
      ui.body.append(list, grid); host.append(n); draw();
    },

    /* Ritmo e precisão: acionar quando o marcador passa pela faixa. cfg: { title, text, verb, hits, anim, speed, zone } */
    timing(host, cfg, api) {
      const ui = frame(host, cfg.title, cfg.text);
      const st = stage(cfg.anim || 'hammer');
      const bar = el('div', 'mg-bar'), zone = el('i', 'zone'), cur = el('i', 'cur'), pips = el('div', 'mg-pips');
      const zw = cfg.zone || 26, z0 = 50 - zw / 2;
      zone.style.left = z0 + '%'; zone.style.width = zw + '%'; bar.append(zone, cur);
      for (let i = 0; i < cfg.hits; i++) pips.append(el('i'));
      let n = 0, pos = 0, raf = 0, t0 = performance.now();
      const loop = t => { raf = requestAnimationFrame(loop); pos = 50 + 50 * Math.sin((t - t0) / (cfg.speed || 420)); cur.style.left = pos + '%'; };
      raf = requestAnimationFrame(loop);
      const act = () => {
        if (n >= cfg.hits) return;
        st.hit(); api.work(true);
        if (pos >= z0 && pos <= z0 + zw) {
          pips.children[n].classList.add('on'); n++; st.set(n); ui.say(['Boa!', 'Isso!', 'No ponto!'][n % 3], 'ok'); api.fx(cfg.anim);
          if (n >= cfg.hits) { cancelAnimationFrame(raf); live = null; setTimeout(() => { st.stop(); api.done(); }, 450); }
        } else ui.say('Fora do ponto. Espere o marcador entrar na faixa clara.', 'err');
      };
      const { n: navEl, m } = nav(api, cfg.verb, act);
      const row = el('div', 'mg-row'); row.append(st.c, bar);
      ui.body.append(row, pips); host.append(navEl);
      live = { key: e => { if (e.key === 'e' || e.key === 'E' || e.key === ' ') { e.preventDefault(); act(); } }, stop() { cancelAnimationFrame(raf); st.stop(); } };
      m.focus();
    },

    /* Segurar e soltar no ponto certo (aquecer, cozinhar). cfg: { title, text, verb, anim, lo, hi } */
    hold(host, cfg, api) {
      const ui = frame(host, cfg.title, cfg.text);
      const st = stage(cfg.anim || 'heat');
      const g = el('div', 'mg-gauge'), zone = el('i', 'zone'), fill = el('i', 'fill');
      const lo = cfg.lo || 62, hi = cfg.hi || 84;
      zone.style.bottom = lo + '%'; zone.style.height = (hi - lo) + '%'; g.append(zone, fill);
      let v = 0, holding = false, raf = 0, last = performance.now(), finished = false;
      const loop = t => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(60, t - last); last = t;
        v = Math.max(0, Math.min(100, v + (holding ? 0.045 : -0.03) * dt));
        fill.style.height = v + '%'; st.set(v / 100);
      };
      raf = requestAnimationFrame(loop);
      const down = () => { if (!finished) { holding = true; api.work(true); } };
      const up = () => {
        if (!holding || finished) return; holding = false;
        if (v >= lo && v <= hi) { finished = true; ui.say('No ponto certo!', 'ok'); api.fx(cfg.anim); cancelAnimationFrame(raf); live = null; setTimeout(() => { st.stop(); api.done(); }, 500); }
        else ui.say(v < lo ? 'Ainda está fraco. Segure mais um pouco.' : 'Passou do ponto. Deixe baixar e tente de novo.', 'err');
      };
      const { n, m } = nav(api, cfg.verb + ' (segure)', null);
      m.onpointerdown = e => { e.preventDefault(); down(); }; m.onpointerup = up; m.onpointerleave = up; m.onclick = null;
      const row = el('div', 'mg-row'); row.append(st.c, g, el('span', 'dim', 'Segure o botão (ou E) e solte quando a barra estiver dentro da faixa clara.'));
      ui.body.append(row); host.append(n);
      live = { key: e => { if (e.key === 'e' || e.key === 'E' || e.key === ' ') { e.preventDefault(); if (e.type === 'keydown') down(); else up(); } }, keyup: true, stop() { cancelAnimationFrame(raf); st.stop(); } };
    },

    /* Encantamento: observar a sequência de runas e repetir. cfg: { title, text, len } */
    runes(host, cfg, api) {
      const ui = frame(host, cfg.title, cfg.text);
      const DIR = { ArrowUp: '↑', ArrowRight: '→', ArrowDown: '↓', ArrowLeft: '←' }, keys = Object.keys(DIR);
      const seq = Array.from({ length: cfg.len || 4 }, () => keys[Math.floor(Math.random() * 4)]);
      const show = el('div', 'mg-runes'), pad = el('div', 'mg-pad');
      seq.forEach(() => show.append(el('i', '', '✦')));
      let at = 0, showing = true, timers = [];
      const play = () => {
        showing = true; at = 0; [...show.children].forEach(c => { c.textContent = '✦'; c.className = ''; });
        ui.say('Observe a sequência...');
        seq.forEach((k, i) => timers.push(setTimeout(() => { show.children[i].textContent = DIR[k]; show.children[i].className = 'lit'; api.fx('rune'); }, 500 + i * 650)));
        timers.push(setTimeout(() => { [...show.children].forEach(c => { c.textContent = '✦'; c.className = ''; }); showing = false; ui.say('Agora repita com as setas.'); }, 700 + seq.length * 650));
      };
      const press = k => {
        if (showing) return;
        if (k === seq[at]) {
          show.children[at].textContent = DIR[k]; show.children[at].className = 'lit'; at++; api.fx('rune'); api.work(true);
          if (at >= seq.length) { live = null; ui.say('O encantamento se completa!', 'ok'); setTimeout(() => api.done(), 600); }
        } else { ui.say('A runa se apagou. Observe de novo.', 'err'); timers.push(setTimeout(play, 700)); showing = true; }
      };
      keys.forEach(k => { const b = btn('btn', DIR[k], () => press(k)); b.dataset.key = k; pad.append(b); });
      const { n, m } = nav(api, 'Ver de novo', () => { timers.forEach(clearTimeout); play(); });
      ui.body.append(show, pad); host.append(n); host.dataset.seq = seq.join(',');
      live = { key: e => { if (DIR[e.key]) { e.preventDefault(); press(e.key); } }, stop() { timers.forEach(clearTimeout); } };
      play();
    },

    /* Inspeção visual: encontrar as peças gastas. cfg: { title, text, parts: [{name, x, y, w, h, worn}] } */
    inspect(host, cfg, api) {
      const ui = frame(host, cfg.title, cfg.text);
      const view = el('div', 'mg-inspect'); let left = cfg.parts.filter(p => p.worn).length;
      cfg.parts.forEach((p, i) => {
        const b = btn('part' + (p.worn ? ' worn' : '') + (p.round ? ' round' : ''), '', () => {
          if (!p.worn) return ui.say(`${p.name}: em bom estado.`);
          if (b.classList.contains('found')) return;
          b.classList.add('found'); left--; ui.say(`${p.name}: ${p.issue || 'peça gasta'}. Anotado.`, 'ok'); api.fx('pick');
          if (!left) setTimeout(() => api.done(cfg.parts.filter(q => q.worn).map(q => q.name)), 500);
        });
        b.style.cssText = `left:${p.x}%;top:${p.y}%;width:${p.w}%;height:${p.h}%`; b.title = p.name; b.dataset.i = i; b.setAttribute('aria-label', p.name);
        view.append(b);
      });
      ui.body.append(view, el('span', 'dim', 'Toque nas peças para examinar. As gastas têm ferrugem ou rachaduras.'));
      host.append(nav(api, '', null).n); host.querySelector('.mg-main').hidden = true;
    },

    /* Atendimento: avaliar com instrumentos e escolher o cuidado. cfg: { title, patient, complaint, readings: {inst: [texto, alterado]}, cares: [nomes], care } */
    exam(host, cfg, api) {
      const ui = frame(host, cfg.title, `${cfg.patient}: "${cfg.complaint}"`);
      const INST = { termometro: 'Termômetro', estetoscopio: 'Estetoscópio', lupa: 'Lupa de exame' };
      const notes = el('ul', 'mg-notes'), tools = el('div', 'mg-shelf'), cares = el('div', 'mg-shelf');
      let found = false;
      Object.keys(INST).forEach(k => tools.append(Object.assign(btn('mg-item', INST[k], function () {
        const [txt, bad] = cfg.readings[k];
        this.disabled = true; this.classList.add('sel'); api.work(true); api.fx('pick');
        notes.append(el('li', bad ? 'bad' : '', `${INST[k]}: ${txt}${bad ? '  ⚠' : '  ✔'}`));
        if (bad) { found = true; [...cares.children].forEach(c => { c.disabled = false; }); ui.say('Você encontrou a causa. Escolha o cuidado adequado.', 'ok'); }
      }), { })));
      [...tools.children].forEach((b, i) => { b.dataset.inst = Object.keys(INST)[i]; });
      cfg.cares.forEach(c => { const b = btn('mg-item', c, () => {
        if (!found) return;
        if (c === cfg.care) { api.done({ care: c }); } else { b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 350); ui.say('Esse cuidado não combina com o que a avaliação mostrou. Releia as anotações.', 'err'); }
      }); b.disabled = true; b.dataset.name = c; cares.append(b); });
      ui.body.append(el('span', 'dim', 'Avaliação: use os instrumentos.'), tools, notes, el('span', 'dim', 'Cuidado:'), cares);
      host.append(nav(api, '', null).n); host.querySelector('.mg-main').hidden = true;
    },

    /* Programar o autômato: montar a sequência de comandos e executar. cfg: { title, text, map, max } */
    robot(host, cfg, api) {
      const ui = frame(host, cfg.title, cfg.text);
      const rows = cfg.map, Hh = rows.length, Ww = rows[0].length;
      const find = ch => { for (let y = 0; y < Hh; y++) { const x = rows[y].indexOf(ch); if (x >= 0) return { x, y }; } };
      const start = find('S'), goal = find('G'), DIRS = { up: ['↑', 0, -1], down: ['↓', 0, 1], left: ['←', -1, 0], right: ['→', 1, 0] };
      const cmds = []; let running = false;
      const grid = el('div', 'mg-grid'); grid.style.gridTemplateColumns = `repeat(${Ww}, 1fr)`;
      const cells = [];
      for (let y = 0; y < Hh; y++) for (let x = 0; x < Ww; x++) { const c = el('div', 'cell' + (rows[y][x] === '#' ? ' wall' : '') + (rows[y][x] === 'G' ? ' goal' : '')); cells.push(c); grid.append(c); }
      const bot = el('div', 'bot'), place = (x, y) => cells[y * Ww + x].append(bot);
      place(start.x, start.y);
      const prog = el('div', 'mg-prog'), pad = el('div', 'mg-pad');
      const draw = () => { prog.replaceChildren(el('span', 'dim', `Comandos (até ${cfg.max}):`)); cmds.forEach(c => prog.append(el('b', '', DIRS[c][0]))); m.disabled = !cmds.length || running; };
      Object.keys(DIRS).forEach(d => { const b = btn('btn', DIRS[d][0], () => { if (!running && cmds.length < cfg.max) { cmds.push(d); draw(); } }); b.dataset.dir = d; pad.append(b); });
      pad.append(btn('btn ghost', 'Apagar', () => { if (!running) { cmds.pop(); place(start.x, start.y); draw(); } }));
      const { n, m } = nav(api, 'Executar ▶', () => {
        if (running) return; running = true; draw(); ui.say(''); api.work(true);
        let x = start.x, y = start.y, i = 0; place(x, y);
        const tick = () => {
          if (i >= cmds.length) { running = false; if (x === goal.x && y === goal.y) return api.done(); draw(); return ui.say('O autômato parou antes do destino. Ajuste os comandos.', 'err'); }
          const [, dx, dy] = DIRS[cmds[i++]], nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= Ww || ny >= Hh || rows[ny][nx] === '#') { running = false; bot.classList.add('bump'); setTimeout(() => bot.classList.remove('bump'), 400); draw(); return ui.say(`O autômato bateu no ${i}º comando. Desvie do obstáculo.`, 'err'); }
          x = nx; y = ny; place(x, y); setTimeout(tick, 280);
        };
        setTimeout(tick, 200);
      });
      ui.body.append(grid, prog, pad); host.append(n); draw();
    },

    /* Criação de cartaz: arrastar elementos, escolher cores e letra. Qualquer composição legível e sem sobreposição vale.
       cfg: { title, text, texts: [título, linha], art } */
    compose(host, cfg, api) {
      const ui = frame(host, cfg.title, cfg.text);
      const BG = ['#f6efd8', '#1f4e9a', '#c8281e', '#2f7a48', '#18141e', '#f2c53d', '#e870a8', '#ffffff'];
      const FG = ['#18141e', '#ffffff', '#ffd75e', '#c8281e', '#1f4e9a'];
      const FONTS = [['Pixel', "'Press Start 2P', monospace"], ['Clássica', 'Georgia, serif'], ['Limpa', 'Arial, sans-serif'], ['À mão', "'Comic Sans MS', cursive"]];
      const d = { bg: 0, fg: 0, font: 0, size: 1, accent: '#e04a3a' };
      const poster = el('div', 'mg-poster');
      const items = [
        // começam empilhados, como recortes soltos na prancheta: é preciso compor
        { k: 'title', node: el('div', 'pi title', cfg.texts[0]), x: 10, y: 36 },
        { k: 'art', node: el('div', 'pi art ' + (cfg.art || 'star')), x: 22, y: 40 },
        { k: 'line', node: el('div', 'pi line', cfg.texts[1]), x: 16, y: 52 },
      ];
      const apply = () => {
        poster.style.background = BG[d.bg]; poster.style.color = FG[d.fg]; poster.style.fontFamily = FONTS[d.font][1];
        items[0].node.style.fontSize = [11, 15, 20][d.size] + 'px';
        items.forEach(it => { it.node.style.left = it.x + '%'; it.node.style.top = it.y + '%'; });
      };
      items.forEach(it => {
        poster.append(it.node);
        it.node.onpointerdown = e => {
          e.preventDefault(); it.node.setPointerCapture(e.pointerId);
          const r = poster.getBoundingClientRect(), n = it.node.getBoundingClientRect(), ox = e.clientX - n.left, oy = e.clientY - n.top;
          it.node.onpointermove = ev => { it.x = Math.max(0, Math.min(100 - n.width / r.width * 100, (ev.clientX - r.left - ox) / r.width * 100)); it.y = Math.max(0, Math.min(100 - n.height / r.height * 100, (ev.clientY - r.top - oy) / r.height * 100)); apply(); api.work(true); };
          it.node.onpointerup = () => { it.node.onpointermove = null; };
        };
      });
      const lum = h => { const n = parseInt(h.slice(1), 16), f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); };
      const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
      const ctr = el('div', 'mg-ctrls');
      const sw = (label, list, key) => { const row = el('div', 'ctrl'); row.append(el('span', 'dim', label)); list.forEach((c, i) => { const b = btn('swatch-b', '', () => { d[key] = i; apply(); api.fx('draw'); }); b.style.background = c; b.dataset[key] = i; b.setAttribute('aria-label', label + ' ' + (i + 1)); row.append(b); }); ctr.append(row); };
      sw('Fundo', BG, 'bg'); sw('Texto', FG, 'fg');
      const r2 = el('div', 'ctrl'); r2.append(el('span', 'dim', 'Letra'));
      FONTS.forEach((f, i) => { const b = btn('btn small', f[0], () => { d.font = i; apply(); }); b.dataset.font = i; r2.append(b); });
      r2.append(btn('btn small', 'Título −', () => { d.size = Math.max(0, d.size - 1); apply(); }), btn('btn small', 'Título +', () => { d.size = Math.min(2, d.size + 1); apply(); }));
      ctr.append(r2);
      const { n } = nav(api, 'Entregar cartaz', () => {
        const pr = poster.getBoundingClientRect();
        const rects = items.map(it => { const r = it.node.getBoundingClientRect(); return { k: it.k, x: (r.left - pr.left) / pr.width, y: (r.top - pr.top) / pr.height, w: r.width / pr.width, h: r.height / pr.height }; });
        if (contrast(BG[d.bg], FG[d.fg]) < 3) return ui.say('O texto some nesse fundo. Troque a cor do fundo ou do texto para dar leitura.', 'err');
        const out = rects.find(r => r.x < -0.01 || r.y < -0.01 || r.x + r.w > 1.02 || r.y + r.h > 1.02);
        if (out) return ui.say('Um elemento está saindo do cartaz. Diminua o título ou reposicione.', 'err');
        for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { const a = rects[i], b = rects[j]; const ow = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oh = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); if (ow > 0.03 && oh > 0.03) return ui.say('Dois elementos estão um em cima do outro. Arraste para separar.', 'err'); }
        api.done({ bg: BG[d.bg], fg: FG[d.fg], accent: d.accent, font: FONTS[d.font][1], size: d.size, texts: cfg.texts, art: cfg.art || 'star', items: rects });
      });
      const wrap = el('div', 'mg-row top'); wrap.append(poster, ctr);
      ui.body.append(wrap, el('span', 'dim', 'Arraste o título, a ilustração e a linha de texto. Qualquer composição legível, sem nada sobreposto, vale.'));
      host.append(n); apply();
    },

    /* Pintura livre em uma tela 16x12. cfg: { title, text, minColors, minFill } */
    paint(host, cfg, api) {
      const ui = frame(host, cfg.title, cfg.text);
      const Wc = 16, Hc = 12, data = new Array(Wc * Hc).fill(0);
      const c = el('canvas', 'pixel mg-canvas'); c.width = Wc; c.height = Hc;
      const g = c.getContext('2d');
      let color = 2, tool = 'brush', down = false;
      const redraw = () => data.forEach((v, i) => { g.fillStyle = PAINT_COLORS[v]; g.fillRect(i % Wc, Math.floor(i / Wc), 1, 1); });
      const at = e => { const r = c.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * Wc), Math.floor((e.clientY - r.top) / r.height * Hc)]; };
      const fill = (x, y) => { const from = data[y * Wc + x]; if (from === color) return; const q = [[x, y]]; while (q.length) { const [a, b] = q.pop(); if (a < 0 || b < 0 || a >= Wc || b >= Hc || data[b * Wc + a] !== from) continue; data[b * Wc + a] = color; q.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]); } };
      const put = e => { const [x, y] = at(e); if (x < 0 || y < 0 || x >= Wc || y >= Hc) return; if (tool === 'fill') fill(x, y); else { const s = tool === 'big' ? 1 : 0; for (let dy = 0; dy <= s; dy++) for (let dx = 0; dx <= s; dx++) if (x + dx < Wc && y + dy < Hc) data[(y + dy) * Wc + x + dx] = tool === 'erase' ? 0 : color; } redraw(); api.work(true); };
      c.onpointerdown = e => { e.preventDefault(); down = true; c.setPointerCapture(e.pointerId); put(e); };
      c.onpointermove = e => { if (down && tool !== 'fill') put(e); };
      c.onpointerup = () => { down = false; };
      const pal = el('div', 'mg-pal'), tools = el('div', 'ctrl');
      PAINT_COLORS.forEach((col, i) => { if (!i) return; const b = btn('swatch-b' + (i === color ? ' sel' : ''), '', () => { color = i; [...pal.children].forEach(x => x.classList.toggle('sel', x === b)); if (tool === 'erase') pickTool('brush'); }); b.style.background = col; b.dataset.color = i; b.setAttribute('aria-label', 'Cor ' + i); pal.append(b); });
      const TOOLS = { brush: 'Pincel fino', big: 'Pincel largo', fill: 'Balde', erase: 'Borracha' };
      const pickTool = t => { tool = t; [...tools.querySelectorAll('button')].forEach(b => b.classList.toggle('on', b.dataset.tool === t)); };
      Object.keys(TOOLS).forEach(t => { const b = btn('btn small', TOOLS[t], () => pickTool(t)); b.dataset.tool = t; tools.append(b); });
      const { n } = nav(api, 'Assinar e entregar', () => {
        const used = new Set(data.filter(v => v)), filled = data.filter(v => v).length / data.length;
        if (used.size < (cfg.minColors || 3)) return ui.say(`A encomenda pede pelo menos ${cfg.minColors || 3} cores. Você usou ${used.size}.`, 'err');
        if (filled < (cfg.minFill || 0.5)) return ui.say('Ainda há muito espaço em branco. Preencha pelo menos metade da tela.', 'err');
        api.done({ data: data.map(v => v.toString(36)).join('') });
      });
      const side = el('div', 'mg-ctrls'); side.append(pal, tools);
      const wrap = el('div', 'mg-row top'); wrap.append(c, side);
      ui.body.append(wrap, el('span', 'dim', 'Pinte como quiser. O tema é uma sugestão: a obra é sua.')); host.append(n); redraw(); pickTool('brush');
    },

    /* Venda: entregar o item pedido e dar o troco. cfg: { title, customer, item, shelf, price, paid } */
    sell(host, cfg, api) {
      const ui = frame(host, cfg.title, `${cfg.customer}: "Quero ${cfg.item}, por favor."`);
      const grid = el('div', 'mg-shelf'), row = el('div', 'mg-calc');
      const input = el('input', 'mg-num'); input.type = 'number'; input.inputMode = 'numeric'; input.placeholder = '?'; input.disabled = true;
      const bump = v => { input.value = Math.max(0, (parseInt(input.value, 10) || 0) + v); };
      const minus = btn('btn', '−', () => bump(-1)), plus = btn('btn', '+', () => bump(1)); minus.disabled = plus.disabled = true;
      row.append(minus, input, plus);
      const info = el('span', 'dim', 'Primeiro, entregue o item pedido.');
      cfg.shelf.forEach(name => { const b = btn('mg-item', name, () => {
        if (name !== cfg.item) { b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 350); return ui.say(`O cliente pediu ${cfg.item}.`, 'err'); }
        [...grid.children].forEach(x => { x.disabled = true; }); b.classList.add('sel'); api.fx('pick'); api.work(true);
        info.textContent = `Custa ${cfg.price} moedas. O cliente pagou com ${cfg.paid}. Quanto é o troco?`;
        input.disabled = minus.disabled = plus.disabled = m.disabled = false; input.focus();
      }); b.dataset.name = name; grid.append(b); });
      const go = () => { if (input.value === '') return; if (parseInt(input.value, 10) === cfg.paid - cfg.price) api.done(); else ui.say(`Confira a conta: ${cfg.paid} menos ${cfg.price}.`, 'err'); };
      const { n, m } = nav(api, 'Dar o troco', go); m.disabled = true;
      input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
      ui.body.append(grid, info, row); host.append(n);
    },
  };

  function open(host, kind, cfg, api) {
    close();
    host.dataset.kind = kind;
    GAMES[kind](host, cfg, api);
  }
  function close() { if (live && live.stop) live.stop(); live = null; }
  /* O jogo repassa as teclas enquanto um painel está aberto. */
  function key(e) { if (!live) return false; if (e.type === 'keyup' && !live.keyup) return false; live.key(e); return true; }

  return { open, close, key, has: k => !!GAMES[k] };
})();
