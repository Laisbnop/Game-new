/* Mundo do jogo: a vila (maior que a tela) e os interiores das construções.
   Cada mapa tem um fundo pré-desenhado, uma grade de colisão, objetos com os
   quais se interage e figuras altas (árvores) ordenadas por profundidade.
   Tudo é desenhado por código, sem imagens externas. */

const World = (() => {
  const VW = 256, VH = 160;          // área visível (a câmera)
  const CELL = 8;                    // tamanho da célula de colisão
  const OUT = '#241a2c';
  let W = VW, H = VH, g, rand;       // mapa em construção

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


  /* ================= construção de mapas ================= */
  let cur;                            // mapa em construção
  function newMap(id, w, h, seed) {
    W = w; H = h; rand = rng(seed);
    const bg = document.createElement('canvas'); bg.width = w; bg.height = h;
    g = bg.getContext('2d');
    cur = { id, w, h, bg, cols: Math.ceil(w / CELL), rows: Math.ceil(h / CELL), objs: [], sprites: [], npcs: [], doors: {}, spawn: { x: w / 2, y: h - 10 } };
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
  const isFree = (x, y, w, h) => {
    for (let cy = Math.floor(y / CELL); cy <= Math.floor((y + h - 1) / CELL); cy++) for (let cx = Math.floor(x / CELL); cx <= Math.floor((x + w - 1) / CELL); cx++) {
      if (cx < 0 || cy < 0 || cx >= cur.cols || cy >= cur.rows) return false;
      if (cur.solid[cy * cur.cols + cx] || cur.path[cy * cur.cols + cx]) return false;
    }
    return true;
  };
  function road(kind, x, y, w, h) { ground(kind, x, y, w, h); mark(cur.path, x - 4, y - 4, w + 8, h + 8); }
  const obj = o => { cur.objs.push(Object.assign({ r: 18 }, o)); };

  /* Figura alta desenhada em um canvas próprio, para o personagem poder passar por trás. */
  function tall(drawFn, x, y, w, h, ox, solidBox) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const keep = g; g = c.getContext('2d'); g.translate(ox - x, h - 4 - y); drawFn(x, y); g = keep;
    cur.sprites.push({ img: c, x: x - ox, y: y - h + 4, base: y });
    if (solidBox) solid(x + solidBox[0], y + solidBox[1], solidBox[2], solidBox[3]);
  }
  const addTree = (x, y, r = 11) => tall((a, b) => tree(a, b, r), x, y, r * 2 + 8, r * 2 + 20, r + 4, [-4, -6, 8, 6]);
  const addPine = (x, y) => tall(pine, x, y, 26, 40, 13, [-4, -6, 8, 6]);
  const addLamp = (x, y) => tall(lamp, x, y, 12, 32, 6, [-2, -3, 5, 3]);

  /* Construção com porta. Devolve a posição da porta. */
  function building(id, name, o, enter = true) {
    const doorX = house(o);
    solid(o.x - 3, o.y + 4, o.w + 6, o.h - 4);
    const d = { x: Math.round(doorX), y: o.y + o.h + 9 };
    if (enter) { cur.doors[id] = d; obj({ id: 'door:' + id, kind: 'door', to: id, x: d.x, y: d.y - 3, r: 14, label: 'Entrar: ' + name }); }
    else obj({ id: 'house:' + id, kind: 'text', x: d.x, y: d.y - 3, r: 14, label: name, text: 'A porta está fechada. Não há ninguém em casa agora.' });
    return d;
  }
  function placard(x, y, c, glyph) {            // plaquinha acima da porta
    box(x - 8, y, 16, 11, '#f0e6cc'); R(x - 6, y + 2, 12, 7, c);
    g.fillStyle = '#ffffff'; glyph.forEach(([a, b, w, h]) => g.fillRect(x - 6 + a, y + 2 + b, w, h));
  }

  /* ================= a vila ================= */
  const VILA = { w: 1024, h: 608 };
  const riverX = y => 800 + Math.round(Math.sin(y / 14) * 3);
  const PLOTS = Array.from({ length: 18 }, (_, i) => ({ x: 876 + (i % 6) * 20, y: 424 + Math.floor(i / 6) * 22 }));
  const HERBS = [[858, 128], [968, 168], [992, 296], [862, 296], [760, 300], [430, 150], [972, 60], [744, 160]].map(([x, y]) => ({ x, y }));
  const BOARD = { x: 536, y: 262 }, GALLERY = { x: 420, y: 262 };
  const HOME = {
    pobre: { x: 92, y: 140, w: 56, h: 52, roof: '#9a9aa2', flatRoof: true, roofRatio: 0.46, wall: '#c8805a', brick: true, windows: [[6, 6, 9, 8]], doorX: 23, door: '#4a7a9a' },
    media: { x: 76, y: 104, w: 88, h: 88, roof: '#c2523a', roofRatio: 0.36, wall: '#f0e2c0', timber: false, chimney: 12, windows: [[8, 8], [38, 8], [68, 8], [8, 32], [66, 32]], flowerBox: true, door: '#6a4426', doorX: 39 },
    rico:  { x: 44, y: 84, w: 152, h: 108, roof: '#3a4a7a', roofRatio: 0.34, wall: '#fbf8f2', timber: false, chimney: 110, windows: [[10, 8, 11, 11], [34, 8, 11, 11], [70, 8, 12, 11], [106, 8, 11, 11], [130, 8, 11, 11], [10, 36, 11, 12], [34, 36, 11, 12], [106, 36, 11, 12], [130, 36, 11, 12]], shutters: '#4a5a8a', door: '#5a3a2a', doorW: 14, doorX: 69 },
  };

  function buildVila(cls) {
    const m = newMap('vila', VILA.w, VILA.h, 11);
    grass();
    // rio e ponte
    for (let y = 0; y < H; y++) {
      const x = riverX(y);
      R(x - 3, y, 34, 1, '#3c7c30'); R(x - 2, y, 32, 1, '#86764c'); R(x - 1, y, 30, 1, '#bfe4ff');
      R(x, y, 28, 1, '#3f86d8'); R(x + 6, y, 16, 1, '#3478cc');
    }
    solid(794, 0, 44, H); mark(cur.path, 786, 0, 60, H);
    // ruas
    road('terra', 24, 192, 768, 26); road('terra', 24, 512, 768, 26);
    road('terra', 24, 192, 22, 346); road('terra', 748, 192, 22, 346);
    road('terra', 906, 232, 22, 104); road('terra', 922, 368, 22, 40);
    road('pedra', 0, 336, 1024, 32);
    road('pedra', 408, 228, 192, 108); road('terra', 486, 218, 22, 12); road('terra', 486, 368, 22, 144);
    // ponte
    R(788, 331, 50, 42, OUT);
    for (let x = 789; x < 837; x++) R(x, 332, 1, 40, (x - 789) % 6 === 5 ? '#7a5028' : (x - 789) % 6 === 0 ? '#cc9858' : '#b88448');
    R(789, 332, 48, 2, '#6e4a24'); R(789, 370, 48, 2, '#6e4a24');
    open(786, 338, 56, 30);

    // casa do jogador (muda conforme a família)
    const hs = HOME[cls] || HOME.media;
    if (cls === 'pobre') {
      R(41, 151, 46, 36, '#5a3a22'); for (let r = 0; r < 4; r++) { R(42, 153 + r * 8, 44, 6, '#7a5230'); for (let c = 0; c < 44; c += 5) R(43 + c, 153 + r * 8, 3, 3, r % 2 ? '#58b858' : '#2f8a40'); }
      solid(40, 150, 48, 38);
      R(156, 150, 2, 30, '#6a4426'); R(194, 150, 2, 30, '#6a4426'); R(156, 153, 40, 1, '#d8d8d8');
      [['#e8e4d8', 160, 9], ['#3f86d0', 171, 7], ['#e0a23a', 180, 6], ['#d8507c', 187, 6]].forEach(([c, x, w]) => box(x, 154, w, 9, c));
      solid(156, 172, 40, 10);
    } else if (cls === 'media') {
      fence(32, 68, 190, '#f0f0e8'); fence(172, 204, 190, '#f0f0e8'); solid(30, 184, 44, 6); solid(170, 184, 40, 6);
      R(36, 166, 30, 8, '#5a3a22'); for (let i = 0; i < 28; i += 3) R(37 + i, 166, 2, 3, ['#ff7088', '#ffe066', '#c8a0ff'][i % 3]);
    } else {
      [32, 208].forEach(x => { for (let y = 100; y < 190; y += 12) { blob(x, y, 7, '#143c24', 0.8); blob(x, y, 6, '#2a8046', 0.8); } solid(x - 7, 94, 14, 96); });
      fountain(214, 150);
    }
    building('casa', 'Sua casa', hs);
    if (cls === 'rico') { R(108, 162, 2, 30, '#e8e2d4'); R(130, 162, 2, 30, '#e8e2d4'); box(106, 160, 28, 2, '#ffd75e'); }

    // casas de moradores
    building('lucia', 'Casa de Dona Lúcia', { x: 232, y: 120, w: 64, h: 72, roof: '#4a7ab0', wall: '#dce8f0', windows: [[6, 8], [48, 8]], flowerBox: true, door: '#a05a3a' }, false);
    building('maya', 'Casa da família de Maya', { x: 328, y: 112, w: 72, h: 80, roof: '#a86a48', wall: '#f0e2c0', windows: [[6, 8], [56, 8]], chimney: 50, door: '#3f9a72' }, false);
    building('antonio', 'Mercearia do Seu Antônio', { x: 320, y: 432, w: 76, h: 80, roof: '#8a6a3a', wall: '#ece2c8', windows: [[6, 8, 16, 9], [54, 8, 16, 9]], door: '#6a4426' }, false);
    building('davi', 'Casa de Davi', { x: 664, y: 440, w: 68, h: 72, roof: '#c2523a', wall: '#ece2c8', windows: [[6, 8], [52, 8]], flowerBox: true, door: '#3f6aa0' }, false);

    // locais de trabalho
    const B = (id, o, c, glyph) => { const d = building(id, JOBNAME[id], o); placard(d.x, o.y + o.h - 33, c, glyph); };
    B('hospital', { x: 532, y: 92, w: 124, h: 100, roof: '#c8d4dc', wall: '#f8f8f8', timber: false, roofRatio: 0.4, windows: [[10, 10, 11, 11], [30, 10, 11, 11], [84, 10, 11, 11], [104, 10, 11, 11]], door: '#4a8ab8', doorW: 14 }, '#e04a3a', [[5, 0, 2, 7], [2, 2, 8, 3]]);
    B('escola', { x: 676, y: 100, w: 64, h: 92, roof: '#4a8a5a', wall: '#f0e2c0', windows: [[6, 10], [48, 10]], chimney: 8, door: '#7a4a2a' }, '#4a8a5a', [[2, 1, 8, 1], [2, 3, 8, 1], [2, 5, 5, 1]]);
    B('restaurante', { x: 60, y: 244, w: 100, h: 92, roof: '#e0a23a', wall: '#ece2c8', windows: [[8, 10, 14, 9], [78, 10, 14, 9]], chimney: 76, flowerBox: true, door: '#7a4a2a' }, '#e0a23a', [[2, 4, 8, 2], [4, 1, 4, 3]]);
    B('estudio', { x: 180, y: 252, w: 92, h: 84, roof: '#d9628f', wall: '#f6f0f4', timber: false, windows: [[8, 10, 14, 9], [70, 10, 14, 9]], door: '#5a3a7a' }, '#d9628f', [[2, 1, 3, 3], [7, 1, 3, 3], [2, 5, 8, 1]]);
    B('atelie', { x: 292, y: 252, w: 92, h: 84, roof: '#8a5ad9', wall: '#f4eedc', windows: [[8, 10, 14, 9], [70, 10, 14, 9]], shutters: '#8a5ad9', door: '#6a4426' }, '#8a5ad9', [[3, 0, 2, 5], [3, 5, 6, 2]]);
    B('guilda', { x: 612, y: 252, w: 92, h: 84, roof: '#3aa6a0', wall: '#e4ecf0', timber: false, windows: [[8, 10, 14, 9], [70, 10, 14, 9]], door: '#2a4a5a' }, '#3aa6a0', [[2, 2, 2, 3], [8, 2, 2, 3], [5, 0, 2, 7]]);
    B('ferraria', { x: 60, y: 420, w: 100, h: 92, roof: '#5a5a66', wall: '#b0a8a0', brick: true, windows: [[8, 10, 12, 9]], chimney: 70, door: '#4a3a2a', doorW: 14 }, '#5a5a66', [[1, 1, 10, 2], [5, 3, 2, 4]]);
    B('oficina', { x: 180, y: 428, w: 116, h: 84, roof: '#3f86d0', flatRoof: true, wall: '#d8dce4', timber: false, windows: [[8, 10, 14, 9], [94, 10, 14, 9]], door: '#3a3a4a', doorW: 16 }, '#3f86d0', [[1, 2, 4, 4], [7, 2, 4, 4], [4, 0, 4, 2]]);
    B('mercado', { x: 532, y: 420, w: 108, h: 92, roof: '#c8683a', wall: '#f4e8c8', windows: [[8, 10, 16, 9], [84, 10, 16, 9]], flowerBox: true, door: '#7a4a2a', doorW: 14 }, '#c8683a', [[2, 2, 8, 4], [4, 0, 4, 2]]);
    // torre de magia
    for (let y = 232; y < 336; y += 6) R(908 + ((y / 6) % 2) * 4, y, 6, 2, '#c8b8e8');
    B('torre', { x: 892, y: 88, w: 50, h: 144, roof: '#6a3fa0', roofRatio: 0.3, wall: '#c8c0d8', brick: true, windows: [[19, 12, 11, 12], [19, 44, 11, 12]], door: '#3a2a5a' }, '#6a3fa0', [[5, 0, 2, 2], [3, 2, 6, 2], [5, 4, 2, 3]]);
    for (let i = 0; i < 5; i++) { R(917 - i * 5, 88 - i * 6 - 6, i * 10 + 2, 6, OUT); R(918 - i * 5, 88 - i * 6 - 5, i * 10, 5, i % 2 ? '#5a2f90' : '#7a4fb0'); }
    R(916, 52, 4, 6, '#ffd75e'); solid(888, 56, 58, 40);

    // praça
    fountain(497, 276); solid(483, 266, 28, 16);
    box(BOARD.x, BOARD.y - 24, 52, 22, '#8a5e36'); R(BOARD.x + 2, BOARD.y - 22, 48, 18, '#e8dcc0'); R(BOARD.x + 6, BOARD.y - 2, 3, 6, '#6a4426'); R(BOARD.x + 43, BOARD.y - 2, 3, 6, '#6a4426');
    solid(BOARD.x, BOARD.y - 8, 52, 10);
    obj({ id: 'board', kind: 'board', sid: 'vila:board', x: BOARD.x + 26, y: BOARD.y + 8, label: 'Quadro de avisos' });
    box(GALLERY.x, GALLERY.y - 24, 46, 22, '#6a4426'); R(GALLERY.x + 2, GALLERY.y - 22, 42, 18, '#d8c8a8'); R(GALLERY.x + 5, GALLERY.y - 2, 3, 6, '#6a4426'); R(GALLERY.x + 38, GALLERY.y - 2, 3, 6, '#6a4426');
    solid(GALLERY.x, GALLERY.y - 8, 46, 10);
    obj({ id: 'gallery', kind: 'gallery', sid: 'vila:gallery', x: GALLERY.x + 23, y: GALLERY.y + 8, label: 'Mural de arte da praça' });
    [[416, 322], [586, 322], [416, 236], [586, 236]].forEach(([x, y]) => addLamp(x, y));
    box(444, 318, 26, 6, '#b88448'); solid(444, 316, 26, 8); box(528, 318, 26, 6, '#b88448'); solid(528, 316, 26, 8);

    // fazenda
    R(866, 412, 132, 78, '#6a4a2a'); R(868, 414, 128, 74, '#8a6238');
    fence(862, 918, 412, '#b88448'); fence(946, 1000, 412, '#b88448'); fence(862, 1000, 498, '#b88448');
    solid(860, 404, 62, 8); solid(944, 404, 62, 8); solid(860, 492, 146, 8); solid(858, 404, 6, 96); solid(1000, 404, 6, 96);
    house({ x: 868, y: 520, w: 60, h: 62, roof: '#b8402e', wall: '#c85a3a', timber: '#f0e8d8', windows: [[6, 6, 9, 8]], door: '#f0e8d8', doorW: 16 }); solid(865, 524, 66, 60);
    box(962, 552, 30, 8, '#b88448'); R(964, 554, 26, 4, '#e8d070'); solid(962, 550, 30, 10);
    obj({ id: 'st:galinheiro', kind: 'station', sid: 'vila:galinheiro', x: 977, y: 568, label: 'Cocho das galinhas' });
    obj({ id: 'st:celeiro', kind: 'station', sid: 'vila:celeiro', x: 942, y: 562, label: 'Celeiro' });
    [[950, 572], [1000, 566], [990, 582]].forEach(([x, y]) => { R(x, y, 5, 4, '#f8f8f8'); R(x + 4, y - 2, 3, 3, '#f8f8f8'); R(x + 6, y - 1, 2, 1, '#f0a020'); R(x + 4, y - 3, 2, 1, '#e04a3a'); });
    PLOTS.forEach((p, i) => obj({ id: 'plot:' + i, kind: 'plot', i, x: p.x + 8, y: p.y + 10, r: 14, label: 'Canteiro' }));
    HERBS.forEach((p, i) => obj({ id: 'herb:' + i, kind: 'herb', i, x: p.x, y: p.y + 4, r: 16, label: 'Erva-lua' }));

    mark(cur.path, 852, 396, 164, 200);
    HERBS.forEach(h => mark(cur.path, h.x - 16, h.y - 18, 32, 36));          // nada cresce em cima das ervas
    // vegetação: bordas fechadas e árvores espalhadas
    solid(0, 0, W, 26); solid(0, H - 10, W, 10); solid(0, 0, 8, H); solid(W - 8, 0, 8, H); open(0, 338, 8, 28); open(W - 8, 338, 8, 28);
    solid(0, 338, 2, 28); solid(W - 2, 338, 2, 28);
    for (let x = 14; x < W; x += 26) { if (x < 780 || x > 850) { (x % 3 ? addTree : addPine)(x, 30 + (x % 4) * 3, 10); (x % 2 ? addTree : addPine)(x + 8, H - 4 - (x % 3) * 2, 10); } }
    for (let y = 60; y < H - 30; y += 34) { if (y < 320 || y > 380) { addPine(10, y); addTree(W - 10, y, 9); } }
    let placed = 0;
    for (let i = 0; i < 900 && placed < 46; i++) {
      const x = 30 + Math.floor(rand() * (W - 60)), y = 60 + Math.floor(rand() * (H - 90));
      if (!isFree(x - 16, y - 30, 32, 40)) continue;
      (rand() < 0.35 ? addPine : addTree)(x, y, 9 + Math.floor(rand() * 4)); mark(cur.path, x - 16, y - 30, 32, 40); placed++;
    }
    for (let i = 0; i < 60; i++) { const x = 30 + rand() * (W - 60), y = 50 + rand() * (H - 80); if (isFree(x - 8, y - 10, 16, 14)) { bush(Math.round(x), Math.round(y), 4 + Math.floor(rand() * 2)); solid(x - 4, y - 4, 8, 5); } }
    flowers(420, (x, y) => !isFree(x - 2, y - 2, 6, 8));

    m.spawn = { x: m.doors.casa.x, y: m.doors.casa.y };
    return m;
  }
  const JOBNAME = { hospital: 'Hospital', escola: 'Escola da Vila', restaurante: 'Restaurante da Vila', estudio: 'Estúdio de Design', atelie: 'Ateliê de Pintura', guilda: 'Guilda dos Códigos', ferraria: 'Ferraria', oficina: 'Oficina Mecânica', mercado: 'Mercado', torre: 'Torre de Magia', casa: 'Sua casa' };

  /* ================= interiores ================= */
  /* Móveis encostados na parede do fundo: o personagem chega por baixo e interage. */
  const ST = {
    shelf(x, w) { box(x, 44, w, 46, '#8a5e36'); for (let r = 0; r < 3; r++) { R(x + 2, 48 + r * 14, w - 4, 10, '#5a3a22'); for (let i = 0; i + 6 <= w - 6; i += 7) box(x + 4 + i, 50 + r * 14, 4, 7, ['#c8483a', '#e0a23a', '#58b858', '#3f86d0', '#f0e6cc', '#8a5ad9'][(i + r * 3) % 6]); } },
    crate(x, w) { for (let i = 0; i + 16 <= w; i += 17) { box(x + i, 72, 16, 18, '#b88448'); R(x + i, 80, 16, 1, '#7a5028'); R(x + i + 7, 72, 2, 18, '#7a5028'); if (i % 2 === 0) box(x + i + 1, 58, 14, 13, '#c89858'); } },
    counter(x, w) { box(x, 70, w, 20, '#f0ece4'); R(x, 70, w, 5, '#c89858'); R(x, 70, w, 1, '#e0b878'); },
    stove(x, w) { box(x, 62, w, 28, '#b8b8c4'); R(x, 62, w, 5, '#3a3a44'); box(x + 5, 56, 12, 8, '#7a7a8a'); R(x + 6, 57, 10, 2, '#c8642a'); box(x + 4, 74, w - 8, 12, '#2a2a34'); R(x + 6, 76, w - 12, 2, '#e88a3a'); },
    board(x, w) { ST.counter(x, w); box(x + 5, 67, w - 10, 5, '#d8b078'); R(x + 9, 65, 9, 3, '#f08030'); R(x + w - 12, 62, 2, 8, '#e0e0e8'); },
    desk(x, w) { box(x, 70, w, 20, '#a8784a'); R(x, 70, w, 4, '#c89858'); box(x + 4, 64, 12, 8, '#ffffff'); R(x + 6, 66, 8, 1, '#3a4a8a'); R(x + 6, 68, 6, 1, '#3a4a8a'); box(x + w - 10, 62, 5, 9, '#e0a23a'); },
    cabinet(x, w) { box(x, 40, w, 50, '#f4f4f4'); R(x + w / 2 - 1, 40, 2, 50, '#c0c8cc'); R(x + w / 2 - 4, 50, 8, 16, '#3fae6a'); R(x + w / 2 - 8, 54, 16, 8, '#3fae6a'); R(x + 4, 72, 3, 3, '#8a8a98'); R(x + w - 7, 72, 3, 3, '#8a8a98'); },
    bed(x, w) { box(x, 68, w, 22, '#f8f8f8'); R(x, 68, w, 4, '#8cc4e8'); box(x + 2, 62, 12, 8, '#ffffff'); R(x + 2, 86, 3, 6, '#8a8a98'); R(x + w - 5, 86, 3, 6, '#8a8a98'); },
    forge(x, w) { box(x, 44, w, 46, '#8a6a5a'); for (let r = 0; r < 46; r += 6) R(x, 44 + r + 5, w, 1, '#6a4a3a'); box(x + 6, 62, w - 12, 22, '#2a1a12'); R(x + 8, 74, w - 16, 8, '#e04a1a'); R(x + 10, 70, w - 20, 5, '#f8a030'); R(x + w / 2 - 2, 66, 4, 5, '#ffe066'); box(x + w / 2 - 5, 30, 10, 16, '#6a4a3a'); },
    anvil(x, w) { const c = x + w / 2; box(c - 6, 80, 12, 10, '#6a4426'); box(c - 12, 70, 24, 6, '#5a5a66'); R(c - 16, 71, 5, 3, '#5a5a66'); box(c - 7, 76, 14, 5, '#4a4a56'); R(c - 12, 70, 24, 1, '#9a9aa8'); },
    tub(x, w) { box(x + 2, 72, w - 4, 18, '#8a5e36'); R(x + 2, 78, w - 4, 1, '#5a3a22'); R(x + 2, 85, w - 4, 1, '#5a3a22'); R(x + 4, 73, w - 8, 4, '#3f86d8'); R(x + 7, 74, 6, 1, '#bfe4ff'); },
    cauldron(x, w) { const c = x + w / 2; blob(c, 78, 13, OUT, 0.8); blob(c, 78, 12, '#2a2a34', 0.8); R(c - 11, 68, 22, 4, '#3a3a44'); R(c - 9, 69, 18, 2, '#58d878'); R(c - 5, 69, 3, 1, '#b8f8c8'); R(c - 10, 88, 3, 3, OUT); R(c + 7, 88, 3, 3, OUT); },
    easel(x, w) { const c = x + w / 2; R(c - 11, 50, 2, 42, '#8a5e36'); R(c + 9, 50, 2, 42, '#8a5e36'); R(c - 1, 44, 2, 46, '#6a4426'); box(c - 10, 48, 20, 26, '#fbfbf6'); R(c - 12, 75, 24, 2, '#8a5e36'); },
    tools(x, w) { box(x, 42, w, 30, '#c8b088'); [[4, 6, '#8a8a98'], [12, 4, '#c8483a'], [20, 7, '#8a8a98'], [28, 5, '#e0a23a']].forEach(([a, h, c]) => { if (a + 4 < w) { R(x + a, 46, 3, 14 + h, c); R(x + a - 1, 46, 5, 3, c); } }); ST.counter(x, w); box(x + 4, 64, 12, 6, '#c8483a'); },
    terminal(x, w) { ST.desk(x, w); box(x + 6, 46, w - 12, 22, '#101828'); R(x + 9, 50, 12, 2, '#6ad0a0'); R(x + 12, 55, 16, 2, '#6aa6f0'); R(x + 9, 60, 8, 2, '#f0c060'); R(x + w / 2 - 2, 68, 4, 3, '#3a3a4a'); },
    lousa(x, w) { R(x + 4, 66, w - 8, 2, '#d8c8a8'); R(x + w - 14, 64, 6, 2, '#ffffff'); },
    stall(x, w) { ST.counter(x, w); for (let i = 0; i + 9 <= w - 4; i += 10) { box(x + 3 + i, 62, 7, 8, ['#c8483a', '#e0a23a', '#58b858', '#f0e6cc'][(i / 10) % 4]); } for (let i = 0; i < w; i += 8) R(x + i, 40, 8, 8, (i / 8) % 2 ? '#d8483a' : '#f8f4ec'); R(x, 48, w, 1, OUT); R(x, 40, 2, 30, '#8a5e36'); R(x + w - 2, 40, 2, 30, '#8a5e36'); },
  };
  /* Móveis soltos no chão. */
  const FLOOR = {
    table(x, y, w = 30) { box(x, y - 12, w, 12, '#b88448'); R(x, y - 12, w, 3, '#d8a868'); R(x + 2, y, 3, 4, '#6a4426'); R(x + w - 5, y, 3, 4, '#6a4426'); solid(x, y - 12, w, 14); },
    rug(x, y, w, h, c) { R(x, y, w, h, shade(c, 0.7)); R(x + 2, y + 2, w - 4, h - 4, c); R(x + 5, y + 5, w - 10, h - 10, shade(c, 1.2)); },
    plant(x, y) { box(x, y - 8, 8, 8, '#b0603a'); blob(x + 4, y - 13, 6, '#143c24'); blob(x + 4, y - 13, 5, '#2f8a40'); blob(x + 2, y - 15, 2, '#58b858'); solid(x, y - 6, 8, 6); },
    homebed(x, y, c, fancy) { box(x, y - 30, 22, 30, fancy ? '#6a4426' : '#8a5e36'); R(x + 2, y - 28, 18, 26, c); box(x + 3, y - 28, 16, 8, '#ffffff'); R(x + 2, y - 18, 18, 2, shade(c, 0.75)); solid(x, y - 30, 22, 30); },
    chest(x, y) { box(x, y - 12, 18, 12, '#8a5e36'); R(x, y - 12, 18, 4, '#b88448'); R(x + 8, y - 8, 2, 3, '#ffd75e'); R(x, y - 7, 18, 1, '#5a3a22'); solid(x, y - 12, 18, 12); },
    vehicle(x, y) { solid(x, y - 14, 44, 16); },
    circle(x, y) { for (let d = 0; d < 60; d++) { const a = d / 60 * 6.283; R(x + Math.cos(a) * 18, y + Math.sin(a) * 9, 2, 1, d % 5 ? '#c8a0ff' : '#ffd75e'); R(x + Math.cos(a) * 12, y + Math.sin(a) * 6, 1, 1, '#8a5ad9'); } R(x - 1, y - 6, 2, 12, '#8a5ad9'); R(x - 10, y - 1, 20, 1, '#8a5ad9'); },
    robot(x, y) { box(x, y - 22, 14, 14, '#b8c0d0'); R(x + 3, y - 18, 3, 3, '#3f86d8'); R(x + 8, y - 18, 3, 3, '#3f86d8'); R(x + 6, y - 26, 2, 4, OUT); R(x + 5, y - 28, 4, 3, '#e04a3a'); box(x + 2, y - 7, 4, 7, '#8a94a8'); box(x + 8, y - 7, 4, 7, '#8a94a8'); solid(x, y - 8, 14, 9); },
    studentDesk(x, y) { box(x, y - 10, 26, 10, '#c89858'); R(x, y - 10, 26, 3, '#e0b878'); solid(x, y - 10, 26, 10); },
  };

  /* wall, f1, f2, planks, decor(), stations [[sid, label, kind, x, w]], floor() */
  const ROOMS = {
    hospital: { c: ['#e2f0ee', '#d4e0dc', '#c0d0cc'], mentor: [226, 120],
      decor() { box(108, 8, 34, 24, '#f4f0e4'); R(110, 10, 30, 20, '#8fd0f0'); R(124, 10, 2, 20, '#f4f0e4'); box(216, 10, 28, 30, '#ffffff'); blob(226, 20, 5, '#e04a3a'); blob(234, 20, 5, '#e04a3a'); for (let i = 0; i < 8; i++) R(222 + i, 23 + i, 17 - i * 2, 1, '#e04a3a'); },
      st: [['recepcao', 'Balcão da recepção', 'desk', 10, 40], ['armario', 'Armário de cuidados', 'cabinet', 62, 34], ['maca', 'Maca de atendimento', 'bed', 110, 50], ['mesa', 'Mesa de registros', 'desk', 172, 40]],
      floor() { [[20, 138], [46, 138], [72, 138]].forEach(([x, y]) => { box(x, y - 8, 14, 8, '#8cc4e8'); R(x, y - 14, 14, 6, '#6aa6d0'); }); FLOOR.plant(236, 150); } },
    restaurante: { c: ['#f2e8d2', '#e0d4bc', '#c8b8a0'], mentor: [230, 112],
      decor() { R(0, 40, W, 22, '#e6eef0'); for (let x = 0; x < W; x += 8) R(x, 40, 1, 22, '#c8d4d8'); box(206, 8, 40, 26, '#f4f0e4'); R(208, 10, 36, 22, '#8fd0f0'); R(225, 10, 2, 22, '#f4f0e4'); },
      st: [['despensa', 'Despensa', 'shelf', 10, 38], ['tabua', 'Tábua de corte', 'board', 58, 40], ['fogao', 'Fogão', 'stove', 108, 40], ['balcao', 'Balcão de pratos', 'counter', 158, 40]],
      floor() { FLOOR.table(34, 140, 34); FLOOR.table(150, 140, 34); } },
    estudio: { c: ['#f2e6ee', '#c8a878', '#a88858'], planks: true, mentor: [228, 116],
      decor() { ['#e04a3a', '#f2c53d', '#3fa070', '#3f86d0', '#8a5ad9'].forEach((c, i) => box(14 + i * 12, 14, 9, 9, c)); box(196, 8, 50, 34, '#fbfbf6'); R(200, 12, 22, 6, '#3f86d0'); R(226, 12, 16, 14, '#f8a0c8'); R(200, 22, 22, 2, '#8a8a9a'); R(200, 28, 14, 6, '#e0a23a'); },
      st: [['prancheta', 'Prancheta de criação', 'desk', 96, 56]], floor() { FLOOR.rug(86, 104, 76, 34, '#d9628f'); FLOOR.plant(20, 110); FLOOR.table(190, 146, 30); } },
    atelie: { c: ['#f4eedc', '#c8a878', '#a88858'], planks: true, mentor: [226, 120],
      decor() { box(8, 8, 110, 30, '#d8c8a8'); },
      st: [['tintas', 'Estante de tintas', 'shelf', 132, 34], ['cavalete', 'Cavalete', 'easel', 178, 30]], floor() { FLOOR.rug(150, 104, 70, 30, '#8a5ad9'); FLOOR.plant(16, 112); [['#e04a3a', 60], ['#3f86d0', 72], ['#f2c53d', 84]].forEach(([c, x]) => { box(x, 142, 8, 8, c); solid(x, 142, 8, 8); }); } },
    ferraria: { c: ['#8a8078', '#6a625c', '#5a544e'], mentor: [226, 124],
      decor() { for (let y = 6; y < 60; y += 8) for (let x = (y % 16 ? 0 : 8); x < W; x += 16) R(x, y, 1, 8, '#6e665e'); for (let y = 6; y < 62; y += 8) R(0, y, W, 1, '#6e665e'); [[150, 12], [166, 12], [182, 12]].forEach(([x, y], i) => { R(x, y, 2, 20, '#8a5e36'); box(x - 3, y + 18, 8, 6, ['#b0b0c0', '#9a9aa8', '#c0c0cc'][i]); }); },
      st: [['minerios', 'Caixas de minério', 'crate', 8, 36], ['forja', 'Forja', 'forge', 54, 40], ['bigorna', 'Bigorna', 'anvil', 104, 36], ['tina', 'Tina de água', 'tub', 204, 32]], floor() {} },
    oficina: { c: ['#d0d4dc', '#8e98ac', '#7e889c'], mentor: [228, 124],
      decor() { box(150, 10, 50, 28, '#f0e6cc'); R(156, 16, 20, 3, '#3f86d0'); R(156, 22, 34, 3, '#e0a23a'); R(156, 28, 14, 3, '#c8483a'); for (let x = 0; x < W; x += 20) { R(x, 60, 10, 4, '#ffd75e'); R(x + 10, 60, 10, 4, '#3a3a44'); } },
      st: [['ferramentas', 'Bancada de ferramentas', 'tools', 10, 40], ['pecas', 'Caixas de peças', 'crate', 62, 36]], floor() { FLOOR.rug(98, 104, 64, 40, '#5a6478'); FLOOR.vehicle(108, 132); } },
    torre: { c: ['#4a3a6a', '#5a4a7a', '#4a3c68'], mentor: [36, 124],
      decor() { for (let i = 0; i < 26; i++) R(8 + (i * 53) % 240, 6 + (i * 29) % 50, 1 + (i % 3 === 0), 1 + (i % 3 === 0), i % 4 ? '#c8a0ff' : '#ffd75e'); box(110, 8, 36, 30, '#1a1430'); blob(128, 22, 8, '#ffe89a'); blob(132, 20, 6, '#1a1430'); },
      st: [['estante', 'Estante de frascos', 'shelf', 10, 36], ['caldeirao', 'Caldeirão', 'cauldron', 62, 36]], floor() { FLOOR.circle(178, 122); } },
    guilda: { c: ['#c4d0e2', '#8e98ac', '#7e889c'], mentor: [34, 124],
      decor() { box(150, 8, 60, 34, '#101828'); for (let i = 0; i < 5; i++) R(154 + (i % 3) * 5, 12 + i * 6, 18 + (i * 37) % 30, 2, ['#6ad0a0', '#6aa6f0', '#f0c060'][i % 3]); box(220, 10, 26, 44, '#3a3a4a'); for (let i = 0; i < 5; i++) { R(224, 15 + i * 8, 18, 4, '#2a2a34'); R(226, 16 + i * 8, 2, 2, i % 2 ? '#58d878' : '#ffd75e'); } },
      st: [['terminal', 'Terminal de comandos', 'terminal', 60, 44], ['pecas', 'Caixa de cartões', 'crate', 10, 34]], floor() { FLOOR.rug(160, 106, 60, 34, '#3aa6a0'); FLOOR.robot(183, 132); } },
    escola: { c: ['#f0e8d4', '#b88a58', '#9a7044'], planks: true, mentor: [230, 112],
      decor() { box(74, 8, 124, 46, '#8a5e36'); R(78, 12, 116, 38, '#2f5a44'); blob(226, 24, 10, OUT); blob(226, 24, 9, '#ffffff'); R(226, 18, 1, 7, OUT); R(226, 24, 5, 1, OUT); },
      st: [['estante', 'Estante de materiais', 'shelf', 10, 36], ['lousa', 'Lousa', 'lousa', 100, 72]], floor() { FLOOR.studentDesk(58, 142); FLOOR.studentDesk(150, 142); } },
    mercado: { c: ['#f8e8c8', '#c8b088', '#b09868'], mentor: [226, 116],
      decor() { R(14, 30, 96, 3, '#8a5e36'); ['#c8483a', '#e0a23a', '#58b858', '#3f86d0', '#8a5ad9', '#f0e6cc'].forEach((c, i) => box(20 + i * 15, 20, 9, 10, c)); box(204, 12, 40, 18, '#f0e6cc'); R(210, 17, 28, 2, '#8a5e36'); R(210, 22, 18, 2, '#8a5e36'); },
      st: [['estoque', 'Caixas do estoque', 'crate', 10, 52], ['banca', 'Banca de vendas', 'stall', 100, 64]], floor() { FLOOR.plant(236, 150); } },
  };
  const HOMEROOM = {
    pobre: { c: ['#e8d8b8', '#b08a5a', '#96744a'], planks: true, bed: '#c85a5a', rug: '#a86a48',
      decor() { box(30, 12, 26, 20, '#f4f0e4'); R(32, 14, 22, 16, '#8fd0f0'); R(42, 14, 2, 16, '#f4f0e4'); R(120, 20, 60, 2, '#8a5e36'); ['#c8483a', '#7a7a8a', '#e0a23a'].forEach((c, i) => box(126 + i * 18, 10, 10, 9, c)); R(204, 14, 14, 18, '#e8e0c8'); R(206, 17, 10, 2, '#8a5e36'); },
      extra() { FLOOR.homebed(60, 108, '#5a8ab8'); } },
    media: { c: ['#f0e4c8', '#c8a878', '#a88858'], planks: true, bed: '#3f86d0', rug: '#c2523a',
      decor() { box(26, 10, 34, 24, '#f4f0e4'); R(28, 12, 30, 20, '#8fd0f0'); R(42, 12, 2, 20, '#f4f0e4'); box(110, 10, 24, 18, '#d8c8a8'); R(113, 13, 18, 12, '#58a83c'); box(196, 10, 40, 30, '#8a5e36'); for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) R(199 + i * 6, 14 + r * 12, 4, 9, ['#c8483a', '#3f86d0', '#e0a23a', '#58b858'][(i + r) % 4]); },
      extra() { box(150, 138, 36, 12, '#5a7aa8'); R(150, 132, 36, 6, '#4a6a98'); solid(150, 132, 36, 18); FLOOR.plant(16, 150); } },
    rico: { c: ['#ece4f0', '#d8c8a8', '#c0b090'], bed: '#8a5ad9', rug: '#3a4a7a',
      decor() { [26, 96, 196].forEach(x => { box(x, 8, 34, 28, '#f4f0e4'); R(x + 2, 10, 30, 24, '#8fd0f0'); R(x + 16, 10, 2, 24, '#f4f0e4'); R(x - 3, 8, 3, 30, '#8a5ad9'); R(x + 34, 8, 3, 30, '#8a5ad9'); }); box(144, 12, 30, 22, '#ffd75e'); R(147, 15, 24, 16, '#3a4a7a'); blob(159, 23, 5, '#f0c8a0'); },
      extra() { box(146, 132, 44, 18, '#2a2a34'); R(146, 132, 44, 4, '#4a4a58'); for (let i = 0; i < 40; i += 4) R(148 + i, 144, 3, 6, '#ffffff'); solid(146, 132, 44, 18); FLOOR.plant(16, 150); FLOOR.plant(234, 110); box(22, 96, 10, 14, '#ffd75e'); solid(22, 96, 10, 14); } },
  };

  function buildRoom(id, cls) {
    const m = newMap(id, VW, VH, 29);
    const home = id === 'casa', def = home ? HOMEROOM[cls] || HOMEROOM.media : ROOMS[id];
    roomBase(def.c[0], def.c[1], def.c[2], def.planks);
    def.decor();
    solid(0, 0, W, 76); solid(0, 0, 4, H); solid(W - 4, 0, 4, H); solid(0, H - 3, W, 3);
    if (home) {
      FLOOR.rug(96, 102, 64, 36, def.rug);
      ST.stove(108, 34); solid(108, 72, 34, 20);
      obj({ id: 'st:fogao', kind: 'text', x: 125, y: 100, label: 'Fogão', text: 'O fogão de casa. Ainda guarda o calor do café da manhã.' });
      FLOOR.homebed(12, 108, def.bed, cls === 'rico');
      obj({ id: 'bed', kind: 'bed', x: 23, y: 114, label: 'Sua cama' });
      FLOOR.chest(42, 92); obj({ id: 'chest', kind: 'chest', x: 51, y: 98, label: 'Baú' });
      FLOOR.table(196, 106, 34);
      def.extra();
      m.decorSpots = [[70, 150], [208, 92], [92, 96]];
      m.mentor = [214, 124];
    } else {
      def.st.forEach(([sid, label, kind, x, w]) => {
        ST[kind](x, w); if (kind !== 'lousa') solid(x, 72, w, 20);
        obj({ id: 'st:' + sid, kind: 'station', sid: id + ':' + sid, x: x + w / 2, y: 100, r: Math.max(16, w / 2), label });
      });
      def.floor();
      if (id === 'oficina') obj({ id: 'st:veiculo', kind: 'station', sid: 'oficina:veiculo', x: 130, y: 142, r: 20, label: 'Veículo em conserto' });
      if (id === 'torre') obj({ id: 'st:circulo', kind: 'station', sid: 'torre:circulo', x: 178, y: 140, r: 16, label: 'Círculo de runas' });
      if (id === 'guilda') obj({ id: 'st:automato', kind: 'station', sid: 'guilda:automato', x: 190, y: 140, r: 16, label: 'Autômato' });
      m.mentor = def.mentor;
    }
    // porta de saída
    R(112, H - 8, 32, 8, '#6a4426'); R(114, H - 6, 28, 6, '#c8a878'); R(118, H - 5, 20, 1, '#a88858');
    obj({ id: 'exit', kind: 'exit', x: 128, y: H - 8, r: 14, label: 'Sair' });
    m.spawn = { x: 128, y: H - 14 };
    return m;
  }

  /* ================= acesso e colisão ================= */
  const cache = {};
  function get(id, cls) {
    const key = id === 'vila' || id === 'casa' ? id + ':' + cls : id;
    if (!cache[key]) cache[key] = id === 'vila' ? buildVila(cls) : buildRoom(id, cls);
    return cache[key];
  }
  /* A caixa dos pés (10x6, com x,y no centro da base) está livre? */
  function free(map, x, y) {
    const x0 = x - 5, y0 = y - 6;
    if (x0 < 0 || y0 < 0 || x0 + 10 > map.w || y > map.h) return false;
    for (let cy = Math.floor(y0 / CELL); cy <= Math.floor((y - 1) / CELL); cy++) for (let cx = Math.floor(x0 / CELL); cx <= Math.floor((x0 + 9) / CELL); cx++) if (map.solid[cy * map.cols + cx]) return false;
    return true;
  }
  const camera = (map, px, py) => ({ x: Math.round(Math.max(0, Math.min(map.w - VW, px - VW / 2))), y: Math.round(Math.max(0, Math.min(map.h - VH, py - 14 - VH / 2))) });

  /* ================= desenho ================= */
  const ICONS = {       // marcas deixadas no mundo por tarefas concluídas
    tool(x, y) { R(x + 3, y, 2, 9, '#8a5e36'); box(x, y, 8, 3, '#b0b0c0'); },
    bike(x, y) { [0, 9].forEach(d => { blob(x + 3 + d, y + 6, 4, OUT); blob(x + 3 + d, y + 6, 3, '#d8d8e0'); blob(x + 3 + d, y + 6, 1, OUT); }); R(x + 3, y + 2, 9, 1, '#c8483a'); R(x + 6, y + 2, 1, 4, '#c8483a'); R(x + 10, y, 3, 1, OUT); },
    veg(x, y) { box(x, y + 3, 10, 6, '#b88448'); R(x + 1, y + 1, 3, 3, '#f08030'); R(x + 5, y + 1, 3, 3, '#e04a3a'); R(x + 3, y, 2, 2, '#58b858'); },
    plate(x, y) { blob(x + 5, y + 6, 5, OUT, 0.5); blob(x + 5, y + 6, 4, '#ffffff', 0.5); R(x + 3, y + 5, 4, 2, '#e0a23a'); },
    bot(x, y) { box(x + 1, y + 2, 8, 7, '#b8c0d0'); R(x + 3, y + 4, 2, 2, '#3f86d8'); R(x + 6, y + 4, 2, 2, '#3f86d8'); R(x + 4, y, 2, 2, '#e04a3a'); },
    goods(x, y) { box(x, y + 2, 5, 7, '#c8483a'); box(x + 6, y + 4, 5, 5, '#e0a23a'); },
    book(x, y) { box(x, y + 3, 10, 6, '#3f86d0'); R(x + 5, y + 3, 1, 6, '#ffffff'); },
  };
  const CROP_COLORS = { cenoura: '#f08030', tomate: '#e04a3a', abobora: '#e8a020' };

  function drawPainting(ctx, data, x, y) {         // quadro 16x12 emoldurado
    ctx.fillStyle = OUT; ctx.fillRect(x - 2, y - 2, 20, 16); ctx.fillStyle = '#c89838'; ctx.fillRect(x - 1, y - 1, 18, 14);
    for (let i = 0; i < 192; i++) { ctx.fillStyle = PAINT_COLORS[parseInt(data[i], 36)] || '#fbfbf6'; ctx.fillRect(x + i % 16, y + Math.floor(i / 16), 1, 1); }
  }
  function drawPoster(ctx, p, x, y) {              // cartaz em miniatura 14x16
    ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 1, 16, 18); ctx.fillStyle = p.bg; ctx.fillRect(x, y, 14, 16);
    p.items.forEach(it => { ctx.fillStyle = it.k === 'art' ? p.accent : p.fg; ctx.fillRect(x + Math.round(it.x * 14), y + Math.round(it.y * 16), Math.max(2, Math.round(it.w * 14)), Math.max(1, Math.round(it.h * 16))); });
  }

  /* Desenha um quadro do jogo.
     view: { map, cam, t, actors: [{look, x, y, dir, moving, bubble, name}], state: S, markers: [{x,y}], fx } */
  function render(ctx, v) {
    const { map, cam, t, state: S } = v;
    ctx.drawImage(map.bg, -cam.x, -cam.y);
    g = ctx;
    ctx.save(); ctx.translate(-cam.x, -cam.y);
    const seen = (x, y, pad = 30) => x > cam.x - pad && x < cam.x + VW + pad && y > cam.y - pad && y < cam.y + VH + pad + 20;

    if (map.id === 'vila') {
      const ph = Math.floor(t / 280);
      for (let i = 0; i < 70; i++) {                      // reflexos do rio
        const y = (i * 37 + ph * 2) % map.h; if (!seen(810, y) || (y > 330 && y < 374)) continue;
        R(riverX(y) + 3 + (i * 11 + ph) % 20, y, 3 + i % 2, 1, i % 2 ? '#bfe4ff' : '#8cc4f8');
      }
      for (let i = 0; i < 4; i++) { const k = ((t / 900) + i / 4) % 1; ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.fillRect(Math.round(495 + Math.sin(k * 5 + i) * 5), Math.round(266 - k * 8), 2, 2); }
      // canteiros
      S.farm.plots.forEach((p, i) => {
        const q = PLOTS[i]; if (!seen(q.x, q.y)) return;
        if (p.s === 0) { R(q.x, q.y, 16, 16, '#7a5632'); R(q.x + 2, q.y + 3, 3, 1, '#58a83c'); R(q.x + 10, q.y + 11, 3, 1, '#58a83c'); return; }
        R(q.x, q.y, 16, 16, p.w ? '#4a3018' : '#6a4426'); for (let r = 3; r < 16; r += 5) R(q.x + 1, q.y + r, 14, 1, p.w ? '#3a2410' : '#5a3a1e');
        const c = CROP_COLORS[p.crop] || '#58b858';
        if (p.s === 2) { R(q.x + 7, q.y + 8, 2, 2, '#c8b078'); }
        if (p.s === 3) { R(q.x + 7, q.y + 6, 2, 6, '#58b858'); R(q.x + 5, q.y + 6, 2, 2, '#58b858'); R(q.x + 9, q.y + 8, 2, 2, '#58b858'); }
        if (p.s === 4) { blob(q.x + 8, q.y + 6, 5, '#143c24'); blob(q.x + 8, q.y + 6, 4, '#2f8a40'); box(q.x + 5, q.y + 8, 6, 6, c); R(q.x + 6, q.y + 9, 2, 2, shade(c, 1.3)); }
      });
      // ervas
      HERBS.forEach((h, i) => { if (S.herbsTaken[i] || !seen(h.x, h.y)) return; const b = Math.floor(t / 400 + i) % 2; R(h.x - 1, h.y - 2, 2, 6, '#2f8a40'); R(h.x - 3, h.y, 2, 2, '#58b858'); R(h.x + 1, h.y + 1, 2, 2, '#58b858'); box(h.x - 2, h.y - 6, 4, 4, b ? '#e8d8ff' : '#c8a0ff'); });
      // cartazes e quadros na praça
      S.world.posters.slice(-3).forEach((p, i) => drawPoster(ctx, p, BOARD.x + 4 + i * 16, BOARD.y - 21));
      S.world.paintings.slice(-2).forEach((p, i) => drawPainting(ctx, p.data, GALLERY.x + 4 + i * 21, GALLERY.y - 20));
    }
    if (map.id === 'atelie') S.world.paintings.slice(-5).forEach((p, i) => drawPainting(ctx, p.data, 13 + i * 21, 16));
    if (map.id === 'casa') (S.world.decor || []).forEach((d, i) => { const s = map.decorSpots[i % map.decorSpots.length]; box(s[0], s[1] - 8, 8, 8, '#b0603a'); blob(s[0] + 4, s[1] - 12, 4, '#2f8a40'); R(s[0] + 2, s[1] - 15, 3, 3, '#ff7088'); R(s[0] + 5, s[1] - 13, 2, 2, '#ffe066'); });
    (v.fx || []).filter(f => !f.top).forEach(f => drawFx(ctx, f, t));

    // figuras ordenadas pela base (quem está mais abaixo fica na frente)
    const list = [];
    map.sprites.forEach(s => { if (seen(s.x + 16, s.base, 44)) list.push({ base: s.base, s }); });
    v.actors.forEach(a => list.push({ base: a.y, a }));
    list.sort((p, q) => p.base - q.base);
    list.forEach(e => {
      if (e.s) { ctx.drawImage(e.s.img, e.s.x, e.s.y); return; }
      const a = e.a;
      ctx.fillStyle = 'rgba(20,30,20,.28)'; ctx.fillRect(Math.round(a.x) - 6, Math.round(a.y) - 2, 12, 3);
      Sprites.draw(ctx, a.look, a.x - 10, a.y - 27 + (a.hop || 0), a.moving ? Sprites.walk(t) : (a.work ? Math.floor(t / 170) % 2 : 0), a.dir || 'down');
      if (a.icon && ICONS[a.icon]) ICONS[a.icon](Math.round(a.x) + 8, Math.round(a.y) - 10);
    });
    v.actors.forEach(a => { if (a.bubble) bubble(Math.round(a.x) - 7, Math.round(a.y) - 42, a.bubble === '...' ? '' : '!', t); if (a.heart) heart(ctx, Math.round(a.x) - 3, Math.round(a.y) - 38 - Math.floor(t / 300) % 2); });

    (v.fx || []).filter(f => f.top).forEach(f => drawFx(ctx, f, t));
    (v.markers || []).forEach(mk => { const b = Math.floor(t / 250) % 2; const x = Math.round(mk.x), y = Math.round(mk.y) - b * 2; ctx.fillStyle = OUT; ctx.fillRect(x - 4, y - 8, 9, 6); ctx.fillRect(x - 3, y - 2, 7, 2); ctx.fillRect(x - 1, y, 3, 2); ctx.fillStyle = '#ffd75e'; ctx.fillRect(x - 3, y - 7, 7, 5); ctx.fillRect(x - 2, y - 2, 5, 1); ctx.fillRect(x, y - 1, 1, 2); });
    ctx.restore();
  }
  function heart(ctx, x, y) { ctx.fillStyle = '#e04a3a'; ctx.fillRect(x, y, 3, 3); ctx.fillRect(x + 4, y, 3, 3); ctx.fillRect(x + 1, y + 3, 5, 2); ctx.fillRect(x + 3, y + 5, 1, 1); }
  function drawFx(ctx, f, t) {
    if (f.type === 'icon' && ICONS[f.icon]) ICONS[f.icon](f.x, f.y);
    if (f.type === 'spark') for (let i = 0; i < 6; i++) { const k = ((t / 700) + i / 6) % 1; ctx.fillStyle = i % 2 ? '#ffe066' : '#c8a0ff'; ctx.fillRect(Math.round(f.x + Math.cos(i * 1.7 + t / 500) * 11), Math.round(f.y - 4 - k * 16), 1 + (k < 0.5), 1 + (k < 0.5)); }
    if (f.type === 'steam') for (let i = 0; i < 3; i++) { const k = ((t / 600) + i / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; ctx.fillRect(Math.round(f.x + i * 4 - 4 + Math.sin(k * 6 + i) * 2), Math.round(f.y - k * 12), 2, 2); }
    if (f.type === 'vehicle') { ICONS.bike(f.x, f.y); if (f.fixed) { ctx.fillStyle = '#ffe066'; ctx.fillRect(f.x + 12 + Math.floor(t / 200) % 3, f.y - 3, 2, 2); } else { ctx.fillStyle = '#b8502a'; ctx.fillRect(f.x + 2, f.y + 5, 3, 3); ctx.fillRect(f.x + 5, f.y + 2, 4, 1); } }
    if (f.type === 'board') { ctx.fillStyle = '#f4f4f4'; f.lines.forEach((w, i) => ctx.fillRect(f.x, f.y + i * 6, w, 1)); }
    if (f.type === 'glow') { ctx.fillStyle = `rgba(255,170,60,${0.35 + 0.2 * Math.sin(t / 150)})`; ctx.fillRect(f.x, f.y, f.w, f.h); }
  }

  return { VW, VH, get, free, camera, render, PLOTS, HERBS, BOARD, GALLERY, drawPainting, drawPoster, JOBNAME };
})();

/* Paleta do pintor (índice em base 36 → cor). */
const PAINT_COLORS = ['#fbfbf6', '#241a2c', '#e04a3a', '#f08030', '#f2c53d', '#58b858', '#2f8a40', '#3f86d8', '#8fd0f0', '#8a5ad9', '#f8a0c8', '#8a5e36', '#c8b088', '#8a8a9a'];
