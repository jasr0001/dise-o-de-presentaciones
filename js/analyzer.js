/* Lumina Slides — Motor de análisis de texto (100 % en el navegador).
 * Detecta idioma, estructura, frases clave (TF‑IDF + posición + señales), palabras clave,
 * cifras, cronologías, citas, definiciones y tablas para construir la presentación.
 */
(function () {
  'use strict';
  const PD = (window.PD = window.PD || {});

  const STOP_ES = 'a al algo algunas algunos ante antes como con contra cual cuales cuando de del desde donde dos el ella ellas ellos en entre era eran es esa esas ese eso esos esta estas este esto estos fue fueron ha han hasta hay la las le les lo los mas más me mi mis muy ni no nos o os otra otras otro otros para pero poco por porque que qué quien quienes se sea sean ser si sí sin sobre son su sus también tan tanto te tiene tienen todo todos tu tus un una unas uno unos y ya yo así cada aunque mismo misma mismos sido siendo puede pueden según solo sólo además donde dentro durante mediante tras hacia esto estas estos aquí allí bien cómo cuál cuándo dónde había habían hace hacen hacer debe deben forma parte vez veces gran grandes mayor menor mejor otro través sino lugar caso casos tipo manera modo general así decir dicho nuevo nueva ello ella tal tales sus nuestra nuestro nuestros nuestras usted ustedes él estar está están estaba estaban será serán podría podrían tener tenía haber hemos he'.split(' ');
  const STOP_EN = 'a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its itself just me more most my no nor not of off on once only or other our ours out over own same she should so some such than that the their theirs them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your also may might must shall however thus therefore within without upon among per via et al use used using one two new many much well like'.split(' ');
  const STOP = new Set([...STOP_ES, ...STOP_EN]);

  const ABBR = ['Sr', 'Sra', 'Srta', 'Dr', 'Dra', 'Ing', 'Lic', 'Prof', 'etc', 'p. ej', 'ej', 'pág', 'págs', 'núm', 'vol', 'cap', 'fig', 'figs', 'aprox', 'EE. UU', 'U.S', 'e.g', 'i.e', 'vs', 'Mr', 'Mrs', 'Ms', 'Jr', 'St', 'No', 'al', 'cf', 'approx', 'Fig', 'Eq', 'Ref', 'Inc', 'Ltd', 'Co', 'Corp', 'S.A', 'Av', 'Univ', 'Dept', 'ed', 'eds'];

  const CUES = /\b(en conclusi[oó]n|en resumen|en s[ií]ntesis|por lo tanto|en definitiva|es fundamental|es clave|es esencial|lo m[aá]s importante|cabe destacar|destaca|demuestra|demostr[oó]|revela|muestran?|indican?|sugiere|se concluye|los resultados|el objetivo|nuestro estudio|this (paper|study|article)|we (show|find|found|propose|demonstrate)|results? (show|indicate|suggest)|in conclusion|in summary|overall|importantly|key|significant(ly)?|crucial|essential|the main|our findings)\b/i;
  const ADDITIVE = /^(adem[aá]s|asimismo|igualmente|por otro lado|por otra parte|de igual (manera|forma)|del mismo modo|en este sentido|en este contexto|en efecto|as[ií] pues|as[ií] mismo|por (su|otra) parte|cabe (mencionar|se[ñn]alar|destacar) que|es (importante|necesario) (destacar|se[ñn]alar|mencionar) que|moreover|furthermore|in addition|additionally|also|besides|likewise|similarly|in this sense|in this context|indeed|notably|it is (important|worth) (to note|noting) that)\s*,?\s*/i;

  const L = {
    es: { agenda: 'Contenido', summary: 'Resumen ejecutivo', keyIdeas: 'Ideas clave', stats: 'Datos clave', timeline: 'Cronología', quote: 'Cita destacada', concepts: 'Conceptos clave', glossary: 'Glosario', conclusions: 'Conclusiones', thanks: 'Gracias', questions: '¿Preguntas?', sources: 'Referencias', section: 'Sección', part: 'Parte', table: 'Datos', figure: 'Figura', chart: 'En cifras', takeaway: 'Idea central', overview: 'Panorama', minutes: 'min de lectura' },
    en: { agenda: 'Agenda', summary: 'Executive summary', keyIdeas: 'Key ideas', stats: 'Key figures', timeline: 'Timeline', quote: 'Featured quote', concepts: 'Key concepts', glossary: 'Glossary', conclusions: 'Conclusions', thanks: 'Thank you', questions: 'Questions?', sources: 'References', section: 'Section', part: 'Part', table: 'Data', figure: 'Figure', chart: 'By the numbers', takeaway: 'Core idea', overview: 'Overview', minutes: 'min read' }
  };
  PD.labels = L;

  /* ---------- Utilidades ---------- */
  const norm = (w) => w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tokenize = (s) => (s.match(/[\p{L}][\p{L}\p{N}'’-]*/gu) || []).map((w) => w.toLowerCase());
  const isContent = (w) => w.length > 2 && !STOP.has(w) && !STOP.has(norm(w)) && !/^\d+$/.test(w);
  const wordCount = (s) => (s.match(/\S+/g) || []).length;
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  // Raíz simple para agrupar plurales (es/en)
  const stem = (w) => {
    let s = norm(w);
    if (s.length > 5) s = s.replace(/(ciones|siones)$/, 'cion').replace(/(es|s)$/, '');
    else if (s.length > 3) s = s.replace(/s$/, '');
    return s;
  };

  function detectLang(text) {
    const words = tokenize(text.slice(0, 20000));
    let es = 0, en = 0;
    const esSet = new Set(['de', 'la', 'que', 'el', 'en', 'los', 'del', 'las', 'por', 'una', 'para', 'con', 'como', 'más', 'pero', 'sus', 'es']);
    const enSet = new Set(['the', 'of', 'and', 'to', 'in', 'is', 'that', 'for', 'it', 'with', 'as', 'was', 'on', 'are', 'this', 'by']);
    words.forEach((w) => { if (esSet.has(w)) es++; if (enSet.has(w)) en++; });
    return en > es * 1.2 ? 'en' : 'es';
  }

  function splitSentences(text) {
    let t = ' ' + text.replace(/\s+/g, ' ') + ' ';
    // Protege abreviaturas y decimales
    ABBR.forEach((a) => {
      const re = new RegExp('(\\s|\\()' + a.replace(/\./g, '\\.').replace(/ /g, '\\s?') + '\\.', 'g');
      t = t.replace(re, (m) => m.replace(/\./g, '§'));
    });
    t = t.replace(/(\d)\.(\d)/g, '$1§$2').replace(/\b([A-Z])\.(?=\s?[A-Z]\.)/g, '$1§').replace(/\s([A-Z])\.\s/g, ' $1§ ');
    const parts = t.split(/(?<=[.!?…])["”»’)]?\s+(?=["“«¿¡(]?[\p{Lu}\d])/u);
    return parts.map((s) => s.replace(/§/g, '.').trim()).filter((s) => wordCount(s) >= 4 && /\p{L}{3}/u.test(s));
  }
  PD.splitSentences = splitSentences;

  /* ---------- Compresión de frases a viñetas ---------- */
  function compress(sentence, maxWords, opts = {}) {
    let s = sentence.trim();
    s = s.replace(/\s*\[[\d,\s–-]+\]/g, '') // [12], [3-5]
      .replace(/\s*\((?:[^()]*\b(19|20)\d{2}[a-z]?|[^()]*et al\.?[^()]*|fig\.?[^()]*|figura[^()]*|tabla[^()]*|table[^()]*|véase[^()]*|ver[^()]*|see[^()]*)\)/gi, '')
      .replace(/\s+/g, ' ');
    if (!opts.keepParens) s = s.replace(/\s*\([^()]{25,}\)/g, '');
    s = s.replace(ADDITIVE, '');
    s = s.replace(/^(y|e|pero|and|but)\s+/i, '');
    const qo = (s.match(/[“«]/g) || []).length, qc = (s.match(/[”»]/g) || []).length;
    if (qo !== qc || ((s.match(/"/g) || []).length % 2)) s = s.replace(/[“”«»"]/g, '');
    s = s.replace(/[.;:,\s]+$/, '');
    const words = s.split(' ');
    if (words.length > maxWords) {
      // Corta en un límite de cláusula si es posible
      const limit = words.slice(0, maxWords + 1).join(' ');
      const cut = Math.max(limit.lastIndexOf(';'), limit.lastIndexOf(':'), limit.lastIndexOf(','), limit.lastIndexOf(' – '), limit.lastIndexOf(' — '));
      const minLen = words.slice(0, Math.ceil(maxWords * 0.55)).join(' ').length;
      if (cut > minLen) s = limit.slice(0, cut);
      else {
        let w = words.slice(0, maxWords);
        // No terminar en palabra vacía
        while (w.length > 3 && STOP.has(w[w.length - 1].toLowerCase().replace(/[^\p{L}]/gu, ''))) w.pop();
        s = w.join(' ').replace(/[,;:]$/, '') + '…';
      }
    }
    s = s.replace(/[.;:,\s]+$/, (m) => (m.includes('…') ? '…' : ''));
    return cap(s.trim());
  }
  PD.compress = compress;

  /* ---------- Secciones ---------- */
  const SKIP_SECTION = /^(referencias|bibliograf[ií]a|references|bibliography|works cited|agradecimientos|acknowledg(e)?ments?|[ií]ndice|table of contents|contents|contenido|anexos?|ap[eé]ndices?|appendix|notas|notes|conflict of interest|conflicto de intereses|funding|financiaci[oó]n|author contributions|declaraci[oó]n)\b/i;
  const ABSTRACT = /^(resumen|abstract|summary|s[ií]ntesis|executive summary|resumen ejecutivo)\b/i;
  const CONCL = /^(\d+[.)]?\s*)?(conclusi[oó]n(es)?|conclusions?|discusi[oó]n|discussion|consideraciones finales|reflexiones finales|final remarks|closing|cierre|recomendaciones)\b/i;
  const REFS = /^(referencias|bibliograf[ií]a|references|bibliography|works cited)\b/i;

  function buildSections(blocks, docTitle) {
    const heads = blocks.filter((b) => b.type === 'heading');
    let title = docTitle || '';
    let startIdx = 0;
    // Primer encabezado como título del documento
    if (heads.length && blocks.indexOf(heads[0]) <= 2) {
      const h = heads[0];
      const sameLevel = heads.filter((x) => x.level === h.level).length;
      const i0 = blocks.indexOf(h);
      if (sameLevel === 1 || heads.length === 1 || (blocks[i0 + 1] && blocks[i0 + 1].type === 'heading' && blocks[i0 + 1].level >= h.level)) {
        if (!title || title.length < 4 || /^(untitled|documento|microsoft|sin t[ií]tulo)/i.test(title)) title = h.text;
        startIdx = blocks.indexOf(h) + 1;
      }
    }
    const body = blocks.slice(startIdx);
    const bh = body.filter((b) => b.type === 'heading');
    // Nivel de corte: el más alto que produzca ≥2 secciones
    const levels = [...new Set(bh.map((h) => h.level))].sort((a, b) => a - b);
    let splitLevel = null;
    for (const lv of levels) {
      if (bh.filter((h) => h.level <= lv).length >= 2) { splitLevel = lv; break; }
    }
    const sections = [];
    let cur = { title: '', blocks: [] };
    let refBlocks = null;
    body.forEach((b) => {
      if (b.type === 'heading' && splitLevel !== null && b.level <= splitLevel) {
        if (cur.blocks.length || cur.title) sections.push(cur);
        cur = { title: b.text.replace(/^(\d+(\.\d+)*|[IVXLC]+)[.)]?\s+/, ''), rawTitle: b.text, blocks: [] };
      } else if (b.type === 'heading') {
        cur.blocks.push({ type: 'sub', text: b.text.replace(/^(\d+(\.\d+)*)[.)]?\s+/, '') });
      } else cur.blocks.push(b);
    });
    if (cur.blocks.length || cur.title) sections.push(cur);

    const kept = [];
    sections.forEach((s) => {
      if (REFS.test(s.title)) { refBlocks = s.blocks; return; }
      if (SKIP_SECTION.test(s.title)) return;
      s.isAbstract = ABSTRACT.test(s.title);
      s.isConclusion = CONCL.test(s.title);
      kept.push(s);
    });
    return { title, sections: kept, refBlocks };
  }

  /* Segmentación automática cuando el documento no tiene encabezados */
  function autoSegment(paras, target) {
    const total = paras.reduce((a, p) => a + wordCount(p.text), 0);
    if (paras.length <= 1) {
      // Un solo bloque gigante: trocear por frases
      const sents = splitSentences(paras[0]?.text || '');
      const per = Math.max(4, Math.ceil(sents.length / target));
      const out = [];
      for (let i = 0; i < sents.length; i += per) out.push([{ type: 'para', text: sents.slice(i, i + per).join(' ') }]);
      return out;
    }
    const goal = total / target;
    const vecs = paras.map((p) => {
      const v = {};
      tokenize(p.text).filter(isContent).forEach((w) => { const s = stem(w); v[s] = (v[s] || 0) + 1; });
      return v;
    });
    const cos = (a, b) => {
      let dot = 0, na = 0, nb = 0;
      for (const k in a) { na += a[k] * a[k]; if (b[k]) dot += a[k] * b[k]; }
      for (const k in b) nb += b[k] * b[k];
      return dot / (Math.sqrt(na * nb) || 1);
    };
    const groups = [];
    let cur = [], acc = 0;
    paras.forEach((p, i) => {
      cur.push(p); acc += wordCount(p.text);
      const next = paras[i + 1];
      if (!next) return;
      const sim = cos(vecs[i], vecs[i + 1]);
      if ((acc >= goal * 0.7 && sim < 0.18) || acc >= goal * 1.35) { groups.push(cur); cur = []; acc = 0; }
    });
    if (cur.length) groups.push(cur);
    return groups;
  }

  /* ---------- Análisis principal ---------- */
  PD.analyze = function (parsed) {
    const blocks = (parsed.blocks || []).filter((b) => b.type !== 'para' || wordCount(b.text) >= 3);
    const fullText = blocks.map((b) => b.text || (b.items || []).join('. ') || '').join('\n');
    const lang = detectLang(fullText);
    const lab = L[lang];

    let { title, sections, refBlocks } = buildSections(blocks, parsed.title);
    if (!title || title.length < 3) title = parsed.fileTitle ? cap(parsed.fileTitle) : '';

    // Sin estructura → segmentación automática
    const totalWords = wordCount(fullText);
    const usable = sections.filter((s) => s.blocks.some((b) => b.type === 'para' || b.type === 'list'));
    if (usable.length < 2 && totalWords > 250) {
      const paras = blocks.filter((b) => b.type === 'para' || b.type === 'list').map((b) => (b.type === 'list' ? { type: 'para', text: b.items.join('. ') + '.' } : b));
      const target = Math.max(3, Math.min(12, Math.round(totalWords / 280)));
      sections = autoSegment(paras, target).map((g) => ({ title: '', blocks: g, auto: true }));
      // Conservar imágenes y tablas
      const extras = blocks.filter((b) => b.type === 'image' || b.type === 'table');
      extras.forEach((b, i) => sections[Math.min(sections.length - 1, i)].blocks.push(b));
    }

    /* Frases por sección */
    const allSentences = [];
    sections.forEach((s, si) => {
      s.sentences = [];
      s.lists = [];
      s.images = [];
      s.tables = [];
      s.quotes = [];
      s.subs = [];
      let sub = '';
      s.blocks.forEach((b) => {
        if (b.type === 'sub') { sub = b.text; s.subs.push(b.text); return; }
        if (b.type === 'para') {
          splitSentences(b.text).forEach((t, k) => {
            const o = { text: t, section: si, sub, firstInPara: k === 0, pos: s.sentences.length };
            s.sentences.push(o); allSentences.push(o);
          });
        } else if (b.type === 'list') {
          s.lists.push({ items: b.items, sub });
          b.items.forEach((t) => {
            if (wordCount(t) >= 3) {
              const o = { text: t, section: si, sub, fromList: true, pos: s.sentences.length };
              s.sentences.push(o); allSentences.push(o);
            }
          });
        } else if (b.type === 'image') s.images.push(b);
        else if (b.type === 'table') s.tables.push(b);
        else if (b.type === 'quote') s.quotes.push(b.text);
      });
      s.words = s.sentences.reduce((a, x) => a + wordCount(x.text), 0);
    });
    // Elimina secciones vacías y fusiona las muy cortas
    sections = sections.filter((s) => s.sentences.length || s.images.length || s.tables.length);
    for (let i = sections.length - 1; i > 0; i--) {
      const s = sections[i];
      if (s.words < 35 && !s.images.length && !s.tables.length && !s.isConclusion && sections.length > 3) {
        const prev = sections[i - 1];
        s.sentences.forEach((x) => { x.sub = x.sub || s.title; prev.sentences.push(x); });
        prev.lists.push(...s.lists); prev.quotes.push(...s.quotes);
        if (s.title) prev.subs.push(s.title);
        prev.words += s.words;
        sections.splice(i, 1);
      }
    }
    sections.forEach((s, si) => s.sentences.forEach((x) => (x.section = si)));

    /* TF‑IDF por raíz, usando secciones como documentos */
    const df = {}, tf = {}, surface = {};
    sections.forEach((s) => {
      const seen = new Set();
      s.sentences.forEach((x) => {
        x.tokens = tokenize(x.text).filter(isContent);
        x.stems = x.tokens.map(stem);
        x.stems.forEach((st, k) => {
          tf[st] = (tf[st] || 0) + 1;
          seen.add(st);
          const w = x.tokens[k];
          surface[st] = surface[st] || {};
          surface[st][w] = (surface[st][w] || 0) + 1;
        });
      });
      seen.forEach((st) => (df[st] = (df[st] || 0) + 1));
    });
    const N = Math.max(1, sections.length);
    const weight = {};
    Object.keys(tf).forEach((st) => {
      const idf = Math.log(1 + N / (df[st] || 1));
      weight[st] = Math.log(1 + tf[st]) * (0.6 + idf);
    });
    const bestSurface = (st) => Object.entries(surface[st] || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || st;

    /* Puntuación de frases */
    let maxScore = 0;
    allSentences.forEach((x) => {
      const uniq = [...new Set(x.stems)];
      let sc = uniq.reduce((a, st) => a + (weight[st] || 0), 0) / Math.pow(Math.max(uniq.length, 1), 0.55);
      const wc = wordCount(x.text);
      if (x.pos === 0) sc *= 1.25;
      else if (x.firstInPara) sc *= 1.1;
      if (CUES.test(x.text)) sc *= 1.25;
      if (/\d/.test(x.text)) sc *= 1.08;
      if (wc < 7) sc *= 0.7;
      if (wc > 45) sc *= 0.75;
      if (/^(figura|fig\.|tabla|table|fuente|source)\b/i.test(x.text)) sc *= 0.3;
      if (/https?:\/\/|www\.|@\w+\.\w/.test(x.text)) sc *= 0.4;
      if (/\?$/.test(x.text)) sc *= 0.8;
      if (/^[“"«]/.test(x.text) || /[”"»],?\s*(afirm|dijo|señal|explic|said|says)/i.test(x.text)) { sc *= 0.45; x.isQuote = true; }
      x.score = sc;
      maxScore = Math.max(maxScore, sc);
    });
    allSentences.forEach((x) => (x.score = x.score / (maxScore || 1)));

    /* Palabras clave (unigramas + bigramas) */
    const bigrams = {};
    allSentences.forEach((x) => {
      const toks = tokenize(x.text);
      for (let i = 0; i < toks.length - 1; i++) {
        if (isContent(toks[i]) && isContent(toks[i + 1])) {
          const k = toks[i] + ' ' + toks[i + 1];
          bigrams[k] = (bigrams[k] || 0) + 1;
        }
      }
      // Bigramas con preposición (es): "cambio de clima" → no; mantenemos solo contiguos
    });
    const kwUni = Object.keys(weight).filter((st) => tf[st] >= 2).map((st) => ({ term: bestSurface(st), stem: st, w: weight[st] * (tf[st] > 2 ? 1 : 0.8) }));
    const kwBi = Object.entries(bigrams).filter(([, c]) => c >= 2).map(([k, c]) => {
      const [a, b] = k.split(' ');
      return { term: k, stem: stem(a) + ' ' + stem(b), w: ((weight[stem(a)] || 0) + (weight[stem(b)] || 0)) * 0.62 * Math.log(1 + c) };
    });
    let keywords = [...kwBi, ...kwUni].sort((a, b) => b.w - a.w);
    const used = new Set();
    keywords = keywords.filter((k) => {
      const parts = k.stem.split(' ');
      if (parts.length === 1 && used.has(parts[0])) return false;
      if (parts.length === 2 && used.has(k.stem)) return false;
      used.add(k.stem); parts.forEach((p) => used.add(p));
      return true;
    }).slice(0, 24);
    // Respeta las mayúsculas originales (nombres propios: «América Latina»)
    keywords.forEach((k) => {
      const re = new RegExp('(^|[^\\p{L}])(' + k.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?=[^\\p{L}]|$)', 'giu');
      const forms = {};
      let m, n = 0;
      while ((m = re.exec(fullText)) && n++ < 60) forms[m[2]] = (forms[m[2]] || 0) + 1;
      const total = Object.values(forms).reduce((a, b) => a + b, 0);
      const caps = Object.entries(forms).filter(([f]) => /^\p{Lu}/u.test(f) && f.split(' ').every((w) => /^\p{Lu}/u.test(w)));
      const capCount = caps.reduce((a, [, c]) => a + c, 0);
      if (caps.length && capCount >= total * 0.6) k.term = caps.sort((a, b) => b[1] - a[1])[0][0];
    });
    const kwMax = keywords[0]?.w || 1;
    keywords.forEach((k) => (k.w = k.w / kwMax));

    /* Títulos para secciones sin título */
    sections.forEach((s, si) => {
      s.rank = s.sentences.slice().sort((a, b) => b.score - a.score);
      if (!s.title) {
        const local = {};
        s.sentences.forEach((x) => x.stems.forEach((st) => (local[st] = (local[st] || 0) + 1)));
        const scored = Object.keys(local).map((st) => ({ st, v: local[st] * Math.log(1 + N / (df[st] || 1)) })).sort((a, b) => b.v - a.v);
        const bi = Object.entries(bigrams).filter(([k, c]) => c >= 2).filter(([k]) => { const [a, b] = k.split(' '); return local[stem(a)] && local[stem(b)]; })
          .map(([k, c]) => { const [a, b] = k.split(' '); return { k, v: (local[stem(a)] + local[stem(b)]) * Math.log(1 + c) * Math.log(1 + N / (Math.max(df[stem(a)], df[stem(b)]) || 1)) }; })
          .sort((a, b) => b.v - a.v);
        let t;
        if (bi[0] && bi[0].v > (scored[0]?.v || 0) * 0.9) t = bi[0].k;
        else t = scored.slice(0, 2).map((x) => bestSurface(x.st)).join(lang === 'es' ? ' y ' : ' and ');
        s.title = cap(t || `${lab.part} ${si + 1}`);
        s.autoTitle = true;
      }
    });

    /* Cifras destacadas */
    const stats = [];
    const statRe = /(?:(?:US)?\$|€|£)\s?\d[\d.,]*\s?(?:millones|mil millones|billones|millón|millon|mil|million|billion|bn|M|k)?|\b\d{1,3}(?:[.,]\d+)?\s?%|\b\d[\d.,]*\s?(?:millones|mil millones|millón|billones|million|billion|veces|times|x)\b|\b\d[\d.,]*\s?(?:km|kg|toneladas|tons?|MW|GW|kWh|TWh|°C|grados|años|years|horas|hours|días|days|personas|people|usuarios|users|empresas|companies|países|countries|pacientes|patients|proyectos|projects|empleos|jobs)\b|\b\d{1,3}(?:[.,]\d{3})+\b/gi;
    allSentences.forEach((x) => {
      const m = x.text.match(statRe);
      if (!m) return;
      m.slice(0, 2).forEach((v) => {
        const value = v.trim().replace(/\s+%/, '%');
        if (/^(19|20)\d{2}$/.test(value)) return;
        const num = parseFloat(value.replace(/[^\d.,]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
        if (!isFinite(num) || num === 0) return;
        // Etiqueta: cláusula que contiene la cifra, sin la cifra
        const clauses = x.text.split(/[;:]|,\s(?=(?:mientras|aunque|pero|while|whereas|but)\b)/);
        const clause = clauses.find((c) => c.includes(v.trim())) || x.text;
        let label = clause.replace(v, ' ').replace(/\s+/g, ' ').replace(/^\s*(el|la|los|las|un|una|the|a|an|de|del|of)\s+(?=de\b|del\b|of\b)/i, '').replace(/^[\s,]*(de|del|of)\s+/i, '').trim();
        label = compress(label, 11).replace(/^(el|la|los|las|un|una|the|an?)\s+(?=(de|del|of)\b)/i, '').replace(/^(de|del|of)\s+/i, '');
        label = cap(label);
        if (wordCount(label) < 3) return;
        stats.push({ value: value.length > 14 ? value.replace(/\s?(millones|millón|million)/i, ' M').replace(/\s?(mil millones|billion)/i, ' mil M') : value, label, sentence: x.text, num, pct: /%/.test(value), score: x.score, section: x.section });
      });
    });
    const statSeen = new Set();
    const topStats = stats.sort((a, b) => b.score - a.score).filter((s) => {
      const k = s.value + '|' + s.label.slice(0, 20);
      if (statSeen.has(s.value) || statSeen.has(k)) return false;
      statSeen.add(s.value); statSeen.add(k);
      return true;
    });

    /* Cronología */
    const events = [];
    allSentences.forEach((x) => {
      const m = x.text.match(/\b(1[5-9]\d{2}|20\d{2})\b/g);
      if (!m) return;
      const year = m[0];
      if (/\(\s*[^()]*\b(19|20)\d{2}[a-z]?\s*\)/.test(x.text) && m.length === 1 && /et al|,\s*(19|20)\d{2}\)/.test(x.text)) return; // probablemente cita
      let txt = x.text.replace(new RegExp('^(en|in|desde|since|hacia|durante|a partir de|en el año)\\s+(el\\s+)?(año\\s+)?' + year + '\\s*,?\\s*', 'i'), '');
      events.push({ year: +year, label: year, text: compress(txt, 14), score: x.score });
    });
    const byYear = {};
    events.forEach((e) => { if (!byYear[e.year] || byYear[e.year].score < e.score) byYear[e.year] = e; });
    const timeline = Object.values(byYear).sort((a, b) => a.year - b.year);

    /* Citas */
    const quotes = [];
    sections.forEach((s) => s.quotes.forEach((q) => quotes.push({ text: q, author: '' })));
    const qre = /[“"«]([^”"»]{40,260})[”"»](?:\s*[,—–-]?\s*(?:afirm[oó]|dijo|señal[oó]|explic[oó]|said|says|according to|seg[uú]n)?\s*([\p{Lu}][\p{L}.]+(?:\s[\p{Lu}][\p{L}.]+){0,3}))?/gu;
    let qm;
    while ((qm = qre.exec(fullText))) quotes.push({ text: qm[1].trim(), author: qm[2] || '' });
    // Si no hay citas: la frase más potente como cita destacada
    const pull = allSentences.filter((x) => { const w = wordCount(x.text); return w >= 12 && w <= 32 && !/\d{3,}/.test(x.text); }).sort((a, b) => b.score - a.score)[0];

    /* Definiciones / glosario */
    const defs = [];
    const defRe = lang === 'es'
      ? /^(?:el|la|los|las|un|una)?\s*([\p{L}][\p{L}\s-]{2,38}?)\s+(?:es|son|se define como|se entiende por|consiste en|se refiere a)\s+((?:un|una|el|la|los|las|aquel|aquella|aquellos|el conjunto|la capacidad|el proceso)\b.{15,170})$/iu
      : /^(?:the|an?)?\s*([\p{L}][\p{L}\s-]{2,38}?)\s+(?:is|are|refers to|is defined as|consists of|means)\s+((?:an?|the|any|process|set)\b.{15,170})$/iu;
    allSentences.forEach((x) => {
      const m = x.text.replace(/[.]$/, '').match(defRe);
      if (m && wordCount(m[1]) <= 4 && !STOP.has(m[1].toLowerCase().trim()) && !/^(esto|esta|este|eso|this|that|it|there|which|lo|ello)$/i.test(m[1].trim())) {
        defs.push({ term: cap(m[1].trim()), def: compress(m[2], 20), score: x.score });
      }
    });
    const defSeen = new Set();
    const glossary = defs.sort((a, b) => b.score - a.score).filter((d) => { const k = norm(d.term); if (defSeen.has(k)) return false; defSeen.add(k); return true; });

    /* Referencias */
    let references = [];
    if (refBlocks) {
      refBlocks.forEach((b) => {
        if (b.type === 'para') references.push(...(b.text.length > 300 ? b.text.split(/(?<=\.)\s+(?=\[?\d+\]?\.?\s|\p{Lu}[\p{L}-]+,\s\p{Lu}\.)/u) : [b.text]));
        else if (b.type === 'list') references.push(...b.items);
      });
      references = references.map((r) => r.trim()).filter((r) => r.length > 20);
    }

    /* Autor / subtítulo */
    let subtitle = '';
    const abs = sections.find((s) => s.isAbstract);
    const firstGood = (abs || sections[0])?.rank?.[0];
    if (firstGood) subtitle = compress(firstGood.text, 18);

    const tables = sections.flatMap((s) => s.tables.map((t) => ({ ...t, section: s.title })));
    const images = sections.flatMap((s) => s.images.map((im) => ({ ...im, section: s.title })));

    return {
      title: cap(title || (lang === 'es' ? 'Presentación' : 'Presentation')),
      subtitle,
      author: parsed.author || '',
      lang,
      labels: lab,
      sections,
      keywords,
      stats: topStats,
      timeline,
      quotes,
      pull,
      glossary,
      references,
      tables,
      images,
      wordCount: totalWords,
      readingMinutes: Math.max(1, Math.round(totalWords / 220)),
      sentenceCount: allSentences.length,
      format: parsed.format,
      fileName: parsed.fileName,
      pages: parsed.pages
    };
  };
})();
