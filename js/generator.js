/* Lumina Slides — Generador del guion de diapositivas según el nivel de detalle */
(function () {
  'use strict';
  const PD = (window.PD = window.PD || {});
  const wc = (s) => (s.match(/\S+/g) || []).length;

  PD.levels = [
    { id: 1, name: 'Esencial', desc: 'Lo imprescindible. Ideal para una exposición rápida de 5 minutos.', sections: 4, perSection: 1, bullets: 3, words: 14 },
    { id: 2, name: 'Equilibrado', desc: 'Ideas principales con datos y contexto. Perfecto para clases y reuniones.', sections: 6, perSection: 1, bullets: 4, words: 20 },
    { id: 3, name: 'Detallado', desc: 'Cada sección desarrollada, con separadores, cronología y conceptos.', sections: 9, perSection: 2, bullets: 5, words: 26 },
    { id: 4, name: 'Exhaustivo', desc: 'Cobertura extrema: todo el documento, glosario, referencias y notas completas.', sections: 18, perSection: 3, bullets: 6, words: 34 }
  ];

  PD.elementList = [
    { id: 'agenda', name: 'Índice / agenda' },
    { id: 'summary', name: 'Resumen ejecutivo' },
    { id: 'dividers', name: 'Separadores de sección' },
    { id: 'stats', name: 'Datos clave' },
    { id: 'chart', name: 'Gráfico de cifras' },
    { id: 'timeline', name: 'Cronología' },
    { id: 'quote', name: 'Cita destacada' },
    { id: 'concepts', name: 'Conceptos clave' },
    { id: 'images', name: 'Imágenes del documento' },
    { id: 'tables', name: 'Tablas' },
    { id: 'glossary', name: 'Glosario' },
    { id: 'conclusions', name: 'Conclusiones' },
    { id: 'references', name: 'Referencias' },
    { id: 'closing', name: 'Cierre y preguntas' }
  ];

  PD.defaultElements = (level) => {
    const on = {
      1: ['stats', 'conclusions', 'closing'],
      2: ['agenda', 'summary', 'stats', 'chart', 'quote', 'images', 'conclusions', 'closing'],
      3: ['agenda', 'summary', 'dividers', 'stats', 'chart', 'timeline', 'quote', 'concepts', 'images', 'tables', 'conclusions', 'closing'],
      4: PD.elementList.map((e) => e.id)
    }[level];
    const o = {};
    PD.elementList.forEach((e) => (o[e.id] = on.includes(e.id)));
    return o;
  };

  const jaccard = (a, b) => {
    const A = new Set(a), B = new Set(b);
    let i = 0;
    A.forEach((x) => B.has(x) && i++);
    return i / (A.size + B.size - i || 1);
  };

  function pickSentences(list, n, taken) {
    const out = [];
    for (const s of list) {
      if (out.length >= n) break;
      if (taken.has(s)) continue;
      if (out.some((o) => jaccard(o.stems || [], s.stems || []) > 0.45)) continue;
      out.push(s);
    }
    out.forEach((s) => taken.add(s));
    return out;
  }

  let uid = 0;
  const id = () => 's' + Date.now().toString(36) + (uid++).toString(36);

  PD.generate = function (A, opts) {
    const lv = PD.levels.find((l) => l.id === opts.level) || PD.levels[1];
    const el = opts.elements || PD.defaultElements(lv.id);
    const lab = A.labels;
    const slides = [];
    const taken = new Set();
    const maxW = lv.words;

    /* Selección de secciones por importancia, conservando el orden */
    let sections = A.sections.filter((s) => s.sentences.length);
    const conclusion = el.conclusions ? sections.filter((s) => s.isConclusion).pop() : null;
    let body = sections.filter((s) => s !== conclusion && !(s.isAbstract && sections.length > 2));
    const importance = (s) => (s.rank.slice(0, 3).reduce((a, x) => a + x.score, 0)) * Math.log(2 + s.words);
    if (body.length > lv.sections) {
      const keep = new Set(body.slice().sort((a, b) => importance(b) - importance(a)).slice(0, lv.sections));
      body = body.filter((s) => keep.has(s));
    }

    /* Portada */
    slides.push({
      id: id(), type: 'cover',
      title: opts.title || A.title,
      subtitle: opts.subtitle !== undefined && opts.subtitle !== null ? opts.subtitle : A.subtitle,
      author: opts.author || A.author || '',
      date: opts.date || '',
      kicker: A.keywords.slice(0, 3).map((k) => k.term).join(' · '),
      notes: A.sections[0]?.rank.slice(0, 3).map((x) => x.text).join(' ') || ''
    });

    /* Agenda */
    if (el.agenda && body.length >= 2) {
      slides.push({
        id: id(), type: 'agenda', title: lab.agenda,
        items: body.map((s) => s.title).concat(conclusion ? [conclusion.title] : []).slice(0, 10),
        notes: (A.lang === 'es' ? 'Recorrido de la presentación: ' : 'Presentation roadmap: ') + body.map((s) => s.title).join(', ') + '.'
      });
    }

    /* Resumen ejecutivo */
    if (el.summary) {
      const picks = body.map((s) => s.rank[0]).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, lv.id >= 4 ? 6 : lv.id >= 3 ? 5 : 4)
        .sort((a, b) => a.section - b.section || a.pos - b.pos);
      if (picks.length >= 2) {
        slides.push({
          id: id(), type: 'summary', title: lv.id >= 3 ? lab.summary : lab.keyIdeas,
          items: picks.map((p) => PD.compress(p.text, Math.min(maxW, 22))),
          notes: picks.map((p) => p.text).join(' ')
        });
      }
    }

    /* Conceptos clave */
    if (el.concepts && A.keywords.length >= 6) {
      slides.push({ id: id(), type: 'concepts', title: lab.concepts, keywords: A.keywords.slice(0, lv.id >= 4 ? 14 : 10).map((k) => ({ term: k.term, w: k.w })), notes: '' });
    }

    /* Elementos especiales y dónde insertarlos */
    const stats = el.stats ? A.stats.slice(0, lv.id >= 3 ? 4 : 3) : [];
    const pctStats = A.stats.filter((s) => s.pct && s.num <= 100).slice(0, 6);
    const specials = [];
    if (stats.length >= 2) specials.push({ at: 0.34, slide: { id: id(), type: 'stats', title: lab.stats, stats: stats.map((s) => ({ value: s.value, label: s.label })), notes: stats.map((s) => s.sentence).join(' ') } });
    if (el.chart && pctStats.length >= 3) {
      specials.push({ at: 0.45, slide: { id: id(), type: 'chart', title: lab.chart, bars: pctStats.map((s) => ({ value: s.num, display: s.value, label: PD.compress(s.label, 10) })), notes: pctStats.map((s) => s.sentence).join(' ') } });
    }
    if (el.timeline && A.timeline.length >= 3) {
      let ev = A.timeline;
      const maxEv = lv.id >= 4 ? 7 : 5;
      if (ev.length > maxEv) ev = ev.slice().sort((a, b) => b.score - a.score).slice(0, maxEv).sort((a, b) => a.year - b.year);
      specials.push({ at: 0.55, slide: { id: id(), type: 'timeline', title: lab.timeline, events: ev.map((e) => ({ label: e.label, text: PD.compress(e.text, 12) })), notes: '' } });
    }
    if (el.quote) {
      const q = A.quotes.find((x) => wc(x.text) <= 45);
      const pull = q ? { text: q.text, author: q.author } : A.pull ? { text: A.pull.text.replace(/[.]$/, ''), author: '' } : null;
      if (pull) specials.push({ at: 0.75, slide: { id: id(), type: 'quote', title: lab.quote, quote: pull.text, author: pull.author || '', notes: pull.text } });
    }

    /* Diapositivas de contenido */
    const layouts = ['bullets', 'highlight', 'split', 'cards', 'bullets', 'numbered'];
    let li = 0;
    const content = [];
    body.forEach((s, si) => {
      const group = [];
      if (el.dividers) {
        const best = s.rank[0];
        group.push({ id: id(), type: 'divider', number: si + 1, title: s.title, subtitle: best ? PD.compress(best.text, 16) : '', notes: '' });
      }
      const room = lv.bullets;
      const nSlides = Math.max(1, Math.min(lv.perSection, Math.ceil(s.sentences.length / (room * 1.7))));
      // Prefiere elementos de lista si la sección es básicamente una lista
      const pool = el.quote ? s.rank.filter((x) => !x.isQuote) : s.rank;
      const chosen = pickSentences(pool, room * nSlides, taken).sort((a, b) => a.pos - b.pos);
      // Reparte las frases en diapositivas respetando un presupuesto de palabras para que nunca se desborden
      const budget = 82;
      const chunks = [];
      let cur = [], words = 0;
      chosen.forEach((x) => {
        const w = Math.min(wc(x.text), maxW + 1);
        if (cur.length && (cur.length >= room || words + w > budget)) { chunks.push(cur); cur = []; words = 0; }
        cur.push(x); words += w;
      });
      if (cur.length) chunks.push(cur);
      // Si salen demasiadas, conserva las frases más importantes
      while (chunks.length > nSlides + (lv.id >= 3 ? 1 : 0)) {
        const all = chunks.flat();
        const drop = all.slice().sort((a, b) => a.score - b.score)[0];
        const c = chunks.find((ch) => ch.includes(drop));
        c.splice(c.indexOf(drop), 1);
        for (let i = chunks.length - 1; i >= 0; i--) if (!chunks[i].length) chunks.splice(i, 1);
        // reagrupa
        const flat = chunks.flat(); chunks.length = 0; cur = []; words = 0;
        flat.forEach((x) => { const w = Math.min(wc(x.text), maxW + 1); if (cur.length && (cur.length >= room || words + w > budget)) { chunks.push(cur); cur = []; words = 0; } cur.push(x); words += w; });
        if (cur.length) chunks.push(cur);
      }
      const total = chunks.length;
      for (let k = 0; k < total; k++) {
        const chunk = chunks[k];
        if (!chunk.length) continue;
        let layout = layouts[li++ % layouts.length];
        const texts = chunk.map((x) => PD.compress(x.text, maxW));
        const short = texts.every((t) => wc(t) <= 14) && texts.length >= 3 && texts.length <= 4;
        const sequential = s.lists.length && chunk.every((x) => x.fromList) || chunk.some((x) => /^(primer[oa]?|segund[oa]|tercer[oa]?|finalmente|paso \d|first|second|third|finally|step \d)\b/i.test(x.text));
        if (layout === 'cards' && !short) layout = 'bullets';
        if (layout === 'split' && texts.length < 4) layout = 'bullets';
        if (layout === 'numbered' && !sequential) layout = texts.length >= 4 ? 'split' : 'bullets';
        if (sequential && texts.length >= 3) layout = 'numbered';
        let statement = '';
        if (layout === 'highlight') {
          const top = chunk.slice().sort((a, b) => b.score - a.score)[0];
          if (wc(top.text) >= 9 && wc(top.text) <= 40 && chunk.length >= 2) {
            statement = PD.compress(top.text, Math.max(maxW, 24));
            texts.splice(chunk.indexOf(top), 1);
            texts.splice(3);
          } else layout = 'bullets';
        }
        const image = el.images && k === 0 && s.images[0] ? s.images[0] : null;
        if (image) layout = 'image';
        const sub = chunk[0].sub && chunk[0].sub !== s.title ? chunk[0].sub : '';
        group.push({
          id: id(), type: 'content', layout,
          title: s.title,
          kicker: sub || (total > 1 ? `${lab.part} ${k + 1}/${total}` : (el.dividers ? '' : `${String(si + 1).padStart(2, '0')}`)),
          statement,
          bullets: texts,
          image: image ? { src: image.src, alt: image.alt || '' } : null,
          notes: chunk.map((x) => x.text).join(' ') + (s.rank.length > chunk.length && lv.id >= 3 ? '\n\n' + s.rank.filter((x) => !chunk.includes(x)).slice(0, 2).map((x) => x.text).join(' ') : '')
        });
      }
      // Imágenes adicionales y tablas de esta sección
      if (el.images) s.images.slice(1, lv.id >= 4 ? 4 : 2).forEach((im, n) => group.push({ id: id(), type: 'image', title: s.title, image: { src: im.src, alt: im.alt || '' }, caption: im.alt || `${lab.figure} ${n + 2}`, notes: '' }));
      if (el.tables) s.tables.slice(0, lv.id >= 4 ? 2 : 1).forEach((t) => {
        const rows = t.rows.filter((r) => r.some((c) => c)).slice(0, 8).map((r) => r.slice(0, 6).map((c) => (c.length > 60 ? c.slice(0, 57) + '…' : c)));
        if (rows.length >= 2 && rows[0].length >= 2) group.push({ id: id(), type: 'table', title: s.title, kicker: lab.table, rows, notes: '' });
      });
      content.push(group);
    });

    // Inserta los especiales en sus posiciones relativas
    const flat = [];
    const total = content.length;
    specials.sort((a, b) => a.at - b.at);
    content.forEach((g, gi) => {
      flat.push(...g);
      while (specials.length && (gi + 1) / Math.max(total, 1) >= specials[0].at) flat.push(specials.shift().slide);
    });
    specials.forEach((sp) => flat.push(sp.slide));
    slides.push(...flat);

    /* Glosario */
    if (el.glossary && A.glossary.length >= 2) {
      slides.push({ id: id(), type: 'glossary', title: lab.glossary, items: A.glossary.slice(0, 6).map((g) => ({ term: g.term, def: g.def })), notes: '' });
    }

    /* Conclusiones */
    if (el.conclusions) {
      let picks;
      if (conclusion) picks = pickSentences(conclusion.rank, lv.bullets, taken).sort((a, b) => a.pos - b.pos);
      if (!picks || picks.length < 2) {
        const all = A.sections.flatMap((s) => s.sentences);
        const tail = all.slice(Math.floor(all.length * 0.7));
        const cue = /(en conclusi[oó]n|en resumen|por (lo )?tanto|en definitiva|finalmente|se concluye|in conclusion|overall|therefore|in summary|ultimately)/i;
        const ranked = [...tail.filter((x) => cue.test(x.text)), ...tail.slice().sort((a, b) => b.score - a.score), ...all.slice().sort((a, b) => b.score - a.score)];
        picks = pickSentences(ranked, Math.min(lv.bullets, 4), taken);
      }
      if (picks.length) slides.push({ id: id(), type: 'conclusions', title: conclusion && !conclusion.autoTitle ? conclusion.title : lab.conclusions, bullets: picks.map((p) => PD.compress(p.text, maxW)), notes: picks.map((p) => p.text).join(' ') });
    }

    /* Referencias */
    if (el.references && A.references.length) {
      slides.push({ id: id(), type: 'references', title: lab.sources, items: A.references.slice(0, 7).map((r) => (r.length > 190 ? r.slice(0, 187) + '…' : r)), notes: '' });
    }

    /* Cierre */
    if (el.closing) {
      slides.push({ id: id(), type: 'closing', title: lab.thanks, subtitle: lab.questions, kicker: opts.title || A.title, author: opts.author || A.author || '', keywords: A.keywords.slice(0, 5).map((k) => k.term), notes: '' });
    }

    return slides;
  };
})();
