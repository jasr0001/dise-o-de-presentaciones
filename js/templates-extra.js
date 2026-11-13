/* Lumina Slides — 30 plantillas adicionales (motivos decorativos + variantes de estilo),
 * 13 paletas y 7 combinaciones tipográficas nuevas. Todo es compatible con html2canvas
 * (SVG en línea, sin filtros ni desenfoques). */
(function () {
  'use strict';
  const PD = (window.PD = window.PD || {});

  /* ---------- Paletas nuevas ---------- */
  PD.palettes.push(
    { id: 'papel', name: 'Papel', bg: '#F3EEE3', surface: '#FBF8F1', ink: '#2B2620', muted: '#776C5E', a1: '#B4532A', a2: '#3F6B5C', a3: '#D9A23B' },
    { id: 'nordico', name: 'Nórdico', bg: '#EEF2F3', surface: '#FFFFFF', ink: '#1F2A30', muted: '#637178', a1: '#3C6E8F', a2: '#8FB3C4', a3: '#D98C5F' },
    { id: 'desierto', name: 'Desierto', bg: '#F7EBDD', surface: '#FFF6EC', ink: '#3B2618', muted: '#8A6C55', a1: '#D9733B', a2: '#A6452A', a3: '#6E8B74' },
    { id: 'rubi', name: 'Rubí', bg: '#FFF7F5', surface: '#FFFFFF', ink: '#2E0F17', muted: '#7A5560', a1: '#C2185B', a2: '#F48FB1', a3: '#5C6BC0' },
    { id: 'durazno', name: 'Durazno', bg: '#FFF4EC', surface: '#FFFFFF', ink: '#3A2A22', muted: '#8A7062', a1: '#E8774A', a2: '#F2B661', a3: '#5B8E7D' },
    { id: 'oliva', name: 'Oliva', bg: '#F2F1E6', surface: '#FAFAF2', ink: '#2D2E1F', muted: '#6F705C', a1: '#6B7A2F', a2: '#C9A227', a3: '#A34A28' },
    { id: 'cobalto', name: 'Cobalto', bg: '#F3F6FD', surface: '#FFFFFF', ink: '#0E1A3A', muted: '#5A6584', a1: '#1E4FD8', a2: '#FFB020', a3: '#E2445C' },
    { id: 'pastel', name: 'Pastel', bg: '#FBF7FF', surface: '#FFFFFF', ink: '#2E2A3D', muted: '#77718A', a1: '#8B6CEF', a2: '#5FBFAE', a3: '#F08DB1' },
    { id: 'sepia', name: 'Sepia', bg: '#EFE4D2', surface: '#F8F0E2', ink: '#3A2C1E', muted: '#7D6A55', a1: '#8B5A2B', a2: '#B9874B', a3: '#5E6B4E' },
    { id: 'selva', name: 'Selva', dark: true, bg: '#0F2019', surface: '#17301F', ink: '#EAF2EC', muted: '#9DB5A5', a1: '#5CC48A', a2: '#E6C35C', a3: '#E77E5A' },
    { id: 'grafito', name: 'Grafito', dark: true, bg: '#1C1D21', surface: '#26282E', ink: '#F1F0EC', muted: '#A3A3A0', a1: '#F2B63D', a2: '#E8E4DA', a3: '#6FA3B5' },
    { id: 'pizarra', name: 'Pizarra', dark: true, bg: '#1F2B2A', surface: '#283735', ink: '#F0F2EC', muted: '#A9B5AE', a1: '#F6C85F', a2: '#8FD3C1', a3: '#F28B82' },
    { id: 'brutal', name: 'Contraste', bg: '#F4F4EF', surface: '#FFFFFF', ink: '#0A0A0A', muted: '#55554F', a1: '#0A0A0A', a2: '#FFE14D', a3: '#FF5A36' },
    { id: 'tinta', name: 'Tinta', dark: true, bg: '#101828', surface: '#1A2438', ink: '#F5F3EE', muted: '#9AA3B5', a1: '#E9C46A', a2: '#F4A261', a3: '#8AB6D6' }
  );

  /* ---------- Tipografías nuevas (archivos ya incluidos en /fonts) ---------- */
  PD.fonts.push(
    { id: 'revista', name: 'Revista', head: 'DM Serif Display', body: 'Lato', q: '' },
    { id: 'clasica', name: 'Clásica', head: 'Merriweather', body: 'Source Serif 4', q: '' },
    { id: 'urbana', name: 'Urbana', head: 'Space Grotesk', body: 'Inter', q: '' },
    { id: 'cartel', name: 'Cartel', head: 'Bebas Neue', body: 'Open Sans', q: '' },
    { id: 'humanista', name: 'Humanista', head: 'Nunito', body: 'Lato', q: '' },
    { id: 'suave', name: 'Suave', head: 'Manrope', body: 'Inter', q: '' },
    { id: 'moda', name: 'Moda', head: 'Cormorant Garamond', body: 'Montserrat', q: '' }
  );

  /* ---------- Categorías de las plantillas originales ---------- */
  const baseCats = { aurora: 'creativa', editorial: 'editorial', suizo: 'creativa', corporativo: 'formal', neon: 'oscura', academico: 'formal', geometrico: 'creativa', minimal: 'minimal' };
  PD.templates.forEach((t) => (t.cat = baseCats[t.id] || 'creativa'));

  /* ---------- 30 plantillas nuevas ---------- */
  // motif: decoración de fondo · mods: variantes de estilo (ver css/slides-extra.css)
  const T = [
    ['boletin', 'Boletín', 'Cabecera de periódico y columnas sobrias', 'papel', 'revista', 'editorial', 'masthead', 'm-kicker-italic mk-dash m-cards-plain'],
    ['periodico', 'Periódico', 'Filetes finos, serif clásica y tono sepia', 'sepia', 'clasica', 'editorial', 'columns', 'm-kicker-caps mk-square m-cards-plain r-0'],
    ['cuaderno', 'Cuaderno', 'Hoja rayada con margen, cercana y escolar', 'nordico', 'humanista', 'creativa', 'notebook', 'mk-check m-cards-soft'],
    ['pizarra', 'Pizarra', 'Marco de madera y tiza sobre verde oscuro', 'pizarra', 'humanista', 'oscura', 'chalk', 'mk-dash m-cards-outline'],
    ['bauhaus', 'Bauhaus', 'Círculo, cuadrado y triángulo primarios', 'cobalto', 'geometrica', 'creativa', 'bauhaus', 'm-upper r-0 mk-square m-cards-hard'],
    ['nordico', 'Nórdico', 'Arco suave, calma y mucho aire', 'nordico', 'suave', 'minimal', 'arch', 'mk-ring m-cards-soft r-lg'],
    ['selva', 'Selva', 'Hojas botánicas sobre verde profundo', 'selva', 'revista', 'oscura', 'leaves', 'mk-leaf m-cards-soft'],
    ['desierto', 'Desierto', 'Dunas cálidas y sol bajo', 'desierto', 'moda', 'calida', 'dunes', 'm-kicker-caps mk-dash m-cards-plain'],
    ['brutalista', 'Brutalista', 'Bordes gruesos, sombras duras, sin adornos', 'brutal', 'urbana', 'creativa', 'brutal', 'm-upper r-0 mk-square m-cards-hard m-title-bar'],
    ['retro', 'Retro 70', 'Franjas curvas y colores de los setenta', 'durazno', 'amigable', 'creativa', 'retro', 'mk-dot m-cards-soft r-lg'],
    ['cientifico', 'Científico', 'Papel milimetrado y datos precisos', 'oceano', 'tecnica', 'formal', 'graph', 'm-kicker-mono mk-arrow m-cards-outline r-0'],
    ['ejecutivo', 'Ejecutivo', 'Banda lateral oscura y acentos dorados', 'tinta', 'urbana', 'formal', 'sidebar', 'mk-square m-cards-outline'],
    ['galeria', 'Galería', 'Marco de museo, blanco y negro elegante', 'mono', 'moda', 'minimal', 'gallery', 'm-kicker-caps mk-dash m-cards-plain r-0'],
    ['origami', 'Origami', 'Pliegues triangulares en tonos pastel', 'pastel', 'suave', 'creativa', 'origami', 'mk-tri m-cards-soft'],
    ['semitono', 'Semitono', 'Trama de puntos de imprenta y titulares grandes', 'rubi', 'cartel', 'creativa', 'halftone', 'm-upper mk-square m-cards-hard r-0'],
    ['cobalto', 'Cobalto', 'Bloque de color partido y banda de títulos', 'cobalto', 'urbana', 'formal', 'split', 'm-band mk-square m-cards-outline'],
    ['boleto', 'Boleto', 'Troquel de entrada y tipografía de cartel', 'oliva', 'cartel', 'creativa', 'ticket', 'm-upper mk-arrow m-cards-outline r-0'],
    ['acuarela', 'Acuarela', 'Manchas suaves y serif delicada', 'pastel', 'elegante', 'calida', 'watercolor', 'm-kicker-italic mk-dot m-cards-soft r-lg'],
    ['constelacion', 'Constelación', 'Órbitas y estrellas sobre azul noche', 'tinta', 'suave', 'oscura', 'orbit', 'mk-star m-cards-outline'],
    ['mosaico', 'Mosaico', 'Teselas de color en las esquinas', 'oliva', 'geometrica', 'creativa', 'mosaic', 'mk-square m-cards-soft r-0'],
    ['amanecer', 'Amanecer', 'Rayos de sol y tonos durazno', 'durazno', 'revista', 'calida', 'sunrise', 'm-kicker-italic mk-dot m-cards-soft'],
    ['panal', 'Panal', 'Celdas hexagonales y ámbar sobre grafito', 'grafito', 'urbana', 'oscura', 'hex', 'mk-hex m-cards-outline'],
    ['flechas', 'Flechas', 'Chevrones dinámicos que empujan hacia adelante', 'atardecer', 'geometrica', 'creativa', 'chevrons', 'm-upper mk-arrow m-cards-hard r-0'],
    ['ritmo', 'Ritmo', 'Barras de ecualizador y energía nocturna', 'pizarra', 'urbana', 'oscura', 'bars', 'mk-bar m-cards-outline'],
    ['fiesta', 'Fiesta', 'Confeti de formas y colores alegres', 'coral', 'amigable', 'creativa', 'confetti', 'mk-dot m-cards-soft r-lg'],
    ['marco', 'Marco clásico', 'Esquinas ornamentales y serif tradicional', 'vino', 'elegante', 'formal', 'brackets', 'm-center-head m-kicker-italic mk-diamond m-cards-plain'],
    ['cinta', 'Cinta', 'Cinta diagonal y verde fresco', 'menta', 'moderna', 'creativa', 'ribbon', 'mk-dot m-cards-soft'],
    ['tinta-oro', 'Tinta y oro', 'Doble filete dorado sobre negro', 'oro', 'lujo', 'oscura', 'goldframe', 'm-center-head m-kicker-caps mk-diamond m-cards-outline'],
    ['lineal', 'Lineal', 'Líneas paralelas finas y orden absoluto', 'nordico', 'suave', 'minimal', 'lines', 'mk-dash m-cards-plain r-0'],
    ['pop', 'Pop', 'Círculos rotundos y sombras desplazadas', 'cobalto', 'cartel', 'creativa', 'pop', 'm-upper mk-dot m-cards-hard r-lg m-title-shadow']
  ];
  T.forEach(([id, name, desc, palette, font, cat, motif, mods]) => PD.templates.push({ id, name, desc, palette, font, cat, motif, mods, extra: true }));

  PD.templateCategories = [
    { id: 'todas', name: 'Todas' },
    { id: 'formal', name: 'Formales' },
    { id: 'editorial', name: 'Editoriales' },
    { id: 'minimal', name: 'Minimalistas' },
    { id: 'creativa', name: 'Creativas' },
    { id: 'calida', name: 'Cálidas' },
    { id: 'oscura', name: 'Oscuras' }
  ];

  // Clases extra que el renderizador añade a cada diapositiva
  PD.tplClasses = (id) => {
    const t = PD.getTemplate(id);
    return t && t.extra ? 'tplx m-' + t.motif + ' ' + t.mods : '';
  };

  /* ---------- Motivos decorativos (SVG 1280×720) ---------- */
  const svg = (body, cls) => `<svg class="dx ${cls || ''}" viewBox="0 0 1280 720" preserveAspectRatio="none">${body}</svg>`;
  const rnd = (seed) => () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

  const M = {
    masthead: (big, i) => `<div class="dx-mast"><span>${big ? '' : 'Nº ' + String(i + 1).padStart(2, '0')}</span></div>` + (big ? svg('<rect x="96" y="640" width="1088" height="2" class="f-ink"/><rect x="96" y="648" width="1088" height="1" class="f-ink"/>') : ''),
    columns: (big) => svg((big ? '' : '<rect x="96" y="40" width="1088" height="3" class="f-ink"/>') + '<rect x="96" y="' + (big ? 120 : 48) + '" width="1088" height="1" class="f-ink"/><rect x="96" y="672" width="1088" height="1" class="f-ink"/>'),
    notebook: () => svg(Array.from({ length: 17 }, (_, k) => `<rect x="0" y="${60 + k * 40}" width="1280" height="1.5" class="f-a2 o4"/>`).join('') + '<rect x="70" y="0" width="2.5" height="720" class="f-a3 o7"/>'),
    chalk: (big) => svg('<rect x="0" y="0" width="1280" height="720" fill="none" stroke-width="34" class="s-wood"/><rect x="17" y="17" width="1246" height="686" fill="none" stroke-width="2" class="s-a1 o4"/>' + (big ? '<path d="M180 610 q 60 -30 120 0 t 120 0" fill="none" stroke-width="5" stroke-linecap="round" class="s-ink o5"/>' : '')),
    bauhaus: (big, i) => big
      ? svg('<circle cx="1070" cy="200" r="190" class="f-a1"/><rect x="820" y="420" width="260" height="260" class="f-a2"/><polygon points="1120,700 1280,700 1280,470" class="f-a3"/><rect x="0" y="0" width="28" height="720" class="f-ink"/>')
      : svg(`<circle cx="1220" cy="${i % 2 ? 660 : 60}" r="70" class="f-a1"/><rect x="1160" y="${i % 2 ? 40 : 600}" width="70" height="70" class="f-a2"/><rect x="0" y="0" width="16" height="720" class="f-ink"/>`),
    arch: (big) => big ? svg('<path d="M760 720 L760 330 A 260 260 0 0 1 1280 330 L1280 720 Z" class="f-a2 o5"/><circle cx="1020" cy="300" r="70" class="f-a3 o9"/>') : svg('<path d="M1100 720 L1100 560 A 90 90 0 0 1 1280 560 L1280 720 Z" class="f-a2 o4"/>'),
    leaves: (big) => {
      const leaf = (x, y, r, s, c) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0 C 60 -90 160 -90 220 0 C 160 90 60 90 0 0 Z" class="${c}"/><path d="M0 0 L 220 0" stroke-width="3" class="s-bg o5" fill="none"/></g>`;
      return big ? svg(leaf(1000, 120, 35, 1.4, 'f-a1 o8') + leaf(1080, 420, -25, 1.1, 'f-a3 o7') + leaf(860, 640, 15, 0.9, 'f-a2 o7') + leaf(-40, 700, -40, 0.9, 'f-a1 o5')) : svg(leaf(1150, 40, 40, 0.7, 'f-a1 o7') + leaf(1210, 650, -30, 0.5, 'f-a3 o6'));
    },
    dunes: (big) => svg(`<circle cx="1040" cy="${big ? 260 : 120}" r="${big ? 90 : 40}" class="f-a3 o8"/><path d="M0 ${big ? 560 : 650} C 260 ${big ? 480 : 610} 520 ${big ? 640 : 700} 820 ${big ? 560 : 650} S 1180 ${big ? 500 : 620} 1280 ${big ? 540 : 640} L1280 720 L0 720 Z" class="f-a1 o5"/><path d="M0 ${big ? 630 : 690} C 300 ${big ? 580 : 660} 620 ${big ? 700 : 720} 1280 ${big ? 600 : 680} L1280 720 L0 720 Z" class="f-a2 o6"/>`),
    brutal: (big) => svg('<rect x="22" y="22" width="1236" height="676" fill="none" stroke-width="10" class="s-ink"/>' + (big ? '<rect x="1040" y="22" width="218" height="140" class="f-a1"/><rect x="22" y="590" width="300" height="108" class="f-a2"/>' : '<rect x="1150" y="22" width="108" height="56" class="f-a1"/>')),
    retro: (big) => {
      const cs = ['s-a1', 's-a2', 's-a3', 's-ink'];
      return big
        ? svg(cs.map((c, k) => `<circle cx="1280" cy="720" r="${560 - k * 70}" fill="none" stroke-width="56" class="${c}"/>`).join(''))
        : svg(['f-a1', 'f-a2', 'f-a3'].map((c, k) => `<rect x="0" y="${688 + k * 10}" width="1280" height="10" class="${c}"/>`).join(''));
    },
    graph: () => svg(Array.from({ length: 33 }, (_, k) => `<rect x="${k * 40}" y="0" width="1" height="720" class="f-a1 ${k % 5 ? 'o1' : 'o25'}"/>`).join('') + Array.from({ length: 19 }, (_, k) => `<rect x="0" y="${k * 40}" width="1280" height="1" class="f-a1 ${k % 5 ? 'o1' : 'o25'}"/>`).join('')),
    sidebar: (big) => svg(big ? '<rect x="0" y="0" width="430" height="720" class="f-surface"/><rect x="430" y="0" width="6" height="720" class="f-a1"/>' : '<rect x="0" y="0" width="40" height="720" class="f-surface"/><rect x="40" y="0" width="4" height="720" class="f-a1"/>'),
    gallery: (big) => big ? svg('<rect x="700" y="90" width="480" height="540" class="f-ink o1"/><rect x="680" y="70" width="480" height="540" class="f-surface"/><rect x="680" y="70" width="480" height="540" fill="none" stroke-width="2" class="s-ink"/><circle cx="880" cy="290" r="120" class="f-a1"/><rect x="930" y="330" width="150" height="200" class="f-a3 o8"/><rect x="760" y="470" width="240" height="6" class="f-ink"/>') : svg('<rect x="96" y="660" width="140" height="2" class="f-ink"/>'),
    origami: (big) => big ? svg('<polygon points="880,0 1280,0 1280,400" class="f-a1 o7"/><polygon points="880,0 1280,400 1040,360" class="f-a2 o6"/><polygon points="0,720 0,420 300,720" class="f-a3 o6"/><polygon points="0,420 180,560 300,720" class="f-a2 o4"/>') : svg('<polygon points="1130,0 1280,0 1280,150" class="f-a1 o6"/><polygon points="1130,0 1280,150 1210,140" class="f-a2 o5"/>'),
    halftone: (big) => {
      let out = '';
      for (let y = 0; y < 12; y++) for (let x = 0; x < 14; x++) {
        const r = Math.max(0, (big ? 15 : 9) * (1 - (x + y) / 18));
        if (r > 0.8) out += `<circle cx="${1280 - x * 30}" cy="${y * 30}" r="${r.toFixed(1)}" class="f-a1"/>`;
      }
      return svg(out + (big ? '<rect x="0" y="650" width="1280" height="70" class="f-ink"/>' : ''));
    },
    split: (big) => big ? svg('<rect x="0" y="0" width="520" height="720" class="f-a1"/><rect x="520" y="0" width="14" height="720" class="f-a2"/>') : '',
    ticket: (big) => svg('<rect x="40" y="40" width="1200" height="640" rx="18" fill="none" stroke-width="3" stroke-dasharray="14 10" class="s-ink o5"/>' + Array.from({ length: 9 }, (_, k) => `<circle cx="40" cy="${110 + k * 62}" r="12" class="f-bg"/><circle cx="1240" cy="${110 + k * 62}" r="12" class="f-bg"/>`).join('') + (big ? '<rect x="980" y="40" width="3" height="640" class="f-a1"/>' : '')),
    watercolor: (big) => svg(big
      ? '<path d="M960 60 C 1120 20 1300 140 1240 300 C 1190 430 1000 420 920 330 C 830 230 820 100 960 60 Z" class="f-a1 o2"/><path d="M1020 360 C 1160 330 1300 460 1220 600 C 1150 720 960 700 930 590 C 900 480 920 380 1020 360 Z" class="f-a2 o25"/><path d="M60 560 C 180 500 320 600 260 690 C 210 760 40 740 30 660 C 20 600 30 580 60 560 Z" class="f-a3 o25"/>'
      : '<path d="M1110 -20 C 1240 -40 1320 80 1260 170 C 1210 240 1090 220 1060 140 C 1030 60 1040 -10 1110 -20 Z" class="f-a1 o2"/>'),
    orbit: (big) => {
      const r = rnd(7); let stars = '';
      for (let k = 0; k < (big ? 40 : 18); k++) stars += `<circle cx="${(r() * 1280).toFixed(0)}" cy="${(r() * 720).toFixed(0)}" r="${(r() * 2 + 0.6).toFixed(1)}" class="f-ink o5"/>`;
      return svg(stars + (big ? '<ellipse cx="1000" cy="330" rx="330" ry="120" fill="none" stroke-width="2" class="s-a1 o6" transform="rotate(-18 1000 330)"/><ellipse cx="1000" cy="330" rx="220" ry="70" fill="none" stroke-width="1.5" class="s-a2 o5" transform="rotate(-18 1000 330)"/><circle cx="1000" cy="330" r="46" class="f-a1"/><circle cx="1290" cy="230" r="10" class="f-a3"/>' : '<ellipse cx="1180" cy="80" rx="160" ry="50" fill="none" stroke-width="1.5" class="s-a1 o5" transform="rotate(-18 1180 80)"/><circle cx="1180" cy="80" r="16" class="f-a1"/>'));
    },
    mosaic: (big) => {
      const cs = ['f-a1', 'f-a2', 'f-a3', 'f-ink o2', 'f-surface']; const r = rnd(3); let out = '';
      const n = big ? 5 : 3;
      for (let y = 0; y < n; y++) for (let x = 0; x < n - y; x++) out += `<rect x="${1280 - (x + 1) * 64}" y="${y * 64}" width="60" height="60" class="${cs[Math.floor(r() * cs.length)]}"/>`;
      if (big) for (let y = 0; y < 3; y++) for (let x = 0; x < 3 - y; x++) out += `<rect x="${x * 64}" y="${720 - (y + 1) * 64}" width="60" height="60" class="${cs[Math.floor(r() * cs.length)]}"/>`;
      return svg(out);
    },
    sunrise: (big) => {
      const cx = big ? 1040 : 1230, cy = big ? 720 : 0, R = big ? 700 : 230;
      let rays = '';
      for (let k = 0; k < 12; k++) { const a1 = (big ? Math.PI : 0) + (k / 12) * Math.PI, a2 = a1 + Math.PI / 24; rays += `<polygon points="${cx},${cy} ${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)} ${cx + R * Math.cos(a2)},${cy + R * Math.sin(a2)}" class="f-a2 o25"/>`; }
      return svg(rays + `<circle cx="${cx}" cy="${cy}" r="${big ? 170 : 70}" class="f-a1"/>`);
    },
    hex: (big) => {
      let out = ''; const s = 34, h = s * Math.sqrt(3);
      const cols = big ? 9 : 5, rows = big ? 8 : 4;
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows - Math.floor(c / 2); r++) {
        const x = 1280 - c * s * 1.5 - 20, y = r * h + (c % 2 ? h / 2 : 0) + 10;
        const pts = Array.from({ length: 6 }, (_, k) => `${(x + s * Math.cos(k * Math.PI / 3)).toFixed(1)},${(y + s * Math.sin(k * Math.PI / 3)).toFixed(1)}`).join(' ');
        out += `<polygon points="${pts}" fill="none" stroke-width="2" class="${(c + r) % 5 === 0 ? 's-a1' : 's-ink o2'}"/>`;
      }
      return svg(out);
    },
    chevrons: (big) => svg(Array.from({ length: big ? 4 : 2 }, (_, k) => `<polygon points="${(big ? 900 : 1150) + k * 90},${big ? 220 : 40} ${(big ? 960 : 1180) + k * 90},${big ? 360 : 100} ${(big ? 900 : 1150) + k * 90},${big ? 500 : 160} ${(big ? 940 : 1170) + k * 90},${big ? 500 : 160} ${(big ? 1000 : 1200) + k * 90},${big ? 360 : 100} ${(big ? 940 : 1170) + k * 90},${big ? 220 : 40}" class="${['f-a1', 'f-a2', 'f-a3', 'f-ink o3'][k]}"/>`).join('')),
    bars: (big) => {
      const r = rnd(11); let out = ''; const n = big ? 26 : 14, w = big ? 22 : 14, base = 720;
      for (let k = 0; k < n; k++) { const hgt = (big ? 50 : 40) + r() * (big ? 140 : 110); out += `<rect x="${1280 - (k + 1) * (w + 8)}" y="${base - hgt}" width="${w}" height="${hgt}" rx="4" class="${k % 4 === 0 ? 'f-a2' : 'f-a1'} ${k % 3 ? 'o6' : ''}"/>`; }
      return svg(out);
    },
    confetti: (big) => {
      const r = rnd(5); let out = ''; const cs = ['f-a1', 'f-a2', 'f-a3'];
      for (let k = 0; k < (big ? 46 : 16); k++) {
        let x = r() * 1280, y = r() * 720; if (!big && x < 900 && y > 90) { x = 1000 + r() * 260; y = r() * 720; }
        if (big && x < 900 && y > 40 && y < 680) x = 920 + r() * 340;
        const c = cs[k % 3], t = k % 3;
        out += t === 0 ? `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(6 + r() * 8).toFixed(0)}" class="${c}"/>` : t === 1 ? `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="22" height="9" rx="3" class="${c}" transform="rotate(${(r() * 180).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>` : `<polygon points="${x.toFixed(0)},${(y - 10).toFixed(0)} ${(x + 10).toFixed(0)},${(y + 8).toFixed(0)} ${(x - 10).toFixed(0)},${(y + 8).toFixed(0)}" class="${c}"/>`;
      }
      return svg(out);
    },
    brackets: () => {
      const c = (x, y, sx, sy) => `<path d="M${x} ${y + sy * 90} L${x} ${y} L${x + sx * 90} ${y}" fill="none" stroke-width="3" class="s-a1"/><path d="M${x + sx * 14} ${y + sy * 60} L${x + sx * 14} ${y + sy * 14} L${x + sx * 60} ${y + sy * 14}" fill="none" stroke-width="1.5" class="s-a1 o6"/><circle cx="${x + sx * 14}" cy="${y + sy * 14}" r="4" class="f-a1"/>`;
      return svg(c(40, 40, 1, 1) + c(1240, 40, -1, 1) + c(40, 680, 1, -1) + c(1240, 680, -1, -1));
    },
    ribbon: (big) => big ? svg('<polygon points="760,720 1010,720 1280,360 1280,30" class="f-a1"/><polygon points="1010,720 1080,720 1280,450 1280,360" class="f-a2"/>') : svg('<polygon points="1140,0 1210,0 1280,70 1280,140" class="f-a1"/>'),
    goldframe: () => svg('<rect x="34" y="34" width="1212" height="652" fill="none" stroke-width="2" class="s-a1"/><rect x="46" y="46" width="1188" height="628" fill="none" stroke-width="1" class="s-a1 o6"/><rect x="630" y="28" width="20" height="20" transform="rotate(45 640 38)" class="f-a1"/><rect x="630" y="672" width="20" height="20" transform="rotate(45 640 682)" class="f-a1"/>'),
    lines: (big) => svg(Array.from({ length: big ? 14 : 7 }, (_, k) => `<rect x="${big ? 760 : 1060}" y="${(big ? 380 : 560) + k * 22}" width="${(big ? 520 : 220) - k * (big ? 24 : 18)}" height="2" class="${k % 4 === 0 ? 'f-a1' : 'f-ink o2'}" transform="translate(${k * (big ? 24 : 18)} 0)"/>`).join('')),
    pop: (big) => big ? svg('<circle cx="1060" cy="360" r="250" class="f-a2"/><circle cx="1060" cy="360" r="250" fill="none" stroke-width="10" class="s-ink" transform="translate(-18 -18)"/><circle cx="160" cy="640" r="70" class="f-a3"/><circle cx="160" cy="640" r="70" fill="none" stroke-width="8" class="s-ink" transform="translate(-10 -10)"/>') : svg('<circle cx="1230" cy="60" r="80" class="f-a2"/><circle cx="1230" cy="60" r="80" fill="none" stroke-width="6" class="s-ink" transform="translate(-10 -10)"/>')
  };

  const baseDecor = PD.decor;
  PD.decor = (tpl, type, i) => {
    const t = PD.getTemplate(tpl);
    if (!t || !t.extra) return baseDecor(tpl, type, i);
    const big = type === 'cover' || type === 'closing' || type === 'divider' || type === 'quote';
    const fn = M[t.motif];
    return fn ? fn(big, i) : '';
  };
})();
