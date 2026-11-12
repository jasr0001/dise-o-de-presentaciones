/* Lumina Slides — Plantillas, paletas y tipografías */
(function () {
  'use strict';
  const PD = (window.PD = window.PD || {});

  /* ---------- Paletas ---------- */
  PD.palettes = [
    { id: 'oceano', name: 'Océano', bg: '#F4F8FC', surface: '#FFFFFF', ink: '#0B2540', muted: '#5B7086', a1: '#0E7CC2', a2: '#13B5A6', a3: '#F2A541' },
    { id: 'atardecer', name: 'Atardecer', bg: '#FFF8F3', surface: '#FFFFFF', ink: '#2B1B17', muted: '#7A5F55', a1: '#F25C3D', a2: '#F7A93B', a3: '#8E3B8C' },
    { id: 'bosque', name: 'Bosque', bg: '#F4F7F2', surface: '#FFFFFF', ink: '#1D2B1F', muted: '#5E6F5F', a1: '#2F7D4F', a2: '#A3C24A', a3: '#D98E32' },
    { id: 'lavanda', name: 'Lavanda', bg: '#F8F6FD', surface: '#FFFFFF', ink: '#251E3E', muted: '#6D6585', a1: '#7B5CF0', a2: '#E05FB5', a3: '#3FC1C9' },
    { id: 'coral', name: 'Coral', bg: '#FFF6F4', surface: '#FFFFFF', ink: '#2A1A1F', muted: '#7C6369', a1: '#FF6F61', a2: '#2EC4B6', a3: '#FFBF69' },
    { id: 'menta', name: 'Menta', bg: '#F1FAF7', surface: '#FFFFFF', ink: '#0F2A26', muted: '#56716C', a1: '#14B88A', a2: '#0F766E', a3: '#F59E0B' },
    { id: 'vino', name: 'Vino', bg: '#FBF5F6', surface: '#FFFFFF', ink: '#2A1016', muted: '#7D5C63', a1: '#B3123F', a2: '#E8798F', a3: '#3D5A80' },
    { id: 'terracota', name: 'Terracota', bg: '#F6F0E8', surface: '#FFFBF5', ink: '#3A2A1E', muted: '#85705E', a1: '#C4683F', a2: '#6B8F71', a3: '#D9A441' },
    { id: 'mono', name: 'Monocromo', bg: '#FAFAFA', surface: '#FFFFFF', ink: '#111111', muted: '#6B6B6B', a1: '#111111', a2: '#8A8A8A', a3: '#C9C9C9' },
    { id: 'medianoche', name: 'Medianoche', dark: true, bg: '#0B1020', surface: '#151C36', ink: '#EEF2FF', muted: '#9AA4C7', a1: '#6C8CFF', a2: '#22D3EE', a3: '#F472B6' },
    { id: 'neon', name: 'Neón', dark: true, bg: '#09090E', surface: '#15151F', ink: '#F4F4F8', muted: '#8E8EA6', a1: '#39FF88', a2: '#00E1FF', a3: '#FF3DCB' },
    { id: 'oro', name: 'Oro y negro', dark: true, bg: '#101010', surface: '#1B1B1B', ink: '#F6F1E7', muted: '#A79F8F', a1: '#D4AF37', a2: '#E8D8A8', a3: '#8C6D1F' },
    { id: 'abismo', name: 'Abismo', dark: true, bg: '#071A2B', surface: '#0D2740', ink: '#E6F1FA', muted: '#8FB0CB', a1: '#38BDF8', a2: '#34D399', a3: '#FBBF24' }
  ];

  /* ---------- Tipografías (Google Fonts) ---------- */
  PD.fonts = [
    { id: 'moderna', name: 'Moderna', head: 'Poppins', body: 'Inter', q: 'family=Poppins:wght@400;600;700;800&family=Inter:wght@400;500;600' },
    { id: 'editorial', name: 'Editorial', head: 'Playfair Display', body: 'Source Serif 4', q: 'family=Playfair+Display:ital,wght@0,500;0,700;0,800;1,500&family=Source+Serif+4:wght@400;600' },
    { id: 'elegante', name: 'Elegante', head: 'Cormorant Garamond', body: 'Lato', q: 'family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Lato:wght@400;700' },
    { id: 'tecnica', name: 'Técnica', head: 'Space Grotesk', body: 'IBM Plex Sans', q: 'family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500;600' },
    { id: 'geometrica', name: 'Geométrica', head: 'Montserrat', body: 'Open Sans', q: 'family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;600' },
    { id: 'academica', name: 'Académica', head: 'Merriweather', body: 'Merriweather Sans', q: 'family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&family=Merriweather+Sans:wght@400;600' },
    { id: 'impacto', name: 'Impacto', head: 'Bebas Neue', body: 'Roboto', q: 'family=Bebas+Neue&family=Roboto:wght@400;500;700' },
    { id: 'amigable', name: 'Amigable', head: 'Nunito', body: 'Nunito Sans', q: 'family=Nunito:wght@500;700;800;900&family=Nunito+Sans:wght@400;600' },
    { id: 'lujo', name: 'Lujo', head: 'DM Serif Display', body: 'DM Sans', q: 'family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;700' },
    { id: 'futurista', name: 'Futurista', head: 'Syne', body: 'Manrope', q: 'family=Syne:wght@500;700;800&family=Manrope:wght@400;500;700' }
  ];

  /* ---------- Plantillas ---------- */
  PD.templates = [
    { id: 'aurora', name: 'Aurora', desc: 'Degradados suaves y tarjetas de cristal', palette: 'lavanda', font: 'moderna' },
    { id: 'editorial', name: 'Editorial', desc: 'Estilo revista, serif y columnas', palette: 'terracota', font: 'editorial' },
    { id: 'suizo', name: 'Suizo', desc: 'Retícula audaz y bloques de color', palette: 'atardecer', font: 'geometrica' },
    { id: 'corporativo', name: 'Corporativo', desc: 'Limpio, sobrio y profesional', palette: 'oceano', font: 'tecnica' },
    { id: 'neon', name: 'Neón', desc: 'Oscuro, tecnológico y luminoso', palette: 'neon', font: 'futurista' },
    { id: 'academico', name: 'Académico', desc: 'Clásico para tesis y artículos', palette: 'vino', font: 'academica' },
    { id: 'geometrico', name: 'Geométrico', desc: 'Formas lúdicas y color vibrante', palette: 'coral', font: 'amigable' },
    { id: 'minimal', name: 'Minimal', desc: 'Espacio en blanco y elegancia', palette: 'mono', font: 'lujo' }
  ];

  PD.getPalette = (id, custom) => {
    if (id === 'custom' && custom) return custom;
    return PD.palettes.find((p) => p.id === id) || PD.palettes[0];
  };
  PD.getFont = (id) => PD.fonts.find((f) => f.id === id) || PD.fonts[0];
  PD.getTemplate = (id) => PD.templates.find((t) => t.id === id) || PD.templates[0];

  /* ---------- Utilidades de color ---------- */
  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  function mix(a, b, t) {
    const x = hexToRgb(a), y = hexToRgb(b);
    return rgbToHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
  }
  function luminance(h) {
    const c = hexToRgb(h).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) {
    const l1 = luminance(a), l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function rgba(h, a) {
    const c = hexToRgb(h);
    return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  }
  PD.color = { hexToRgb, rgbToHex, mix, luminance, contrast, rgba };

  /* Construye una paleta completa a partir de 3 colores elegidos por el usuario */
  PD.buildCustomPalette = (bg, a1, a2) => {
    const dark = luminance(bg) < 0.2;
    const ink = dark ? mix(bg, '#FFFFFF', 0.93) : mix(bg, '#000000', 0.88);
    return {
      id: 'custom', name: 'Personalizada', dark, bg,
      surface: dark ? mix(bg, '#FFFFFF', 0.06) : mix(bg, '#FFFFFF', 0.7),
      ink, muted: mix(ink, bg, 0.42), a1, a2, a3: mix(a1, a2, 0.5)
    };
  };

  /* Variables CSS para una diapositiva */
  PD.themeVars = (pal, font) => {
    const onA1 = contrast(pal.a1, '#FFFFFF') >= 3 ? '#FFFFFF' : '#111111';
    const onA2 = contrast(pal.a2, '#FFFFFF') >= 3 ? '#FFFFFF' : '#111111';
    // Color de acento legible sobre el fondo
    let accentText = pal.a1;
    if (contrast(pal.a1, pal.bg) < 3) accentText = pal.dark ? mix(pal.a1, '#FFFFFF', 0.4) : mix(pal.a1, '#000000', 0.45);
    const vars = {
      '--bg': pal.bg, '--surface': pal.surface, '--ink': pal.ink, '--muted': pal.muted,
      '--a1': pal.a1, '--a2': pal.a2, '--a3': pal.a3, '--on-a1': onA1, '--on-a2': onA2,
      '--accent-text': accentText,
      '--line': rgba(pal.ink, pal.dark ? 0.16 : 0.12),
      '--a1-soft': rgba(pal.a1, pal.dark ? 0.2 : 0.12),
      '--a2-soft': rgba(pal.a2, pal.dark ? 0.2 : 0.12),
      '--a3-soft': rgba(pal.a3, pal.dark ? 0.2 : 0.14),
      '--a1-glow': rgba(pal.a1, 0.55),
      '--card': pal.dark ? rgba('#FFFFFF', 0.05) : rgba(pal.surface, 0.86),
      '--shadow': pal.dark ? '0 18px 40px rgba(0,0,0,.45)' : '0 18px 40px ' + rgba(pal.ink, 0.08),
      '--font-head': `'${font.head}', 'Segoe UI', sans-serif`,
      '--font-body': `'${font.body}', 'Segoe UI', sans-serif`
    };
    return Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';');
  };

  /* ---------- Carga de fuentes ---------- */
  // Las fuentes están alojadas localmente en /fonts (css/fonts.css); aquí solo esperamos a que carguen
  const loadedFonts = {};
  PD.loadFont = (font) => {
    if (loadedFonts[font.id]) return loadedFonts[font.id];
    const tests = [`700 40px '${font.head}'`, `400 40px '${font.head}'`, `400 20px '${font.body}'`, `600 20px '${font.body}'`, `700 20px '${font.body}'`];
    loadedFonts[font.id] = Promise.race([
      Promise.all(tests.map((t) => document.fonts.load(t).catch(() => null))).then(() => true),
      new Promise((r) => setTimeout(() => r(false), 6000))
    ]);
    return loadedFonts[font.id];
  };

  /* ---------- Decoraciones SVG por plantilla ---------- */
  // Devuelve HTML decorativo para el fondo de cada diapositiva (compatible con html2canvas: sin filtros ni blur)
  PD.decor = (tpl, type, i) => {
    const big = type === 'cover' || type === 'closing' || type === 'divider' || type === 'quote';
    switch (tpl) {
      case 'aurora':
        return big
          ? `<div class="d-blob b1"></div><div class="d-blob b2"></div><div class="d-blob b3"></div>
             <svg class="d-rings" viewBox="0 0 400 400"><circle cx="200" cy="200" r="190" /><circle cx="200" cy="200" r="140" /><circle cx="200" cy="200" r="90" /></svg>`
          : `<div class="d-blob b1 sm"></div><div class="d-blob b2 sm"></div>`;
      case 'editorial':
        return `<div class="d-rule-top"></div><div class="d-issue">${big ? '' : 'Nº ' + String(i + 1).padStart(2, '0')}</div>`;
      case 'suizo':
        return big
          ? `<div class="d-block"></div><div class="d-circle"></div><div class="d-grid"></div>`
          : `<div class="d-strip"></div><div class="d-grid"></div><div class="d-dot"></div>`;
      case 'corporativo':
        return `<div class="d-band"></div>${big ? '<div class="d-corner"></div><svg class="d-chev" viewBox="0 0 200 200"><path d="M0 0 L120 100 L0 200 Z"/><path d="M60 0 L180 100 L60 200 Z"/></svg>' : '<div class="d-foot"></div>'}`;
      case 'neon':
        return `<div class="d-gridlines"></div>${big ? '<div class="d-glow g1"></div><div class="d-glow g2"></div><svg class="d-wave" viewBox="0 0 1280 200" preserveAspectRatio="none"><path d="M0 120 C 200 40, 400 200, 640 110 S 1080 30, 1280 120"/><path d="M0 150 C 220 70, 420 220, 640 140 S 1060 60, 1280 150"/></svg>' : '<div class="d-glow g1 sm"></div><div class="d-scan"></div>'}`;
      case 'academico':
        return big
          ? `<div class="d-frame"></div><div class="d-crest"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="38"/><path d="M30 62 L50 30 L70 62 Z"/></svg></div>`
          : `<div class="d-header"></div><div class="d-footline"></div>`;
      case 'geometrico':
        return big
          ? `<svg class="d-shapes" viewBox="0 0 1280 720"><circle cx="1130" cy="120" r="170" class="f1"/><circle cx="1010" cy="620" r="90" class="f2"/><polygon points="80,720 260,720 170,560" class="f3"/><rect x="1180" y="420" width="70" height="70" rx="14" class="f3" transform="rotate(20 1215 455)"/><circle cx="120" cy="90" r="26" class="f2"/></svg>`
          : `<svg class="d-shapes" viewBox="0 0 1280 720"><circle cx="1250" cy="40" r="110" class="f1"/><circle cx="1205" cy="${i % 2 ? 170 : 150}" r="24" class="f2"/><polygon points="0,720 90,720 0,630" class="f3"/></svg>`;
      case 'minimal':
        return big ? `<div class="d-line-v"></div><div class="d-mark"></div>` : `<div class="d-line-h"></div>`;
      default:
        return '';
    }
  };
})();
