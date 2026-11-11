/* Personagens em pixel art (20x28), montados por código a partir da aparência
   escolhida: corpo, tom de pele, tipo e cor de cabelo. Sem imagens externas.

   Ordem das camadas: cabelo de trás → corpo → cabeça → cabelo da frente →
   contorno escuro automático em volta de tudo. */

const Sprites = (() => {
  const W = 20, H = 28;
  const OUT = '#241a2c';

  /* [base, sombra, luz] */
  const SKINS = [
    { id: 's1', name: 'Muito clara',  c: ['#ffe0c4', '#e8b896', '#fff0e0'] },
    { id: 's2', name: 'Clara',        c: ['#f4c79c', '#d49c70', '#ffdcb8'] },
    { id: 's3', name: 'Morena clara', c: ['#dca272', '#b87c50', '#ecb888'] },
    { id: 's4', name: 'Morena',       c: ['#b9794f', '#955a36', '#cc8e62'] },
    { id: 's5', name: 'Escura',       c: ['#8a5636', '#6a3e24', '#9e6a48'] },
    { id: 's6', name: 'Muito escura', c: ['#5e3a26', '#452818', '#724a34'] },
  ];
  const HAIR_COLORS = [
    { id: 'preto',    name: 'Preto',           c: ['#2e2836', '#18141e', '#4a4458'] },
    { id: 'castanho', name: 'Castanho escuro', c: ['#5a3a24', '#3c2414', '#7a5438'] },
    { id: 'claro',    name: 'Castanho claro',  c: ['#9a6a3c', '#74482a', '#bc8a56'] },
    { id: 'loiro',    name: 'Loiro',           c: ['#e8c45a', '#bc9238', '#f8e08c'] },
    { id: 'ruivo',    name: 'Ruivo',           c: ['#c8562a', '#983a1c', '#e87a48'] },
    { id: 'grisalho', name: 'Grisalho',        c: ['#b8b8c8', '#8a8a9e', '#dcdce8'] },
    { id: 'azul',     name: 'Azul',            c: ['#3f7fd8', '#2a56a8', '#6aa6f0'] },
    { id: 'rosa',     name: 'Rosa',            c: ['#e870a8', '#b84a80', '#f8a0c8'] },
  ];
  const HAIRS = [
    { id: 'careca',   name: 'Careca' },
    { id: 'liso',     name: 'Longo liso' },
    { id: 'ondulado', name: 'Longo ondulado' },
    { id: 'crespo',   name: 'Crespo' },
    { id: 'cacheado', name: 'Cacheado' },
    { id: 'trancas',  name: 'Tranças' },
  ];
  /* O corpo muda só a roupa/silhueta. [cor de cima, cor de baixo] */
  const BODIES = [
    { id: 'f', name: 'Feminino',    outfit: ['#d8507c', '#3a4a8a'] },
    { id: 'm', name: 'Masculino',   outfit: ['#3f86d0', '#6a5038'] },
    { id: 'n', name: 'Não-binário', outfit: ['#3fa070', '#55556a'] },
  ];

  const byId = (list, id) => list.find(o => o.id === id) || list[0];
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const f = v => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0');
    return '#' + f(n >> 16) + f((n >> 8) & 255) + f(n & 255);
  };

  /* dir: 'down' (de frente), 'up' (de costas) ou 'side' (de perfil, olhando para a esquerda) */
  function render(look, frame, dir = 'down') {
    const grid = Array.from({ length: H }, () => Array(W).fill(null));
    const p = (x, y, c) => { if (x >= 1 && x < W - 1 && y >= 1 && y < H - 1) grid[y][x] = c; };
    const row = (y, x0, x1, c) => { for (let x = x0; x <= x1; x++) p(x, y, c); };
    const box = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) row(y, x0, x1, c); };

    const [S, Sd, Sl] = byId(SKINS, look.skin).c;
    const [Hb, Hd, Hl] = byId(HAIR_COLORS, look.hairColor).c;
    const body = look.body === 'robe' ? { id: 'robe', outfit: ['#6a3fa0', '#6a3fa0'] } : byId(BODIES, look.body);
    const [T, B] = look.outfit || body.outfit;
    const Td = shade(T, 0.75), Bd = shade(B, 0.75), SHOE = '#3a2a22';
    const hair = look.hair;
    const step = frame === 1, up = dir === 'up', side = dir === 'side';

    /* ---- cabelo de trás (fica atrás do corpo) ---- */
    if (hair === 'liso') box(4, 8, 15, 19, Hd);
    if (hair === 'ondulado') for (let y = 8; y <= 20; y++) row(y, y % 4 < 2 ? 4 : 3, y % 4 < 2 ? 15 : 16, Hd);
    if (hair === 'cacheado') box(4, 8, 15, 17, Hd);
    if (hair === 'trancas') [6, 8, 11, 13].forEach(x => { for (let y = 14; y <= 18; y++) p(x, y, y % 2 ? Hb : Hd); });

    /* ---- corpo ---- */
    row(15, 8, 11, Sd);                                   // pescoço
    const legs = (y0) => {
      const ly = step ? 24 : 25;                          // passo: perna esquerda encolhe
      box(6, y0, 8, ly, B); box(11, y0, 13, 25, B);
      p(8, ly, Bd); p(13, 25, Bd);
      row(ly + 1, 5, 8, SHOE); row(26, 11, 14, SHOE);
    };
    const arms = (sleeveEnd) => {
      const a = step ? 1 : 0;                             // braços balançam um pixel
      box(4, 16, 5, 21 - a, S); box(14, 16, 15, 20 + a, S);
      box(4, 16, 5, sleeveEnd - a, T); box(14, 16, 15, sleeveEnd - 1 + a, Td);
    };
    if (side) {                                           // perfil: tronco estreito, um braço e pernas em passada
      const long = body.id === 'f' ? 23 : body.id === 'robe' ? 25 : 21;
      box(7, 16, 12, long, T); box(12, 16, 12, long, Td);
      if (body.id === 'f') row(19, 7, 12, shade(T, 0.6));
      if (body.id === 'robe') { row(25, 6, 13, '#ffd75e'); row(26, 7, 11, SHOE); }
      else {
        const y0 = long + 1;
        if (step) { box(6, y0, 8, 24, B); box(11, y0, 13, 25, Bd); row(25, 5, 8, SHOE); row(26, 10, 13, SHOE); }
        else { box(8, y0, 11, 25, B); p(11, 25, Bd); row(26, 7, 11, SHOE); }
      }
      const ax = step ? 8 : 9;                            // braço balança
      box(ax, 16, ax + 1, 20, S); box(ax, 16, ax + 1, body.id === 'f' ? 17 : 18, Td);
    } else if (body.id === 'm') {
      box(6, 16, 13, 21, T); box(13, 16, 13, 21, Td); row(21, 6, 13, Td);
      row(16, 8, 11, shade(T, 1.2));
      row(22, 6, 13, B); legs(23); arms(18);
    } else if (body.id === 'f') {
      box(6, 16, 13, 22, T); box(13, 16, 13, 22, Td);
      row(19, 6, 13, shade(T, 0.6));                      // cinto
      row(22, 5, 14, T); row(23, 5, 14, Td);              // barra da túnica
      p(9, 16, Sd); p(10, 16, Sd);                        // gola
      legs(24); arms(17);
    } else if (body.id === 'n') {
      box(6, 16, 13, 21, T); box(13, 16, 13, 21, Td);
      box(9, 16, 10, 21, '#f0e8d0');                      // camiseta por baixo da jaqueta aberta
      p(8, 16, shade(T, 1.25)); p(11, 16, shade(T, 1.25));
      row(21, 6, 8, Td); row(21, 11, 13, Td);
      row(22, 6, 13, B); legs(23); arms(20);
    } else {                                              // manto do mestre
      box(6, 16, 13, 25, T); box(13, 16, 13, 25, Td);
      box(5, 22, 14, 25, T); box(14, 22, 14, 25, Td);
      box(9, 16, 10, 25, '#ffd75e'); row(25, 5, 14, '#ffd75e');
      row(26, 6, 8, SHOE); row(26, 11, 13, SHOE);
      arms(20);
    }

    /* ---- cabeça ---- */
    row(6, 7, 12, S); row(7, 6, 13, S); box(5, 8, 14, 12, S); row(13, 6, 13, S); row(14, 7, 12, S);
    box(14, 8, 14, 12, Sd); p(13, 13, Sd); p(12, 14, Sd);
    if (side) { p(6, 10, OUT); p(6, 11, OUT); p(6, 13, Sd); }                  // um olho, de perfil
    else if (!up) {
      p(7, 10, OUT); p(7, 11, OUT); p(12, 10, OUT); p(12, 11, OUT);          // olhos
      p(6, 12, shade(S, 0.93)); p(13, 12, shade(S, 0.93));
      p(9, 13, Sd); p(10, 13, Sd);                                           // boca
    }

    /* ---- cabelo da frente ---- */
    const cap = () => {                    // topo da cabeça, comum aos cabelos longos
      row(4, 7, 12, Hb); row(5, 6, 13, Hb); box(5, 6, 14, 8, Hb);
      p(5, 9, Hb); p(6, 9, Hb); p(13, 9, Hb); p(14, 9, Hb);
      row(4, 7, 12, Hl);
    };
    if (hair === 'careca') {
      row(7, 8, 10, Sl); p(8, 8, Sl);                     // brilho no topo
      p(4, 11, S); p(15, 11, Sd);                         // orelhas
      if (!up && !side) { p(7, 9, Sd); p(12, 9, Sd); }    // sobrancelhas
    } else if (hair === 'liso') {
      cap();
      box(4, 7, 5, 19, Hb); box(14, 7, 15, 19, Hb);       // mechas retas até o peito
      for (let y = 9; y <= 19; y++) { p(5, y, Hd); p(14, y, Hd); }
      row(6, 8, 11, Hl);                                  // faixa de brilho
      p(9, 5, Hd); p(9, 6, Hd); p(9, 7, Hd); p(9, 8, Hd); // risca ao meio
    } else if (hair === 'ondulado') {
      cap();
      for (let y = 7; y <= 20; y++) {                     // mechas em zigue-zague
        const out = y % 4 >= 2;
        row(y, out ? 3 : 4, 5, Hb); row(y, 14, out ? 16 : 15, Hb);
        p(5, y, out ? Hb : Hd); p(14, y, out ? Hb : Hd);
        if (out) { p(3, y, Hl); p(16, y, Hd); }
      }
      p(3, 21, Hb); p(4, 21, Hb); p(15, 21, Hb); p(16, 21, Hb);
      p(8, 5, Hd); p(8, 6, Hd); p(8, 7, Hd); p(7, 8, Hd);
    } else if (hair === 'crespo') {
      for (let y = 1; y <= 13; y++) for (let x = 2; x <= 17; x++) {   // volume redondo
        if (Math.hypot(x - 9.5, y - 7.6) > 7.1) continue;
        if (!up && y >= 9 && x >= 6 && x <= 13) continue; // rosto
        const tex = ((x * 37) ^ (y * 91) ^ (x * y * 13)) % 7;         // textura salpicada
        p(x, y, tex === 0 || tex === 4 ? Hd : (tex === 2 && y < 7 ? Hl : Hb));
      }
    } else if (hair === 'cacheado') {
      box(5, 5, 14, 8, Hb);
      const curl = (cx, cy) => {
        box(cx - 1, cy - 1, cx + 1, cy + 1, Hb);
        p(cx, cy - 2, Hb); p(cx - 2, cy, Hb); p(cx + 2, cy, Hb); p(cx, cy + 2, Hb);
        p(cx - 1, cy - 1, Hl); p(cx + 1, cy + 1, Hd); p(cx, cy + 1, Hd);
      };
      [[6, 5], [9, 4], [12, 4], [14, 6], [4, 8], [15, 9], [3, 11], [16, 12],
       [4, 14], [15, 15], [5, 17], [14, 18], [8, 7], [11, 7]].forEach(c => curl(c[0], c[1]));
    } else if (hair === 'trancas') {
      cap();
      for (let x = 6; x <= 13; x += 2) for (let y = 5; y <= 8; y++) p(x, y, Hd);  // divisões no couro cabeludo
      const braid = (x, y1) => {
        for (let y = 8; y <= y1; y++) p(x, y, y % 2 ? Hb : Hd);
        p(x, y1 + 1, '#ffd75e');                          // conta dourada na ponta
      };
      braid(3, 19); braid(5, 21); braid(14, 21); braid(16, 19);
    }
    if (hair !== 'careca' && up) {                        // de costas: o cabelo cobre a cabeça
      row(9, 6, 13, Hb); box(5, 9, 14, 12, Hb); row(13, 6, 13, Hb); row(14, 7, 12, Hd);
      for (let y = 9; y <= 13; y += 2) for (let x = 6 + (y % 4 ? 0 : 1); x <= 13; x += 3) p(x, y, Hd);
      if (hair === 'liso' || hair === 'ondulado') { box(5, 13, 14, 19, Hb); for (let y = 13; y <= 19; y++) { p(5, y, Hd); p(14, y, Hd); if (hair === 'ondulado' && y % 2) { p(8, y, Hd); p(11, y, Hd); } } p(9, 19, Hd); p(10, 19, Hd); }
      if (hair === 'cacheado') { box(5, 13, 14, 17, Hb); for (let y = 13; y <= 17; y += 2) for (let x = 5; x <= 14; x += 3) { p(x, y, Hl); p(x + 1, y + 1, Hd); } }
      if (hair === 'trancas') for (let x = 5; x <= 14; x += 2) { for (let y = 9; y <= 20; y++) p(x, y, y % 2 ? Hb : Hd); p(x, 21, '#ffd75e'); }
    }
    if (hair !== 'careca' && side) {                      // de perfil: rosto livre à esquerda, cabelo atrás
      for (let y = 9; y < H; y++) for (let x = 1; x <= 5; x++) if (grid[y][x] === Hb || grid[y][x] === Hd || grid[y][x] === Hl || grid[y][x] === '#ffd75e') grid[y][x] = null;
      box(5, 9, 5, 12, S);
      box(10, 9, 14, 13, Hb); p(10, 13, S); p(10, 12, S); p(12, 11, Hd); p(13, 9, Hd);
      if (hair === 'liso' || hair === 'ondulado' || hair === 'cacheado' || hair === 'trancas') for (let y = 14; y <= (hair === 'cacheado' ? 17 : 19); y++) { row(y, 12, 15, y % 2 && hair !== 'liso' ? Hd : Hb); p(15, y, Hd); }
    }
    if (look.hat === 'chef') {                            // chapéu de cozinha
      box(6, 1, 13, 5, '#f8f8f8'); row(1, 7, 12, '#ffffff'); box(13, 2, 13, 5, '#d8d8e4'); row(6, 5, 14, '#e8e8f0'); p(9, 3, '#d8d8e4'); p(9, 4, '#d8d8e4');
    }
    if (look.beard) {
      row(12, 6, 13, '#eeeef4'); row(13, 6, 13, '#eeeef4'); row(14, 7, 12, '#eeeef4');
      row(15, 8, 11, '#d8d8e4'); row(16, 9, 10, '#d8d8e4');
      p(9, 13, '#b8b8c8'); p(10, 13, '#b8b8c8');
    }

    /* ---- contorno ---- */
    const filled = grid.map(r => r.map(Boolean));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (filled[y][x]) continue;
      if ((filled[y - 1] && filled[y - 1][x]) || (filled[y + 1] && filled[y + 1][x]) || filled[y][x - 1] || filled[y][x + 1]) grid[y][x] = OUT;
    }

    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x]) { g.fillStyle = grid[y][x]; g.fillRect(x, y, 1, 1); }
    return c;
  }

  const flipped = img => {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.translate(W, 0); g.scale(-1, 1); g.drawImage(img, 0, 0);
    return c;
  };
  /* Quadros por direção: [parado, passo A, passo B]. */
  const cache = new Map();
  function frames(look) {
    const key = JSON.stringify(look);
    if (!cache.has(key)) {
      const set = dir => { const a = render(look, 0, dir), b = render(look, 1, dir); return [a, b, dir === 'side' ? a : flipped(b)]; };
      const down = set('down'), up = set('up'), left = set('side');
      cache.set(key, { down, up, left, right: left.map(flipped) });
    }
    return cache.get(key);
  }

  const WALK = [1, 0, 2, 0];
  /* Desenha com o canto superior esquerdo em (x, y). dir: 'down' | 'up' | 'left' | 'right'.
     frame: 0 = parado; ou passe walk(t) para o ciclo de caminhada. */
  function draw(ctx, look, x, y, frame = 0, dir = 'down') {
    const set = frames(look)[dir] || frames(look).down;
    ctx.drawImage(set[Math.abs(frame) % 3 | 0], Math.round(x), Math.round(y));
  }
  const walk = t => WALK[Math.floor(t / 130) % 4];

  const ORI = { body: 'robe', skin: 's3', hair: 'liso', hairColor: 'grisalho', beard: true };

  return { W, H, SKINS, HAIR_COLORS, HAIRS, BODIES, ORI, draw, frames, walk };
})();
