/* Sprites em pixel art 16x20, desenhados por código (sem imagens externas).
   Letras do molde: O contorno · H cabelo · S pele · E olho · T roupa · A detalhe
   P calça · B bota · W branco · G óculos */

const Sprites = (() => {
  const BASE = [
    '................',
    '.....OOOOOO.....',
    '....OHHHHHHO....',
    '...OHHHHHHHHO...',
    '...OHHHHHHHHO...',
    '...OHHSSSSHHO...',
    '...OHSESSESHO...',
    '...OSSESSESSO...',
    '....OSSSSSSO....',
    '.....OSSSSO.....',
    '....OOTTTTOO....',
    '...OTTTAATTTO...',
    '..OSOTTAATTOSO..',
    '..OSOTTTTTTOSO..',
    '...OOTTTTTTOO...',
    '....OPPPPPPO....',
    '....OPPOOPPO....',
    '....OPPOOPPO....',
    '....OBBOOBBO....',
    '....OOO..OOO....',
  ];

  const set = (rows, r, str) => { rows[r] = str; };
  const put = (rows, r, c, ch) => { rows[r] = rows[r].slice(0, c) + ch + rows[r].slice(c + 1); };

  const MODS = {
    long(rows) {            // cabelo comprido caindo nos ombros
      for (let r = 7; r <= 10; r++) {
        const first = rows[r].search(/[^.]/);
        for (let c = 3; c < Math.max(first, 4); c++) { put(rows, r, c, 'H'); put(rows, r, 15 - c, 'H'); }
        put(rows, r, 2, 'O'); put(rows, r, 13, 'O');
      }
    },
    buns(rows) {            // dois coques
      set(rows, 1, '..OO.OOOOOO.OO..');
      set(rows, 2, '.OHHOHHHHHHOHHO.');
      set(rows, 3, '..OOHHHHHHHHOO..');
    },
    chefHat(rows) {
      set(rows, 0, '....OOOOOOOO....');
      set(rows, 1, '...OWWWWWWWWO...');
      set(rows, 2, '...OWWWWWWWWO...');
      set(rows, 3, '....OWWWWWWO....');
    },
    glasses(rows) { set(rows, 6, '...OHGEGGEGHO...'); },
    beard(rows) {
      set(rows, 8, '....OWWWWWWO....');
      set(rows, 9, '.....OWWWWO.....');
      set(rows, 10, '....OOTWWTOO....');
    },
  };

  const COMMON = { O: '#2a1a2e', E: '#1b1b2b', W: '#f4f4f4', G: '#34344e' };

  const DEFS = {
    lia:    { mods: ['long'],    H: '#8f5bd6', S: '#f2c79a', T: '#3aa6a0', A: '#bff0ea', P: '#3b4a8a', B: '#5a3a2a' },
    nina:   { mods: ['buns'],    H: '#f07aa8', S: '#ffd9b3', T: '#f2c53d', A: '#d9628f', P: '#7a4a9a', B: '#4a2a3a' },
    maya:   { mods: ['long'],    H: '#2b2233', S: '#b9794f', T: '#f4f4f4', A: '#e05a4f', P: '#4a8ab8', B: '#e8e8e8' },
    caio:   { mods: ['chefHat'], H: '#4a2f1d', S: '#d99a6c', T: '#f4f4f4', A: '#e0483a', P: '#3a3a4a', B: '#2a2a2a' },
    teo:    { mods: ['glasses'], H: '#8a5a2b', S: '#f2c79a', T: '#5aa84e', A: '#f4f4f4', P: '#6a5038', B: '#3a2a1a' },
    davi:   { mods: [],          H: '#e8c85a', S: '#ffd9b3', T: '#2d3a66', A: '#e0483a', P: '#2d3a66', B: '#1a1a1a' },
    mentor: { mods: ['long', 'beard'], H: '#dcdce8', S: '#e8b48a', T: '#6a3fa0', A: '#ffd75e', P: '#6a3fa0', B: '#3a2a4a' },
  };

  const cache = {};
  function build(id) {
    if (cache[id]) return cache[id];
    const def = DEFS[id] || DEFS.lia;
    const rows = BASE.slice();
    def.mods.forEach(m => MODS[m](rows));
    const pal = Object.assign({}, COMMON, def);
    const frames = [0, 1].map(f => {
      const c = document.createElement('canvas');
      c.width = 16; c.height = 20;
      const g = c.getContext('2d');
      rows.forEach((row, r) => {
        let y = r;
        if (f === 1) {              // 2º quadro: corpo desce 1px e perna encolhe (passinho)
          if (r === 17) return;
          if (r < 17) y = r + 1;
        }
        for (let x = 0; x < 16; x++) {
          const ch = row[x];
          if (ch === '.') continue;
          g.fillStyle = pal[ch] || '#f0f';
          g.fillRect(x, y, 1, 1);
        }
      });
      return c;
    });
    return (cache[id] = frames);
  }

  /* Desenha o personagem `id` com o canto superior esquerdo em (x, y). */
  function draw(ctx, id, x, y, frame = 0, flip = false) {
    const img = build(id)[frame % 2];
    x = Math.round(x); y = Math.round(y);
    if (flip) {
      ctx.save(); ctx.translate(x + 16, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore();
    } else ctx.drawImage(img, x, y);
  }

  return { draw };
})();
