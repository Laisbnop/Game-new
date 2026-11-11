/* Cenários em pixel art (256x160), desenhados por código: a praça da vila e a
   casa da família (que muda conforme o contexto). */

const Scene = (() => {
  const W = 256, H = 160;
  const FEET = 121;                       // linha do chão onde os personagens pisam
  const OUT = '#241a2c';

  let ctx, bg, raf = 0, opts = {}, place = 'praca', info = {};
  const hero = { x: 96, tx: 96, flip: false, jump: 0, back: 0, onArrive: null };
  let particles = [], waters = [], smoke = null;

  function rng(seed) { return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; }
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const f = v => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0');
    return '#' + f(n >> 16) + f((n >> 8) & 255) + f(n & 255);
  };

  /* ================= peças do cenário ================= */
  let g, rand;
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };

  function grass(worn) {
    R(0, 0, W, H, '#58a83c');
    for (let i = 0; i < 26; i++) {                         // manchas mais escuras e mais claras
      const cx = rand() * W, cy = rand() * H, rx = 8 + rand() * 18, ry = 4 + rand() * 8;
      g.fillStyle = i % 3 ? '#4f9c38' : '#63b444';
      for (let y = -ry; y <= ry; y++) {
        const hw = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry)));
        g.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2, 1);
      }
    }
    for (let i = 0; i < 520; i++) R(rand() * W, rand() * H, 1, 1, rand() < 0.5 ? '#468c32' : '#78c452');
    for (let i = 0; i < 90; i++) {                         // tufos de capim
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

  /* ================= cenários ================= */
  const riverX = y => 168 + Math.round(Math.sin(y / 11) * 3);

  function river() {
    for (let y = 0; y < H; y++) {
      const x = riverX(y);
      R(x - 3, y, 32, 1, '#3c7c30'); R(x - 2, y, 30, 1, '#86764c'); R(x - 1, y, 28, 1, '#bfe4ff');
      R(x, y, 26, 1, '#3f86d8'); R(x + 5, y, 16, 1, '#3478cc');
      if (y % 5 === 0) { R(x - 1, y, 2, 1, '#3f86d8'); R(x + 25, y, 2, 1, '#3f86d8'); }
    }
    waters.push({ x: riverX, w: 26, y0: 0, y1: H });
  }

  function buildPraca() {
    grass();
    river();
    // construções ao fundo
    ground('terra', 36, 62, 10, 44); ground('terra', 216, 88, 10, 18);
    house({ x: 12, y: 10, w: 60, h: 52, roof: '#4a8a5a', windows: [[6, 8], [45, 8]], flowerBox: true, chimney: 44, door: '#3f9a72' });
    sign(54, 76, '#4a8a5a');
    house({ x: 196, y: 30, w: 52, h: 58, roof: opts.color || '#c2523a', roofRatio: 0.48, windows: [[5, 9], [38, 9]], shutters: '#7a4a2a', door: '#7a4a2a' });
    R(214, 44, 16, 11, OUT); R(215, 45, 14, 9, '#f0e6cc'); R(218, 47, 8, 5, opts.color || '#c2523a');   // placa da guilda
    smoke = { x: 59, y: 2 };
    // rua de pedra e ponte
    ground('pedra', 0, 106, W, 18);
    R(159, 103, 44, 24, OUT);
    for (let x = 160; x < 202; x++) R(x, 104, 1, 22, (x - 160) % 6 === 5 ? '#7a5028' : (x - 160) % 6 === 0 ? '#cc9858' : '#b88448');
    R(160, 104, 42, 2, '#6e4a24'); R(160, 124, 42, 2, '#6e4a24');
    [160, 180, 200].forEach(x => { R(x - 1, 100, 4, 7, OUT); R(x, 101, 2, 5, '#8a5e36'); R(x - 1, 121, 4, 7, OUT); R(x, 122, 2, 5, '#8a5e36'); });
    // praça
    well(84, 74);
    lamp(22, 104); lamp(146, 104); lamp(236, 104);
    tree(118, 46, 12); tree(142, 78, 9); tree(100, 22, 9);
    bush(8, 100); bush(78, 60, 4); bush(250, 98, 4); bush(132, 100, 4);
    barrel(74, 50); barrel(186, 76);
    fence(4, 60, 138); fence(96, 150, 138); fence(206, 250, 138);
    [16, 44, 76, 112, 138].forEach((x, i) => (i % 2 ? pine : tree)(x, 158 - (i % 2) * 2, 9));
    [214, 240].forEach(x => pine(x, 158));
    flowers(60, (x, y) => (y > 100 && y < 128) || (x > 160 && x < 204) || (x > 8 && x < 76 && y < 66) || (x > 192 && y > 26 && y < 92));
    info = { npcX: 122, spot: 96, enter: -22, exit: -22, guild: 212 };
  }

  function buildCasa() {
    const cls = opts.cls || 'media';
    if (cls === 'pobre') {
      grass(true);
      ground('terra', 0, 106, W, 18);
      // vizinhos colados
      house({ x: -22, y: 40, w: 50, h: 50, roof: '#8a8e96', flatRoof: true, wall: '#d8c4a0', timber: false, windows: [[30, 8]], door: false });
      house({ x: 222, y: 44, w: 50, h: 46, roof: '#a86a48', wall: '#b8d0c8', timber: false, windows: [[8, 7]], door: false });
      ground('terra', 119, 96, 10, 10);
      const door = house({ x: 98, y: 50, w: 52, h: 46, roof: '#9a9aa2', flatRoof: true, roofRatio: 0.46, wall: '#c8805a', brick: true, windows: [[6, 6, 9, 8]], doorX: 21, door: '#4a7a9a' });
      R(131, 44, 14, 11, OUT); R(132, 45, 12, 9, '#3f86d8'); R(132, 45, 12, 2, '#6aacf0'); R(132, 50, 12, 1, '#2a62b0');   // caixa d'água
      R(103, 94, 4, 4, '#a85a3a'); R(103, 91, 4, 3, '#2f8a40'); R(109, 95, 3, 3, '#8a8e96'); R(109, 92, 3, 3, '#58b858');     // vasos
      // horta
      R(41, 67, 46, 30, '#5a3a22');
      for (let r = 0; r < 4; r++) { R(42, 69 + r * 7, 44, 5, '#7a5230'); for (let c = 0; c < 44; c += 5) { R(43 + c, 69 + r * 7, 3, 3, r % 2 ? '#58b858' : '#2f8a40'); if (r === 1) R(44 + c, 70 + r * 7, 1, 1, '#e04a3a'); } }
      fence(38, 88, 104, '#9a7a50');
      // varal
      R(163, 66, 2, 26, '#6a4426'); R(207, 66, 2, 26, '#6a4426'); R(163, 69, 46, 1, '#d8d8d8');
      [['#e8e4d8', 168, 9], ['#3f86d0', 179, 7], ['#e0a23a', 188, 6], ['#d8507c', 196, 8]].forEach(([c, x, w]) => { R(x - 1, 69, w + 2, 11, OUT); R(x, 70, w, 9, c); R(x, 70, w, 2, shade(c, 1.15)); });
      tree(20, 34, 10); tree(180, 40, 11); tree(240, 34, 8);
      bush(158, 100, 4); bush(30, 100, 4);
      [10, 60, 110, 150, 200, 244].forEach((x, i) => (i % 3 ? tree : pine)(x, 158 - (i % 2) * 3, 9));
      flowers(30, (x, y) => (y > 100 && y < 128) || (x > 36 && x < 154 && y > 40 && y < 106) || (x > 160 && x < 212 && y > 60 && y < 96));
      info = { npcX: 132, spot: 158, enter: 262, exit: 262, door };
    } else if (cls === 'media') {
      grass();
      ground('calcada', 0, 106, W, 18);
      ground('asfalto', 0, 126, W, 26);
      for (let x = 6; x < W; x += 22) R(x, 138, 12, 2, '#e8e0a0');
      R(0, 124, W, 2, '#e0e0d8');
      ground('laje', 108, 98, 12, 8);
      const door = house({ x: 78, y: 16, w: 76, h: 82, roof: '#c2523a', roofRatio: 0.36, wall: '#f0e2c0', timber: false, chimney: 12,
        windows: [[8, 8], [34, 8], [58, 8], [8, 30], [56, 28, 13, 11]], flowerBox: true, door: '#6a4426', doorX: 30 });
      R(78, 68 + 6, 76, 1, shade('#f0e2c0', 0.8));                                                       // divisão dos andares
      fence(40, 104, 104, '#f0f0e8'); fence(124, 200, 104, '#f0f0e8');
      R(204, 92, 2, 12, '#6a6a7a'); R(200, 86, 10, 7, OUT); R(201, 87, 8, 5, '#3f86d0');                 // caixa de correio
      car(176, 128, '#b84a3a');
      tree(30, 60, 12); tree(224, 50, 11); bush(60, 98, 5); bush(170, 98, 5); bush(186, 98, 4);
      R(44, 84, 26, 8, '#5a3a22'); for (let i = 0; i < 24; i += 3) R(45 + i, 84, 2, 3, ['#ff7088', '#ffe066', '#c8a0ff'][i % 3]);
      lamp(14, 104); lamp(240, 104);
      flowers(34, (x, y) => y > 96 || (x > 72 && x < 160));
      info = { npcX: 122, spot: 150, enter: 262, exit: 262, door };
    } else {
      grass();
      ground('laje', 0, 106, W, 18);
      ground('laje', 118, 92, 20, 14);
      // piscina
      R(9, 35, 46, 30, '#e8e2d4'); R(8, 34, 48, 1, OUT); R(8, 65, 48, 1, OUT); R(8, 34, 1, 32, OUT); R(55, 34, 1, 32, OUT);
      R(13, 39, 38, 22, '#3fb0d8'); R(13, 39, 38, 3, '#2a8ab8');
      waters.push({ x: () => 14, w: 36, y0: 43, y1: 60 });
      // casa: duas alas e um bloco central mais alto
      house({ x: 66, y: 36, w: 46, h: 56, roof: '#4a5a8a', wall: '#f6f2ea', timber: false, roofRatio: 0.42, windows: [[5, 6, 9, 11], [20, 6, 9, 11]], shutters: '#4a5a8a', door: false });
      house({ x: 144, y: 36, w: 46, h: 56, roof: '#4a5a8a', wall: '#f6f2ea', timber: false, roofRatio: 0.42, windows: [[17, 6, 9, 11], [32, 6, 9, 11]], shutters: '#4a5a8a', door: false });
      const door = house({ x: 100, y: 10, w: 56, h: 82, roof: '#3a4a7a', wall: '#fbf8f2', timber: false, roofRatio: 0.34, chimney: 40,
        windows: [[6, 6, 11, 11], [39, 6, 11, 11], [22, 6, 12, 11], [5, 30, 11, 12], [40, 30, 11, 12]], door: '#5a3a2a', doorW: 14, doorX: 21 });
      R(119, 66, 2, 26, '#e8e2d4'); R(135, 66, 2, 26, '#e8e2d4'); R(116, 64, 24, 3, OUT); R(117, 65, 22, 1, '#ffd75e');   // pórtico
      R(121, 36, 14, 2, '#ffd75e');
      fountain(222, 78);
      // sebes aparadas e portão
      for (let x = 0; x < W; x += 12) if (x < 100 || x > 150) bush(x + 6, 142, 6, '#2a8046');
      R(100, 128, 3, 16, OUT); R(153, 128, 3, 16, OUT); R(99, 126, 5, 3, '#e8e2d4'); R(152, 126, 5, 3, '#e8e2d4');
      for (let x = 104; x < 153; x += 4) R(x, 131, 1, 13, '#3a3a4a');
      R(103, 131, 50, 1, '#3a3a4a'); R(126, 128, 4, 3, '#ffd75e');
      [72, 90, 166, 184].forEach(x => bush(x, 100, 4, '#2a8046'));
      lamp(60, 104); lamp(196, 104);
      tree(22, 96, 9); tree(240, 40, 11); tree(40, 22, 10); pine(8, 30); pine(206, 30);
      flowers(30, (x, y) => y > 98 || (x > 60 && x < 196) || (x < 60 && y > 30 && y < 70));
      info = { npcX: 132, spot: 160, enter: 262, exit: 262, door };
    }
  }

  function build() {
    bg = document.createElement('canvas'); bg.width = W; bg.height = H;
    g = bg.getContext('2d'); rand = rng(place === 'praca' ? 11 : 29);
    waters = []; smoke = null;
    (place === 'praca' ? buildPraca : buildCasa)();
  }

  /* ================= animação ================= */
  function frame(t) {
    raf = requestAnimationFrame(frame);
    ctx.drawImage(bg, 0, 0);

    const ph = Math.floor(t / 280);
    waters.forEach((w, k) => {                              // reflexos na água
      const span = w.y1 - w.y0;
      for (let i = 0; i < Math.ceil(span / 9); i++) {
        const y = w.y0 + (i * 17 + ph * 2 + k * 5) % span;
        if (place === 'praca' && y > 101 && y < 128) continue;
        ctx.fillStyle = i % 2 ? '#bfe4ff' : '#8cc4f8';
        ctx.fillRect(w.x(y) + 3 + (i * 11 + ph) % (w.w - 8), y, 3 + i % 2, 1);
      }
    });
    if (smoke) for (let i = 0; i < 4; i++) {                // fumaça da chaminé
      const k = ((t / 900) + i / 4) % 1;
      ctx.fillStyle = `rgba(240,240,240,${0.7 * (1 - k)})`;
      ctx.fillRect(Math.round(smoke.x + Math.sin(k * 5 + i) * 2 + k * 4), Math.round(smoke.y - k * 9 + 6), 2 + (k > 0.4), 2);
    }

    // herói
    let moving = false;
    if (opts.hero) {
      moving = Math.abs(hero.tx - hero.x) > 0.6;
      if (moving) {
        hero.flip = hero.tx < hero.x;
        hero.x += Math.sign(hero.tx - hero.x) * 0.9;
      } else {
        hero.x = hero.tx;
        if (hero.onArrive) { const f = hero.onArrive; hero.onArrive = null; f(); }
        else if (hero.back && t > hero.back) { hero.back = 0; hero.tx = info.spot; }
        else if (!hero.back) hero.flip = info.npcX < hero.x;
      }
    }
    const top = FEET - 26;
    const shadow = x => { ctx.fillStyle = 'rgba(20,30,20,.3)'; ctx.fillRect(Math.round(x) + 4, FEET - 1, 12, 3); ctx.fillRect(Math.round(x) + 6, FEET + 2, 8, 1); };
    if (opts.npc) { shadow(info.npcX); Sprites.draw(ctx, opts.npc, info.npcX, top, Math.floor(t / 900) % 2 ? 0 : 0, opts.hero ? hero.x < info.npcX : false); }
    if (opts.hero) {
      let jy = 0;
      if (hero.jump) { const p = (t - hero.jump) / 800; if (p >= 1) hero.jump = 0; else jy = -Math.abs(Math.sin(p * Math.PI * 2)) * 8 * (1 - p); }
      shadow(hero.x);
      Sprites.draw(ctx, opts.hero, hero.x, top + jy, moving ? Math.floor(t / 140) % 2 : 0, hero.flip);
    }

    particles = particles.filter(p => t < p.end);
    particles.forEach(p => {
      const k = (p.end - t) / 900;
      ctx.fillStyle = p.c;
      ctx.fillRect(Math.round(p.x + p.vx * (1 - k) * 22), Math.round(p.y - (1 - k) * p.rise), 1 + (k > 0.5), 1 + (k > 0.5));
    });
  }

  return {
    /* o: { place: 'praca'|'casa', cls, color, hero: aparência|null, npc: aparência|null } */
    start(canvas, o) {
      ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
      opts = Object.assign({}, o); place = opts.place || 'praca';
      build();
      hero.x = hero.tx = info.spot; hero.back = 0; hero.onArrive = null;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    },
    /* O herói sai andando, o cenário troca e ele entra no novo lugar. */
    travel(to, npc, done) {
      hero.back = 0; hero.tx = info.exit;
      hero.onArrive = () => {
        place = to; opts.npc = npc; build();
        hero.x = info.enter; hero.tx = info.spot;
        hero.onArrive = () => done && done();
      };
    },
    visitGuild() { if (place === 'praca') { hero.tx = info.guild; hero.back = performance.now() + 4000; } },
    celebrate() {
      const now = performance.now(); hero.jump = now;
      for (let i = 0; i < 20; i++) particles.push({ x: hero.x + 10, y: FEET - 20, vx: Math.random() * 2 - 1, rise: 14 + Math.random() * 24,
        c: ['#ffe066', '#ffffff', '#ffb36b'][i % 3], end: now + 600 + Math.random() * 500 });
    },
  };
})();
