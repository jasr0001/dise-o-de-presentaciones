/* Lumina Slides — Traducción de los textos de las diapositivas al idioma elegido (es, en, fr, de, pt).
 * 1) Traductor integrado del navegador (Chrome), que funciona en el propio equipo.
 * 2) Si no existe, Google Translate: solo se envía el texto que aparece en las diapositivas.
 */
(function () {
  'use strict';
  const PD = (window.PD = window.PD || {});
  const cache = new Map();
  const GT = 'https://translate.googleapis.com/translate_a/single?client=gtx&dt=t';

  async function viaBrowser(texts, src, tgt, onStep) {
    if (!('Translator' in self) || src === 'auto') return null;
    const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
    try {
      // Solo si el modelo ya está instalado: evitamos descargas largas o que se queden colgadas
      const av = await Promise.race([self.Translator.availability({ sourceLanguage: src, targetLanguage: tgt }), timeout(3000)]);
      if (av !== 'available') return null;
      const tr = await Promise.race([self.Translator.create({ sourceLanguage: src, targetLanguage: tgt }), timeout(8000)]);
      const out = [];
      for (const t of texts) { out.push(await Promise.race([tr.translate(t), timeout(10000)])); onStep(); }
      return out;
    } catch (e) {
      return null;
    }
  }

  async function gtRequest(text, src, tgt) {
    let last;
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 20000);
        const res = await fetch(GT + '&sl=' + src + '&tl=' + tgt + '&q=' + encodeURIComponent(text), { signal: ctrl.signal }).finally(() => clearTimeout(timer));
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        return (data[0] || []).map((x) => x[0] || '').join('');
      } catch (e) {
        last = e;
        await new Promise((r) => setTimeout(r, 400 + 500 * attempt + Math.random() * 300));
      }
    }
    throw last;
  }

  async function viaGoogle(texts, src, tgt, onStep) {
    // Agrupa los textos en lotes separados por saltos de línea
    const batches = [];
    let cur = [], len = 0;
    texts.forEach((t, i) => {
      if (cur.length && (len + t.length > 1800 || cur.length >= 40)) { batches.push(cur); cur = []; len = 0; }
      cur.push(i); len += t.length + 1;
    });
    if (cur.length) batches.push(cur);
    const out = new Array(texts.length);
    let next = 0, failed = 0;
    const worker = async () => {
      while (next < batches.length) {
        const b = batches[next++];
        const joined = b.map((i) => texts[i].replace(/\n+/g, ' ')).join('\n');
        let res = null;
        try { res = (await gtRequest(joined, src, tgt)).split('\n'); } catch (e) { res = null; }
        if (res && res.length === b.length) b.forEach((i, k) => (out[i] = res[k].trim()));
        else {
          // Lote fallido o desalineado: se traduce cada texto por separado
          for (const i of b) {
            try { out[i] = (await gtRequest(texts[i], src, tgt)).trim(); } catch (e) { failed++; out[i] = texts[i]; }
          }
        }
        b.forEach(() => onStep());
      }
    };
    await Promise.all([worker(), worker()]);
    if (failed > texts.length * 0.5) throw new Error('El traductor no respondió');
    return out;
  }

  /* Traduce una lista de textos al idioma `tgt`, con caché por idioma */
  const key = (tgt, t) => tgt + '\u0001' + t;
  PD.translateTexts = async function (texts, src, tgt, onProgress) {
    const todo = [...new Set(texts.filter((t) => t && /\p{L}{2}/u.test(t) && !cache.has(key(tgt, t))))];
    if (todo.length) {
      let done = 0;
      const step = () => { done++; onProgress && onProgress(done / todo.length); };
      let res = await viaBrowser(todo, src, tgt, step);
      if (!res) res = await viaGoogle(todo, src || 'auto', tgt, step);
      todo.forEach((t, i) => cache.set(key(tgt, t), fixCase(t, res[i] || t)));
    }
    return texts.map((t) => (t && cache.has(key(tgt, t)) ? cache.get(key(tgt, t)) : t));
  };

  // Mantiene la mayúscula inicial y el estilo sin punto final de las viñetas
  function fixCase(orig, tr) {
    let t = tr.replace(/\s+/g, ' ').trim();
    if (/^\p{Lu}/u.test(orig)) t = t.charAt(0).toUpperCase() + t.slice(1);
    if (!/[.!?…]$/.test(orig)) t = t.replace(/[.]$/, '');
    return t;
  }

  /* Traduce todos los textos visibles de las diapositivas (y las notas) */
  PD.translateDeck = async function (slides, src, tgt, onProgress) {
    const lab = PD.labels[tgt] || PD.labels.es;
    const labels = new Set(Object.values(lab));
    const refs = [];
    const add = (obj, key) => {
      const v = obj[key];
      if (typeof v === 'string' && v && !labels.has(v) && !/^(\S+ \d+\/\d+|\d+)$/.test(v)) refs.push({ obj, key });
    };
    slides.forEach((s) => {
      ['title', 'subtitle', 'kicker', 'statement', 'quote', 'caption', 'notes'].forEach((k) => add(s, k));
      if (s.type === 'closing') { /* kicker = título del documento ya incluido */ }
      if (Array.isArray(s.bullets)) s.bullets.forEach((_, i) => add(s.bullets, i));
      if (Array.isArray(s.items) && s.type !== 'references') s.items.forEach((it, i) => (typeof it === 'string' ? add(s.items, i) : (add(it, 'term'), add(it, 'def'))));
      (s.stats || []).forEach((x) => { add(x, 'label'); if (/\p{L}{2}/u.test(x.value || '')) add(x, 'value'); });
      (s.bars || []).forEach((x) => add(x, 'label'));
      (s.events || []).forEach((x) => add(x, 'text'));
      if (Array.isArray(s.keywords)) s.keywords.forEach((k, i) => (typeof k === 'string' ? add(s.keywords, i) : add(k, 'term')));
      (s.rows || []).forEach((r) => r.forEach((_, j) => add(r, j)));
      if (s.image) add(s.image, 'alt');
    });
    const out = await PD.translateTexts(refs.map((r) => r.obj[r.key]), src, tgt, onProgress);
    refs.forEach((r, i) => (r.obj[r.key] = out[i]));
    return slides;
  };

  // Marca un texto ya en español para no volver a traducirlo
  PD.markTranslated = (t, tgt) => { if (t && !cache.has(key(tgt, t))) cache.set(key(tgt, t), t); };
})();
