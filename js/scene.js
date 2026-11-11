/* Cenário da vila em pixel art (256x144), desenhado por código. */

const Scene = (() => {
  const W = 256, H = 144;
  const SPOTS = { home: 42, mentor: 90, guild: 206 };
  const HOUSES = {
    pobre: { x: 28, y: 44, w: 38, h: 34, roof: ['#8a6a3a', '#6e5228'], wall: '#b89a6a', windows: 1 },
    media: { x: 20, y: 34, w: 52, h: 44, roof: ['#c2523a', '#96382a'], wall: '#eadfc4', windows: 1 },
    rico:  { x: 12, y: 24, w: 66, h: 54, roof: ['#3f66c0', '#2b4a94'], wall: '#f4eedc', windows: 2, gold: true },
  };

  let ctx, bg, opts = {}, raf = 0;
  const hero = { x: SPOTS.mentor, tx: SPOTS.mentor, flip: false, jump: 0, back: 0 };
  let particles = [];

  function rng(seed) {
    return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  }
  const riverX = y => 150 + Math.round(Math.sin(y / 9) * 2);

  function house(g, o, doorColor) {
    const { x, y, w, h } = o;
    const rh = Math.round(h * 0.48);
    // parede
    g.fillStyle = '#2a1a2e'; g.fillRect(x - 1, y + rh - 1, w + 2, h - rh + 2);
    g.fillStyle = o.wall; g.fillRect(x, y + rh, w, h - rh);
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x, y + rh, w, 3);
    g.fillStyle = '#7a5a3a'; g.fillRect(x, y + rh, 2, h - rh); g.fillRect(x + w - 2, y + rh, 2, h - rh);
    // telhado
    g.fillStyle = '#2a1a2e'; g.fillRect(x - 4, y - 1, w + 8, rh + 2);
    for (let r = 0; r < rh; r++) {
      for (let c = -3; c < w + 3; c++) {
        const tile = ((c + (Math.floor(r / 4) % 2) * 3) % 6 === 0) || r % 4 === 3;
        g.fillStyle = o.roof[tile ? 1 : 0];
        g.fillRect(x + c, y + r, 1, 1);
      }
    }
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x - 3, y, w + 6, 1);
    // porta
    const dx = x + Math.floor(w / 2) - 5, dy = y + h - 15;
    g.fillStyle = '#2a1a2e'; g.fillRect(dx - 1, dy - 1, 12, 16);
    g.fillStyle = doorColor; g.fillRect(dx, dy, 10, 15);
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(dx + 5, dy, 1, 15);
    g.fillStyle = '#ffd75e'; g.fillRect(dx + 7, dy + 8, 1, 2);
    // janelas
    const win = wx => {
      g.fillStyle = '#2a1a2e'; g.fillRect(wx - 1, dy, 9, 9);
      g.fillStyle = '#8fd0f0'; g.fillRect(wx, dy + 1, 7, 7);
      g.fillStyle = '#eafaff'; g.fillRect(wx + 1, dy + 2, 2, 2);
      g.fillStyle = '#7a5a3a'; g.fillRect(wx + 3, dy + 1, 1, 7);
    };
    win(x + 5);
    if (o.windows > 1) win(x + w - 12);
    if (o.gold) { g.fillStyle = '#ffd75e'; g.fillRect(x - 4, y + rh, w + 8, 1); g.fillRect(dx + 3, dy - 4, 4, 2); }
  }

  function pine(g, x, y) {         // (x, y) = base do tronco
    g.fillStyle = '#5a3a22'; g.fillRect(x - 2, y - 5, 4, 5);
    for (let layer = 0; layer < 3; layer++) {
      const top = y - 28 + layer * 7, hgt = 11, half = 5 + layer * 2;
      for (let r = 0; r < hgt; r++) {
        const wd = Math.round((r + 1) / hgt * half);
        g.fillStyle = '#16402a'; g.fillRect(x - wd - 1, top + r, wd * 2 + 2, 1);
        g.fillStyle = '#2f8a4a'; g.fillRect(x - wd, top + r, wd * 2, 1);
        g.fillStyle = '#5cc06a'; g.fillRect(x - wd, top + r, Math.max(1, Math.floor(wd / 2)), 1);
      }
    }
  }

  function barrel(g, x, y) {
    g.fillStyle = '#2a1a2e'; g.fillRect(x - 1, y - 1, 10, 12);
    g.fillStyle = '#9a6a3a'; g.fillRect(x, y, 8, 10);
    g.fillStyle = '#c08a4e'; g.fillRect(x + 1, y, 2, 10);
    g.fillStyle = '#5a4030'; g.fillRect(x, y + 2, 8, 1); g.fillRect(x, y + 7, 8, 1);
  }

  function buildBackground() {
    bg = document.createElement('canvas'); bg.width = W; bg.height = H;
    const g = bg.getContext('2d');
    const rand = rng(7);

    // grama
    g.fillStyle = '#5aa040'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = rand() < 0.5 ? '#4c8c36' : '#6fb850';
      g.fillRect(Math.floor(rand() * W), Math.floor(rand() * H), rand() < 0.3 ? 2 : 1, 1);
    }

    // caminhos de terra
    const dirt = (x, y, w, h) => {
      g.fillStyle = '#b89a62'; g.fillRect(x - 1, y - 1, w + 2, h + 2);
      g.fillStyle = '#dcc890'; g.fillRect(x, y, w, h);
      for (let i = 0; i < w * h / 14; i++) {
        g.fillStyle = rand() < 0.5 ? '#c8b078' : '#efe2b4';
        g.fillRect(x + Math.floor(rand() * w), y + Math.floor(rand() * h), 2, 1);
      }
    };
    const hs = HOUSES[opts.cls] || HOUSES.media;
    const guild = { x: 184, y: 30, w: 60, h: 48, roof: [opts.color || '#c2523a', '#2a1a2e55'], wall: '#eadfc4', windows: 2 };
    guild.roof[1] = shade(guild.roof[0]);
    dirt(hs.x + Math.floor(hs.w / 2) - 5, hs.y + hs.h, 10, 98 - hs.y - hs.h);
    dirt(guild.x + 25, 78, 10, 20);
    dirt(0, 96, W, 16);

    // rio
    for (let y = 0; y < H; y++) {
      const x = riverX(y);
      g.fillStyle = '#3f7a34'; g.fillRect(x - 2, y, 26, 1);
      g.fillStyle = '#2c5c9c'; g.fillRect(x - 1, y, 24, 1);
      g.fillStyle = '#3f80cc'; g.fillRect(x, y, 22, 1);
    }

    // ponte
    g.fillStyle = '#2a1a2e'; g.fillRect(142, 92, 38, 24);
    for (let x = 143; x < 179; x++) {
      g.fillStyle = (x - 143) % 5 === 4 ? '#7a5028' : '#b88448';
      g.fillRect(x, 93, 1, 22);
    }
    g.fillStyle = '#6e4a24'; g.fillRect(143, 93, 36, 2); g.fillRect(143, 113, 36, 2);

    // flores
    for (let i = 0; i < 46; i++) {
      const x = Math.floor(rand() * W), y = Math.floor(rand() * H);
      if (y > 90 && y < 118) continue;
      if (x > 144 && x < 178) continue;
      g.fillStyle = rand() < 0.6 ? '#ffffff' : '#ffe066';
      g.fillRect(x, y, 2, 2);
      g.fillStyle = '#3f7a34'; g.fillRect(x, y + 2, 1, 1);
    }

    // construções
    pine(g, 104, 40); pine(g, 126, 58); pine(g, 92, 70);
    house(g, hs, '#3f9a72');
    house(g, guild, '#7a4a2a');
    barrel(g, hs.x + hs.w + 4, hs.y + hs.h - 10);
    barrel(g, guild.x - 12, 68);
    // placa da guilda
    g.fillStyle = '#2a1a2e'; g.fillRect(guild.x + 23, guild.y + 12, 14, 9);
    g.fillStyle = '#f4eedc'; g.fillRect(guild.x + 24, guild.y + 13, 12, 7);
    g.fillStyle = guild.roof[0]; g.fillRect(guild.x + 27, guild.y + 15, 6, 3);

    [8, 30, 56, 80, 112, 196, 222, 246].forEach((x, i) => pine(g, x, 142 - (i % 2) * 5));
  }

  function shade(hex) {
    const n = parseInt(hex.slice(1), 16);
    const f = v => Math.round(v * 0.72).toString(16).padStart(2, '0');
    return '#' + f(n >> 16) + f((n >> 8) & 255) + f(n & 255);
  }

  function shadow(x) {
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(Math.round(x) + 3, 109, 10, 2);
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    ctx.drawImage(bg, 0, 0);

    // brilho da água
    const ph = Math.floor(t / 260);
    ctx.fillStyle = '#9fd0ff';
    for (let i = 0; i < 16; i++) {
      const y = (i * 23 + ph * 3) % H;
      if (y > 91 && y < 116) continue;
      ctx.fillRect(riverX(y) + 3 + (i * 7) % 15, y, 3, 1);
    }

    // movimento do herói
    const moving = Math.abs(hero.tx - hero.x) > 0.5;
    if (moving) {
      hero.flip = hero.tx < hero.x;
      hero.x += Math.sign(hero.tx - hero.x) * 0.7;
    } else if (hero.back && t > hero.back) {
      hero.back = 0; hero.tx = SPOTS.mentor;
    } else if (!hero.back) hero.flip = false;

    const step = moving ? Math.floor(t / 130) % 2 : Math.floor(t / 600) % 2;
    let jy = 0;
    if (hero.jump) {
      const p = (t - hero.jump) / 800;          // dois pulinhos que vão diminuindo
      if (p >= 1) hero.jump = 0; else jy = -Math.abs(Math.sin(p * Math.PI * 2)) * 7 * (1 - p);
    }

    shadow(112); Sprites.draw(ctx, 'mentor', 112, 90, Math.floor(t / 800) % 2, true);
    shadow(hero.x); Sprites.draw(ctx, opts.charId || 'lia', hero.x, 90 + jy, step, hero.flip);

    particles = particles.filter(p => t < p.end);
    particles.forEach(p => {
      const k = (p.end - t) / 900;
      ctx.fillStyle = p.c;
      ctx.fillRect(Math.round(p.x + p.vx * (1 - k) * 20), Math.round(p.y - (1 - k) * p.rise), 1 + (k > 0.5), 1 + (k > 0.5));
    });
  }

  return {
    /* opts: { charId, cls, color } */
    start(canvas, o) {
      ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      opts = o || {};
      buildBackground();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    },
    /* Anda até 'home' ou 'guild' e depois volta para perto do mestre. */
    visit(spot) {
      hero.tx = SPOTS[spot] ?? SPOTS.mentor;
      hero.back = performance.now() + 4200;
    },
    celebrate() {
      const now = performance.now();
      hero.jump = now;
      for (let i = 0; i < 18; i++) {
        particles.push({
          x: hero.x + 8, y: 96, vx: Math.random() * 2 - 1, rise: 14 + Math.random() * 22,
          c: ['#ffe066', '#ffffff', '#ffb36b'][i % 3], end: now + 600 + Math.random() * 500,
        });
      }
    },
  };
})();
