/* Motor das atividades: desenha a etapa atual, confere a resposta e avança.
   Não conhece o jogo: recebe o estado da atividade e alguns ganchos.

   ActivityUI.mount(host, act, st, hooks)
     act   – definição (ACTIVITIES…)
     st    – { step, errors } (salvo pelo jogo; uma etapa concluída nunca se repete)
     hooks – { choices, fmt, save, anim, teacher, practice, onExit, onComplete } */

const ActivityUI = (() => {
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const btn = (cls, text, fn) => { const b = el('button', cls, text); b.type = 'button'; b.onclick = fn; return b; };

  /* Etapas efetivas: resolve os desvios ("branch") conforme as escolhas salvas. */
  function stepsOf(act, choices) {
    return act.steps.flatMap(s => (s.k === 'branch' ? s.opts[(choices[s.key] || { i: 0 }).i] || s.opts[0] : [s]));
  }

  /* Embaralha sempre do mesmo jeito para a mesma etapa (não muda ao recarregar). */
  function shuffled(n, seedText) {
    let seed = [...seedText].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 17);
    const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const idx = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    if (n > 1 && idx.every((v, i) => v === i)) idx.push(idx.shift());      // nunca já resolvido
    return idx;
  }

  function mount(host, act, st, hooks) {
    const steps = stepsOf(act, hooks.choices);
    if (st.step >= steps.length) { hooks.onComplete(); return; }
    const step = steps[st.step];

    // pula escolhas livres já feitas quando a atividade é refeita como treino
    if (hooks.practice && (step.k === 'pick' || step.k === 'write') && hooks.choices[step.key]) { st.step++; hooks.save(); return mount(host, act, st, hooks); }

    host.replaceChildren();
    const head = el('div', 'act-head');
    head.append(el('span', 'act-title', act.title), el('span', 'act-step', `Etapa ${st.step + 1} de ${steps.length}`));
    const sayBox = el('div', 'act-say');
    const pc = el('canvas', 'pixel portrait'); pc.width = 20; pc.height = 18;
    Sprites.draw(pc.getContext('2d'), hooks.teacher.look, 0, -1);
    const sayMain = el('div', 'dialog-main');
    sayMain.append(el('div', 'who', hooks.teacher.name), el('div', 'act-text', hooks.fmt(step.say || '')));
    sayBox.append(pc, sayMain);
    const prompt = el('div', 'act-prompt', step.prompt ? hooks.fmt(step.prompt) : '');
    const body = el('div', 'act-body');
    const fb = el('div', 'act-fb'); fb.setAttribute('aria-live', 'polite');
    const nav = el('div', 'act-nav');
    const exit = btn('btn ghost', 'Sair', () => hooks.onExit());
    exit.title = 'Seu progresso fica salvo';
    const main = btn('btn primary act-main', 'Verificar', null);
    nav.append(exit, main);
    host.append(head, sayBox, prompt);
    if (step.code) host.append(el('pre', 'act-code', step.code));
    host.append(body, fb, nav);

    let solved = false;
    const next = () => { st.step++; hooks.save(); mount(host, act, st, hooks); };
    const succeed = () => {
      if (solved) return;
      solved = true;
      if (step.anim) hooks.anim(step.anim);
      if (step.out) { const o = el('pre', 'act-code out', step.out); o.dataset.label = 'Saída'; body.before(o); }
      fb.className = 'act-fb ok'; fb.textContent = hooks.fmt(step.ok || 'Muito bem!');
      body.classList.add('locked');
      body.querySelectorAll('button, input').forEach(b => { b.disabled = true; });
      main.disabled = false; main.hidden = false; main.textContent = 'Continuar ▶'; main.onclick = next;
      main.focus();
    };
    const fail = hint => { st.errors = (st.errors || 0) + 1; hooks.save(); fb.className = 'act-fb err'; fb.textContent = hooks.fmt(hint || 'Ainda não. Tente de novo.'); hooks.anim('err'); };
    const sameSet = (a, b) => a.length === b.length && a.every(v => b.includes(v));

    const KINDS = {
      say() { main.textContent = 'Continuar ▶'; main.onclick = next; hooks.anim('talk'); },

      pick() {
        let sel = null;
        const grid = el('div', 'act-opts cards');
        step.opts.forEach(([label, desc], i) => {
          const b = btn('act-opt', null, () => { sel = i; [...grid.children].forEach((c, k) => c.classList.toggle('sel', k === i)); main.disabled = false; });
          b.dataset.i = i; b.append(el('b', '', label), el('span', '', desc));
          grid.append(b);
        });
        body.append(grid);
        main.textContent = step.confirm; main.disabled = true;
        main.onclick = () => { hooks.choices[step.key] = { i: sel, label: step.opts[sel][0] }; hooks.save(); step.ok = step.ok || `Escolha registrada: ${step.opts[sel][0]}.`; succeed(); };
      },

      write() {
        const input = el('input', 'act-text-in'); input.type = 'text'; input.maxLength = 60; input.placeholder = step.ph || '';
        body.append(input);
        main.textContent = 'Confirmar';
        const go = () => {
          const v = input.value.trim();
          if (v.length < 3) return fail('Escreva pelo menos algumas palavras.');
          hooks.choices[step.key] = { i: 0, label: v }; hooks.save(); succeed();
        };
        main.onclick = go;
        input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
      },

      q() {
        main.hidden = true;
        const grid = el('div', 'act-opts');
        step.opts.forEach((label, i) => {
          const b = btn('act-opt', hooks.fmt(label), () => {
            if (i === step.ans) { b.classList.add('right'); succeed(); }
            else { b.classList.add('wrong'); b.disabled = true; fail(step.hint); }
          });
          b.dataset.i = i; grid.append(b);
        });
        body.append(grid);
      },

      multi() {
        const sel = new Set();
        const grid = el('div', 'act-opts chips');
        step.opts.forEach((label, i) => {
          const b = btn('act-opt', label, () => { sel.has(i) ? sel.delete(i) : sel.add(i); b.classList.toggle('sel', sel.has(i)); });
          b.dataset.i = i; grid.append(b);
        });
        body.append(grid);
        main.onclick = () => (sameSet([...sel], step.ans) ? succeed() : fail(step.hint));
      },

      order() {
        const seq = [];
        const pool = el('div', 'act-opts chips'), list = el('ol', 'act-seq');
        const draw = () => {
          pool.replaceChildren(); list.replaceChildren();
          shuffled(step.items.length, step.items[0]).filter(i => !seq.includes(i)).forEach(i => {
            const b = btn('act-opt', step.items[i], () => { seq.push(i); draw(); }); b.dataset.i = i; pool.append(b);
          });
          seq.forEach((i, pos) => {
            const li = el('li');
            const b = btn('act-opt placed', step.items[i], () => { seq.splice(pos, 1); draw(); }); b.title = 'Toque para tirar';
            li.append(b); list.append(li);
          });
          if (!seq.length) list.append(el('li', 'empty', 'Toque nos itens abaixo, na ordem certa.'));
          main.disabled = seq.length !== step.items.length;
        };
        body.append(list, pool); draw();
        main.onclick = () => {
          const bad = seq.findIndex((v, i) => v !== i);
          if (bad < 0) return succeed();
          fail(`${step.hint} (O ${bad + 1}º item está fora do lugar.)`);
        };
      },

      match() {
        main.hidden = true;
        let cur = null, left = step.pairs.length;
        const wrap = el('div', 'act-match'), colA = el('div', 'col'), colB = el('div', 'col');
        const order = shuffled(step.pairs.length, step.pairs[0][1]);
        step.pairs.forEach((p, i) => {
          const a = btn('act-opt', p[0], () => { cur = i; [...colA.children].forEach(c => c.classList.toggle('sel', c === a)); });
          a.dataset.a = i; colA.append(a);
        });
        order.forEach(i => {
          const b = btn('act-opt', step.pairs[i][1], () => {
            if (cur === null) { fb.className = 'act-fb'; fb.textContent = 'Primeiro toque em um item da esquerda.'; return; }
            const a = colA.querySelector(`[data-a="${cur}"]`);
            if (cur === i) {
              a.classList.remove('sel'); a.classList.add('right'); b.classList.add('right'); a.disabled = b.disabled = true;
              cur = null; fb.textContent = '';
              if (--left === 0) succeed();
            } else fail(step.hint);
          });
          b.dataset.b = i; colB.append(b);
        });
        wrap.append(colA, colB); body.append(wrap);
      },

      calc() {
        const row = el('div', 'act-calc');
        const input = el('input', 'act-num'); input.type = 'number'; input.inputMode = 'numeric'; input.placeholder = '?';
        const bump = d => { input.value = Math.max(0, (parseInt(input.value, 10) || 0) + d); };
        row.append(btn('btn', '−', () => bump(-1)), input, btn('btn', '+', () => bump(1)));
        body.append(row);
        const go = () => {
          if (input.value === '') return;
          parseInt(input.value, 10) === step.ans ? succeed() : fail(step.hint);
        };
        main.onclick = go;
        input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
      },

      tap() {
        main.hidden = true;
        let n = 0;
        const pips = el('div', 'act-pips');
        for (let i = 0; i < step.n; i++) pips.append(el('i'));
        const b = btn('btn primary act-tap', step.label, () => {
          n++; hooks.anim(step.anim || 'ok');
          pips.children[n - 1].classList.add('on');
          if (n >= step.n) succeed();
        });
        body.append(b, pips);
      },

      robot() {
        const rows = step.map, H = rows.length, W = rows[0].length;
        const find = ch => { for (let y = 0; y < H; y++) { const x = rows[y].indexOf(ch); if (x >= 0) return { x, y }; } };
        const start = find('S'), goal = find('G');
        const DIRS = { up: ['↑', 0, -1], down: ['↓', 0, 1], left: ['←', -1, 0], right: ['→', 1, 0] };
        const cmds = [];
        let running = false;
        const grid = el('div', 'act-grid'); grid.style.gridTemplateColumns = `repeat(${W}, 1fr)`;
        const cells = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const c = el('div', 'cell' + (rows[y][x] === '#' ? ' wall' : '') + (rows[y][x] === 'G' ? ' goal' : ''));
          cells.push(c); grid.append(c);
        }
        const bot = el('div', 'bot');
        const place = (x, y) => { cells[y * W + x].append(bot); };
        place(start.x, start.y);
        const prog = el('div', 'act-prog');
        const draw = () => {
          prog.replaceChildren(el('span', 'dim', `Programa (até ${step.max} comandos):`));
          cmds.forEach(c => prog.append(el('b', '', DIRS[c][0])));
          main.disabled = !cmds.length || running;
        };
        const pad = el('div', 'act-pad');
        Object.keys(DIRS).forEach(d => { const b = btn('btn', DIRS[d][0], () => { if (!running && cmds.length < step.max) { cmds.push(d); draw(); } }); b.dataset.dir = d; pad.append(b); });
        pad.append(btn('btn ghost', 'Apagar', () => { if (!running) { cmds.pop(); place(start.x, start.y); draw(); } }));
        body.append(grid, prog, pad); draw();
        main.textContent = 'Executar ▶';
        main.onclick = () => {
          if (running) return;
          running = true; draw(); fb.textContent = ''; hooks.anim('type');
          let x = start.x, y = start.y, i = 0;
          place(x, y);
          const tick = () => {
            if (i >= cmds.length) {
              running = false;
              if (x === goal.x && y === goal.y) return succeed();
              draw(); return fail('O robô parou antes da bandeira. ' + step.hint);
            }
            const [, dx, dy] = DIRS[cmds[i++]];
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H || rows[ny][nx] === '#') {
              running = false; bot.classList.add('bump'); setTimeout(() => bot.classList.remove('bump'), 400);
              draw(); return fail(`O robô bateu no ${i}º comando. ` + step.hint);
            }
            x = nx; y = ny; place(x, y);
            setTimeout(tick, 320);
          };
          setTimeout(tick, 250);
        };
      },

      design() {
        // começa sempre com algo a corrigir
        const val = step.props.map(p => Math.max(0, p.opts.findIndex((_, n) => !p.ok.includes(n))));
        const poster = el('div', 'act-poster');
        const title = el('div', 'p-title', step.text[0]), sub = el('div', 'p-sub', step.text[1]);
        poster.append(title, sub);
        const apply = () => {
          step.props.forEach((p, k) => {
            const o = p.opts[val[k]];
            if (p.type === 'cor') { const [bg, fg] = PALETTES[o]; poster.style.background = bg; poster.style.color = fg; }
            if (p.type === 'fonte') poster.style.fontFamily = FONTS[o];
            if (p.type === 'alinh') poster.style.textAlign = ['left', 'center', 'right'][val[k]];
            if (p.type === 'tam') title.style.fontSize = val[k] ? '22px' : '10px';
            if (p.type === 'esp') { poster.style.padding = val[k] ? '18px 16px' : '2px'; sub.style.marginTop = val[k] ? '12px' : '0'; }
          });
        };
        const ctrls = el('div', 'act-ctrls');
        step.props.forEach((p, k) => {
          const row = el('div', 'ctrl'); row.append(el('span', 'dim', p.name));
          const group = el('div', 'act-opts chips');
          p.opts.forEach((o, i) => {
            const b = btn('act-opt' + (val[k] === i ? ' sel' : ''), o, () => { val[k] = i; [...group.children].forEach((c, n) => c.classList.toggle('sel', n === i)); apply(); hooks.anim('draw'); });
            b.dataset.prop = k; b.dataset.i = i; group.append(b);
          });
          row.append(group); ctrls.append(row);
        });
        body.append(poster, ctrls); apply();
        main.onclick = () => (step.props.every((p, k) => p.ok.includes(val[k])) ? succeed() : fail(step.hint));
      },
    };

    KINDS[step.k]();
  }

  return { mount, stepsOf };
})();
