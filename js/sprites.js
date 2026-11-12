/* Personagens em pixel art (20x28), montados por código a partir da aparência:
   tom de pele, cabelo e cor, roupa de cima, roupa de baixo, calçado e chapéu.
   Qualquer combinação vale para qualquer gênero. Sem imagens externas.

   Camadas: cabelo de trás → corpo → cabeça → cabelo da frente → chapéu →
   contorno escuro automático. Três vistas: de frente, de costas e de perfil. */

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
  /* back = até onde o cabelo desce nas costas (linha do sprite); 0 = não desce. */
  const HAIRS = [
    { id: 'careca',        name: 'Careca',          back: 0 },
    { id: 'curtoLiso',     name: 'Curto liso',      back: 0 },
    { id: 'curtoOndulado', name: 'Curto ondulado',  back: 0 },
    { id: 'curtoCacheado', name: 'Curto cacheado',  back: 0 },
    { id: 'crespoCurto',   name: 'Crespo curto',    back: 0 },
    { id: 'crespo',        name: 'Crespo volumoso', back: 0 },
    { id: 'medio',         name: 'Médio',           back: 15 },
    { id: 'longoLiso',     name: 'Longo liso',      back: 19 },
    { id: 'longoOndulado', name: 'Longo ondulado',  back: 20 },
    { id: 'longoCacheado', name: 'Longo cacheado',  back: 17 },
    { id: 'trancas',       name: 'Tranças',         back: 20 },
    { id: 'rabo',          name: 'Rabo de cavalo',  back: 0 },
    { id: 'coque',         name: 'Coque',           back: 0 },
  ];
  const GENDERS = [{ id: 'f', name: 'Feminino' }, { id: 'm', name: 'Masculino' }, { id: 'n', name: 'Não-binário' }];
  const TOPS = [{ id: 'camiseta', name: 'Camiseta' }, { id: 'camisa', name: 'Camisa' }, { id: 'blusa', name: 'Blusa' }, { id: 'jardineira', name: 'Jardineira' }];
  const BOTTOMS = [{ id: 'calca', name: 'Calça' }, { id: 'short', name: 'Short' }, { id: 'saia', name: 'Saia' }];
  const CLOTH_COLORS = ['#d8507c', '#e04a3a', '#e0a23a', '#f2d24a', '#3fa070', '#5a7a5a', '#3f86d0', '#3a4a8a', '#8a5ad9', '#f4f4f4', '#3a3a4a', '#6a5038', '#c8683a', '#f08fb0'];
  const SHOE_COLORS = ['#3a2a22', '#8a5e36', '#f4f4f4', '#c8483a', '#3a4a8a', '#2a2a34'];
  const HATS = [{ id: 'palha', name: 'Chapéu de palha' }, { id: 'boina', name: 'Boina' }, { id: 'pescador', name: 'Chapéu de pescador' }];

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
    const robe = look.top === 'manto';
    const T = look.topColor || '#3f86d0', B = look.bottomColor || '#6a5038', SHOE = look.shoeColor || '#3a2a22';
    const Td = shade(T, 0.75), Bd = shade(B, 0.75), CREAM = '#f0e8d0';
    const hair = byId(HAIRS, look.hair), hid = hair.id, bottom = look.bottom || 'calca', top = look.top || 'camiseta';
    const step = frame === 1, up = dir === 'up', side = dir === 'side';
    const sleeve = { camiseta: 2, camisa: 4, blusa: 1, jardineira: 2, manto: 5 }[top] || 2;      // linhas de manga
    const sleeveColor = top === 'jardineira' ? CREAM : T;

    /* ---- cabelo de trás (fica atrás do corpo) ---- */
    if (!up && !side) {
      if (hid === 'longoLiso') box(4, 8, 15, 19, Hd);
      if (hid === 'longoOndulado') for (let y = 8; y <= 20; y++) row(y, y % 4 < 2 ? 4 : 3, y % 4 < 2 ? 15 : 16, Hd);
      if (hid === 'longoCacheado') box(4, 8, 15, 17, Hd);
      if (hid === 'medio') box(4, 8, 15, 15, Hd);
      if (hid === 'trancas') [6, 8, 11, 13].forEach(x => { for (let y = 14; y <= 18; y++) p(x, y, y % 2 ? Hb : Hd); });
    }

    /* ---- corpo ---- */
    row(15, 8, 11, Sd);                                   // pescoço
    if (side) {                                           // perfil: tronco estreito, um braço e pernas em passada
      box(7, 16, 12, robe ? 25 : 21, top === 'jardineira' ? CREAM : T); box(12, 16, 12, 21, top === 'jardineira' ? shade(CREAM, 0.85) : Td);
      if (top === 'jardineira') { box(7, 18, 9, 21, T); p(8, 16, T); p(8, 17, T); }
      if (top === 'camisa') { p(7, 16, shade(T, 1.3)); box(7, 17, 7, 21, shade(T, 1.2)); }
      if (robe) { row(25, 6, 13, '#ffd75e'); row(26, 7, 11, SHOE); }
      else {
        const leg = (x0, x1, yEnd, c) => { if (bottom === 'calca') box(x0, 22, x1, yEnd, c); else { box(x0, 22, x1, 23, c); box(x0, 24, x1, yEnd, S); } };
        if (step) { leg(6, 8, 24, B); leg(11, 13, 25, Bd); row(25, 5, 8, SHOE); row(26, 10, 13, SHOE); }
        else { leg(8, 11, 25, B); row(26, 7, 11, SHOE); }
        if (bottom === 'saia') { row(21, 6, 13, B); row(22, 5, 14, B); row(23, 5, 14, Bd); }
      }
      const ax = step ? 8 : 9;                            // braço balança
      box(ax, 16, ax + 1, 20, S); box(ax, 16, ax + 1, 15 + sleeve, shade(sleeveColor, 0.8));
    } else {
      // tronco
      box(6, 16, 13, 21, top === 'jardineira' ? CREAM : T); box(13, 16, 13, 21, top === 'jardineira' ? shade(CREAM, 0.85) : Td);
      if (top === 'camiseta') row(16, 8, 11, shade(T, 1.2));
      if (top === 'camisa') { box(9, 16, 10, 21, shade(T, 1.25)); p(8, 16, '#ffffff'); p(11, 16, '#ffffff'); p(9, 18, Td); p(9, 20, Td); }
      if (top === 'blusa') { row(16, 8, 11, S); p(9, 17, S); p(10, 17, S); row(21, 6, 13, shade(T, 1.2)); }
      if (top === 'jardineira') { box(7, 18, 12, 21, T); box(7, 16, 7, 17, T); box(12, 16, 12, 17, T); p(7, 18, '#ffd75e'); p(12, 18, '#ffd75e'); }
      if (up && top === 'jardineira') { box(7, 16, 12, 21, CREAM); box(7, 19, 12, 21, T); p(8, 16, T); p(8, 17, T); p(8, 18, T); p(11, 16, T); p(11, 17, T); p(11, 18, T); }
      if (up && (top === 'camisa' || top === 'blusa' || top === 'camiseta')) box(6, 16, 12, 21, T);
      // braços
      const a = step ? 1 : 0;
      box(4, 16, 5, 21 - a, S); box(14, 16, 15, 20 + a, S);
      box(4, 16, 5, Math.min(21 - a, 15 + sleeve), sleeveColor); box(14, 16, 15, Math.min(20 + a, 15 + sleeve), shade(sleeveColor, 0.8));
      // parte de baixo
      if (robe) { box(6, 16, 13, 25, T); box(13, 16, 13, 25, Td); box(5, 22, 14, 25, T); box(9, 16, 10, 25, '#ffd75e'); row(25, 5, 14, '#ffd75e'); row(26, 6, 8, SHOE); row(26, 11, 13, SHOE); box(4, 16, 5, 20, T); box(14, 16, 15, 20, Td); }
      else {
        const ly = step ? 24 : 25;
        const leg = (x0, x1, yEnd, sh) => { if (bottom === 'calca') { box(x0, 23, x1, yEnd, B); p(x1, yEnd, Bd); } else if (bottom === 'short') { box(x0, 23, x1, 23, B); box(x0, 24, x1, yEnd, S); } else box(x0, 24, x1, yEnd, S); };
        if (bottom !== 'saia') row(22, 6, 13, B);
        leg(6, 8, ly); leg(11, 13, 25);
        if (bottom === 'saia') { row(21, 6, 13, B); row(22, 5, 14, B); row(23, 5, 14, Bd); p(9, 22, Bd); }
        row(ly + 1, 5, 8, SHOE); row(26, 11, 14, SHOE);
      }
    }

    /* ---- cabeça ---- */
    row(6, 7, 12, S); row(7, 6, 13, S); box(5, 8, 14, 12, S); row(13, 6, 13, S); row(14, 7, 12, S);
    box(14, 8, 14, 12, Sd); p(13, 13, Sd); p(12, 14, Sd);
    if (side) { p(6, 10, OUT); p(6, 11, OUT); p(6, 13, Sd); }
    else if (!up) {
      p(7, 10, OUT); p(7, 11, OUT); p(12, 10, OUT); p(12, 11, OUT);
      p(6, 12, shade(S, 0.93)); p(13, 12, shade(S, 0.93)); p(9, 13, Sd); p(10, 13, Sd);
    }

    /* ---- cabelo da frente ---- */
    const cap = () => {                    // topo da cabeça
      row(4, 7, 12, Hb); row(5, 6, 13, Hb); box(5, 6, 14, 8, Hb);
      p(5, 9, Hb); p(6, 9, Hb); p(13, 9, Hb); p(14, 9, Hb); row(4, 7, 12, Hl);
    };
    const curl = (cx, cy) => {
      box(cx - 1, cy - 1, cx + 1, cy + 1, Hb); p(cx, cy - 2, Hb); p(cx - 2, cy, Hb); p(cx + 2, cy, Hb); p(cx, cy + 2, Hb);
      p(cx - 1, cy - 1, Hl); p(cx + 1, cy + 1, Hd); p(cx, cy + 1, Hd);
    };
    const afro = (r, cy, y0) => {
      for (let y = y0; y <= 13; y++) for (let x = 2; x <= 17; x++) {
        if (Math.hypot(x - 9.5, y - cy) > r) continue;
        if (!up && y >= 9 && x >= 6 && x <= 13) continue;
        const tex = ((x * 37) ^ (y * 91) ^ (x * y * 13)) % 7;
        p(x, y, tex === 0 || tex === 4 ? Hd : (tex === 2 && y < 7 ? Hl : Hb));
      }
    };
    if (hid === 'careca') {
      row(7, 8, 10, Sl); p(8, 8, Sl); p(4, 11, S); p(15, 11, Sd);
      if (!up && !side) { p(7, 9, Sd); p(12, 9, Sd); }
    } else if (hid === 'curtoLiso') {
      cap(); p(4, 7, Hb); p(4, 8, Hb); p(15, 7, Hb); p(15, 8, Hb); p(5, 10, Hb); p(14, 10, Hb); row(6, 8, 11, Hl); p(11, 8, Hd); p(12, 8, Hd);
    } else if (hid === 'curtoOndulado') {
      cap(); [5, 7, 9].forEach(y => { p(4, y, Hb); p(15, y, Hb); }); p(5, 10, Hb); p(14, 10, Hb); p(4, 6, Hl);
      [7, 10, 13].forEach(x => { p(x, 3, Hb); p(x, 6, Hd); }); p(8, 8, Hd); p(11, 8, Hd);
    } else if (hid === 'curtoCacheado') {
      box(5, 5, 14, 8, Hb); [[6, 5], [9, 4], [12, 4], [14, 6], [4, 8], [15, 8], [8, 7], [11, 7]].forEach(c => curl(c[0], c[1]));
    } else if (hid === 'crespoCurto') afro(5.9, 8.6, 3);
    else if (hid === 'crespo') afro(7.1, 7.6, 1);
    else if (hid === 'medio') {
      cap(); box(4, 7, 5, 14, Hb); box(14, 7, 15, 14, Hb); for (let y = 9; y <= 14; y++) { p(5, y, Hd); p(14, y, Hd); }
      p(4, 15, Hb); p(15, 15, Hb); row(6, 8, 11, Hl); p(10, 5, Hd); p(10, 6, Hd); p(10, 7, Hd);
    } else if (hid === 'longoLiso') {
      cap(); box(4, 7, 5, 19, Hb); box(14, 7, 15, 19, Hb); for (let y = 9; y <= 19; y++) { p(5, y, Hd); p(14, y, Hd); }
      row(6, 8, 11, Hl); p(9, 5, Hd); p(9, 6, Hd); p(9, 7, Hd); p(9, 8, Hd);
    } else if (hid === 'longoOndulado') {
      cap();
      for (let y = 7; y <= 20; y++) { const out = y % 4 >= 2; row(y, out ? 3 : 4, 5, Hb); row(y, 14, out ? 16 : 15, Hb); p(5, y, out ? Hb : Hd); p(14, y, out ? Hb : Hd); if (out) { p(3, y, Hl); p(16, y, Hd); } }
      p(3, 21, Hb); p(4, 21, Hb); p(15, 21, Hb); p(16, 21, Hb); p(8, 5, Hd); p(8, 6, Hd); p(8, 7, Hd); p(7, 8, Hd);
    } else if (hid === 'longoCacheado') {
      box(5, 5, 14, 8, Hb);
      [[6, 5], [9, 4], [12, 4], [14, 6], [4, 8], [15, 9], [3, 11], [16, 12], [4, 14], [15, 15], [5, 17], [14, 18], [8, 7], [11, 7]].forEach(c => curl(c[0], c[1]));
    } else if (hid === 'trancas') {
      cap(); for (let x = 6; x <= 13; x += 2) for (let y = 5; y <= 8; y++) p(x, y, Hd);
      const braid = (x, y1) => { for (let y = 8; y <= y1; y++) p(x, y, y % 2 ? Hb : Hd); p(x, y1 + 1, '#ffd75e'); };
      braid(3, 19); braid(5, 21); braid(14, 21); braid(16, 19);
    } else if (hid === 'rabo') {
      cap(); p(4, 7, Hb); p(15, 7, Hb); row(6, 8, 11, Hl);
      if (!up && !side) { box(15, 8, 16, 14, Hb); p(16, 15, Hb); p(15, 8, '#e04a3a'); for (let y = 10; y <= 14; y += 2) p(16, y, Hd); }
    } else if (hid === 'coque') {
      cap(); p(4, 7, Hb); p(15, 7, Hb); box(8, 1, 11, 3, Hb); row(1, 9, 10, Hl); p(11, 3, Hd); p(8, 3, Hd);
    }

    if (hid !== 'careca' && up) {                         // de costas: o cabelo cobre a cabeça
      row(9, 6, 13, Hb); box(5, 9, 14, 12, Hb); row(13, 6, 13, Hb); row(14, 7, 12, Hd);
      for (let y = 9; y <= 13; y += 2) for (let x = 6 + (y % 4 ? 0 : 1); x <= 13; x += 3) p(x, y, Hd);
      const fall = hair.back;
      if (hid === 'trancas') for (let x = 5; x <= 14; x += 2) { for (let y = 9; y <= 20; y++) p(x, y, y % 2 ? Hb : Hd); p(x, 21, '#ffd75e'); }
      else if (hid === 'longoCacheado') { box(5, 13, 14, 17, Hb); for (let y = 13; y <= 17; y += 2) for (let x = 5; x <= 14; x += 3) { p(x, y, Hl); p(x + 1, y + 1, Hd); } }
      else if (fall) { box(5, 13, 14, fall, Hb); for (let y = 13; y <= fall; y++) { p(5, y, Hd); p(14, y, Hd); if (hid === 'longoOndulado' && y % 2) { p(8, y, Hd); p(11, y, Hd); } } p(9, fall, Hd); p(10, fall, Hd); }
      if (hid === 'rabo') { box(9, 11, 10, 19, Hb); p(10, 13, Hd); p(10, 16, Hd); row(11, 9, 10, '#e04a3a'); p(9, 20, Hb); }
      if (hid === 'coque') { box(8, 6, 11, 8, Hd); row(6, 9, 10, Hl); }
    }
    if (hid !== 'careca' && side) {                       // de perfil: rosto livre à esquerda, cabelo atrás
      for (let y = 9; y < H; y++) for (let x = 1; x <= 5; x++) if (grid[y][x] === Hb || grid[y][x] === Hd || grid[y][x] === Hl || grid[y][x] === '#ffd75e') grid[y][x] = null;
      box(5, 9, 5, 12, S);
      box(10, 9, 14, 13, Hb); p(10, 13, S); p(10, 12, S); p(12, 11, Hd); p(13, 9, Hd);
      if (hair.back) for (let y = 14; y <= Math.min(hair.back, 19); y++) { row(y, 12, 15, y % 2 && hid !== 'longoLiso' && hid !== 'medio' ? Hd : Hb); p(15, y, Hd); }
      if (hid === 'rabo') { box(15, 9, 16, 15, Hb); p(16, 16, Hb); p(15, 9, '#e04a3a'); p(16, 12, Hd); }
      if (hid === 'coque') { for (let x = 8; x <= 11; x++) for (let y = 1; y <= 3; y++) grid[y][x] = null; box(12, 3, 15, 6, Hb); p(15, 6, Hd); p(13, 3, Hl); }
    }

    /* ---- chapéu ---- */
    if (look.hat === 'palha') {
      box(6, 2, 13, 5, '#e8c860'); row(2, 7, 12, '#f4dc88'); row(5, 6, 13, '#8a5e36'); row(6, 3, 16, '#e8c860');
      if (up) row(7, 4, 15, '#c8a040'); else if (side) { row(6, 2, 15, '#e8c860'); row(7, 10, 15, '#c8a040'); } else { row(7, 4, 5, '#c8a040'); row(7, 14, 15, '#c8a040'); }
    } else if (look.hat === 'boina') {
      box(5, 3, 14, 6, '#c8483a'); row(2, 7, 13, '#c8483a'); row(2, 8, 11, '#e06a5a'); p(15, 4, '#c8483a'); p(15, 5, '#c8483a'); p(16, 5, '#a83a2e'); p(10, 1, '#a83a2e'); row(6, 5, 14, '#a83a2e');
    } else if (look.hat === 'pescador') {
      box(5, 2, 14, 6, '#8a9a6a'); row(2, 6, 13, '#a4b482'); row(6, 5, 14, '#6a7a4e'); row(7, 3, 16, '#8a9a6a'); p(3, 8, '#6a7a4e'); p(16, 8, '#6a7a4e');
    } else if (look.hat === 'chef') {
      box(6, 1, 13, 5, '#f8f8f8'); row(1, 7, 12, '#ffffff'); box(13, 2, 13, 5, '#d8d8e4'); row(6, 5, 14, '#e8e8f0');
    }
    if (look.beard) {
      row(12, 6, 13, '#eeeef4'); row(13, 6, 13, '#eeeef4'); row(14, 7, 12, '#eeeef4'); row(15, 8, 11, '#d8d8e4'); row(16, 9, 10, '#d8d8e4'); p(9, 13, '#b8b8c8'); p(10, 13, '#b8b8c8');
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
      if (cache.size > 80) cache.delete(cache.keys().next().value);
    }
    return cache.get(key);
  }

  const WALK = [1, 0, 2, 0];
  /* Desenha com o canto superior esquerdo em (x, y). dir: 'down' | 'up' | 'left' | 'right'. */
  function draw(ctx, look, x, y, frame = 0, dir = 'down') {
    const set = frames(look)[dir] || frames(look).down;
    ctx.drawImage(set[Math.abs(frame) % 3 | 0], Math.round(x), Math.round(y));
  }
  const walk = t => WALK[Math.floor(t / 130) % 4];
  /* Pequeno canvas com o personagem parado, para painéis. */
  function canvas(look, dir = 'down', frame = 0) {
    const c = document.createElement('canvas'); c.className = 'pixel'; c.width = W; c.height = H;
    draw(c.getContext('2d'), look, 0, 0, frame, dir);
    return c;
  }

  return { W, H, SKINS, HAIR_COLORS, HAIRS, GENDERS, TOPS, BOTTOMS, CLOTH_COLORS, SHOE_COLORS, HATS, draw, frames, walk, canvas };
})();
