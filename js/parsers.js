/* Lumina Slides — Lectura de documentos en (casi) cualquier formato.
 * Todos los lectores devuelven { title, author, blocks: [...] } donde cada bloque es:
 *   { type: 'heading', level, text } | { type: 'para', text } | { type: 'list', items: [] }
 *   { type: 'quote', text } | { type: 'table', rows: [[]] } | { type: 'image', src, alt }
 */
(function () {
  'use strict';
  const PD = (window.PD = window.PD || {});

  /* ---------- Carga perezosa de librerías ---------- */
  const scripts = {};
  function loadScript(src) {
    if (scripts[src]) return scripts[src];
    scripts[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => { delete scripts[src]; reject(new Error('No se pudo cargar ' + src)); };
      document.head.appendChild(s);
    });
    return scripts[src];
  }
  PD.loadScript = loadScript;

  const clean = (s) => (s || '').replace(/­/g, '').replace(/[ \t ]+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();

  /* ---------- Texto plano → bloques ---------- */
  function isHeadingLine(line, next) {
    const t = line.trim();
    if (!t || t.length > 90 || t.length < 3) return false;
    if (/[.;,]$/.test(t)) return false;
    const words = t.split(/\s+/);
    if (words.length > 12) return false;
    if (/^(\d+(\.\d+)*|[IVXLC]+)[.)]?\s+\p{Lu}/u.test(t)) return true;
    if (/^(cap[ií]tulo|secci[oó]n|parte|chapter|section|part)\b/i.test(t)) return true;
    const letters = t.replace(/[^\p{L}]/gu, '');
    if (letters.length >= 4 && letters === letters.toUpperCase()) return true;
    if (/:$/.test(t) && words.length <= 6) return true;
    // Línea corta seguida de un párrafo largo
    if (next && next.trim().length > 50 && words.length <= 8 && /^\p{Lu}/u.test(t) && t.length < next.trim().length * 0.7) return true;
    return false;
  }

  function plainToBlocks(text) {
    text = text.replace(/\r\n?/g, '\n').replace(/\t/g, ' ');
    // Une palabras cortadas con guion al final de línea
    text = text.replace(/(\p{L})-\n(\p{Ll})/gu, '$1$2');
    const lines = text.split('\n');
    const blocks = [];
    let para = [];
    let list = null;
    const flushPara = () => {
      if (para.length) blocks.push({ type: 'para', text: clean(para.join(' ')) });
      para = [];
    };
    const flushList = () => {
      if (list && list.items.length) blocks.push(list);
      list = null;
    };
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const t = raw.trim();
      if (!t) { flushPara(); flushList(); continue; }
      const li = t.match(/^([-*•·▪◦–]|\(?[a-z0-9]{1,2}[).])\s+(.{3,})$/i);
      if (li && !/^\d+\.\s+\p{Lu}[^.]{0,60}$/u.test(t)) {
        flushPara();
        if (!list) list = { type: 'list', items: [] };
        list.items.push(clean(li[2]));
        continue;
      }
      flushList();
      const nextLine = lines.slice(i + 1).find((l) => l.trim());
      const prevBlank = i === 0 || !lines[i - 1].trim();
      if (prevBlank && isHeadingLine(t, nextLine)) {
        flushPara();
        const num = t.match(/^(\d+(?:\.\d+)*)/);
        const level = num ? Math.min(3, num[1].split('.').length) : 1;
        blocks.push({ type: 'heading', level, text: clean(t.replace(/:$/, '')) });
        continue;
      }
      para.push(t);
    }
    flushPara(); flushList();
    return blocks;
  }

  /* ---------- Markdown → bloques ---------- */
  function markdownToBlocks(md) {
    const blocks = [];
    const lines = md.replace(/\r\n?/g, '\n').split('\n');
    let para = [], list = null, inCode = false, table = null;
    const strip = (s) => clean(s.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`~]{1,3}/g, ''));
    const flush = () => {
      if (para.length) blocks.push({ type: 'para', text: strip(para.join(' ')) });
      para = [];
      if (list) blocks.push(list);
      list = null;
      if (table) blocks.push(table);
      table = null;
    };
    for (const line of lines) {
      if (/^```/.test(line.trim())) { inCode = !inCode; flush(); continue; }
      if (inCode) continue;
      const t = line.trim();
      if (!t) { flush(); continue; }
      let m;
      if ((m = t.match(/^(#{1,6})\s+(.*)$/))) { flush(); blocks.push({ type: 'heading', level: m[1].length, text: strip(m[2]) }); continue; }
      if ((m = t.match(/^!\[([^\]]*)\]\(([^)\s]+)/))) { flush(); blocks.push({ type: 'image', src: m[2], alt: m[1] }); continue; }
      if (/^\|.*\|$/.test(t)) {
        if (/^\|[\s:|-]+\|$/.test(t)) continue;
        if (!table) { flush(); table = { type: 'table', rows: [] }; }
        table.rows.push(t.slice(1, -1).split('|').map((c) => strip(c)));
        continue;
      }
      if ((m = t.match(/^>\s?(.*)$/))) { flush(); blocks.push({ type: 'quote', text: strip(m[1]) }); continue; }
      if ((m = t.match(/^([-*+]|\d+[.)])\s+(.*)$/))) {
        if (para.length) { blocks.push({ type: 'para', text: strip(para.join(' ')) }); para = []; }
        if (!list) list = { type: 'list', items: [] };
        list.items.push(strip(m[2]));
        continue;
      }
      if (list) { blocks.push(list); list = null; }
      para.push(t);
    }
    flush();
    return blocks;
  }

  /* ---------- HTML → bloques ---------- */
  function htmlToBlocks(html, baseTitle) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script,style,noscript,nav,footer,header aside,form,button,svg,iframe').forEach((n) => n.remove());
    const blocks = [];
    const title = clean(doc.querySelector('title')?.textContent || '') || baseTitle || '';
    const author = doc.querySelector('meta[name="author"]')?.getAttribute('content') || '';
    const root = doc.querySelector('article') || doc.querySelector('main') || doc.body;
    if (!root) return { title, author, blocks };

    const walk = (el) => {
      for (const node of el.children) {
        const tag = node.tagName.toLowerCase();
        if (/^h[1-6]$/.test(tag)) {
          const t = clean(node.textContent);
          if (t) blocks.push({ type: 'heading', level: +tag[1], text: t });
        } else if (tag === 'p') {
          node.querySelectorAll('img').forEach((img) => pushImg(img));
          const t = clean(node.textContent);
          if (t) {
            // Párrafos en negrita y cortos suelen ser subtítulos (frecuente en DOCX)
            const strong = node.querySelector('strong,b');
            if (strong && clean(strong.textContent) === t && t.length < 90 && !/[.;]$/.test(t)) blocks.push({ type: 'heading', level: 3, text: t });
            else blocks.push({ type: 'para', text: t });
          }
        } else if (tag === 'ul' || tag === 'ol') {
          const items = [...node.querySelectorAll(':scope > li')].map((li) => clean(li.textContent)).filter(Boolean);
          if (items.length) blocks.push({ type: 'list', items });
        } else if (tag === 'blockquote') {
          const t = clean(node.textContent);
          if (t) blocks.push({ type: 'quote', text: t });
        } else if (tag === 'table') {
          const rows = [...node.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => clean(c.textContent))).filter((r) => r.some(Boolean));
          if (rows.length) blocks.push({ type: 'table', rows });
        } else if (tag === 'img') {
          pushImg(node);
        } else if (tag === 'figure') {
          const img = node.querySelector('img');
          if (img) pushImg(img, clean(node.querySelector('figcaption')?.textContent || ''));
        } else if (tag === 'pre' || tag === 'code') {
          continue;
        } else if (node.children.length) {
          // Texto suelto dentro de div
          const direct = [...node.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ');
          if (clean(direct).length > 40) blocks.push({ type: 'para', text: clean(direct) });
          walk(node);
        } else {
          const t = clean(node.textContent);
          if (t.length > 40) blocks.push({ type: 'para', text: t });
        }
      }
    };
    const pushImg = (img, caption) => {
      const src = img.getAttribute('src');
      if (src && /^(data:image|https?:)/.test(src)) blocks.push({ type: 'image', src, alt: caption || img.getAttribute('alt') || '' });
    };
    walk(root);
    if (!blocks.length) return { title, author, blocks: plainToBlocks(root.textContent || '') };
    return { title, author, blocks };
  }

  /* ---------- PDF ---------- */
  async function parsePDF(buf, onProgress) {
    await loadScript('vendor/pdf.min.js');
    const lib = window.pdfjsLib;
    lib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
    let pdf;
    const bytes = new Uint8Array(buf);
    try {
      // pdf.js se queda con el búfer que recibe: le pasamos una copia para poder reintentar
      pdf = await lib.getDocument({ data: bytes.slice() }).promise;
    } catch (e) {
      if (e && e.name === 'PasswordException') throw new Error('El PDF está protegido con contraseña. Quita la protección y vuelve a subirlo.');
      console.warn('pdf.js: reintento sin worker', e);
      // Sin worker (p. ej. abierto como file://): carga el worker en el hilo principal
      await loadScript('vendor/pdf.worker.min.js');
      pdf = await lib.getDocument({ data: bytes.slice() }).promise;
    }
    let meta = {};
    try { meta = (await pdf.getMetadata()).info || {}; } catch (e) { /* sin metadatos */ }

    const pages = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      const lines = [];
      let cur = null;
      for (const it of tc.items) {
        if (!it.str && !it.hasEOL) continue;
        const y = Math.round(it.transform[5]);
        const x = it.transform[4];
        const h = Math.round(Math.abs(it.transform[3]) || it.height || 10);
        if (!cur || Math.abs(cur.y - y) > Math.max(2, h * 0.4)) {
          if (cur) lines.push(cur);
          cur = { y, x, size: h, text: '', bold: /bold|black|heavy/i.test(it.fontName || '') };
        }
        cur.text += (cur.text && !/\s$/.test(cur.text) && it.str && !/^\s/.test(it.str) && x - (cur.endX || 0) > h * 0.15 ? ' ' : '') + it.str;
        cur.endX = x + (it.width || 0);
        cur.size = Math.max(cur.size, h);
      }
      if (cur) lines.push(cur);
      pages.push(lines.filter((l) => l.text.trim()));
      onProgress && onProgress(p / pdf.numPages);
    }

    // Detecta encabezados/pies repetidos en muchas páginas
    const norm = (t) => t.toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
    const freq = {};
    pages.forEach((lines) => {
      const seen = new Set();
      [...lines.slice(0, 3), ...lines.slice(-3)].forEach((l) => seen.add(norm(l.text)));
      seen.forEach((k) => (freq[k] = (freq[k] || 0) + 1));
    });
    const repeated = new Set(Object.keys(freq).filter((k) => pages.length > 3 && freq[k] >= pages.length * 0.5));

    // Tamaño de fuente del cuerpo (moda ponderada por caracteres)
    const sizeCount = {};
    pages.flat().forEach((l) => (sizeCount[l.size] = (sizeCount[l.size] || 0) + l.text.length));
    const body = +Object.entries(sizeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 10;
    const headSizes = [...new Set(pages.flat().filter((l) => l.size >= body * 1.18 && l.text.length < 120).map((l) => l.size))].sort((a, b) => b - a);

    const blocks = [];
    let para = [];
    let lastY = null, lastSize = body, lastWasHead = false;
    const flush = () => {
      if (!para.length) return;
      let t = para.join('\n').replace(/(\p{L})-\n(\p{Ll})/gu, '$1$2').replace(/\n/g, ' ');
      t = clean(t);
      const li = t.match(/^([•·▪◦–-]|\d{1,2}[.)])\s+(.*)$/);
      if (li && t.length < 400) {
        const last = blocks[blocks.length - 1];
        if (last && last.type === 'list') last.items.push(li[2]);
        else blocks.push({ type: 'list', items: [li[2]] });
      } else if (t) blocks.push({ type: 'para', text: t });
      para = [];
    };
    pages.forEach((lines) => {
      lastY = null;
      lines.forEach((l) => {
        const t = l.text.trim();
        if (repeated.has(norm(t))) return;
        if (/^(p[aá]g(ina)?\.?\s*)?\d{1,4}(\s*(de|of|\/)\s*\d+)?$/i.test(t)) return;
        const isHead = (l.size >= body * 1.18 && t.length < 120 && t.split(/\s+/).length <= 16) ||
          (l.bold && l.size >= body && t.length < 80 && !/[.,;]$/.test(t) && /^\p{Lu}|^\d/u.test(t));
        if (isHead) {
          flush();
          const level = l.size >= body * 1.18 ? Math.min(3, headSizes.indexOf(l.size) + 1 || 3) : 3;
          const prev = blocks[blocks.length - 1];
          // Títulos partidos en dos líneas
          if (prev && prev.type === 'heading' && prev._size === l.size && prev === blocks[blocks.length - 1] && lastWasHead && lastY !== null && Math.abs(lastY - l.y) < l.size * 1.4) prev.text = clean(prev.text + ' ' + t);
          else blocks.push({ type: 'heading', level, text: t, _size: l.size });
          lastWasHead = true;
          lastY = l.y; lastSize = l.size;
          return;
        }
        lastWasHead = false;
        const gap = lastY === null ? 0 : lastY - l.y;
        const bullet = /^([•·▪◦–-]|\d{1,2}[.)])\s+/.test(t);
        if (para.length && (gap > l.size * 1.75 || gap < 0 || bullet || lastSize !== l.size && Math.abs(lastSize - l.size) > 1)) flush();
        para.push(t);
        lastY = l.y; lastSize = l.size;
      });
    });
    flush();

    // Párrafos que cruzan de página: une si el anterior no termina en punto
    const merged = [];
    blocks.forEach((b) => {
      const prev = merged[merged.length - 1];
      if (prev && prev.type === 'para' && b.type === 'para' && !/[.!?:”"»)]$/.test(prev.text) && /^\p{Ll}/u.test(b.text)) prev.text += ' ' + b.text;
      else merged.push(b);
    });
    const headingBlocks = merged.filter((b) => b.type === 'heading');
    return {
      title: (/^\(?(anonymous|untitled|sin t[ií]tulo)\)?$|^microsoft word|\.(docx?|pdf|tex)$/i.test(clean(meta.Title || '')) ? '' : clean(meta.Title || '')) || (headingBlocks[0] ? headingBlocks[0].text : ''),
      author: clean(meta.Author || ''),
      blocks: merged,
      pages: pdf.numPages
    };
  }

  /* ---------- DOCX ---------- */
  async function parseDOCX(buf) {
    await loadScript('vendor/mammoth.browser.min.js');
    const res = await window.mammoth.convertToHtml({ arrayBuffer: buf }, { styleMap: ["p[style-name='Title'] => h1:fresh", "p[style-name='Subtitle'] => h2:fresh", "p[style-name='Título'] => h1:fresh", "p[style-name='Subtítulo'] => h2:fresh"] });
    const out = htmlToBlocks(res.value);
    let title = '', author = '';
    try {
      await loadScript('vendor/jszip.min.js');
      const zip = await window.JSZip.loadAsync(buf);
      const core = await zip.file('docProps/core.xml')?.async('string');
      if (core) {
        title = clean((core.match(/<dc:title>([\s\S]*?)<\/dc:title>/) || [])[1] || '');
        author = clean((core.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/) || [])[1] || '');
      }
    } catch (e) { /* opcional */ }
    return { title: title || '', author, blocks: out.blocks };
  }

  /* ---------- Formatos ZIP: PPTX, ODT/ODP, EPUB, XLSX ---------- */
  const xmlText = (s) => clean(s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)));

  async function parsePPTX(buf) {
    await loadScript('vendor/jszip.min.js');
    const zip = await window.JSZip.loadAsync(buf);
    const files = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
      .sort((a, b) => +a.match(/(\d+)\.xml/)[1] - +b.match(/(\d+)\.xml/)[1]);
    const blocks = [];
    for (const f of files) {
      const xml = await zip.file(f).async('string');
      const shapes = xml.split(/<p:sp>|<p:sp /).slice(1);
      let titleDone = false;
      const items = [];
      shapes.forEach((sp) => {
        const isTitle = /type="(ctrTitle|title)"/.test(sp);
        const paras = (sp.match(/<a:p>[\s\S]*?<\/a:p>/g) || []).map((p) => xmlText((p.match(/<a:t>[\s\S]*?<\/a:t>/g) || []).join(' '))).filter(Boolean);
        if (isTitle && !titleDone && paras.length) { blocks.push({ type: 'heading', level: 2, text: paras.join(' ') }); titleDone = true; }
        else items.push(...paras);
      });
      if (items.length) {
        const long = items.filter((t) => t.length > 160);
        if (long.length > items.length / 2) items.forEach((t) => blocks.push({ type: 'para', text: t }));
        else blocks.push({ type: 'list', items });
      }
    }
    return { title: blocks.find((b) => b.type === 'heading')?.text || '', blocks };
  }

  async function parseODF(buf) {
    await loadScript('vendor/jszip.min.js');
    const zip = await window.JSZip.loadAsync(buf);
    const xml = await zip.file('content.xml').async('string');
    const blocks = [];
    const re = /<text:h[^>]*?(?:text:outline-level="(\d)")?[^>]*>([\s\S]*?)<\/text:h>|<text:list-item[^>]*>([\s\S]*?)<\/text:list-item>|<text:p[^>]*>([\s\S]*?)<\/text:p>/g;
    let m;
    while ((m = re.exec(xml))) {
      if (m[2] !== undefined) blocks.push({ type: 'heading', level: +(m[1] || 1), text: xmlText(m[2]) });
      else if (m[3] !== undefined) {
        const t = xmlText(m[3]);
        if (!t) continue;
        const last = blocks[blocks.length - 1];
        if (last && last.type === 'list') last.items.push(t);
        else blocks.push({ type: 'list', items: [t] });
      } else {
        const t = xmlText(m[4]);
        if (t) blocks.push({ type: 'para', text: t });
      }
    }
    let title = '';
    const meta = await zip.file('meta.xml')?.async('string');
    if (meta) title = xmlText((meta.match(/<dc:title>([\s\S]*?)<\/dc:title>/) || [])[1] || '');
    return { title, blocks: blocks.filter((b) => b.type !== 'heading' || b.text) };
  }

  async function parseEPUB(buf) {
    await loadScript('vendor/jszip.min.js');
    const zip = await window.JSZip.loadAsync(buf);
    let order = [];
    let title = '', author = '';
    try {
      const container = await zip.file('META-INF/container.xml').async('string');
      const opfPath = container.match(/full-path="([^"]+)"/)[1];
      const base = opfPath.includes('/') ? opfPath.replace(/[^/]+$/, '') : '';
      const opf = await zip.file(opfPath).async('string');
      title = xmlText((opf.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/) || [])[1] || '');
      author = xmlText((opf.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/) || [])[1] || '');
      const manifest = {};
      (opf.match(/<item\s[^>]*>/g) || []).forEach((it) => {
        const id = (it.match(/id="([^"]+)"/) || [])[1];
        const href = (it.match(/href="([^"]+)"/) || [])[1];
        if (id && href) manifest[id] = base + decodeURIComponent(href);
      });
      order = (opf.match(/<itemref\s[^>]*idref="([^"]+)"/g) || []).map((r) => manifest[r.match(/idref="([^"]+)"/)[1]]).filter(Boolean);
    } catch (e) {
      order = Object.keys(zip.files).filter((f) => /\.(x?html?)$/i.test(f)).sort();
    }
    const blocks = [];
    for (const f of order) {
      const file = zip.file(f);
      if (!file) continue;
      const html = await file.async('string');
      blocks.push(...htmlToBlocks(html).blocks);
    }
    return { title, author, blocks };
  }

  async function parseXLSX(buf) {
    await loadScript('vendor/jszip.min.js');
    const zip = await window.JSZip.loadAsync(buf);
    const ss = await zip.file('xl/sharedStrings.xml')?.async('string');
    const strings = ss ? (ss.match(/<si>[\s\S]*?<\/si>/g) || []).map((s) => xmlText((s.match(/<t[^>]*>[\s\S]*?<\/t>/g) || []).join(''))) : [];
    const sheets = Object.keys(zip.files).filter((f) => /^xl\/worksheets\/sheet\d+\.xml$/.test(f)).sort();
    const blocks = [];
    for (const f of sheets.slice(0, 5)) {
      const xml = await zip.file(f).async('string');
      const rows = (xml.match(/<row[\s\S]*?<\/row>/g) || []).slice(0, 40).map((r) =>
        (r.match(/<c [^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || []).map((c) => {
          const v = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1] || xmlText((c.match(/<is>([\s\S]*?)<\/is>/) || [])[1] || '');
          return /t="s"/.test(c) ? strings[+v] || '' : v;
        }));
      if (rows.length) {
        blocks.push({ type: 'heading', level: 2, text: 'Hoja ' + f.match(/(\d+)\.xml/)[1] });
        blocks.push({ type: 'table', rows });
        rows.forEach((r) => { const t = r.filter((c) => c && isNaN(c)).join(', '); if (t.length > 60) blocks.push({ type: 'para', text: t }); });
      }
    }
    return { title: '', blocks };
  }

  /* ---------- RTF ---------- */
  function rtfToText(rtf) {
    let depth = 0;
    const skipStack = [];
    let skip = false;
    let out = '';
    const destSkip = /^(fonttbl|colortbl|stylesheet|info|pict|header|footer|object|themedata|datastore|latentstyles|xmlnstbl|listtable|listoverridetable|rsidtbl|generator|\*)$/;
    for (let i = 0; i < rtf.length; i++) {
      const c = rtf[i];
      if (c === '{') { skipStack.push(skip); depth++; continue; }
      if (c === '}') { skip = skipStack.pop() || false; depth--; continue; }
      if (c === '\\') {
        const m = rtf.slice(i + 1).match(/^([a-z]+)(-?\d+)? ?|^'([0-9a-f]{2})|^([\\{}])|^\*|^(~|-|_)/i);
        if (!m) continue;
        i += m[0].length;
        if (m[1]) {
          if (destSkip.test(m[1])) skip = true;
          if (!skip) {
            if (m[1] === 'par' || m[1] === 'line') out += '\n';
            else if (m[1] === 'tab') out += ' ';
            else if (m[1] === 'u' && m[2]) { out += String.fromCharCode(+m[2] < 0 ? +m[2] + 65536 : +m[2]); if (rtf[i + 1] === '?') i++; }
          }
        } else if (m[3] && !skip) out += new TextDecoder('windows-1252').decode(new Uint8Array([parseInt(m[3], 16)]));
        else if (m[4] && !skip) out += m[4];
        else if (m[0] === '*') skip = true;
        else if (m[5] === '~' && !skip) out += ' ';
        continue;
      }
      if (!skip && c !== '\r' && c !== '\n') out += c;
    }
    return out.replace(/\n{3,}/g, '\n\n');
  }

  /* ---------- DOC binario antiguo (extracción heurística) ---------- */
  function legacyDocText(buf) {
    const bytes = new Uint8Array(buf);
    const u16 = new TextDecoder('utf-16le').decode(bytes);
    const runs16 = (u16.match(/[\p{L}\p{N}\p{P}\p{Zs}\r\n]{20,}/gu) || []).filter((r) => (r.match(/\p{L}/gu) || []).length > r.length * 0.6);
    const latin = new TextDecoder('windows-1252').decode(bytes);
    const runs8 = (latin.match(/[A-Za-zÀ-ÿ0-9 ,.;:¿?¡!()'"%\-\r\n]{30,}/g) || []);
    const best = runs16.join('').length > runs8.join('').length ? runs16 : runs8;
    return best.join('\n').replace(/\r/g, '\n');
  }

  /* ---------- Imagen (OCR) ---------- */
  async function parseImage(file, onProgress) {
    await loadScript('vendor/tesseract/tesseract.min.js');
    const abs = (p) => new URL(p, location.href).href;
    const base = {
      workerPath: abs('vendor/tesseract/worker.min.js'),
      corePath: abs('vendor/tesseract/'),
      logger: (m) => { if (m.status === 'recognizing text' && onProgress) onProgress(m.progress); }
    };
    let worker;
    try {
      worker = await window.Tesseract.createWorker('spa+eng', 1, { ...base, langPath: abs('vendor/tesseract/lang'), gzip: true });
    } catch (e) {
      // Si los datos de idioma locales no están disponibles, usa los oficiales de Tesseract
      worker = await window.Tesseract.createWorker('spa+eng', 1, base);
    }
    try {
      const res = await worker.recognize(file);
      return { title: '', blocks: ocrToBlocks(res.data) };
    } finally {
      worker.terminate();
    }
  }

  /* Usa la geometría de las líneas del OCR para distinguir títulos y párrafos */
  function ocrToBlocks(data) {
    const lines = (data.lines || []).map((l) => ({ text: clean(l.text), y0: l.bbox.y0, y1: l.bbox.y1, h: l.bbox.y1 - l.bbox.y0, conf: l.confidence }))
      .filter((l) => l.text && l.conf > 35);
    if (lines.length < 2) return plainToBlocks(data.text || '');
    const hs = lines.map((l) => l.h).sort((a, b) => a - b);
    const med = hs[Math.floor(hs.length / 2)] || 10;
    const blocks = [];
    let para = [], prev = null;
    const flush = () => { if (para.length) blocks.push({ type: 'para', text: clean(para.join('\n').replace(/(\p{L})-\n(\p{Ll})/gu, '$1$2').replace(/\n/g, ' ')) }); para = []; };
    lines.forEach((l) => {
      const t = l.text.replace(/^[^\p{L}\d"“¿¡(]+/u, '').replace(/^\d\s+(?=\p{Lu}\p{Ll})/u, '');
      const words = t.split(/\s+/).length;
      if (l.h >= med * 1.22 && words <= 14 && !/[.;,]$/.test(t)) {
        flush();
        const last = blocks[blocks.length - 1];
        if (last && last.type === 'heading' && prev && prev.isHead && l.y0 - prev.y1 < med * 0.8) last.text += ' ' + t;
        else blocks.push({ type: 'heading', level: l.h >= med * 1.6 ? 1 : 2, text: t });
        prev = { ...l, isHead: true };
        return;
      }
      if (prev && !prev.isHead && l.y0 - prev.y1 > med * 0.9) flush();
      para.push(t);
      prev = l;
    });
    flush();
    return blocks
      .filter((b) => (b.text.match(/\p{L}/gu) || []).length >= 3)
      .map((b) => (b.type === 'para' && b.text.split(/\s+/).length <= 6 && !/[.;,:!?]$/.test(b.text) && /^\p{Lu}/u.test(b.text) ? { type: 'heading', level: 2, text: b.text } : b));
  }

  /* ---------- JSON / CSV ---------- */
  function jsonToBlocks(obj) {
    const blocks = [];
    const visit = (v, key, depth) => {
      if (typeof v === 'string') {
        if (v.length > 80) blocks.push({ type: 'para', text: clean(v) });
        else if (/title|titulo|título|name|nombre|heading/i.test(key || '')) blocks.push({ type: 'heading', level: Math.min(3, depth + 1), text: clean(v) });
      } else if (Array.isArray(v)) {
        const strs = v.filter((x) => typeof x === 'string');
        if (strs.length && strs.length === v.length) blocks.push({ type: 'list', items: strs.map(clean) });
        else v.forEach((x) => visit(x, key, depth + 1));
      } else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => visit(x, k, depth + 1));
    };
    visit(obj, '', 0);
    return blocks;
  }
  function csvToBlocks(text) {
    const sep = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    const rows = text.split(/\r?\n/).filter(Boolean).slice(0, 60).map((l) => l.split(sep).map((c) => clean(c.replace(/^"|"$/g, ''))));
    return [{ type: 'table', rows }];
  }

  /* ---------- Decodificación de texto con detección de codificación ---------- */
  function decodeText(buf) {
    const bytes = new Uint8Array(buf);
    if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes);
    if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes);
    const utf8 = new TextDecoder('utf-8').decode(bytes);
    if ((utf8.match(/\uFFFD/g) || []).length > 3) return new TextDecoder('windows-1252').decode(bytes);
    return utf8;
  }

  /* ---------- Filtrado de imágenes pequeñas ---------- */
  async function filterImages(blocks) {
    const imgs = blocks.filter((b) => b.type === 'image');
    await Promise.all(imgs.map((b) => new Promise((res) => {
      const im = new Image();
      im.onload = () => { b.w = im.naturalWidth; b.h = im.naturalHeight; res(); };
      im.onerror = () => { b.bad = true; res(); };
      im.src = b.src;
      setTimeout(res, 4000);
    })));
    return blocks.filter((b) => b.type !== 'image' || (!b.bad && b.w >= 220 && b.h >= 140 && /^data:/.test(b.src)));
  }

  /* ---------- Punto de entrada ---------- */
  PD.parseFile = async function (file, onProgress) {
    const name = file.name || 'documento';
    const ext = (name.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase() || '';
    const type = file.type || '';
    const baseTitle = name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
    let result;
    const buf = () => file.arrayBuffer();

    if (ext === 'pdf' || type === 'application/pdf') result = await parsePDF(await buf(), onProgress);
    else if (ext === 'docx' || ext === 'docm' || ext === 'dotx') result = await parseDOCX(await buf());
    else if (ext === 'pptx' || ext === 'ppsx' || ext === 'potx') result = await parsePPTX(await buf());
    else if (['odt', 'odp', 'ods', 'ott'].includes(ext)) result = await parseODF(await buf());
    else if (ext === 'epub') result = await parseEPUB(await buf());
    else if (ext === 'xlsx' || ext === 'xlsm') result = await parseXLSX(await buf());
    else if (/^image\//.test(type) || ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tif', 'tiff'].includes(ext)) result = await parseImage(file, onProgress);
    else {
      const raw = await buf();
      const head = new Uint8Array(raw.slice(0, 8));
      const isZip = head[0] === 0x50 && head[1] === 0x4b;
      const isOle = head[0] === 0xd0 && head[1] === 0xcf;
      const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
      if (isPdf) result = await parsePDF(raw, onProgress);
      else if (isZip) {
        await loadScript('vendor/jszip.min.js');
        const zip = await window.JSZip.loadAsync(raw);
        if (zip.file('word/document.xml')) result = await parseDOCX(raw);
        else if (zip.file('ppt/presentation.xml')) result = await parsePPTX(raw);
        else if (zip.file('content.xml')) result = await parseODF(raw);
        else if (zip.file('META-INF/container.xml')) result = await parseEPUB(raw);
        else if (zip.file('xl/workbook.xml')) result = await parseXLSX(raw);
        else throw new Error('Archivo comprimido no reconocido');
      } else if (isOle || ext === 'doc' || ext === 'ppt' || ext === 'xls') {
        result = { title: '', blocks: plainToBlocks(legacyDocText(raw)) };
      } else {
        const text = decodeText(raw);
        if (ext === 'rtf' || /^\{\\rtf/.test(text)) result = { title: '', blocks: plainToBlocks(rtfToText(text)) };
        else if (['html', 'htm', 'xhtml', 'mhtml'].includes(ext) || /^\s*<(!doctype html|html)/i.test(text)) result = htmlToBlocks(text, baseTitle);
        else if (['md', 'markdown', 'mdx'].includes(ext)) result = { title: '', blocks: markdownToBlocks(text) };
        else if (ext === 'json') { try { result = { title: '', blocks: jsonToBlocks(JSON.parse(text)) }; } catch (e) { result = { title: '', blocks: plainToBlocks(text) }; } }
        else if (ext === 'csv' || ext === 'tsv') result = { title: '', blocks: csvToBlocks(ext === 'tsv' ? text.replace(/\t/g, ';') : text) };
        else if (['xml', 'svg', 'fb2'].includes(ext) || /^\s*<\?xml/.test(text)) result = htmlToBlocks(text.replace(/<(\/?)(title|section)>/g, '<$1div>'), baseTitle);
        else if (/^\s*#{1,3}\s/m.test(text) && /\n#{1,3}\s/.test(text)) result = { title: '', blocks: markdownToBlocks(text) };
        else result = { title: '', blocks: plainToBlocks(text) };
      }
    }
    result.blocks = await filterImages(result.blocks || []);
    result.fileName = name;
    result.fileTitle = baseTitle;
    result.format = (ext || type.split('/')[1] || 'txt').toUpperCase();
    return result;
  };

  PD.parseText = function (text) {
    const md = /^\s*#{1,3}\s/m.test(text);
    return { title: '', blocks: md ? markdownToBlocks(text) : plainToBlocks(text), fileName: 'texto', fileTitle: '', format: 'TEXTO' };
  };
  PD._plainToBlocks = plainToBlocks;
})();
