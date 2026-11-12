/* Mundo do jogo: o mapa externo (fazenda, vila e bosque, maior que a tela) e
   os interiores (casa e Armazém). Cada mapa tem um fundo pré-desenhado, uma
   grade de colisão e pontos de interação. O que muda durante o jogo (terra,
   plantas, árvores, pedras, galinhas) é desenhado por cima a cada quadro.
   Tudo é desenhado por código, sem imagens externas. */

const World = (() => {
  const VW = 256, VH = 160;          // área visível (a câmera)
  const CELL = 8;                    // célula de colisão
  const OUT = '#241a2c';
  let W = VW, H = VH, g, rand;

  function rng(seed) { return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; }
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const f = v => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0');
    return '#' + f(n >> 16) + f((n >> 8) & 255) + f(n & 255);
  };

  /* ================= peças do cenário ================= */
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };

  function grass(worn) {
    R(0, 0, W, H, '#58a83c');
    for (let i = 0; i < 26 * (W * H) / 40960; i++) {                         // manchas mais escuras e mais claras
      const cx = rand() * W, cy = rand() * H, rx = 8 + rand() * 18, ry = 4 + rand() * 8;
      g.fillStyle = i % 3 ? '#4f9c38' : '#63b444';
      for (let y = -ry; y <= ry; y++) {
        const hw = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry)));
        g.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2, 1);
      }
    }
    for (let i = 0; i < 520 * (W * H) / 40960; i++) R(rand() * W, rand() * H, 1, 1, rand() < 0.5 ? '#468c32' : '#78c452');
    for (let i = 0; i < 90 * (W * H) / 40960; i++) {                         // tufos de capim
      const x = Math.floor(rand() * W), y = Math.floor(rand() * H);
      R(x, y, 1, 2, '#3a7e2c'); R(x + 2, y, 1, 2, '#3a7e2c'); R(x + 1, y + 1, 1, 1, '#3a7e2c');
    }
    if (worn) for (let i = 0; i < 14; i++) {               // chão batido
      const x = rand() * W, y = rand() * H;
      R(x, y, 6 + rand() * 8, 2, '#a8a060'); R(x + 1, y + 2, 4 + rand() * 6, 1, '#98924e');
    }
  }

  function flowers(n, avoid) {
    for (let i = 0; i < n; i++) {
      const x = Math.floor(rand() * (W - 4)), y = Math.floor(rand() * (H - 4));
      if (avoid(x, y)) continue;
      const c = ['#ffffff', '#ffe066', '#ff9ec0', '#c8a0ff'][Math.floor(rand() * 4)];
      R(x + 1, y, 1, 3, c); R(x, y + 1, 3, 1, c); R(x + 1, y + 1, 1, 1, '#f0a020');
      R(x + 1, y + 3, 1, 2, '#2f7028');
    }
  }

  /* Faixa de chão: 'terra', 'pedra' (calçamento), 'calcada', 'asfalto', 'laje'. */
  function ground(kind, x, y, w, h) {
    const P = {
      terra:   ['#dcc48c', '#b4945a', '#c8ac70', '#f0e0b0'],
      pedra:   ['#cdbfa4', '#8e8068', '#b4a68a', '#e6dcc6'],
      calcada: ['#c8c8c0', '#8c8c88', '#b0b0a8', '#e0e0d8'],
      asfalto: ['#5a5a66', '#3c3c46', '#4e4e5a', '#6a6a76'],
      laje:    ['#e4dcc8', '#a89c84', '#cfc6ae', '#f6f0e0'],
    }[kind];
    R(x - 1, y - 1, w + 2, h + 2, P[1]);
    R(x, y, w, h, P[0]);
    if (kind === 'terra') {
      for (let i = 0; i < w * h / 10; i++) R(x + rand() * (w - 2), y + rand() * (h - 1), 2, 1, rand() < 0.5 ? P[2] : P[3]);
      for (let i = x; i < x + w; i += 3) if (rand() < 0.4) { R(i, y - 1, 2, 1, '#58a83c'); R(i + 1, y + h, 2, 1, '#58a83c'); }
    } else if (kind === 'asfalto') {
      for (let i = 0; i < w * h / 16; i++) R(x + rand() * (w - 1), y + rand() * (h - 1), 1, 1, rand() < 0.5 ? P[2] : P[3]);
    } else {                                              // blocos assentados
      const bw = kind === 'pedra' ? 7 : 10, bh = kind === 'pedra' ? 4 : 6;
      for (let r = 0, yy = y; yy < y + h; r++, yy += bh) {
        R(x, yy + bh - 1, w, 1, P[2]);
        for (let xx = x - (r % 2) * Math.floor(bw / 2); xx < x + w; xx += bw) {
          if (xx + bw - 1 >= x && xx + bw - 1 < x + w) R(xx + bw - 1, yy, 1, Math.min(bh, y + h - yy), P[2]);
          if (rand() < 0.3 && xx >= x && xx + bw - 2 < x + w) R(xx + 1, yy + 1, bw - 3, 1, P[3]);
        }
      }
    }
  }

  function shadowOval(cx, cy, rx, ry) {
    g.fillStyle = 'rgba(20,40,20,.28)';
    for (let y = -ry; y <= ry; y++) {
      const hw = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry)));
      g.fillRect(cx - hw, cy + y, hw * 2, 1);
    }
  }
  function blob(cx, cy, r, c, squash = 1) {
    g.fillStyle = c;
    for (let y = -r; y <= r; y++) {
      const hw = Math.round(Math.sqrt(r * r - y * y));
      g.fillRect(cx - hw, Math.round(cy + y * squash), hw * 2, 1);
    }
  }

  function tree(x, y, r = 11) {            // (x, y) = base do tronco
    shadowOval(x, y, r, 3);
    R(x - 3, y - 9, 6, 9, OUT); R(x - 2, y - 9, 4, 8, '#6a4426'); R(x - 2, y - 9, 1, 8, '#8a5e36');
    const cy = y - 8 - r;
    blob(x, cy, r + 1, '#143c24'); blob(x, cy, r, '#267a3a');
    blob(x - 2, cy - 2, r - 3, '#369a48'); blob(x - 4, cy - 4, r - 6, '#58b858');
    for (let i = 0; i < r * 2; i++) {
      const a = rand() * 6.28, d = rand() * (r - 2);
      R(x + Math.cos(a) * d, cy + Math.sin(a) * d, 2, 1, a > 2.4 && a < 5.2 ? '#84d470' : '#1c5c30');
    }
  }
  function pine(x, y) {
    shadowOval(x, y, 8, 2);
    R(x - 2, y - 6, 4, 6, '#5a3a22');
    for (let layer = 0; layer < 3; layer++) {
      const top = y - 31 + layer * 8, hgt = 12, half = 5 + layer * 2;
      for (let r = 0; r < hgt; r++) {
        const wd = Math.round((r + 1) / hgt * half);
        R(x - wd - 1, top + r, wd * 2 + 2, 1, '#143c24');
        R(x - wd, top + r, wd * 2, 1, '#2a8046');
        R(x - wd, top + r, Math.max(1, Math.floor(wd / 2)), 1, '#58b860');
      }
      R(x - half - 1, top + hgt, half * 2 + 2, 1, '#143c24');
    }
  }
  function bush(x, y, r = 5, c = '#2f8a40') {
    shadowOval(x, y + 1, r + 1, 2);
    blob(x, y - r + 1, r + 1, '#143c24', 0.8); blob(x, y - r + 1, r, c, 0.8);
    blob(x - 1, y - r, r - 2, shade(c, 1.3), 0.8);
    R(x + 1, y - r + 2, 1, 1, '#ff9ec0'); R(x - 3, y - r + 1, 1, 1, '#ffe066');
  }
  function fence(x0, x1, y, c = '#b88448') {
    for (let x = x0; x <= x1; x += 6) { R(x - 1, y - 7, 4, 9, OUT); R(x, y - 6, 2, 7, c); R(x, y - 6, 1, 7, shade(c, 1.25)); }
    R(x0, y - 4, x1 - x0 + 2, 1, shade(c, 0.75)); R(x0, y - 2, x1 - x0 + 2, 1, shade(c, 0.75));
  }
  function lamp(x, y) {
    R(x - 1, y - 20, 3, 20, OUT); R(x, y - 19, 1, 19, '#6a6a7a');
    R(x - 3, y - 26, 7, 7, OUT); R(x - 2, y - 25, 5, 5, '#ffe89a'); R(x - 1, y - 24, 2, 2, '#fffbe0');
    R(x - 2, y - 1, 5, 2, OUT);
  }
  function barrel(x, y) {
    R(x - 1, y - 1, 10, 12, OUT); R(x, y, 8, 10, '#9a6a3a'); R(x + 1, y, 2, 10, '#c08a4e');
    R(x, y + 2, 8, 1, '#5a4030'); R(x, y + 7, 8, 1, '#5a4030');
  }
  function sign(x, y, c) {
    R(x + 5, y, 2, 10, '#6a4426'); R(x - 1, y - 9, 14, 10, OUT); R(x, y - 8, 12, 8, '#f0e6cc'); R(x + 3, y - 6, 6, 4, c);
  }
  function well(x, y) {
    shadowOval(x + 9, y + 12, 11, 3);
    R(x - 1, y - 1, 20, 14, OUT); R(x, y, 18, 12, '#a8a098'); R(x, y, 18, 3, '#c8c0b8');
    for (let i = 0; i < 18; i += 6) { R(x + i + 5, y + 3, 1, 9, '#807870'); R(x + i + 2, y + 7, 1, 5, '#807870'); }
    R(x + 3, y + 1, 12, 3, '#2a5a9a'); R(x + 5, y + 2, 4, 1, '#8fc8f0');
    R(x, y - 14, 2, 14, '#6a4426'); R(x + 16, y - 14, 2, 14, '#6a4426');
    R(x - 3, y - 18, 24, 5, OUT); R(x - 2, y - 17, 22, 3, '#b0502e'); R(x - 2, y - 17, 22, 1, '#d87048');
  }
  function fountain(x, y) {
    shadowOval(x, y + 9, 15, 4);
    blob(x, y, 14, OUT, 0.6); blob(x, y, 13, '#d8d2c4', 0.6); blob(x, y, 10, '#3f86d8', 0.6); blob(x - 2, y - 1, 6, '#6aacf0', 0.6);
    R(x - 2, y - 10, 4, 10, OUT); R(x - 1, y - 9, 2, 9, '#e8e2d4');
    R(x - 4, y - 12, 8, 3, OUT); R(x - 3, y - 11, 6, 1, '#bfe4ff');
  }

  /* Casa vista de cima, de frente. opts: x, y (canto de cima), w, h, cores. */
  function house(o) {
    const { x, y, w, h } = o;
    const rh = Math.round(h * (o.roofRatio || 0.5)), wy = y + rh, wh = h - rh;
    const wall = o.wall || '#ece2c8', roof = o.roof || '#c2523a';
    g.fillStyle = 'rgba(20,40,20,.25)'; g.fillRect(x + 3, y + h, w + 2, 3); g.fillRect(x + w, wy + 4, 5, wh - 2);
    // parede
    R(x - 1, wy - 1, w + 2, wh + 2, OUT); R(x, wy, w, wh, wall);
    if (o.brick) {
      for (let r = 0; r < wh; r += 3) { R(x, wy + r + 2, w, 1, shade(wall, 0.78));
        for (let c = (r / 3 % 2) * 3; c < w; c += 6) R(x + c, wy + r, 1, 2, shade(wall, 0.78)); }
    } else {
      R(x, wy + wh - 4, w, 4, shade(wall, 0.86));
      if (o.timber !== false) { const t = o.timber || '#7a5a3a'; R(x, wy, 2, wh, t); R(x + w - 2, wy, 2, wh, t); R(x, wy + Math.floor(wh / 2) - 1, w, 1, shade(wall, 0.9)); }
    }
    R(x, wy, w, 3, shade(wall, 0.72));                       // sombra do beiral
    // telhado em perspectiva: mais estreito na cumeeira
    for (let r = 0; r < rh; r++) {
      const inset = Math.round((1 - r / rh) * 4) - 3;        // de +1 a -3 → beiral avança 3px
      const x0 = x + inset, ww = w - inset * 2;
      R(x0 - 1, y + r, ww + 2, 1, OUT);
      for (let c = 0; c < ww; c++) {
        const band = Math.floor(r / 4), seam = (c + inset + band * 3) % 6 === 0, edge = r % 4 === 3;
        g.fillStyle = o.flatRoof ? (c % 4 === 0 ? shade(roof, 0.82) : roof)
          : edge ? shade(roof, 0.66) : seam ? shade(roof, 0.8) : (r % 4 === 0 ? shade(roof, 1.18) : roof);
        g.fillRect(x0 + c, y + r, 1, 1);
      }
    }
    R(x + 1, y - 1, w - 2, 1, OUT); R(x + 1, y, w - 2, 2, shade(roof, 1.3));
    R(x - 4, y + rh, w + 8, 1, OUT);
    if (o.chimney) { const cx = x + o.chimney; R(cx - 1, y - 7, 8, 12, OUT); R(cx, y - 6, 6, 10, '#a09088'); R(cx, y - 6, 6, 2, '#c8bab0'); R(cx + 4, y - 4, 2, 8, '#807068'); }
    // janelas
    (o.windows || []).forEach(([wx, wyy, ww = 9, whh = 9]) => {
      const X = x + wx, Y = wy + wyy;
      R(X - 1, Y - 1, ww + 2, whh + 2, OUT); R(X, Y, ww, whh, '#f4f0e4');
      R(X + 1, Y + 1, ww - 2, whh - 2, '#6ab4e8'); R(X + 1, Y + 1, ww - 2, 2, '#a8dcff');
      R(X + Math.floor(ww / 2), Y + 1, 1, whh - 2, '#f4f0e4'); R(X + 1, Y + Math.floor(whh / 2), ww - 2, 1, '#f4f0e4');
      if (o.flowerBox) { R(X - 1, Y + whh, ww + 2, 2, '#7a4a2a'); for (let i = 0; i < ww; i += 2) R(X + i, Y + whh - 1, 1, 1, i % 4 ? '#ff7088' : '#ffe066'); }
      if (o.shutters) { R(X - 3, Y - 1, 2, whh + 2, o.shutters); R(X + ww + 1, Y - 1, 2, whh + 2, o.shutters); }
    });
    // porta
    if (o.door !== false) {
      const dw = o.doorW || 10, dx = x + (o.doorX != null ? o.doorX : Math.floor(w / 2) - dw / 2), dh = Math.min(16, wh - 3), dy = y + h - dh;
      R(dx - 1, dy - 1, dw + 2, dh + 1, OUT); R(dx, dy, dw, dh, o.door || '#8a5a34');
      R(dx, dy, 2, dh, shade(o.door || '#8a5a34', 1.25)); R(dx + Math.floor(dw / 2), dy, 1, dh, shade(o.door || '#8a5a34', 0.75));
      R(dx + dw - 3, dy + Math.floor(dh / 2), 1, 2, '#ffd75e');
      R(dx - 2, y + h, dw + 4, 2, '#b8b0a0'); R(dx - 2, y + h + 2, dw + 4, 1, '#807868');
      return dx + dw / 2;
    }
  }

  function car(x, y, c) {
    shadowOval(x + 18, y + 14, 19, 2);
    R(x + 7, y - 1, 22, 8, OUT); R(x + 8, y, 20, 7, shade(c, 0.85));
    R(x + 10, y + 1, 7, 5, '#a8dcff'); R(x + 19, y + 1, 7, 5, '#8cc8f0');
    R(x - 1, y + 6, 38, 9, OUT); R(x, y + 7, 36, 7, c); R(x, y + 7, 36, 2, shade(c, 1.2));
    R(x + 34, y + 9, 2, 2, '#ffe89a'); R(x, y + 9, 2, 2, '#e04a3a');
    [6, 26].forEach(wx => { R(x + wx - 1, y + 11, 8, 6, OUT); R(x + wx, y + 12, 6, 4, '#3a3a44'); R(x + wx + 2, y + 13, 2, 2, '#b0b0b8'); });
  }


  function roomBase(wall, f1, f2, planks) {
    R(0, 0, W, 72, wall);
    for (let x = 0; x < W; x += 16) R(x, 0, 1, 62, shade(wall, 0.94));
    R(0, 62, W, 6, shade(wall, 0.82)); R(0, 68, W, 4, '#5a4030');
    const tw = planks ? 40 : 16, th = planks ? 8 : 12;
    for (let y = 72, r = 0; y < H; y += th, r++) for (let x = planks ? -((r % 2) * 20) : 0, c = 0; x < W; x += tw, c++) {
      R(x, y, tw, th, planks ? f1 : ((c + r) % 2 ? f1 : f2));
      if (planks) { R(x, y + th - 1, tw, 1, f2); R(x + tw - 1, y, 1, th, f2); }
    }
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 72, W, 3);
  }
  function box(x, y, w, h, c) { R(x - 1, y - 1, w + 2, h + 2, OUT); R(x, y, w, h, c); }
  function desk(x, w, top, front) {
    R(x - 1, 113, w + 2, 27, OUT); R(x, 114, w, 5, top); R(x, 114, w, 1, shade(top, 1.2));
    R(x, 119, w, 20, front); R(x, 119, w, 2, shade(front, 0.72)); R(x + 3, 125, w - 6, 1, shade(front, 0.88));
  }
  function bubble(x, y, mark, t) {
    R(x - 1, y - 1, 16, 12, OUT); R(x, y, 14, 10, '#ffffff'); R(x + 2, y + 10, 5, 1, OUT); R(x + 3, y + 10, 3, 1, '#ffffff'); R(x + 3, y + 11, 2, 1, OUT);
    if (mark === '!') { R(x + 6, y + 2, 2, 4, '#e04a3a'); R(x + 6, y + 7, 2, 1, '#e04a3a'); }
    else for (let i = 0; i <= Math.floor(t / 220) % 3; i++) R(x + 2 + i * 4, y + 4, 2, 2, OUT);
  }


  /* ================= posições fixas do mapa externo ================= */
  const FORA = { w: 1200, h: 512 };
  const GRID = { x0: 40, y0: 196, cols: 20, rows: 10, s: 16 };            // terra cultivável da fazenda
  const YARD = { x0: 142, y0: 402, x1: 256, y1: 458 };                    // onde as galinhas ciscam
  const SPOT = { feeder: [124, 414], nest: [124, 448], water: [336, 136], dummy: [196, 142], bench: [598, 206], hat: [1150, 470] };
  const NTREES = [[880, 90], [930, 70], [900, 236], [950, 276], [880, 336], [940, 388], [1000, 428], [900, 450], [1070, 96], [1130, 116], [1164, 66], [1060, 392], [1120, 440], [1172, 366]];
  const NROCKS = [[862, 206], [984, 246], [1012, 344], [872, 404], [962, 468], [1102, 350], [1152, 196], [1092, 140]];
  const FORAGE = [[916, 124], [1042, 204], [892, 296], [976, 352], [1036, 470], [1142, 404], [1186, 316], [852, 466]];

  /* ================= construção de mapas ================= */
  let cur;
  function newMap(id, w, h, seed) {
    W = w; H = h; rand = rng(seed);
    const bg = document.createElement('canvas'); bg.width = w; bg.height = h;
    g = bg.getContext('2d');
    cur = { id, w, h, bg, cols: Math.ceil(w / CELL), rows: Math.ceil(h / CELL), objs: [], sprites: [], doors: {}, spawn: { x: w / 2, y: h - 10 } };
    cur.solid = new Uint8Array(cur.cols * cur.rows);
    cur.path = new Uint8Array(cur.cols * cur.rows);
    return cur;
  }
  function mark(grid, x, y, w, h, v = 1) {
    for (let cy = Math.max(0, Math.floor(y / CELL)); cy <= Math.min(cur.rows - 1, Math.floor((y + h - 1) / CELL)); cy++)
      for (let cx = Math.max(0, Math.floor(x / CELL)); cx <= Math.min(cur.cols - 1, Math.floor((x + w - 1) / CELL)); cx++) grid[cy * cur.cols + cx] = v;
  }
  const solid = (x, y, w, h) => mark(cur.solid, x, y, w, h);
  const open = (x, y, w, h) => mark(cur.solid, x, y, w, h, 0);
  const keep = (x, y, w, h) => mark(cur.path, x, y, w, h);            // nada de vegetação aqui
  const isFree = (x, y, w, h) => {
    for (let cy = Math.floor(y / CELL); cy <= Math.floor((y + h - 1) / CELL); cy++) for (let cx = Math.floor(x / CELL); cx <= Math.floor((x + w - 1) / CELL); cx++) {
      if (cx < 0 || cy < 0 || cx >= cur.cols || cy >= cur.rows) return false;
      if (cur.solid[cy * cur.cols + cx] || cur.path[cy * cur.cols + cx]) return false;
    }
    return true;
  };
  function road(kind, x, y, w, h) { ground(kind, x, y, w, h); keep(x - 4, y - 4, w + 8, h + 8); }
  const obj = o => { cur.objs.push(Object.assign({ r: 18 }, o)); };

  /* Figura alta em canvas próprio: o personagem pode passar por trás. */
  function tallImg(drawFn, w, h, ox) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const prev = g, pr = rand; g = c.getContext('2d'); rand = rng(w * 31 + h * 7 + ox); g.translate(ox, h - 4); drawFn(0, 0); g = prev; rand = pr;
    return { img: c, ox, h };
  }
  function tall(drawFn, x, y, w, h, ox, box) {
    const s = tallImg(drawFn, w, h, ox);
    cur.sprites.push({ img: s.img, x: x - ox, y: y - h + 4, base: y });
    if (box) solid(x + box[0], y + box[1], box[2], box[3]);
  }
  const addTree = (x, y, r = 11) => tall((a, b) => tree(a, b, r), x, y, r * 2 + 8, r * 2 + 20, r + 4, [-4, -6, 8, 6]);
  const addPine = (x, y) => tall(pine, x, y, 26, 40, 13, [-4, -6, 8, 6]);
  const addLamp = (x, y) => tall(lamp, x, y, 12, 32, 6, [-2, -3, 5, 3]);

  function building(id, label, o, enter) {
    const doorX = house(o);
    solid(o.x - 3, o.y + 4, o.w + 6, o.h - 4);
    const d = { x: Math.round(doorX), y: Math.ceil((o.y + o.h) / CELL) * CELL + 7 };     // primeiro ponto livre em frente à porta
    if (enter) { cur.doors[id] = d; obj({ id: 'door:' + id, kind: 'door', to: id, x: d.x, y: d.y - 3, r: 14, label: 'Entrar: ' + label }); }
    else obj({ id: 'house:' + id, kind: 'text', x: d.x, y: d.y - 3, r: 13, label, text: 'A porta está fechada. Bater sem ser chamado não é costume por aqui.' });
    return d;
  }
  function water(cx, cy, rx, ry) {
    for (let y = -ry - 3; y <= ry + 3; y++) {
      const k = Math.sqrt(Math.max(0, 1 - (y * y) / ((ry + 3) * (ry + 3)))), hw = Math.round((rx + 3) * k);
      R(cx - hw, cy + y, hw * 2, 1, '#86764c');
      const k2 = Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))), hw2 = Math.round(rx * k2);
      if (Math.abs(y) <= ry && hw2 > 1) { R(cx - hw2, cy + y, hw2 * 2, 1, '#bfe4ff'); R(cx - hw2 + 1, cy + y, hw2 * 2 - 2, 1, '#3f86d8'); if (hw2 > 6) R(cx - hw2 + 5, cy + y, hw2 * 2 - 10, 1, '#3478cc'); }
    }
    solid(cx - rx + 2, cy - ry + 4, rx * 2 - 4, ry * 2 - 6); keep(cx - rx - 8, cy - ry - 8, rx * 2 + 16, ry * 2 + 16);
    cur.waters.push({ cx, cy, rx, ry });
  }

  function buildFora() {
    const m = newMap('fora', FORA.w, FORA.h, 11); m.waters = [];
    grass();
    // ---------- estradas ----------
    road('terra', 60, 152, 1130, 24);
    road('terra', 366, 176, 20, 198); road('terra', 176, 362, 210, 16); road('terra', 182, 378, 22, 8);
    road('pedra', 560, 110, 140, 122);
    road('terra', 450, 176, 20, 124); road('terra', 622, 232, 20, 68); road('terra', 440, 300, 392, 22);
    // ---------- fazenda ----------
    keep(GRID.x0 - 6, GRID.y0 - 6, GRID.cols * GRID.s + 12, GRID.rows * GRID.s + 12);
    R(GRID.x0 - 2, GRID.y0 - 2, GRID.cols * GRID.s + 4, GRID.rows * GRID.s + 4, '#4f9c38');
    building('casa', 'Sua casa', { x: 56, y: 60, w: 80, h: 88, roof: '#b85a3a', roofRatio: 0.42, wall: '#ece2c8', windows: [[8, 10], [62, 10]], chimney: 58, flowerBox: true, door: '#6a4426' }, true);
    water(336, 100, 40, 24);
    obj({ id: 'water', kind: 'water', x: SPOT.water[0], y: SPOT.water[1], r: 22, label: 'Lago' });
    // boneco de treino
    box(SPOT.dummy[0] - 2, SPOT.dummy[1] - 4, 4, 4, '#6a4426'); solid(SPOT.dummy[0] - 5, SPOT.dummy[1] - 6, 10, 6); keep(SPOT.dummy[0] - 14, SPOT.dummy[1] - 30, 28, 40);
    obj({ id: 'dummy', kind: 'dummy', x: SPOT.dummy[0], y: SPOT.dummy[1] + 6, r: 16, label: 'Boneco de treino' });
    // galinheiro e cercado
    house({ x: 44, y: 384, w: 60, h: 62, roof: '#b8402e', wall: '#c8744a', timber: '#f0e8d8', windows: [[6, 6, 9, 8]], door: '#f0e8d8', doorW: 12, doorX: 40 }); solid(41, 388, 66, 60);
    keep(104, 376, 176, 110);
    R(108, 390, 164, 84, '#b89858'); for (let i = 0; i < 90; i++) R(110 + rand() * 158, 392 + rand() * 80, 2, 1, rand() < 0.5 ? '#a08448' : '#d0b470');
    fence(108, 176, 392, '#c89858'); fence(208, 270, 392, '#c89858'); fence(108, 270, 478, '#c89858');
    solid(106, 384, 74, 8); solid(206, 384, 68, 8); solid(106, 470, 168, 8); solid(268, 384, 6, 94);
    for (let y = 398; y < 474; y += 8) { R(270, y, 3, 6, '#c89858'); R(270, y, 1, 6, '#e0b878'); }
    box(SPOT.feeder[0] - 9, SPOT.feeder[1] - 12, 18, 7, '#8a5e36'); R(SPOT.feeder[0] - 8, SPOT.feeder[1] - 11, 16, 3, '#5a3a22'); solid(SPOT.feeder[0] - 9, SPOT.feeder[1] - 12, 18, 7);
    box(SPOT.nest[0] - 9, SPOT.nest[1] - 12, 18, 9, '#c89858'); R(SPOT.nest[0] - 7, SPOT.nest[1] - 10, 14, 5, '#e8d070'); solid(SPOT.nest[0] - 9, SPOT.nest[1] - 12, 18, 9);
    obj({ id: 'feeder', kind: 'feeder', x: SPOT.feeder[0], y: SPOT.feeder[1], r: 16, label: 'Comedouro' });
    obj({ id: 'nest', kind: 'nest', x: SPOT.nest[0], y: SPOT.nest[1] + 2, r: 16, label: 'Ninho' });
    // cerca e porteira da fazenda
    for (let y = 40; y < 500; y += 8) if (y < 144 || y > 180) { R(404, y, 3, 6, '#b88448'); R(404, y, 1, 6, '#d8a868'); }
    solid(402, 30, 6, 116); solid(402, 182, 6, 320); keep(396, 30, 18, 470);
    box(396, 140, 6, 12, '#8a5e36'); box(396, 176, 6, 12, '#8a5e36');
    R(120, 132, 14, 10, OUT); R(121, 133, 12, 8, '#f0e6cc'); R(126, 142, 2, 8, '#6a4426'); R(123, 135, 8, 1, '#8a5e36'); R(123, 138, 6, 1, '#8a5e36');
    obj({ id: 'placa', kind: 'text', x: 127, y: 154, r: 12, label: 'Placa', text: 'SÍTIO BEIRA-RIO — cuidado por você. A vila fica para o leste, seguindo a estrada.' });
    // ---------- vila ----------
    building('loja', 'Armazém', { x: 466, y: 62, w: 88, h: 86, roof: '#c8683a', wall: '#f4e8c8', windows: [[8, 10, 16, 9], [64, 10, 16, 9]], flowerBox: true, door: '#7a4a2a', doorW: 14 }, true);
    box(502, 108, 16, 9, '#f0e6cc'); R(505, 111, 10, 3, '#c8683a');
    building('honorio', 'Casa de Seu Honório', { x: 720, y: 70, w: 70, h: 78, roof: '#6a5a4a', wall: '#e0d4bc', windows: [[6, 8], [54, 8]], chimney: 50, door: '#5a3a22' }, false);
    building('bia', 'Casa de Bia', { x: 480, y: 228, w: 70, h: 72, roof: '#4a8a5a', wall: '#f0e2c0', windows: [[6, 8], [54, 8]], flowerBox: true, door: '#c8683a' }, false);
    building('iara', 'Casa de Iara', { x: 690, y: 228, w: 70, h: 72, roof: '#8a5ad9', wall: '#f4eef8', timber: false, windows: [[6, 8], [54, 8]], shutters: '#e0a23a', door: '#3f86d0' }, false);
    fountain(630, 136); solid(616, 126, 28, 16);
    [[566, 226], [694, 226], [566, 116], [694, 116]].forEach(([x, y]) => addLamp(x, y));
    keep(SPOT.bench[0] - 18, SPOT.bench[1] - 14, 36, 22); solid(SPOT.bench[0] - 13, SPOT.bench[1] - 8, 26, 8);
    obj({ id: 'bench', kind: 'bench', x: SPOT.bench[0], y: SPOT.bench[1] + 6, r: 14, label: 'Banco da praça' });
    // ---------- bosque ----------
    building('tome', 'Cabana de Tomé', { x: 980, y: 66, w: 60, h: 76, roof: '#5a7a5a', wall: '#b89868', brick: true, windows: [[6, 8, 9, 8]], chimney: 40, door: '#5a3a22', doorX: 30 }, false);
    water(1104, 258, 62, 36);
    NTREES.forEach(([x, y]) => keep(x - 16, y - 34, 32, 44)); NROCKS.forEach(([x, y]) => keep(x - 12, y - 14, 24, 22)); FORAGE.forEach(([x, y]) => keep(x - 12, y - 14, 24, 24));
    keep(SPOT.hat[0] - 12, SPOT.hat[1] - 14, 24, 24);
    R(846, 150, 14, 10, OUT); R(847, 151, 12, 8, '#f0e6cc'); R(852, 160, 2, 8, '#6a4426'); solid(848, 162, 10, 5);
    obj({ id: 'placa2', kind: 'text', x: 853, y: 176, r: 12, label: 'Placa', text: 'BOSQUE — madeira, pedra e o que a mata oferecer. Corte com juízo: o que se tira hoje volta em alguns dias.' });
    // ---------- vegetação: bordas fechadas e enfeites ----------
    solid(0, 0, W, 26); solid(0, H - 10, W, 10); solid(0, 0, 8, H); solid(W - 8, 0, 8, H);
    for (let x = 14; x < W; x += 26) { (x % 3 ? addTree : addPine)(x, 30 + (x % 4) * 3, 10); (x % 2 ? addTree : addPine)(x + 8, H - 4 - (x % 3) * 2, 10); }
    for (let y = 60; y < H - 30; y += 34) { addPine(10, y); addTree(W - 10, y, 9); }
    let placed = 0;
    for (let i = 0; i < 900 && placed < 26; i++) {
      const x = 30 + Math.floor(rand() * (W - 60)), y = 60 + Math.floor(rand() * (H - 90));
      if (x < 410 || x > 850 || !isFree(x - 16, y - 30, 32, 40)) continue;                 // só na vila: o bosque e a fazenda têm as próprias árvores
      (rand() < 0.35 ? addPine : addTree)(x, y, 9 + Math.floor(rand() * 3)); keep(x - 16, y - 30, 32, 40); placed++;
    }
    for (let i = 0; i < 46; i++) { const x = 30 + rand() * (W - 60), y = 50 + rand() * (H - 80); if (x > 404 && isFree(x - 8, y - 10, 16, 14)) { bush(Math.round(x), Math.round(y), 4 + Math.floor(rand() * 2)); solid(x - 4, y - 4, 8, 5); } }
    flowers(520, (x, y) => !isFree(x - 2, y - 2, 6, 8));
    m.spawn = { x: m.doors.casa.x, y: m.doors.casa.y };
    return m;
  }

  /* ================= interiores ================= */
  const ST = {
    shelf(x, w) { box(x, 44, w, 46, '#8a5e36'); for (let r = 0; r < 3; r++) { R(x + 2, 48 + r * 14, w - 4, 10, '#5a3a22'); for (let i = 0; i + 6 <= w - 6; i += 7) box(x + 4 + i, 50 + r * 14, 4, 7, ['#c8483a', '#e0a23a', '#58b858', '#3f86d0', '#f0e6cc', '#8a5ad9'][(i + r * 3) % 6]); } },
    stove(x, w) { box(x, 62, w, 28, '#b8b8c4'); R(x, 62, w, 5, '#3a3a44'); box(x + 5, 56, 12, 8, '#7a7a8a'); R(x + 6, 57, 10, 2, '#c8642a'); box(x + 4, 74, w - 8, 12, '#2a2a34'); R(x + 6, 76, w - 12, 2, '#e88a3a'); },
    wardrobe(x, w) { box(x, 34, w, 56, '#8a5e36'); R(x, 34, w, 3, '#b88448'); R(x + w / 2 - 1, 38, 2, 50, '#5a3a22'); box(x + 3, 42, w / 2 - 6, 34, '#bfe4ff'); R(x + 5, 44, 3, 12, '#ffffff'); R(x + w - 6, 62, 2, 4, '#ffd75e'); R(x + w / 2 + 3, 44, w / 2 - 8, 1, '#5a3a22'); },
    crate(x, w) { for (let i = 0; i + 16 <= w; i += 17) { box(x + i, 72, 16, 18, '#b88448'); R(x + i, 80, 16, 1, '#7a5028'); R(x + i + 7, 72, 2, 18, '#7a5028'); if (i % 2 === 0) box(x + i + 1, 58, 14, 13, '#c89858'); } },
  };
  const FLOOR = {
    table(x, y, w = 30) { box(x, y - 12, w, 12, '#b88448'); R(x, y - 12, w, 3, '#d8a868'); R(x + 2, y, 3, 4, '#6a4426'); R(x + w - 5, y, 3, 4, '#6a4426'); solid(x, y - 12, w, 14); },
    rug(x, y, w, h, c) { R(x, y, w, h, shade(c, 0.7)); R(x + 2, y + 2, w - 4, h - 4, c); R(x + 5, y + 5, w - 10, h - 10, shade(c, 1.2)); },
    plant(x, y) { box(x, y - 8, 8, 8, '#b0603a'); blob(x + 4, y - 13, 6, '#143c24'); blob(x + 4, y - 13, 5, '#2f8a40'); blob(x + 2, y - 15, 2, '#58b858'); solid(x, y - 6, 8, 6); },
    bed(x, y, c) { box(x, y - 30, 22, 30, '#8a5e36'); R(x + 2, y - 28, 18, 26, c); box(x + 3, y - 28, 16, 8, '#ffffff'); R(x + 2, y - 18, 18, 2, shade(c, 0.75)); solid(x, y - 30, 22, 30); },
    chest(x, y) { box(x, y - 12, 18, 12, '#8a5e36'); R(x, y - 12, 18, 4, '#b88448'); R(x + 8, y - 8, 2, 3, '#ffd75e'); R(x, y - 7, 18, 1, '#5a3a22'); solid(x, y - 12, 18, 12); },
  };

  function buildRoom(id) {
    const m = newMap(id, VW, VH, 29);
    if (id === 'casa') {
      roomBase('#eadfc4', '#b08a5a', '#96744a', true);
      box(30, 12, 26, 20, '#f4f0e4'); R(32, 14, 22, 16, '#8fd0f0'); R(42, 14, 2, 16, '#f4f0e4');
      R(84, 22, 60, 2, '#8a5e36'); ['#c8483a', '#7a7a8a', '#e0a23a'].forEach((c, i) => box(90 + i * 18, 12, 10, 9, c));
      FLOOR.rug(96, 104, 64, 34, '#a86a48');
      ST.stove(108, 34); solid(108, 72, 34, 20);
      obj({ id: 'fogao', kind: 'text', x: 125, y: 100, label: 'Fogão a lenha', text: 'O fogão a lenha do sítio. Antigo, mas ainda esquenta a casa inteira.' });
      FLOOR.bed(12, 108, '#3f86d0'); obj({ id: 'bed', kind: 'bed', x: 23, y: 114, label: 'Dormir' });
      FLOOR.chest(44, 92); obj({ id: 'chest', kind: 'chest', x: 53, y: 98, label: 'Baú' });
      ST.wardrobe(190, 36); solid(190, 72, 36, 20); obj({ id: 'wardrobe', kind: 'wardrobe', x: 208, y: 100, label: 'Guarda-roupa e espelho' });
      FLOOR.table(170, 144, 34); FLOOR.plant(236, 150);
    } else {
      roomBase('#f8e8c8', '#c8b088', '#b09868');
      ST.shelf(10, 40); solid(10, 72, 40, 20); ST.shelf(206, 40); solid(206, 72, 40, 20);
      box(100, 14, 56, 18, '#f0e6cc'); R(108, 19, 40, 2, '#8a5e36'); R(108, 24, 28, 2, '#8a5e36');
      // balcão
      box(70, 96, 116, 14, '#b88448'); R(70, 96, 116, 4, '#d8a868'); solid(70, 92, 116, 18); solid(60, 76, 10, 34); solid(186, 76, 10, 34);
      [['#c8483a', 78], ['#58b858', 90], ['#e0a23a', 160], ['#f0e6cc', 172]].forEach(([c, x]) => box(x, 88, 8, 8, c));
      obj({ id: 'counter', kind: 'counter', x: 128, y: 118, r: 24, label: 'Balcão do Armazém' });
      ST.crate(14, 34); FLOOR.plant(232, 150);
      for (let i = 0; i < 3; i++) { box(22 + i * 14, 136, 10, 12, ['#c8a050', '#8a5e36', '#c8a050'][i]); R(22 + i * 14, 136, 10, 3, '#e8d070'); } solid(20, 136, 42, 12);
      m.keeper = [128, 90];
    }
    solid(0, 0, W, 76); solid(0, 0, 4, H); solid(W - 4, 0, 4, H); solid(0, H - 3, W, 3);
    R(112, H - 8, 32, 8, '#6a4426'); R(114, H - 6, 28, 6, '#c8a878'); R(118, H - 5, 20, 1, '#a88858');
    obj({ id: 'exit', kind: 'exit', x: 128, y: H - 8, r: 14, label: 'Sair' });
    m.spawn = { x: 128, y: H - 14 };
    return m;
  }

  const cache = {};
  function get(id) { if (!cache[id]) cache[id] = id === 'fora' ? buildFora() : buildRoom(id); return cache[id]; }
  /* A caixa dos pés (10x6, com x,y no centro da base) está livre de obstáculos fixos? */
  function free(map, x, y) {
    const x0 = x - 5, y0 = y - 6;
    if (x0 < 0 || y0 < 0 || x0 + 10 > map.w || y > map.h) return false;
    for (let cy = Math.floor(y0 / CELL); cy <= Math.floor((y - 1) / CELL); cy++) for (let cx = Math.floor(x0 / CELL); cx <= Math.floor((x0 + 9) / CELL); cx++) if (map.solid[cy * map.cols + cx]) return false;
    return true;
  }
  const camera = (map, px, py) => ({ x: Math.round(Math.max(0, Math.min(map.w - VW, px - VW / 2))), y: Math.round(Math.max(0, Math.min(map.h - VH, py - 14 - VH / 2))) });
  /* Canteiro da grade da fazenda que contém o ponto (ou -1). */
  const tileAt = (x, y) => { const c = Math.floor((x - GRID.x0) / GRID.s), r = Math.floor((y - GRID.y0) / GRID.s); return c < 0 || r < 0 || c >= GRID.cols || r >= GRID.rows ? -1 : r * GRID.cols + c; };
  const tilePos = i => ({ x: GRID.x0 + (i % GRID.cols) * GRID.s, y: GRID.y0 + Math.floor(i / GRID.cols) * GRID.s });

  /* ================= figuras que mudam com o jogo ================= */
  const figs = {};
  const fig = (key, w, h, ox, fn) => figs[key] || (figs[key] = tallImg(fn, w, h, ox));
  const FRUIT = { laranja: ['#256e34', '#3f9648', '#f08a20'], goiaba: ['#4a8a3a', '#7ab84e', '#f07a90'] };
  function fruitTree(sp, stage, fruit) {
    const [dark, mid, fr] = FRUIT[sp];
    if (stage === 0) return fig('ft0' + sp, 14, 18, 7, () => { R(-1, -8, 2, 8, '#6a4426'); box(-5, -11, 4, 3, mid); box(1, -13, 4, 3, mid); R(-3, 0, 6, 1, '#5a3a1e'); });
    if (stage === 1) return fig('ft1' + sp, 22, 30, 11, () => { shadowOval(0, 0, 7, 2); R(-2, -10, 3, 10, OUT); R(-1, -10, 1, 10, '#8a5e36'); blob(0, -15, 8, OUT); blob(0, -15, 7, dark); blob(-2, -17, 4, mid); });
    return fig('ft2' + sp + (fruit ? 'f' : ''), 34, 46, 17, () => {
      shadowOval(0, 0, 11, 3); R(-3, -12, 6, 12, OUT); R(-2, -12, 4, 11, '#6a4426'); R(-2, -12, 1, 11, '#8a5e36');
      blob(0, -24, 13, OUT); blob(0, -24, 12, dark); blob(-3, -27, 8, mid); blob(-5, -30, 4, shade(mid, 1.25));
      if (fruit) [[-7, -22], [5, -28], [6, -18], [-2, -16], [-9, -30], [1, -33]].forEach(([x, y]) => { box(x, y, 3, 3, fr); R(x, y, 1, 1, shade(fr, 1.3)); });
    });
  }
  const wildTree = () => fig('wild', 34, 50, 17, () => { shadowOval(0, 0, 11, 3); R(-3, -14, 6, 14, OUT); R(-2, -14, 4, 13, '#5a3a22'); R(-2, -14, 1, 13, '#7a5230'); blob(0, -28, 13, '#0f3020'); blob(0, -28, 12, '#1f6a34'); blob(-3, -31, 8, '#2a7e40'); blob(-5, -34, 4, '#3f9a52'); blob(5, -22, 4, '#175428'); });
  const stump = () => fig('stump', 16, 14, 8, () => { box(-5, -6, 10, 6, '#7a5230'); R(-5, -6, 10, 2, '#c8a070'); R(-3, -5, 6, 1, '#a88050'); R(-6, -1, 2, 1, '#5a3a22'); R(5, -1, 2, 1, '#5a3a22'); });
  const dummyFig = () => fig('dummy', 22, 34, 11, () => { R(-1, -22, 2, 22, '#6a4426'); box(-6, -22, 12, 12, '#d8b878'); R(-6, -22, 12, 2, '#f0d8a0'); R(-3, -18, 2, 2, OUT); R(2, -18, 2, 2, OUT); R(-9, -17, 18, 2, '#8a5e36'); blob(0, -26, 5, OUT); blob(0, -26, 4, '#e8c888'); blob(0, -16, 2, '#c8483a'); });
  const HEN = [['#f8f8f0', '#d8d8c8'], ['#c8843a', '#a06428'], ['#4a4a52', '#2e2e36'], ['#e8c878', '#c8a050']];
  function hen(ctx, x, y, kind, flip, peck, bob) {
    const [c, d] = HEN[kind % HEN.length], s = flip ? -1 : 1, hx = x + s * 4, hy = y - 9 + (peck ? 3 : 0) - bob;
    ctx.fillStyle = 'rgba(20,30,20,.25)'; ctx.fillRect(x - 5, y - 1, 10, 2);
    ctx.fillStyle = OUT; ctx.fillRect(x - 6, y - 8 - bob, 12, 8); ctx.fillRect(hx - 3, hy - 1, 6, 6);
    ctx.fillStyle = c; ctx.fillRect(x - 5, y - 7 - bob, 10, 6); ctx.fillRect(hx - 2, hy, 4, 4);
    ctx.fillStyle = d; ctx.fillRect(x - 5 - (flip ? -8 : 0), y - 7 - bob, 2, 3); ctx.fillRect(x - 3, y - 3 - bob, 6, 2);
    ctx.fillStyle = '#e04a3a'; ctx.fillRect(hx - 1, hy - 2, 2, 2);
    ctx.fillStyle = '#f0a020'; ctx.fillRect(hx + s * 2 - (flip ? 1 : 0), hy + 2, 2, 1); ctx.fillRect(x - 2, y - 1, 1, 2); ctx.fillRect(x + 1, y - 1, 1, 2);
    ctx.fillStyle = OUT; ctx.fillRect(hx + (flip ? -1 : 0), hy + 1, 1, 1);
  }

  /* Ícones 16x16 dos itens. */
  const TOOLC = { enxada: '#9a9aa8', machado: '#b0b0c0', picareta: '#8a8a98', foice: '#c8c8d8' };
  const ICON = {
    enxada() { R(7, 2, 2, 12, '#8a5e36'); box(4, 2, 8, 3, '#9a9aa8'); R(4, 5, 2, 2, '#9a9aa8'); },
    regador() { box(4, 6, 8, 7, '#6a8ab8'); R(4, 6, 8, 2, '#8aa8d0'); R(12, 7, 3, 2, '#6a8ab8'); R(14, 5, 1, 3, '#6a8ab8'); R(2, 4, 2, 6, '#4a6a98'); R(3, 3, 5, 1, '#4a6a98'); },
    machado() { R(7, 3, 2, 11, '#8a5e36'); box(8, 2, 5, 6, '#b0b0c0'); R(12, 3, 1, 4, '#e0e0ec'); },
    picareta() { R(7, 3, 2, 11, '#8a5e36'); box(3, 2, 10, 2, '#8a8a98'); R(2, 3, 2, 2, '#8a8a98'); R(12, 3, 2, 2, '#8a8a98'); },
    foice() { R(4, 8, 2, 7, '#8a5e36'); box(5, 2, 7, 2, '#c8c8d8'); R(11, 3, 2, 4, '#c8c8d8'); R(9, 6, 3, 2, '#c8c8d8'); },
    espada() { box(7, 1, 2, 10, '#d8d8e8'); R(7, 1, 1, 10, '#ffffff'); box(4, 11, 8, 2, '#c89838'); R(7, 13, 2, 3, '#6a4426'); },
    seed(c) { box(4, 4, 8, 9, '#e8dcc0'); R(4, 4, 8, 2, '#c8b890'); box(6, 7, 4, 4, c); R(5, 2, 6, 2, '#c8b890'); },
    rabanete() { blob(8, 10, 5, OUT); blob(8, 10, 4, '#e0507a'); R(7, 13, 2, 2, '#f8f0f0'); R(6, 2, 2, 5, '#3f9648'); R(9, 3, 2, 4, '#58b858'); },
    tomate() { blob(8, 9, 6, OUT); blob(8, 9, 5, '#e04a3a'); R(5, 6, 2, 2, '#f8907a'); R(6, 3, 4, 2, '#3f9648'); R(7, 2, 2, 1, '#3f9648'); },
    abobora() { blob(8, 9, 7, OUT, 0.8); blob(8, 9, 6, '#e88a20', 0.8); R(5, 6, 1, 7, '#c06a10'); R(8, 5, 1, 9, '#c06a10'); R(11, 6, 1, 7, '#c06a10'); R(7, 2, 2, 3, '#3f9648'); },
    muda(c) { box(5, 10, 6, 5, '#b0603a'); R(7, 4, 2, 6, '#6a4426'); box(3, 3, 4, 3, c); box(9, 1, 4, 3, c); },
    laranja() { blob(8, 9, 6, OUT); blob(8, 9, 5, '#f08a20'); R(5, 6, 2, 2, '#ffc070'); R(8, 2, 3, 2, '#3f9648'); },
    goiaba() { blob(8, 9, 6, OUT, 1.1); blob(8, 9, 5, '#9ac850', 1.1); blob(8, 10, 2, '#f07a90'); R(7, 2, 2, 2, '#6a4426'); },
    madeira() { box(2, 8, 12, 5, '#8a5e36'); R(2, 8, 12, 1, '#b88448'); box(4, 3, 10, 5, '#7a5230'); R(13, 4, 1, 3, '#d8b078'); R(13, 9, 1, 3, '#d8b078'); },
    pedra() { blob(8, 10, 6, OUT, 0.7); blob(8, 10, 5, '#9a9aa8', 0.7); R(5, 8, 4, 1, '#c8c8d4'); R(9, 11, 3, 1, '#6a6a78'); },
    racao() { box(4, 4, 8, 10, '#c8a050'); R(4, 4, 8, 2, '#e8d070'); R(6, 8, 4, 3, '#8a5e36'); R(6, 2, 4, 2, '#a08030'); },
    ovo() { blob(8, 9, 6, OUT, 1.15); blob(8, 9, 5, '#f8f0e0', 1.15); R(6, 5, 2, 3, '#ffffff'); },
    amora() { [[6, 6], [10, 6], [8, 9], [5, 10], [11, 10], [8, 12]].forEach(([x, y]) => { blob(x, y, 3, OUT); blob(x, y, 2, '#6a2a8a'); }); R(7, 2, 3, 2, '#3f9648'); },
    cogumelo() { box(6, 9, 4, 5, '#f0e6cc'); blob(8, 7, 6, OUT, 0.7); blob(8, 7, 5, '#c8483a', 0.7); R(5, 6, 2, 2, '#ffffff'); R(10, 5, 2, 2, '#ffffff'); },
    flor() { R(7, 8, 2, 7, '#3f9648'); [[8, 3], [5, 6], [11, 6], [8, 8]].forEach(([x, y]) => blob(x, y, 3, '#ffe066')); blob(8, 6, 2, '#f0a020'); },
    chapeu_palha() { box(4, 4, 8, 6, '#e8c860'); R(4, 8, 8, 2, '#8a5e36'); box(1, 10, 14, 2, '#e8c860'); },
    boina() { blob(8, 9, 7, OUT, 0.6); blob(8, 9, 6, '#c8483a', 0.6); R(8, 3, 2, 2, '#a83a2e'); R(4, 12, 8, 1, '#a83a2e'); },
    chapeu_pescador() { box(4, 4, 8, 6, '#8a9a6a'); R(4, 4, 8, 2, '#a4b482'); box(2, 10, 12, 2, '#6a7a4e'); },
    encomenda() { box(3, 5, 10, 9, '#c8a878'); R(7, 5, 2, 9, '#c8483a'); R(3, 9, 10, 1, '#c8483a'); },
    chapeu_tome() { box(4, 5, 8, 5, '#7a6a4a'); box(2, 10, 12, 2, '#5a4a32'); R(5, 7, 2, 1, '#3a2a1a'); },
  };
  const iconCache = {};
  /* Canvas 16x16 com o ícone do item. */
  function icon(id) {
    if (iconCache[id]) return iconCache[id];
    const c = document.createElement('canvas'); c.width = 16; c.height = 16; c.className = 'pixel';
    const prev = g; g = c.getContext('2d');
    const it = ITEMS[id];
    if (it && it.kind === 'seed') ICON.seed({ rabanete: '#e0507a', tomate: '#e04a3a', abobora: '#e88a20' }[it.crop]);
    else if (it && it.kind === 'sapling') ICON.muda(FRUIT[it.tree][1]);
    else if (ICON[id]) ICON[id]();
    g = prev;
    return (iconCache[id] = c);
  }

  function crop(ctx, x, y, kind, stage) {       // stage 0..3 (3 = madura)
    const P = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
    if (stage === 0) { P(7, 9, 2, 2, '#c8b078'); P(4, 5, 1, 1, '#c8b078'); P(11, 11, 1, 1, '#c8b078'); return; }
    if (kind === 'rabanete') {
      if (stage === 1) { P(7, 7, 2, 4, '#58b858'); P(5, 6, 2, 2, '#58b858'); P(9, 6, 2, 2, '#58b858'); }
      else { P(4, 3, 3, 6, '#3f9648'); P(9, 3, 3, 6, '#58b858'); P(7, 2, 2, 7, '#2f8a40'); if (stage === 3) { P(5, 9, 6, 4, OUT); P(6, 9, 4, 3, '#e0507a'); P(6, 9, 1, 1, '#f8a0b8'); } }
    } else if (kind === 'tomate') {
      P(7, stage === 1 ? 6 : 1, 1, stage === 1 ? 6 : 12, '#8a5e36');
      if (stage === 1) { P(5, 6, 2, 2, '#58b858'); P(8, 8, 3, 2, '#58b858'); }
      else { P(3, 3, 4, 4, '#2f8a40'); P(8, 2, 5, 4, '#3f9648'); P(4, 8, 4, 3, '#3f9648'); P(9, 7, 4, 4, '#2f8a40'); const c = stage === 3 ? '#e04a3a' : '#9ac850'; P(4, 5, 3, 3, c); P(10, 4, 3, 3, c); P(8, 9, 3, 3, c); }
    } else {
      if (stage === 1) { P(6, 8, 4, 2, '#58b858'); P(4, 7, 2, 2, '#3f9648'); P(10, 9, 2, 2, '#3f9648'); }
      else { P(1, 9, 14, 2, '#3f9648'); P(2, 6, 4, 4, '#2f8a40'); P(10, 10, 4, 4, '#2f8a40'); P(12, 5, 3, 3, '#58b858'); if (stage === 3) { P(4, 4, 9, 8, OUT); P(5, 5, 7, 6, '#e88a20'); P(7, 5, 1, 6, '#c06a10'); P(10, 5, 1, 6, '#c06a10'); P(6, 6, 1, 2, '#ffc070'); P(8, 3, 2, 2, '#3f9648'); } else { P(6, 7, 4, 4, '#9ac850'); } }
    }
  }
  function debris(ctx, x, y, k) {
    const P = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
    if (k === 'stone') { P(2, 5, 12, 9, OUT); P(3, 6, 10, 7, '#9a9aa8'); P(4, 6, 6, 2, '#c8c8d4'); P(9, 10, 4, 2, '#6a6a78'); P(5, 3, 6, 3, OUT); P(6, 4, 4, 2, '#b0b0bc'); }
    if (k === 'branch') { P(1, 9, 14, 4, OUT); P(2, 10, 12, 2, '#8a5e36'); P(2, 10, 12, 1, '#b88448'); P(9, 5, 3, 5, OUT); P(10, 6, 1, 4, '#8a5e36'); P(4, 6, 3, 4, OUT); P(5, 7, 1, 3, '#8a5e36'); P(11, 4, 3, 2, '#58b858'); }
    if (k === 'weed') { P(2, 8, 12, 6, '#2f8a40'); P(3, 5, 2, 4, '#3f9648'); P(7, 3, 2, 6, '#58b858'); P(11, 5, 2, 4, '#3f9648'); P(5, 9, 6, 4, '#3f9648'); P(1, 11, 2, 3, '#267a3a'); P(13, 11, 2, 3, '#267a3a'); P(9, 6, 1, 1, '#ffe066'); }
  }
  function rock(ctx, x, y) { const P = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); }; P(-9, -11, 18, 12, OUT); P(-8, -10, 16, 10, '#8a8a98'); P(-7, -10, 9, 3, '#c0c0cc'); P(1, -4, 6, 3, '#5e5e6c'); P(-5, -15, 9, 5, OUT); P(-4, -14, 7, 4, '#a4a4b2'); }
  function forage(ctx, x, y, id) {
    const P = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
    if (id === 'amora') { P(-6, -8, 12, 8, '#267a3a'); P(-4, -11, 8, 4, '#3f9648'); [[-4, -6], [1, -8], [3, -4], [-2, -3]].forEach(([a, b]) => P(a, b, 2, 2, '#6a2a8a')); }
    if (id === 'cogumelo') { P(-1, -4, 3, 4, '#f0e6cc'); P(-5, -9, 11, 5, OUT); P(-4, -8, 9, 3, '#c8483a'); P(-2, -8, 2, 1, '#fff'); P(2, -7, 2, 1, '#fff'); }
    if (id === 'flor') { P(0, -6, 1, 6, '#2f8a40'); P(-2, -10, 5, 5, '#ffe066'); P(-1, -9, 3, 3, '#f0a020'); P(-5, -4, 1, 4, '#2f8a40'); P(-7, -7, 4, 4, '#ffe066'); P(4, -3, 1, 3, '#2f8a40'); P(3, -6, 4, 4, '#ffe066'); }
    if (id === 'chapeu_tome') { P(-6, -4, 12, 3, OUT); P(-5, -3, 10, 2, '#5a4a32'); P(-4, -8, 8, 5, OUT); P(-3, -7, 6, 4, '#7a6a4a'); }
  }

  /* ================= desenho ================= */
  /* v: { map, cam, t, state, actors, hens, cursor, markers, tint, floats } */
  function render(ctx, v) {
    const { map, cam, t, state: S } = v;
    ctx.drawImage(map.bg, -cam.x, -cam.y);
    g = ctx;
    ctx.save(); ctx.translate(-cam.x, -cam.y);
    const seen = (x, y, pad = 34) => x > cam.x - pad && x < cam.x + VW + pad && y > cam.y - pad && y < cam.y + VH + pad + 24;
    const list = [];
    map.sprites.forEach(s => { if (seen(s.x + 16, s.base, 46)) list.push({ base: s.base, img: s.img, x: s.x, y: s.y }); });
    const put = (f, x, y) => list.push({ base: y, img: f.img, x: x - f.ox, y: y - f.h + 4 });

    if (map.id === 'fora') {
      const ph = Math.floor(t / 280);
      map.waters.forEach((w, k) => { for (let i = 0; i < 9; i++) { const y = w.cy - w.ry + 4 + (i * 7 + ph + k * 3) % (w.ry * 2 - 8), hw = w.rx * Math.sqrt(1 - ((y - w.cy) ** 2) / (w.ry * w.ry)) - 8; if (hw > 4) R(w.cx - hw + (i * 13 + ph * 2) % (hw * 2), y, 3 + i % 2, 1, i % 2 ? '#bfe4ff' : '#8cc4f8'); } });
      for (let i = 0; i < 4; i++) { const k = ((t / 900) + i / 4) % 1; ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.fillRect(Math.round(628 + Math.sin(k * 5 + i) * 5), Math.round(126 - k * 8), 2, 2); }
      // terra, plantas e entulho da fazenda
      const tiles = S.farm.tiles;
      for (const key in tiles) {
        const o = tiles[key], q = tilePos(+key); if (!seen(q.x + 8, q.y + 8)) continue;
        if (o.k === 'soil') {
          R(q.x, q.y, 16, 16, o.w ? '#4a3018' : '#8a6238'); for (let r = 3; r < 16; r += 5) R(q.x + 1, q.y + r, 14, 1, o.w ? '#38220e' : '#6e4c28');
          if (o.w) { R(q.x + 3, q.y + 6, 2, 1, '#6a8ab8'); R(q.x + 11, q.y + 12, 2, 1, '#6a8ab8'); }
          if (o.crop) crop(ctx, q.x, q.y, o.crop, o.g >= CROPS[o.crop].days ? 3 : o.g === 0 ? 0 : o.g * 2 > CROPS[o.crop].days ? 2 : 1);
        } else if (o.k === 'tree') put(fruitTree(o.sp, o.age >= TREES[o.sp].grow ? 2 : o.age * 2 >= TREES[o.sp].grow ? 1 : 0, o.fruit), q.x + 8, q.y + 13);
        else debris(ctx, q.x, q.y, o.k);
      }
      // bosque
      NTREES.forEach(([x, y], i) => { if (seen(x, y, 50)) put(S.nature.trees[i] ? stump() : wildTree(), x, y); });
      NROCKS.forEach(([x, y], i) => { if (!S.nature.rocks[i] && seen(x, y)) rock(ctx, x, y); });
      FORAGE.forEach(([x, y], i) => { if (S.nature.forage[i] && seen(x, y)) forage(ctx, x, y, S.nature.forage[i]); });
      if (S.nature.hat) forage(ctx, SPOT.hat[0], SPOT.hat[1], 'chapeu_tome');
      // galinheiro
      if (S.coop.feed) { R(SPOT.feeder[0] - 8, SPOT.feeder[1] - 11, 16, 3, '#e8d070'); for (let i = 0; i < Math.min(6, S.coop.feed); i++) R(SPOT.feeder[0] - 7 + i * 3, SPOT.feeder[1] - 12, 2, 1, '#f8e8a0'); }
      for (let i = 0; i < Math.min(3, S.coop.eggs); i++) { blob(SPOT.nest[0] - 4 + i * 4, SPOT.nest[1] - 8, 2, OUT, 1.2); blob(SPOT.nest[0] - 4 + i * 4, SPOT.nest[1] - 8, 1, '#fff8e8', 1.4); }
      // banco da praça: quebrado até a missão do Seu Honório
      const bx = SPOT.bench[0], by = SPOT.bench[1];
      if (S.world.banco) { box(bx - 13, by - 8, 26, 5, '#c89858'); R(bx - 13, by - 8, 26, 1, '#e8c888'); R(bx - 11, by - 3, 3, 4, '#6a4426'); R(bx + 8, by - 3, 3, 4, '#6a4426'); box(bx - 13, by - 14, 26, 3, '#b88448'); }
      else { box(bx - 13, by - 7, 14, 4, '#8a6a48'); R(bx - 11, by - 3, 3, 4, '#5a4030'); R(bx + 2, by - 4, 11, 3, OUT); R(bx + 3, by - 3, 9, 2, '#7a5a3a'); R(bx + 9, by - 1, 3, 2, '#5a4030'); }
      // boneco de treino
      const dk = v.dummyHit ? Math.max(0, 1 - (t - v.dummyHit) / 350) : 0, df = dummyFig();
      list.push({ base: SPOT.dummy[1], img: df.img, x: SPOT.dummy[0] - df.ox + Math.round(Math.sin(t / 30) * 3 * dk), y: SPOT.dummy[1] - df.h + 4 });
      (v.hens || []).forEach(h => list.push({ base: h.y, hen: h }));
    }
    if (v.cursor) { const c = v.cursor, b = Math.floor(t / 350) % 2; ctx.fillStyle = b ? '#ffffff' : '#ffd75e'; [[0, 0, 5, 1], [0, 0, 1, 5], [c.w - 5, 0, 5, 1], [c.w - 1, 0, 1, 5], [0, c.h - 1, 5, 1], [0, c.h - 5, 1, 5], [c.w - 5, c.h - 1, 5, 1], [c.w - 1, c.h - 5, 1, 5]].forEach(([a, e, w, h]) => ctx.fillRect(c.x + a, c.y + e, w, h)); }

    v.actors.forEach(a => list.push({ base: a.y, a }));
    list.sort((p, q) => p.base - q.base);
    list.forEach(e => {
      if (e.img) return ctx.drawImage(e.img, Math.round(e.x), Math.round(e.y));
      if (e.hen) { const h = e.hen; hen(ctx, Math.round(h.x), Math.round(h.y), h.kind, h.flip, h.peck, h.moving ? Math.floor(t / 150) % 2 : 0); if (h.heart) heart(ctx, Math.round(h.x) - 3, Math.round(h.y) - 20 - Math.floor(t / 250) % 2); return; }
      const a = e.a, ax = Math.round(a.x), ay = Math.round(a.y);
      ctx.fillStyle = 'rgba(20,30,20,.28)'; ctx.fillRect(ax - 6, ay - 2, 12, 3);
      const tk = a.tool ? Math.min(1, (t - a.tool.t0) / 280) : -1, using = tk >= 0 && tk < 1;
      if (using && a.dir === 'up') toolSwing(ctx, a, ax, ay, tk);
      Sprites.draw(ctx, a.look, ax - 10, ay - 27 + (a.hop || 0) + (using && tk > 0.4 ? 1 : 0), a.moving ? Sprites.walk(t) : (using ? 1 : 0), a.dir || 'down');
      if (using && a.dir !== 'up') toolSwing(ctx, a, ax, ay, tk);
    });
    v.actors.forEach(a => { if (a.bubble) bubble(Math.round(a.x) - 7, Math.round(a.y) - 42, a.bubble === '...' ? '' : '!', t); if (a.heart) heart(ctx, Math.round(a.x) - 3, Math.round(a.y) - 38 - Math.floor(t / 300) % 2); });
    (v.markers || []).forEach(mk => { const b = Math.floor(t / 250) % 2, x = Math.round(mk.x), y = Math.round(mk.y) - b * 2; ctx.fillStyle = OUT; ctx.fillRect(x - 4, y - 8, 9, 6); ctx.fillRect(x - 3, y - 2, 7, 2); ctx.fillRect(x - 1, y, 3, 2); ctx.fillStyle = '#ffd75e'; ctx.fillRect(x - 3, y - 7, 7, 5); ctx.fillRect(x - 2, y - 2, 5, 1); ctx.fillRect(x, y - 1, 1, 2); });
    (v.floats || []).forEach(f => { const k = (t - f.t0) / 700; if (k < 0 || k > 1) return; ctx.globalAlpha = 1 - k; ctx.drawImage(icon(f.icon), Math.round(f.x) - 8, Math.round(f.y - 24 - k * 14)); ctx.globalAlpha = 1; });
    ctx.restore();
    if (v.tint) { ctx.fillStyle = v.tint; ctx.fillRect(0, 0, VW, VH); }
  }
  /* A ferramenta descreve um arco à frente do personagem. */
  function toolSwing(ctx, a, x, y, k) {
    const d = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[a.dir] || [0, 1];
    const lift = Math.sin(k * Math.PI) * 9, reach = 4 + k * 9;
    const tx = x + d[0] * reach - 8 + (d[1] ? (k - 0.5) * 8 : 0), ty = y - 18 - lift + (d[1] > 0 ? 6 + k * 6 : d[1] < 0 ? -6 - k * 4 : k * 8);
    ctx.save();
    if (a.dir === 'left') { ctx.translate(Math.round(tx) + 16, Math.round(ty)); ctx.scale(-1, 1); ctx.drawImage(icon(a.tool.id), 0, 0); }
    else ctx.drawImage(icon(a.tool.id), Math.round(tx), Math.round(ty));
    ctx.restore();
    if (a.tool.id === 'regador' && k > 0.3) { ctx.fillStyle = '#8fd0f0'; for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(x + d[0] * 14 - 4 + i * 3), Math.round(y - 8 + d[1] * 10 + ((k * 20 + i * 5) % 8)), 1, 2); }
    if (a.tool.id === 'espada' && k > 0.2 && k < 0.8) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(Math.round(x + d[0] * 14 - 6), Math.round(y - 12 + d[1] * 12), 12, 1); ctx.fillRect(Math.round(x + d[0] * 16 - 3), Math.round(y - 15 + d[1] * 12), 6, 1); }
  }
  function heart(ctx, x, y) { ctx.fillStyle = '#e04a3a'; ctx.fillRect(x, y, 3, 3); ctx.fillRect(x + 4, y, 3, 3); ctx.fillRect(x + 1, y + 3, 5, 2); ctx.fillRect(x + 3, y + 5, 1, 1); }

  return { VW, VH, get, free, camera, render, icon, tileAt, tilePos, GRID, YARD, SPOT, NTREES, NROCKS, FORAGE };
})();
