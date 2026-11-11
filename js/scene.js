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

  /* ================= salas das atividades ================= */
  const ROOM = { hero: 150, npc: 32 };
  let anim = { name: null, start: 0 }, prop = null, counter = 0;

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
  const on = (a, name) => a === name;

  const ROOMS = {
    chef: {
      bg() {
        roomBase('#f2e8d2', '#e0d4bc', '#c8b8a0');
        R(0, 40, W, 22, '#e6eef0'); for (let x = 0; x < W; x += 8) R(x, 40, 1, 22, '#c8d4d8'); R(0, 50, W, 1, '#c8d4d8');
        R(14, 26, 76, 3, '#8a5e36'); R(14, 29, 76, 1, OUT);
        ['#c8483a', '#7a7a8a', '#e0a23a', '#3f86d0'].forEach((c, i) => { box(20 + i * 18, 16, 11, 9, c); R(20 + i * 18, 16, 11, 2, shade(c, 1.3)); });
        box(106, 8, 44, 30, '#f4f0e4'); R(108, 10, 40, 26, '#8fd0f0'); R(108, 10, 40, 6, '#b8e4ff'); R(127, 10, 2, 26, '#f4f0e4'); R(114, 20, 10, 3, '#ffffff');
        box(200, 14, 46, 54, '#b8b8c4'); R(200, 14, 46, 6, '#d8d8e0'); box(207, 34, 32, 24, '#2a2a34'); R(209, 36, 28, 3, '#4a4a58');
        [206, 216, 226, 236].forEach(x => R(x, 24, 4, 4, '#3a3a44'));
        R(204, 62, 38, 2, '#8a8a98');
      },
      fg(t, a, k) {
        desk(30, 70, '#c89858', '#f0ece4'); desk(120, 100, '#c89858', '#f0ece4');
        box(54, 106, 16, 8, '#d8d8e8'); R(56, 106, 12, 2, '#f4d878');
        const p = prop || 'stir';
        if (p === 'bake' || on(a, 'bake')) {
          g.fillStyle = `rgba(255,150,40,${on(a, 'bake') ? 0.55 + 0.3 * Math.sin(k / 120) : 0.35})`; g.fillRect(207, 34, 32, 24);
          R(213, 48, 20, 4, '#c8843a'); R(213, 46, 20, 2, '#e8b86a');
          box(176, 107, 22, 6, '#a8a8b8');
        } else if (p === 'chop') {
          box(170, 108, 32, 5, '#d8b078');
          const cut = Math.min(counter, 5);
          R(176 + cut * 2, 105, 16 - cut * 2, 3, '#f08030'); R(192, 105, 3, 3, '#58b858');
          for (let i = 0; i < cut; i++) R(172, 106 - i, 3, 1, '#f8a050');
          const ky = on(a, 'chop') ? 95 + Math.abs(Math.sin(k / 90)) * 8 : 95;
          R(178 + cut * 2, ky, 2, 9, '#e8e8f0'); R(177 + cut * 2, ky - 4, 4, 4, '#5a3a22');
          if (on(a, 'chop')) for (let i = 0; i < 3; i++) R(170 + i * 4 + (k / 40 % 6), 100 - (k / 30 % 8) + i * 2, 1, 1, '#f08030');
        } else if (p === 'mix') {
          box(172, 102, 26, 11, '#e8e4f4'); R(174, 102, 22, 3, '#f4d878'); R(172, 110, 26, 3, '#c8c4d8');
          const wx = 185 + (on(a, 'mix') ? Math.round(Math.cos(k / 90) * 6) : 4), wy = on(a, 'mix') ? Math.round(Math.sin(k / 90) * 2) : 0;
          R(wx, 88 + wy, 1, 13, '#a8a8b8'); R(wx - 1, 99 + wy, 3, 4, '#e0e0ec');
          if (on(a, 'mix')) { R(176 + (k / 50 % 18), 101, 2, 1, '#fff8c8'); R(192 - (k / 70 % 16), 103, 2, 1, '#e8c050'); }
        } else if (p === 'plate') {
          blob(186, 111, 13, OUT, 0.32); blob(186, 111, 12, '#ffffff', 0.3); blob(186, 110, 7, '#e8c878', 0.4); R(182, 108, 4, 2, '#c8483a'); R(188, 109, 4, 2, '#58b858');
          if (on(a, 'plate')) for (let i = 0; i < 5; i++) { const s = (k / 160 + i) % 5; R(174 + i * 6, 100 - s * 3, 1 + (s < 2), 1 + (s < 2), '#ffe066'); }
        } else if (p === 'pick') {
          const n = on(a, 'pick') ? Math.min(5, 1 + Math.floor(k / 240)) : 5;
          ['#f4f4f4', '#e8c050', '#c8483a', '#58b858', '#f08030'].slice(0, n).forEach((c, i) => { box(172 + i * 8, 108, 6, 5, c); R(172 + i * 8, 108, 6, 1, shade(c, 1.2)); });
        } else {                                          // panela no fogo
          R(172, 112, 28, 2, '#3a3a44');
          box(175, 100, 22, 12, '#7a7a8a'); R(176, 100, 20, 2, '#b0b0c0'); R(177, 101, 18, 2, '#c8642a'); R(172, 103, 3, 3, OUT); R(197, 103, 3, 3, OUT);
          const sx = 186 + (on(a, 'stir') ? Math.round(Math.sin(k / 110) * 7) : 5);
          R(sx, 89, 2, 12, '#b88448'); R(sx - 1, 87, 4, 3, '#d8a868');
          for (let i = 0; i < 3; i++) { const s = ((t / 500) + i / 3) % 1; g.fillStyle = `rgba(255,255,255,${(on(a, 'stir') ? 0.8 : 0.4) * (1 - s)})`; g.fillRect(Math.round(180 + i * 5 + Math.sin(s * 6 + i) * 2), Math.round(98 - s * 14), 2, 2); }
        }
      },
    },
    dev: {
      bg() {
        roomBase('#c4d0e2', '#8e98ac', '#7e889c');
        box(92, 8, 112, 50, '#101828'); R(144, 59, 8, 4, '#3a3a4a');
        box(22, 14, 40, 30, '#f0e6cc'); R(27, 20, 18, 3, '#3f86d0'); R(27, 26, 28, 3, '#e0a23a'); R(27, 32, 12, 3, '#58b858');
        box(216, 14, 28, 50, '#3a3a4a'); for (let i = 0; i < 6; i++) { R(220, 19 + i * 7, 20, 4, '#2a2a34'); R(222, 20 + i * 7, 2, 2, i % 2 ? '#58d878' : '#ffd75e'); }
      },
      fg(t, a, k) {
        desk(30, 70, '#a88858', '#6a7488'); desk(120, 100, '#a88858', '#6a7488');
        box(50, 101, 22, 13, '#9a9aaa'); R(59, 106, 4, 3, '#d8d8e8');
        box(172, 101, 24, 13, '#9a9aaa'); R(182, 106, 4, 3, on(a, 'type') && Math.floor(k / 120) % 2 ? '#6ad0f0' : '#d8d8e8');
        const lines = Math.min(6, 2 + counter);
        const line = (i, w) => R(98 + (i % 3) * 6, 13 + i * 6, w, 2, ['#6ad0a0', '#6aa6f0', '#f0c060'][i % 3]);
        for (let i = 0; i < lines; i++) line(i, 22 + (i * 37) % 56);
        if (on(a, 'type') && lines < 7) { line(lines, Math.min(22 + (lines * 37) % 56, k / 12)); if (Math.floor(k / 150) % 2) R(100 + (lines % 3) * 6 + Math.min(22 + (lines * 37) % 56, k / 12), 12 + lines * 6, 2, 4, '#ffffff'); }
        if (on(a, 'bug')) { if (Math.floor(k / 180) % 2) R(96, 18, 100, 4, 'rgba(224,74,58,.75)'); R(190, 44, 4, 8, '#e04a3a'); R(190, 54, 4, 2, '#e04a3a'); }
        if (on(a, 'run') || prop === 'run') {
          const w = on(a, 'run') ? Math.min(96, k / 12) : 96;
          R(98, 51, 96, 4, '#283048'); R(98, 51, w, 4, '#58d878');
          if (w >= 96) { R(184, 42, 2, 2, '#58d878'); R(186, 44, 2, 2, '#58d878'); R(188, 42, 2, 2, '#58d878'); R(190, 40, 2, 2, '#58d878'); R(192, 38, 2, 2, '#58d878'); }
        }
      },
    },
    design: {
      bg() {
        roomBase('#f2e6ee', '#c8a878', '#a88858', true);
        box(96, 6, 104, 54, '#fbfbf6');
        ['#e04a3a', '#f2c53d', '#3fa070', '#3f86d0', '#8a5ad9'].forEach((c, i) => box(20 + i * 12, 18, 9, 9, c));
        R(18, 30, 62, 2, '#8a5e36');
        box(224, 50, 16, 14, '#b0603a'); blob(232, 44, 9, '#143c24'); blob(232, 44, 8, '#2f8a40'); blob(229, 41, 4, '#58b858');
      },
      fg(t, a, k) {
        desk(30, 70, '#d8b078', '#e8dcd0'); desk(120, 100, '#d8b078', '#e8dcd0');
        box(52, 108, 18, 6, '#3a3a4a'); R(54, 109, 14, 3, '#f8a0c8');
        box(172, 107, 24, 7, '#3a3a4a'); R(174, 108, 20, 4, '#8fd0f0'); box(202, 104, 6, 10, '#e0a23a'); R(203, 99, 1, 5, '#e04a3a'); R(206, 100, 1, 4, '#3f86d0');
        const shapes = [[104, 13, 44, 9, '#3f86d0'], [158, 14, 32, 20, '#f8a0c8'], [104, 27, 46, 3, '#8a8a9a'], [104, 33, 34, 3, '#8a8a9a'], [104, 42, 22, 9, '#e0a23a'], [132, 42, 58, 9, '#3fa070']];
        const n = Math.min(shapes.length, 1 + counter);
        shapes.slice(0, n).forEach((s, i) => {
          const grow = i === n - 1 && on(a, 'draw') ? Math.min(1, k / 500) : 1;
          R(s[0], s[1], Math.max(1, Math.round(s[2] * grow)), s[3], s[4]);
          if (grow < 1) R(s[0] + Math.round(s[2] * grow), s[1] - 2, 2, s[3] + 4, OUT);
        });
      },
    },
    saude: {
      bg() {
        roomBase('#e2f0ee', '#d4e0dc', '#c0d0cc');
        box(22, 10, 44, 48, '#ffffff'); blob(39, 26, 6, '#e04a3a'); blob(49, 26, 6, '#e04a3a');
        for (let i = 0; i < 9; i++) R(35 + i, 29 + i, 19 - i * 2, 1, '#e04a3a');
        R(28, 44, 32, 2, '#a8b8c0'); R(28, 49, 24, 2, '#a8b8c0');
        box(204, 14, 40, 50, '#f4f4f4'); R(220, 24, 8, 22, '#3fae6a'); R(213, 31, 22, 8, '#3fae6a'); R(204, 52, 40, 1, '#c0c8cc');
        box(106, 20, 34, 24, '#f4f0e4'); R(108, 22, 30, 20, '#8fd0f0'); R(122, 22, 2, 20, '#f4f0e4');
      },
      fg(t, a, k) {
        desk(30, 70, '#b8c8d0', '#f4f4f4'); desk(120, 100, '#8cc4e8', '#f4f4f4');
        box(52, 106, 14, 8, '#ffffff'); R(57, 108, 4, 4, '#e04a3a');
        blob(180, 108, 6, OUT); blob(180, 108, 5, '#e8c8a8'); box(187, 104, 28, 9, '#f0dcc8'); box(192, 99, 16, 4, '#e8c8a8');
        const n = Math.min(4, counter);
        for (let i = 0; i < n; i++) R(193 + i * 4, 99, 2, 4, '#ffffff');
        if (on(a, 'care')) {
          R(193 + (n % 4) * 4, 99, 2, Math.min(4, Math.ceil(k / 150)), '#ffffff');
          const s = Math.floor(k / 200) % 2;
          R(198 - s, 86 - s, 3 + s, 3 + s, '#e04a3a'); R(203, 86 - s, 3 + s, 3 + s, '#e04a3a'); R(199 - s, 89, 6 + s * 2, 2, '#e04a3a'); R(201, 91, 3, 2, '#e04a3a');
        }
      },
    },
    prof: {
      extras: [{ look: { body: 'f', skin: 's2', hair: 'liso', hairColor: 'ruivo', outfit: ['#e0a23a', '#3a4a8a'] }, x: 96, y: 128 },
               { look: { body: 'm', skin: 's5', hair: 'crespo', hairColor: 'preto', outfit: ['#3fa0a0', '#55556a'] }, x: 200, y: 128 }],
      bg() {
        roomBase('#f0e8d4', '#b88a58', '#9a7044', true);
        box(60, 6, 140, 52, '#8a5e36'); R(64, 10, 132, 44, '#2f5a44'); R(64, 10, 132, 2, '#254a38'); R(64, 56, 132, 2, '#d8c8a8'); R(180, 54, 8, 2, '#ffffff');
        blob(228, 26, 10, OUT); blob(228, 26, 9, '#ffffff'); R(228, 20, 1, 7, OUT); R(228, 26, 5, 1, OUT);
        box(20, 18, 26, 30, '#f0e6cc'); R(24, 24, 18, 2, '#c8483a'); R(24, 30, 14, 2, '#3f86d0'); R(24, 36, 16, 2, '#58b858');
      },
      fg(t, a, k) {
        desk(30, 70, '#b88448', '#8a5e36'); desk(120, 100, '#b88448', '#8a5e36');
        box(50, 108, 14, 6, '#c8483a'); box(66, 106, 6, 8, '#3f86d0');
        const n = Math.min(6, counter * 2);
        const line = (i, w) => R(70, 16 + i * 6, w, 1, '#f4f4f4');
        for (let i = 0; i < n; i++) line(i, 26 + (i * 29) % 44);
        if (on(a, 'write') && n < 6) line(n, Math.min(26 + (n * 29) % 44, k / 14));
        if (counter > 0) {                                  // "pizza" das frações
          for (let d = 0; d < 40; d++) { const an = d / 40 * 6.283; R(170 + Math.cos(an) * 11, 32 + Math.sin(an) * 11, 1, 1, '#f4f4f4'); }
          R(170, 21, 1, 22, '#f4f4f4'); if (counter > 1) R(159, 32, 22, 1, '#f4f4f4');
        }
        box(172, 107, 18, 7, '#ffffff');
        const pl = on(a, 'plan') ? Math.min(3, Math.ceil(k / 300)) : (prop === 'plan' ? 3 : 0);
        for (let i = 0; i < pl; i++) R(174, 108 + i * 2, 14 - i * 3, 1, '#3a4a8a');
        R(88, 148, 36, 12, OUT); R(89, 149, 34, 11, '#c89858'); R(192, 148, 36, 12, OUT); R(193, 149, 34, 11, '#c89858');
        if (on(a, 'write') || on(a, 'talk')) { bubble(102, 116, '!', t); }
      },
    },
    empre: {
      extras: [{ look: { body: 'm', skin: 's4', hair: 'cacheado', hairColor: 'castanho', outfit: ['#e0a23a', '#3a4a6a'] }, x: 226, y: 82 }],
      bg() {
        roomBase('#f8e8c8', '#c8b088', '#b09868');
        for (let x = 0; x < W; x += 16) { R(x, 0, 16, 18, (x / 16) % 2 ? '#d8483a' : '#f8f4ec'); blob(x + 8, 18, 8, (x / 16) % 2 ? '#d8483a' : '#f8f4ec', 0.5); }
        R(0, 0, W, 2, '#8a2a22');
        R(14, 44, 96, 3, '#8a5e36'); R(150, 44, 96, 3, '#8a5e36');
        ['#c8483a', '#e0a23a', '#58b858', '#3f86d0', '#8a5ad9', '#f0e6cc'].forEach((c, i) => { box(20 + i * 15, 34, 9, 10, c); R(20 + i * 15, 34, 9, 2, shade(c, 1.3)); });
        ['#f0e6cc', '#58b858', '#e0a23a', '#c8483a', '#3f86d0'].forEach((c, i) => box(156 + i * 17, 36, 12, 8, c));
        box(112, 30, 30, 14, '#f0e6cc'); R(116, 34, 22, 2, '#8a5e36'); R(116, 38, 14, 2, '#8a5e36');
      },
      fg(t, a, k) {
        desk(30, 70, '#b88448', '#8a5e36'); desk(112, 132, '#b88448', '#8a5e36');
        box(52, 107, 16, 7, '#f0e6cc');
        ['#c8483a', '#e0a23a', '#58b858'].forEach((c, i) => { box(176 + i * 10, 106, 7, 8, c); R(176 + i * 10, 106, 7, 2, shade(c, 1.3)); });
        const stacks = Math.min(5, counter);
        for (let i = 0; i < stacks; i++) { const h = 3 + i * 2; R(121 + i * 6, 113 - h, 5, h + 1, OUT); R(122 + i * 6, 114 - h, 3, h, '#ffd75e'); for (let j = 1; j < h; j += 2) R(122 + i * 6, 114 - h + j, 3, 1, '#c89828'); }
        if (on(a, 'sell')) { bubble(228, 66, '', t); const cx = 226 - Math.min(1, k / 900) * 62; blob(Math.round(cx), 104 - Math.round(Math.sin(Math.min(1, k / 900) * 3.14) * 12), 3, OUT); blob(Math.round(cx), 104 - Math.round(Math.sin(Math.min(1, k / 900) * 3.14) * 12), 2, '#ffd75e'); }
      },
    },
  };

  function buildRoom() {
    ROOMS[opts.room].bg();
    info = { npcX: ROOM.npc, spot: ROOM.hero, enter: ROOM.hero, exit: ROOM.hero };
  }

  function roomFrame(t) {
    const room = ROOMS[opts.room], top = FEET - 39;      // mais alto: a bancada cobre só as pernas
    const k = Math.max(0, t - anim.start), a = anim.name && k < 1500 ? anim.name : null;
    g = ctx;
    const shadow = () => {};
    shadow(ROOM.npc); Sprites.draw(ctx, opts.npc, ROOM.npc, top, a === 'talk' ? Math.floor(k / 200) % 2 : 0, false);
    (room.extras || []).filter(e => e.y < 110).forEach(e => Sprites.draw(ctx, e.look, e.x, e.y, 0, true));
    let jy = 0, jx = 0;
    if (hero.jump) { const p = (t - hero.jump) / 800; if (p >= 1) hero.jump = 0; else jy = -Math.abs(Math.sin(p * Math.PI * 2)) * 8 * (1 - p); }
    if (a === 'err') jx = Math.round(Math.sin(k / 40) * 2 * Math.max(0, 1 - k / 500));
    const working = a && !['talk', 'err', 'ok'].includes(a);
    shadow(ROOM.hero);
    Sprites.draw(ctx, opts.hero, ROOM.hero + jx, top + jy + (working && Math.floor(k / 170) % 2 ? 1 : 0), working ? Math.floor(k / 170) % 2 : 0, false);
    room.fg(t, a, k);
    (room.extras || []).filter(e => e.y >= 110).forEach(e => { Sprites.draw(ctx, e.look, e.x, e.y, 0, false); });
    if (opts.room === 'prof') { R(88, 148, 36, 12, OUT); R(89, 149, 34, 11, '#c89858'); R(192, 148, 36, 12, OUT); R(193, 149, 34, 11, '#c89858'); }

    // animações que servem a qualquer sala
    if (a === 'talk') bubble(ROOM.npc + 4, top - 14, '', t);
    if (a === 'err') bubble(ROOM.hero + 4, top - 14, '!', t);
    if (a === 'wash') for (let i = 0; i < 7; i++) { const s = (k / 500 + i / 7) % 1; blob(Math.round(ROOM.hero + 10 + Math.cos(i * 2.4 + k / 300) * 10), Math.round(106 - s * 16), 2, '#ffffff'); blob(Math.round(ROOM.hero + 10 + Math.cos(i * 2.4 + k / 300) * 10), Math.round(106 - s * 16), 1, '#b8e4ff'); }
    if (a === 'idea') { const b = Math.floor(k / 160) % 2; box(ROOM.hero + 6, top - 14, 8, 8, b ? '#fff8a0' : '#ffe866'); R(ROOM.hero + 8, top - 5, 4, 2, '#8a8a9a'); if (b) { R(ROOM.hero + 2, top - 11, 2, 1, '#ffe866'); R(ROOM.hero + 16, top - 11, 2, 1, '#ffe866'); R(ROOM.hero + 9, top - 18, 2, 2, '#ffe866'); } }
    if (a === 'count' && opts.room !== 'empre') for (let i = 0; i < 3; i++) { const h = Math.min(3 + i * 2, Math.floor(k / 120)); if (h > 0) { R(175 + i * 7, 113 - h, 5, h + 1, OUT); R(176 + i * 7, 114 - h, 3, h, '#ffd75e'); } }
    if (a === 'study') { box(172, 105, 24, 9, '#ffffff'); R(184, 105, 1, 9, '#a8a8b8'); const pg = Math.floor(k / 250) % 3; for (let i = 0; i <= pg; i++) { R(174, 107 + i * 2, 8, 1, '#3a4a8a'); R(187, 107 + i * 2, 7, 1, '#3a4a8a'); } }

    particles = particles.filter(p => t < p.end);
    particles.forEach(p => { const q = (p.end - t) / 900; ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x + p.vx * (1 - q) * 22), Math.round(p.y - (1 - q) * p.rise), 1 + (q > 0.5), 1 + (q > 0.5)); });
  }

  function build() {
    bg = document.createElement('canvas'); bg.width = W; bg.height = H;
    g = bg.getContext('2d'); rand = rng(place === 'praca' ? 11 : 29);
    waters = []; smoke = null;
    (place === 'room' ? buildRoom : place === 'praca' ? buildPraca : buildCasa)();
  }

  /* ================= animação ================= */
  function frame(t) {
    raf = requestAnimationFrame(frame);
    ctx.drawImage(bg, 0, 0);
    if (place === 'room') return roomFrame(t);

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
    /* o: { place: 'praca'|'casa'|'room', room, cls, color, hero: aparência|null, npc: aparência|null } */
    start(canvas, o) {
      ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
      opts = Object.assign({}, o); place = opts.place || 'praca';
      build();
      hero.x = hero.tx = info.spot; hero.back = 0; hero.onArrive = null;
      hero.jump = 0; anim = { name: null, start: 0 }; prop = null; counter = 0; particles = [];
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
    /* Toca uma animação na sala da atividade (mexer, cortar, digitar...). */
    play(name) {
      if (place !== 'room') return;
      if (name === 'ok') return this.celebrate();
      anim = { name, start: performance.now() };
      if (!['talk', 'err', 'wash', 'idea', 'count', 'study'].includes(name)) { if (prop === name) counter++; else { prop = name; counter = 1; } }
    },
    visitGuild() { if (place === 'praca') { hero.tx = info.guild; hero.back = performance.now() + 4000; } },
    celebrate() {
      const now = performance.now(); hero.jump = now;
      for (let i = 0; i < 20; i++) particles.push({ x: hero.x + 10, y: FEET - 20, vx: Math.random() * 2 - 1, rise: 14 + Math.random() * 24,
        c: ['#ffe066', '#ffffff', '#ffb36b'][i % 3], end: now + 600 + Math.random() * 500 });
    },
  };
})();
