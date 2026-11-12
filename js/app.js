/* Lumina Slides — Lógica de la aplicación */
(function () {
  'use strict';
  const PD = window.PD;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = PD.esc;

  /* ================= Estado ================= */
  const prefs = (() => { try { return JSON.parse(localStorage.getItem('lumina-prefs') || '{}'); } catch (e) { return {}; } })();
  const state = {
    parsed: null,
    analysis: null,
    slides: [],
    tpl: prefs.tpl || 'aurora',
    palette: prefs.palette || 'lavanda',
    custom: null,
    font: prefs.font || 'moderna',
    level: prefs.level || 2,
    outLang: prefs.outLang || 'es',
    elements: null,
    opts: { numbers: true, footer: true, emphasis: true, notes: true },
    meta: { title: '', subtitle: null, author: '', date: '' },
    current: 0,
    step: 1,
    maxStep: 1,
    dirty: false,
    undo: []
  };
  const savePrefs = () => { try { localStorage.setItem('lumina-prefs', JSON.stringify({ tpl: state.tpl, palette: state.palette, font: state.font, level: state.level, outLang: state.outLang })); } catch (e) { /* opcional */ } };

  const theme = (over = {}) => {
    const tpl = over.tpl || state.tpl;
    const pal = over.pal || PD.getPalette(over.palette || state.palette, state.custom);
    const font = over.font || PD.getFont(over.fontId || state.font);
    return {
      tpl, pal, font,
      vars: PD.themeVars(pal, font),
      opts: state.opts,
      deckTitle: (state.slides[0] && state.slides[0].title) || state.analysis?.title || '',
      kws: (state.analysis?.keywords || []).slice(0, 10).map((k) => k.term)
    };
  };

  /* ================= Miniaturas escaladas ================= */
  const ro = new ResizeObserver((entries) => entries.forEach((e) => scaleThumb(e.target)));
  function scaleThumb(t) {
    const s = t.firstElementChild;
    if (s) s.style.transform = `scale(${t.clientWidth / 1280})`;
  }
  function mount(container, slide, i, total, th, cls) {
    const t = document.createElement('div');
    t.className = 'thumb' + (cls ? ' ' + cls : '');
    t.innerHTML = PD.renderSlide(slide, i, total, th);
    container.appendChild(t);
    ro.observe(t);
    scaleThumb(t);
    const el = t.firstElementChild;
    PD.fitSlide(el);
    PD.loadFont(th.font).then(() => PD.fitSlide(el));
    return t;
  }

  /* ================= Toasts ================= */
  function toast(msg, type = 'ok', ms = 3600) {
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, ms);
  }

  /* ================= Pasos ================= */
  function goStep(n, scroll = true) {
    if (n > state.maxStep) return;
    state.step = n;
    $$('.panel').forEach((p) => p.classList.toggle('active', +p.dataset.panel === n));
    $$('.step-btn').forEach((b) => {
      const k = +b.dataset.step;
      b.classList.toggle('active', k === n);
      b.classList.toggle('done', k < n || (k <= state.maxStep && k !== n && k < state.maxStep));
      b.disabled = k > state.maxStep;
    });
    $$('.step-line').forEach((l, i) => l.classList.toggle('fill', i + 1 < n));
    if (n === 2) renderDesign();
    if (n === 3) renderContent();
    if (n === 4) renderEditor();
    if (scroll) $('#studio').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function unlock(n) { state.maxStep = Math.max(state.maxStep, n); }

  $$('.step-btn').forEach((b) => b.addEventListener('click', () => goStep(+b.dataset.step)));
  document.addEventListener('click', (e) => {
    const nx = e.target.closest('[data-next]');
    if (nx) { const n = +nx.dataset.next; unlock(n); goStep(n); }
    const go = e.target.closest('[data-go]');
    if (go) { e.preventDefault(); goStep(1); }
  });

  /* ================= Paso 1: documento ================= */
  const fileInput = $('#file-input');
  const dz = $('#dropzone');
  dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); fileInput.value = ''; });
  ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f) handleFile(f); });
  // Soltar en cualquier parte de la página
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => { e.preventDefault(); if (e.target.closest('#dropzone')) return; const f = e.dataTransfer?.files?.[0]; if (f) { goStep(1); handleFile(f); } });

  $$('.tab').forEach((t) => t.addEventListener('click', () => {
    $$('.tab').forEach((x) => x.classList.toggle('active', x === t));
    $$('.tab-pane').forEach((p) => p.classList.toggle('active', p.dataset.pane === t.dataset.tab));
  }));
  const paste = $('#paste-text');
  paste.addEventListener('input', () => { $('#paste-count').textContent = (paste.value.match(/\S+/g) || []).length + ' palabras'; });
  $('#paste-go').addEventListener('click', () => {
    const t = paste.value.trim();
    if ((t.match(/\S+/g) || []).length < 40) return toast('Pega al menos 40 palabras para crear una buena presentación.', 'err');
    processDoc(async () => PD.parseText(t));
  });
  const runSample = () => {
    goStep(1);
    processDoc(async () => { const p = PD.parseText(PD.sampleDoc); p.fileName = 'transicion-energetica.md'; p.format = 'MD'; return p; });
  };
  $('#sample-btn').addEventListener('click', runSample);
  $('#hero-sample').addEventListener('click', runSample);
  $('#change-doc').addEventListener('click', () => {
    $('#insights').classList.add('hidden');
    $('.upload-card').classList.remove('hidden');
  });

  function handleFile(file) {
    if (file.size > 80 * 1024 * 1024) return toast('El archivo supera los 80 MB.', 'err');
    processDoc((onProgress) => PD.parseFile(file, onProgress), file);
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function processDoc(parseFn, file) {
    const proc = $('#processing');
    $('.upload-card').classList.add('hidden');
    $('#insights').classList.add('hidden');
    proc.classList.remove('hidden');
    const steps = $$('.ps', proc);
    steps.forEach((s) => s.classList.remove('run', 'ok'));
    const bar = $('#proc-bar');
    const order = steps.map((s) => s.dataset.ps);
    const setStep = (name, pct) => {
      const k = order.indexOf(name);
      steps.forEach((s, i) => { s.classList.toggle('ok', i < k); s.classList.toggle('run', i === k); });
      bar.style.width = pct + '%';
    };
    $('[data-ps="translate"]', proc).classList.add('hidden');
    const em = $('[data-ps="read"] em', proc);
    em.textContent = file && /^image\//.test(file.type) ? '(reconocimiento óptico de texto)' : '';
    try {
      setStep('read', 8);
      const parsed = await parseFn((p) => { bar.style.width = (8 + p * 37).toFixed(0) + '%'; });
      await sleep(250);
      setStep('struct', 45);
      if (!parsed.blocks || !parsed.blocks.some((b) => b.type === 'para' || b.type === 'list')) throw new Error('No se encontró texto legible en el documento. Si es un PDF escaneado, súbelo como imagen para aplicar OCR.');
      await sleep(350);
      setStep('analyze', 58);
      await sleep(30);
      const A = PD.analyze(parsed);
      if (!A.sentenceCount) throw new Error('El documento no contiene suficientes frases para construir diapositivas.');
      await sleep(400);
      // Guarda los textos originales para poder cambiar de idioma más tarde
      A._orig = { title: A.title, subtitle: A.subtitle, sections: A.sections.map((x) => x.title), keywords: A.keywords.map((k) => k.term) };
      if (A.srcLang !== state.outLang) {
        const tp = $('[data-ps="translate"]', proc);
        tp.classList.remove('hidden');
        $('.ps-txt', tp).textContent = 'Traduciendo al ' + LANG_NAMES[state.outLang] + ' ';
        $('em', tp).textContent = '(' + (LANG_NAMES[A.srcLang] || A.srcLang.toUpperCase()) + ' → ' + LANG_NAMES[state.outLang] + ')';
        setStep('translate', 66);
      }
      await localize(A, (p) => { bar.style.width = (66 + p * 8).toFixed(0) + '%'; });
      state.parsed = parsed;
      state.analysis = A;
      state.meta = { title: A.title, subtitle: null, author: A.author || '', date: dateFor(state.outLang) };
      state.elements = PD.defaultElements(state.level);
      state.dirty = false;
      state.undo = [];
      setStep('design', 76);
      await regenerate((p) => { bar.style.width = (76 + p * 22).toFixed(0) + '%'; });
      await sleep(250);
      setStep('done', 100);
      await sleep(300);
      proc.classList.add('hidden');
      showInsights();
      unlock(4);
      goStep(1, false);
      if (A.translateFailed) toast('No se pudo traducir (revisa tu conexión a internet). Puedes editar los textos o volver a intentarlo.', 'err', 7000);
      else toast(`¡Listo! ${state.slides.length} diapositivas generadas${A.srcLang !== state.outLang ? ' y traducidas al ' + LANG_NAMES[state.outLang] : ''}.`);
    } catch (err) {
      console.error(err);
      proc.classList.add('hidden');
      $('.upload-card').classList.remove('hidden');
      toast(err.message || 'No se pudo leer el documento.', 'err', 6000);
    }
  }

  function countUp(el, to, ms = 900) {
    const start = performance.now();
    const fmt = (v) => Math.round(v).toLocaleString('es-ES');
    const tick = (t) => { const p = Math.min(1, (t - start) / ms); el.textContent = fmt(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  function showInsights() {
    const A = state.analysis;
    $('#insights').classList.remove('hidden');
    $('#ins-format').textContent = A.format || 'DOC';
    $('#ins-name').textContent = A.fileName || 'documento';
    $('#ins-title').textContent = A.title;
    countUp($('#ins-words'), A.wordCount);
    countUp($('#ins-read'), A.readingMinutes);
    countUp($('#ins-sections'), A.sections.length);
    countUp($('#ins-stats'), A.stats.length);
    countUp($('#ins-years'), A.timeline.length);
    $('#ins-lang').textContent = A.srcLang === state.outLang ? A.srcLang.toUpperCase() : A.srcLang.toUpperCase() + '→' + state.outLang.toUpperCase();
    $('#ins-kws').innerHTML = A.keywords.slice(0, 14).map((k, i) => `<span style="animation-delay:${i * 40}ms">${esc(k.term)}</span>`).join('');
    $('#ins-outline').innerHTML = A.sections.slice(0, 16).map((s) => `<li>${esc(s.title)}</li>`).join('');
  }

  /* ================= Generación ================= */
  const LANG_NAMES = { es: 'español', en: 'inglés', fr: 'francés', pt: 'portugués', it: 'italiano', de: 'alemán' };
  const OUT_LANGS = [
    { id: 'es', name: 'Español', flag: '🇪🇸', locale: 'es-ES' },
    { id: 'en', name: 'English', flag: '🇬🇧', locale: 'en-GB' },
    { id: 'fr', name: 'Français', flag: '🇫🇷', locale: 'fr-FR' },
    { id: 'de', name: 'Deutsch', flag: '🇩🇪', locale: 'de-DE' },
    { id: 'pt', name: 'Português', flag: '🇧🇷', locale: 'pt-BR' }
  ];
  const dateFor = (lang) => new Date().toLocaleDateString((OUT_LANGS.find((l) => l.id === lang) || OUT_LANGS[0]).locale, { year: 'numeric', month: 'long' });
  const NEW_SLIDE = {
    es: ['Nueva diapositiva', ['Haz clic para escribir tu primera idea', 'Añade otra idea importante', 'Cierra con un dato o una conclusión'], 'Nuevo punto'],
    en: ['New slide', ['Click to write your first idea', 'Add another key point', 'Close with a fact or a conclusion'], 'New point'],
    fr: ['Nouvelle diapositive', ['Cliquez pour écrire votre première idée', 'Ajoutez une autre idée importante', 'Terminez par un chiffre ou une conclusion'], 'Nouveau point'],
    de: ['Neue Folie', ['Klicken Sie, um Ihre erste Idee zu schreiben', 'Fügen Sie einen weiteren Kernpunkt hinzu', 'Schließen Sie mit einer Zahl oder einem Fazit'], 'Neuer Punkt'],
    pt: ['Novo slide', ['Clique para escrever sua primeira ideia', 'Adicione outra ideia importante', 'Feche com um dado ou uma conclusão'], 'Novo ponto']
  };

  // Pone el análisis en el idioma de salida: etiquetas y textos visibles (título, secciones, conceptos)
  async function localize(A, onProgress) {
    const tgt = state.outLang;
    A.lang = tgt;
    A.labels = PD.labels[tgt] || PD.labels.es;
    A.title = A._orig.title;
    A.subtitle = A._orig.subtitle;
    A.sections.forEach((x, i) => (x.title = A._orig.sections[i]));
    A.keywords.forEach((k, i) => (k.term = A._orig.keywords[i]));
    A.translateFailed = false;
    if (A.srcLang === tgt) return;
    const refs = [[A, 'title'], [A, 'subtitle']];
    A.sections.forEach((x) => refs.push([x, 'title']));
    A.keywords.forEach((k) => refs.push([k, 'term']));
    try {
      const out = await PD.translateTexts(refs.map(([o, k]) => o[k]), A.srcLang, tgt, onProgress);
      refs.forEach(([o, k], i) => { o[k] = out[i]; PD.markTranslated(out[i], tgt); });
    } catch (e) {
      console.error(e);
      A.translateFailed = true;
    }
  }

  let translateWarned = false;
  async function regenerate(onProgress) {
    state.slides = PD.generate(state.analysis, {
      level: state.level,
      elements: state.elements,
      title: state.meta.title,
      subtitle: state.meta.subtitle,
      author: state.meta.author,
      date: state.meta.date
    });
    if (!state.opts.notes) state.slides.forEach((s) => (s.notes = ''));
    const A = state.analysis;
    if (A.srcLang !== state.outLang && !A.translateFailed) {
      try {
        await PD.translateDeck(state.slides, A.srcLang, state.outLang, onProgress);
      } catch (e) {
        console.error(e);
        if (!translateWarned) toast('Parte del texto no se pudo traducir. Revisa tu conexión a internet.', 'err', 6000);
        translateWarned = true;
      }
    }
    state.current = Math.min(state.current, state.slides.length - 1);
  }

  // Bloquea la interfaz mientras se regenera (y se traduce) el contenido
  async function regenerateBusy() {
    document.body.classList.add('busy');
    const needs = state.analysis.srcLang !== state.outLang;
    const t = needs ? setTimeout(() => toast('Traduciendo al ' + LANG_NAMES[state.outLang] + '…', 'ok', 2500), 400) : null;
    try { await regenerate(); } finally { clearTimeout(t); document.body.classList.remove('busy'); }
  }

  /* ================= Idioma de la presentación ================= */
  function renderLangPickers() {
    $$('.lang-pick').forEach((box) => {
      box.innerHTML = OUT_LANGS.map((l) => `<button type="button" class="lp ${l.id === state.outLang ? 'sel' : ''}" data-lang="${l.id}" aria-pressed="${l.id === state.outLang}"><span class="fl">${l.flag}</span>${l.name}</button>`).join('');
    });
  }
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('.lp');
    if (!b) return;
    e.preventDefault();
    const lang = b.dataset.lang;
    if (lang === state.outLang || document.body.classList.contains('busy')) return;
    const A = state.analysis;
    if (A && state.dirty && !window.confirm('Cambiar el idioma regenerará la presentación y se perderán tus ediciones manuales. ¿Continuar?')) return;
    state.outLang = lang;
    savePrefs();
    renderLangPickers();
    if (!A) { toast('La presentación se creará en ' + LANG_NAMES[lang] + '.', 'ok', 2200); return; }
    document.body.classList.add('busy');
    const t = A.srcLang !== lang ? setTimeout(() => toast('Traduciendo al ' + LANG_NAMES[lang] + '…', 'ok', 2500), 300) : null;
    try {
      await localize(A);
      state.meta.title = A.title;
      state.meta.subtitle = null;
      state.meta.date = dateFor(lang);
      state.dirty = false;
      await regenerate();
    } finally {
      clearTimeout(t);
      document.body.classList.remove('busy');
    }
    if (A.translateFailed) toast('No se pudo traducir (revisa tu conexión a internet).', 'err', 5000);
    else toast('Presentación en ' + LANG_NAMES[lang] + '.', 'ok', 2200);
    showInsights();
    if (state.step === 2) renderDesign();
    if (state.step === 3) renderContent();
    if (state.step === 4) renderEditor();
  });
  renderLangPickers();

  /* ================= Paso 2: diseño ================= */
  let prevIndex = 0;
  function previewPicks() {
    const order = ['cover', 'content', 'stats', 'summary', 'timeline', 'chart', 'quote', 'agenda', 'closing'];
    const picks = [];
    order.forEach((t) => { const s = state.slides.find((x) => x.type === t && !picks.includes(x)); if (s && picks.length < 5) picks.push(s); });
    state.slides.forEach((s) => { if (picks.length < 5 && !picks.includes(s)) picks.push(s); });
    return picks;
  }

  function renderDesign() {
    // Plantillas
    const tg = $('#tpl-grid');
    tg.innerHTML = '';
    const cover = state.slides[0];
    PD.templates.forEach((t) => {
      const b = document.createElement('button');
      b.className = 'tpl-card' + (t.id === state.tpl ? ' sel' : '');
      b.dataset.tpl = t.id;
      const th = theme({ tpl: t.id, palette: t.id === state.tpl ? state.palette : t.palette, fontId: t.id === state.tpl ? state.font : t.font });
      mount(b, cover, 0, state.slides.length, th);
      b.insertAdjacentHTML('beforeend', `<b>${esc(t.name)}</b><small>${esc(t.desc)}</small>`);
      b.addEventListener('click', () => {
        state.tpl = t.id; state.palette = t.palette; state.font = t.font;
        savePrefs(); renderDesign();
      });
      tg.appendChild(b);
    });
    // Paletas
    const pg = $('#pal-grid');
    pg.innerHTML = PD.palettes.concat(state.custom ? [state.custom] : []).map((p) => `<button class="pal ${p.id === state.palette ? 'sel' : ''}" data-pal="${p.id}"><div class="sw"><i style="background:${p.bg}"></i><i style="background:${p.a1}"></i><i style="background:${p.a2}"></i><i style="background:${p.a3}"></i><i style="background:${p.ink}"></i></div><span>${esc(p.name)}</span></button>`).join('');
    $$('.pal', pg).forEach((b) => b.addEventListener('click', () => { state.palette = b.dataset.pal; savePrefs(); renderDesign(); }));
    // Tipografías
    const fg = $('#font-grid');
    fg.innerHTML = PD.fonts.map((f) => `<button class="fnt ${f.id === state.font ? 'sel' : ''}" data-font="${f.id}"><span class="aa" style="font-family:'${f.head}'">Aa</span><b>${esc(f.name)}</b><small>${esc(f.head)} + ${esc(f.body)}</small></button>`).join('');
    PD.fonts.forEach((f) => PD.loadFont(f));
    $$('.fnt', fg).forEach((b) => b.addEventListener('click', () => { state.font = b.dataset.font; savePrefs(); renderDesign(); }));
    renderPreview();
  }

  function renderPreview() {
    const picks = previewPicks();
    prevIndex = Math.min(prevIndex, picks.length - 1);
    const th = theme();
    const main = $('#prev-main');
    main.innerHTML = '';
    const s = picks[prevIndex];
    mount(main, s, state.slides.indexOf(s), state.slides.length, th, 'anim');
    const strip = $('#prev-strip');
    strip.innerHTML = '';
    picks.forEach((p, i) => {
      const t = mount(strip, p, state.slides.indexOf(p), state.slides.length, th, i === prevIndex ? 'on' : '');
      t.addEventListener('click', () => { prevIndex = i; renderPreview(); });
    });
    $('#prev-dots').innerHTML = picks.map((_, i) => `<button class="${i === prevIndex ? 'on' : ''}" data-i="${i}" aria-label="Vista ${i + 1}"></button>`).join('');
    $$('#prev-dots button').forEach((b) => b.addEventListener('click', () => { prevIndex = +b.dataset.i; renderPreview(); }));
  }

  $('#cp-apply').addEventListener('click', () => {
    state.custom = PD.buildCustomPalette($('#cp-bg').value, $('#cp-a1').value, $('#cp-a2').value);
    state.palette = 'custom';
    renderDesign();
    toast('Paleta personalizada aplicada.');
  });

  /* ================= Paso 3: contenido ================= */
  function available() {
    const A = state.analysis;
    return {
      agenda: A.sections.length >= 2, summary: A.sections.length >= 2, dividers: A.sections.length >= 2,
      stats: A.stats.length >= 2, chart: A.stats.filter((s) => s.pct && s.num <= 100).length >= 3,
      timeline: A.timeline.length >= 3, quote: !!(A.quotes.length || A.pull), concepts: A.keywords.length >= 6,
      images: A.images.length > 0, tables: A.tables.length > 0, glossary: A.glossary.length >= 2,
      conclusions: true, references: A.references.length > 0, closing: true
    };
  }

  function confirmRegen() {
    if (!state.dirty) return true;
    return window.confirm('Has editado diapositivas manualmente. Cambiar el nivel o los elementos regenerará el contenido y se perderán esas ediciones. ¿Continuar?');
  }

  function renderContent() {
    const A = state.analysis;
    // Niveles con estimación real
    const lg = $('#level-grid');
    lg.innerHTML = PD.levels.map((l) => {
      const n = PD.generate(A, { level: l.id, elements: l.id === state.level ? state.elements : PD.defaultElements(l.id), title: state.meta.title }).length;
      return `<button class="lvl ${l.id === state.level ? 'sel' : ''}" data-lvl="${l.id}"><div class="bars">${[1, 2, 3, 4].map((k) => `<i class="${k <= l.id ? 'on' : ''}" style="height:${6 + k * 5}px"></i>`).join('')}</div><b>${l.name}</b><p>${l.desc}</p><span class="est">≈ ${n} diapositivas · ${Math.max(2, Math.round(n * 0.9))} min</span></button>`;
    }).join('');
    $('#dm-fill').style.width = state.level * 25 + '%';
    $$('.lvl', lg).forEach((b) => b.addEventListener('click', () => {
      const lv = +b.dataset.lvl;
      if (lv === state.level || !confirmRegen()) return;
      state.level = lv;
      state.elements = PD.defaultElements(lv);
      state.dirty = false;
      savePrefs();
      regenerateBusy().then(renderContent);
    }));
    // Elementos
    const av = available();
    $('#elements-grid').innerHTML = PD.elementList.map((e) => `<label class="tgl ${av[e.id] ? '' : 'na'}"><input type="checkbox" data-el="${e.id}" ${state.elements[e.id] ? 'checked' : ''} ${av[e.id] ? '' : 'disabled'}><span class="sw"></span>${e.name}</label>`).join('');
    $$('#elements-grid input').forEach((inp) => inp.addEventListener('change', () => {
      if (!confirmRegen()) { inp.checked = !inp.checked; return; }
      state.elements[inp.dataset.el] = inp.checked;
      state.dirty = false;
      regenerateBusy().then(renderDeckGrid);
    }));
    // Campos
    $('#f-title').value = state.slides[0]?.title || state.meta.title;
    $('#f-subtitle').value = state.slides[0]?.subtitle || '';
    $('#f-author').value = state.meta.author;
    $('#f-date').value = state.meta.date;
    renderDeckGrid();
  }

  function renderDeckGrid() {
    const g = $('#deck-grid');
    g.innerHTML = '';
    const th = theme();
    state.slides.forEach((s, i) => {
      const t = mount(g, s, i, state.slides.length, th);
      t.dataset.n = i + 1;
      t.style.cursor = 'pointer';
      t.addEventListener('click', () => { state.current = i; unlock(4); goStep(4); });
    });
    $('#deck-count').textContent = state.slides.length + ' diapositivas';
  }

  let metaTimer;
  const applyMeta = () => {
    state.meta.title = $('#f-title').value.trim() || state.analysis.title;
    state.meta.subtitle = $('#f-subtitle').value.trim();
    state.meta.author = $('#f-author').value.trim();
    state.meta.date = $('#f-date').value.trim();
    state.slides.forEach((s) => {
      if (s.type === 'cover') Object.assign(s, { title: state.meta.title, subtitle: state.meta.subtitle, author: state.meta.author, date: state.meta.date });
      if (s.type === 'closing') Object.assign(s, { kicker: state.meta.title, author: state.meta.author });
    });
    clearTimeout(metaTimer);
    metaTimer = setTimeout(renderDeckGrid, 250);
  };
  ['#f-title', '#f-subtitle', '#f-author', '#f-date'].forEach((s) => $(s).addEventListener('input', applyMeta));
  [['#o-numbers', 'numbers'], ['#o-footer', 'footer'], ['#o-emphasis', 'emphasis']].forEach(([sel, k]) => $(sel).addEventListener('change', (e) => { state.opts[k] = e.target.checked; renderDeckGrid(); }));
  $('#o-notes').addEventListener('change', (e) => {
    state.opts.notes = e.target.checked;
    if (!state.dirty) regenerateBusy().then(renderDeckGrid);
    else if (!e.target.checked) state.slides.forEach((s) => (s.notes = ''));
  });

  /* ================= Paso 4: editor ================= */
  const snapshot = () => { state.undo.push(JSON.stringify(state.slides)); if (state.undo.length > 60) state.undo.shift(); };
  function undo() {
    const s = state.undo.pop();
    if (!s) return toast('No hay más cambios que deshacer.', 'err', 2000);
    state.slides = JSON.parse(s);
    state.current = Math.min(state.current, state.slides.length - 1);
    renderEditor();
  }

  function setPath(obj, path, val) {
    const parts = path.split('.');
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) o = o[isNaN(parts[i]) ? parts[i] : +parts[i]];
    const last = parts[parts.length - 1];
    o[isNaN(last) ? last : +last] = val;
  }

  function renderEditor() {
    renderThumbs();
    renderStage();
    renderQuick();
  }

  function renderThumbs() {
    const box = $('#ed-thumbs');
    box.innerHTML = '';
    const th = theme();
    state.slides.forEach((s, i) => {
      const w = document.createElement('div');
      w.className = 'ed-th' + (i === state.current ? ' on' : '');
      w.draggable = true;
      w.dataset.i = i;
      w.innerHTML = `<span class="n">${i + 1}</span>`;
      mount(w, s, i, state.slides.length, th);
      w.addEventListener('click', () => { state.current = i; renderEditor(); });
      w.addEventListener('dragstart', (e) => { w.classList.add('dragging'); e.dataTransfer.setData('text/plain', i); e.dataTransfer.effectAllowed = 'move'; });
      w.addEventListener('dragend', () => w.classList.remove('dragging'));
      w.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); w.classList.add('drag-over'); });
      w.addEventListener('dragleave', () => w.classList.remove('drag-over'));
      w.addEventListener('drop', (e) => {
        e.preventDefault(); e.stopPropagation();
        w.classList.remove('drag-over');
        const from = +e.dataTransfer.getData('text/plain');
        const to = i;
        if (from === to || isNaN(from)) return;
        snapshot();
        const [m] = state.slides.splice(from, 1);
        state.slides.splice(from < to ? to - 1 : to, 0, m);
        state.current = state.slides.indexOf(m);
        state.dirty = true;
        renderEditor();
      });
      box.appendChild(w);
    });
    const on = box.children[state.current];
    if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function renderStage() {
    const stage = $('#ed-stage');
    stage.innerHTML = '';
    const s = state.slides[state.current];
    if (!s) return;
    const t = mount(stage, s, state.current, state.slides.length, theme());
    const el = t.firstElementChild;
    $$('[data-f]', el).forEach((n) => {
      n.contentEditable = 'true';
      n.spellcheck = true;
      n.addEventListener('focus', () => { n.dataset.orig = n.innerText; });
      n.addEventListener('input', () => { PD.fitSlide(el); });
      n.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); n.blur(); } e.stopPropagation(); });
      n.addEventListener('paste', (e) => { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\s+/g, ' ')); });
      n.addEventListener('blur', () => {
        const v = n.innerText.replace(/\s+/g, ' ').trim();
        if (v === (n.dataset.orig || '').replace(/\s+/g, ' ').trim()) return;
        snapshot();
        let val = v;
        if (n.dataset.f === 'author' && s.type === 'quote') val = v.replace(/^—\s*/, '');
        setPath(s, n.dataset.f, val);
        state.dirty = true;
        refreshThumb(state.current);
        setTimeout(() => { if (!$('#ed-stage').contains(document.activeElement)) renderStage(); }, 0);
      });
    });
    $('#ed-notes').value = s.notes || '';
    $('#ed-pos').textContent = `${state.current + 1} / ${state.slides.length}`;
    const isList = Array.isArray(s.bullets);
    $('#tb-layout').disabled = s.type !== 'content';
    $('#tb-bullet-add').disabled = !isList && !Array.isArray(s.items);
    $('#tb-bullet-del').disabled = !isList && !Array.isArray(s.items);
  }

  function refreshThumb(i) {
    const w = $('#ed-thumbs').children[i];
    if (!w) return;
    const old = w.querySelector('.thumb');
    if (old) { ro.unobserve(old); old.remove(); }
    mount(w, state.slides[i], i, state.slides.length, theme());
  }

  $('#ed-notes').addEventListener('input', (e) => { const s = state.slides[state.current]; if (s) { s.notes = e.target.value; state.dirty = true; } });
  $('#tb-undo').addEventListener('click', undo);
  $('#tb-del').addEventListener('click', () => {
    if (state.slides.length <= 1) return toast('La presentación debe tener al menos una diapositiva.', 'err');
    snapshot();
    state.slides.splice(state.current, 1);
    state.current = Math.min(state.current, state.slides.length - 1);
    state.dirty = true;
    renderEditor();
    toast('Diapositiva eliminada. Ctrl+Z para deshacer.', 'ok', 2400);
  });
  $('#tb-dup').addEventListener('click', () => {
    snapshot();
    const c = JSON.parse(JSON.stringify(state.slides[state.current]));
    c.id = 'd' + Date.now().toString(36);
    state.slides.splice(state.current + 1, 0, c);
    state.current++;
    state.dirty = true;
    renderEditor();
  });
  $('#tb-add').addEventListener('click', () => {
    snapshot();
    const ns = NEW_SLIDE[state.outLang] || NEW_SLIDE.es;
    state.slides.splice(state.current + 1, 0, {
      id: 'n' + Date.now().toString(36), type: 'content', layout: 'bullets',
      title: ns[0], kicker: '',
      bullets: ns[1].slice(),
      notes: ''
    });
    state.current++;
    state.dirty = true;
    renderEditor();
  });
  const LAYOUTS = ['bullets', 'split', 'cards', 'numbered', 'highlight'];
  $('#tb-layout').addEventListener('click', () => {
    const s = state.slides[state.current];
    if (s.type !== 'content') return;
    snapshot();
    if (s.layout === 'highlight' && s.statement) { s.bullets.unshift(s.statement); s.statement = ''; }
    let next = LAYOUTS[(LAYOUTS.indexOf(s.layout) + 1) % LAYOUTS.length];
    if (s.layout === 'image') next = 'bullets';
    if (next === 'highlight') {
      if (s.bullets.length >= 2) s.statement = s.bullets.shift();
      else next = 'bullets';
    }
    if (next === 'cards' && s.bullets.length > 4) next = 'numbered';
    s.layout = next;
    state.dirty = true;
    renderStage(); refreshThumb(state.current);
    toast('Distribución: ' + { bullets: 'lista', split: 'dos columnas', cards: 'tarjetas', numbered: 'pasos numerados', highlight: 'idea destacada' }[next], 'ok', 1600);
  });
  $('#tb-bullet-add').addEventListener('click', () => {
    const s = state.slides[state.current];
    const arr = s.bullets || s.items;
    if (!Array.isArray(arr)) return;
    snapshot();
    arr.push(typeof arr[0] === 'object' ? { term: 'Término', def: 'Definición' } : (NEW_SLIDE[state.outLang] || NEW_SLIDE.es)[2]);
    state.dirty = true;
    renderStage(); refreshThumb(state.current);
  });
  $('#tb-bullet-del').addEventListener('click', () => {
    const s = state.slides[state.current];
    const arr = s.bullets || s.items;
    if (!Array.isArray(arr) || arr.length <= 1) return;
    snapshot();
    arr.pop();
    state.dirty = true;
    renderStage(); refreshThumb(state.current);
  });

  function renderQuick() {
    $('#quick-tpl').innerHTML = PD.templates.map((t) => `<button class="${t.id === state.tpl ? 'sel' : ''}" data-qt="${t.id}">${esc(t.name)}</button>`).join('');
    $('#quick-pal').innerHTML = PD.palettes.concat(state.custom ? [state.custom] : []).map((p) => `<button class="${p.id === state.palette ? 'sel' : ''}" data-qp="${p.id}" title="${esc(p.name)}"><i style="background:linear-gradient(135deg,${p.bg} 0 45%,${p.a1} 45% 75%,${p.a2} 75%)"></i>${esc(p.name)}</button>`).join('');
    $$('[data-qt]').forEach((b) => b.addEventListener('click', () => { state.tpl = b.dataset.qt; savePrefs(); renderEditor(); }));
    $$('[data-qp]').forEach((b) => b.addEventListener('click', () => { state.palette = b.dataset.qp; savePrefs(); renderEditor(); }));
  }

  document.addEventListener('keydown', (e) => {
    if (state.step !== 4 || !$('#presenter').classList.contains('hidden') || !$('#export-modal').classList.contains('hidden')) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { if (state.current < state.slides.length - 1) { state.current++; renderEditor(); e.preventDefault(); } }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { if (state.current > 0) { state.current--; renderEditor(); e.preventDefault(); } }
    else if (e.key === 'Delete') $('#tb-del').click();
  });

  /* ================= Exportación ================= */
  const modal = $('#export-modal');
  $('#btn-export').addEventListener('click', () => {
    $('#exp-name').value = (state.slides[0]?.title || 'presentacion').slice(0, 70);
    $('#exp-notes').checked = false;
    $('#exp-progress').classList.add('hidden');
    $('#exp-go').disabled = false;
    modal.classList.remove('hidden');
  });
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('[data-close]')) modal.classList.add('hidden'); });
  $('#exp-go').addEventListener('click', async () => {
    const mode = $('input[name="exp-mode"]:checked').value;
    const th = theme();
    if (mode === 'vector') {
      modal.classList.add('hidden');
      toast('Elige «Guardar como PDF» como destino en el diálogo de impresión.', 'ok', 5000);
      await PD.printVector(state.slides, th);
      return;
    }
    $('#exp-go').disabled = true;
    $('#exp-progress').classList.remove('hidden');
    const bar = $('#exp-bar');
    const label = $('#exp-label');
    bar.style.width = '2%';
    try {
      await PD.exportPDF(state.slides, th, {
        quality: +$('#exp-quality').value,
        notes: $('#exp-notes').checked,
        fileName: $('#exp-name').value.trim() || 'presentacion',
        onProgress: (p, n) => { bar.style.width = (p * 100).toFixed(0) + '%'; label.textContent = `Renderizando diapositiva ${n} de ${state.slides.length}…`; }
      });
      label.textContent = '¡PDF descargado!';
      setTimeout(() => modal.classList.add('hidden'), 700);
      confetti();
      toast('Tu presentación se descargó en PDF.');
    } catch (err) {
      console.error(err);
      if (err.declined) { $('#exp-progress').classList.add('hidden'); toast('Descarga cancelada.', 'err', 2500); }
      else toast('No se pudo generar el PDF: ' + err.message, 'err', 6000);
    } finally {
      $('#exp-go').disabled = false;
    }
  });

  /* ================= Modo presentación ================= */
  const pr = $('#presenter');
  let prIdx = 0, prTimer = null, prStart = 0, hudTimer = null;
  function prRender(dir = 1) {
    const stage = $('#pr-stage');
    const th = theme();
    const vw = window.innerWidth, vh = window.innerHeight;
    const sc = Math.min(vw / 1280, vh / 720);
    stage.style.width = 1280 * sc + 'px';
    stage.style.height = 720 * sc + 'px';
    stage.innerHTML = PD.renderSlide(state.slides[prIdx], prIdx, state.slides.length, th);
    const el = stage.firstElementChild;
    el.style.transform = `scale(${sc})`;
    PD.fitSlide(el);
    el.classList.add(dir >= 0 ? 'enter' : 'enter-back');
    $('#pr-count').textContent = `${prIdx + 1} / ${state.slides.length}`;
    $('#pr-progress').style.width = ((prIdx + 1) / state.slides.length) * 100 + '%';
    $('#pr-notes').textContent = state.slides[prIdx].notes || 'Sin notas para esta diapositiva.';
  }
  const prGo = (d) => { const n = prIdx + d; if (n < 0 || n >= state.slides.length) return; prIdx = n; prRender(d); };
  function openPresenter() {
    prIdx = state.current;
    pr.classList.remove('hidden');
    document.documentElement.requestFullscreen?.().catch(() => {});
    prStart = Date.now();
    clearInterval(prTimer);
    prTimer = setInterval(() => { const s = Math.floor((Date.now() - prStart) / 1000); $('#pr-timer').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }, 1000);
    PD.loadFont(theme().font).then(() => prRender(1));
    prRender(1);
  }
  function closePresenter() {
    pr.classList.add('hidden');
    clearInterval(prTimer);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    state.current = prIdx;
    renderEditor();
  }
  $('#btn-present').addEventListener('click', openPresenter);
  $('#pr-prev').addEventListener('click', (e) => { e.stopPropagation(); prGo(-1); });
  $('#pr-next').addEventListener('click', (e) => { e.stopPropagation(); prGo(1); });
  $('#pr-exit').addEventListener('click', (e) => { e.stopPropagation(); closePresenter(); });
  $('#pr-notes-btn').addEventListener('click', (e) => { e.stopPropagation(); $('#pr-notes').classList.toggle('hidden'); });
  pr.addEventListener('click', (e) => { if (e.target.closest('.pr-hud, .pr-notes')) return; prGo(e.clientX < window.innerWidth / 3 ? -1 : 1); });
  pr.addEventListener('mousemove', () => { pr.classList.add('show-cursor'); clearTimeout(hudTimer); hudTimer = setTimeout(() => pr.classList.remove('show-cursor'), 2200); });
  document.addEventListener('keydown', (e) => {
    if (pr.classList.contains('hidden')) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); prGo(1); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); prGo(-1); }
    else if (e.key === 'Home') { prIdx = 0; prRender(-1); }
    else if (e.key === 'End') { prIdx = state.slides.length - 1; prRender(1); }
    else if (e.key === 'Escape') closePresenter();
    else if (e.key.toLowerCase() === 'n') $('#pr-notes').classList.toggle('hidden');
  });
  window.addEventListener('resize', () => { if (!pr.classList.contains('hidden')) prRender(0); });
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && !pr.classList.contains('hidden')) prRender(0); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.classList.contains('hidden')) modal.classList.add('hidden'); });

  /* ================= Confeti ================= */
  function confetti() {
    const c = $('#confetti');
    const ctx = c.getContext('2d');
    c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const colors = ['#8b6cff', '#2fd8f0', '#7dffb3', '#ff5fb8', '#ffd166'];
    const parts = Array.from({ length: 180 }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .55,
      vx: (Math.random() - .5) * 16, vy: -Math.random() * 18 - 6, r: Math.random() * 6 + 4,
      c: colors[(Math.random() * colors.length) | 0], a: Math.random() * Math.PI, va: (Math.random() - .5) * .3
    }));
    let f = 0;
    const tick = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach((p) => { p.vy += .45; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); });
      if (f++ < 170) requestAnimationFrame(tick); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    tick();
  }

  /* ================= Efectos de la página ================= */
  // Partículas de fondo
  (function particles() {
    const c = $('#bg-canvas');
    const ctx = c.getContext('2d');
    let w, h, pts;
    const init = () => {
      w = c.width = innerWidth; h = c.height = innerHeight;
      pts = Array.from({ length: Math.min(70, Math.round(w / 22)) }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25 }));
    };
    init();
    addEventListener('resize', init);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      pts.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.fillStyle = 'rgba(170,160,255,.5)';
        ctx.fillRect(p.x, p.y, 1.6, 1.6);
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < 14000) { ctx.strokeStyle = `rgba(139,108,255,${.12 * (1 - d / 14000)})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
      });
      if (!reduce) requestAnimationFrame(tick);
    };
    tick();
  })();

  // Brillo que sigue al cursor
  const glow = $('.cursor-glow');
  addEventListener('pointermove', (e) => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; });
  $$('.how').forEach((c) => c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px'); }));
  addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', scrollY > 30), { passive: true });

  // Aparición al hacer scroll
  const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .15 });
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 90 + 'ms'; io.observe(el); });

  // Contadores del hero
  $$('[data-count]').forEach((el) => setTimeout(() => countUp(el, +el.dataset.count, 1400), 300));

  /* Demo: carrusel 3D de diapositivas reales + galería */
  (function demo() {
    const A = PD.analyze(PD.parseText(PD.sampleDoc));
    const deck = PD.generate(A, { level: 3, elements: PD.defaultElements(3) });
    const pick = (t) => deck.find((s) => s.type === t);
    const combos = [
      { slide: pick('cover'), tpl: 'aurora', palette: 'medianoche', font: 'moderna' },
      { slide: pick('stats'), tpl: 'suizo', palette: 'atardecer', font: 'geometrica' },
      { slide: pick('timeline'), tpl: 'editorial', palette: 'terracota', font: 'editorial' },
      { slide: pick('quote'), tpl: 'neon', palette: 'neon', font: 'futurista' },
      { slide: deck.find((s) => s.type === 'content' && s.layout === 'cards') || pick('content'), tpl: 'geometrico', palette: 'coral', font: 'amigable' },
      { slide: pick('chart') || pick('summary'), tpl: 'corporativo', palette: 'oceano', font: 'tecnica' }
    ].filter((c) => c.slide);
    const box = $('#deck3d');
    const W = Math.min(560, box.clientWidth * 0.86 || 520);
    const cards = combos.map((c) => {
      const pal = PD.getPalette(c.palette);
      const font = PD.getFont(c.font);
      const th = { tpl: c.tpl, pal, font, vars: PD.themeVars(pal, font), opts: { numbers: true, footer: true, emphasis: true }, deckTitle: A.title, kws: A.keywords.slice(0, 8).map((k) => k.term) };
      const card = document.createElement('div');
      card.className = 'card3d';
      card.style.width = W + 'px';
      card.style.marginLeft = -W / 2 + 'px';
      card.style.marginTop = -(W * 9 / 16) / 2 + 'px';
      box.appendChild(card);
      mount(card, c.slide, deck.indexOf(c.slide), deck.length, th);
      return card;
    });
    let k = 0;
    const layout = () => {
      cards.forEach((c, i) => {
        const p = (i - k + cards.length) % cards.length;
        const tf = [
          'translate3d(0,0,120px) rotateY(-14deg) rotateX(6deg)',
          'translate3d(110px,-120px,-60px) rotateY(-22deg) rotateX(8deg) scale(.86)',
          'translate3d(170px,-210px,-200px) rotateY(-26deg) rotateX(10deg) scale(.74)'
        ][p];
        c.style.transform = tf || 'translate3d(220px,-280px,-360px) rotateY(-28deg) scale(.6)';
        c.style.opacity = p < 3 ? String(1 - p * 0.22) : '0';
        c.style.zIndex = String(10 - p);
      });
    };
    layout();
    setInterval(() => { k = (k + 1) % cards.length; layout(); }, 3200);
    combos.forEach((c) => PD.loadFont(PD.getFont(c.font)).then(() => $$('.slide', box).forEach((s) => PD.fitSlide(s))));

    // Galería de plantillas
    const g = $('#gallery');
    const sampleContent = deck.find((s) => s.type === 'content' && s.layout === 'bullets') || pick('content');
    PD.templates.forEach((t, i) => {
      const pal = PD.getPalette(t.palette), font = PD.getFont(t.font);
      const th = { tpl: t.id, pal, font, vars: PD.themeVars(pal, font), opts: { numbers: true, footer: true, emphasis: true }, deckTitle: A.title, kws: A.keywords.slice(0, 8).map((x) => x.term) };
      const item = document.createElement('div');
      item.className = 'gal-item reveal';
      const s = i % 2 ? sampleContent : pick('cover');
      mount(item, s, deck.indexOf(s), deck.length, th);
      item.insertAdjacentHTML('beforeend', `<h4>${esc(t.name)}</h4><p>${esc(t.desc)}</p>`);
      item.addEventListener('click', () => {
        state.tpl = t.id; state.palette = t.palette; state.font = t.font; savePrefs();
        if (state.analysis) { unlock(2); goStep(2); } else { goStep(1); toast(`Plantilla «${t.name}» seleccionada. Ahora sube tu documento.`); }
      });
      g.appendChild(item);
      io.observe(item);
      PD.loadFont(font).then(() => PD.fitSlide(item.querySelector('.slide')));
    });
  })();

  goStep(1, false);
})();
