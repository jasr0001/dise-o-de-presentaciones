/* Lumina Slides — Renderizado de diapositivas (HTML 1280×720) */
(function () {
  'use strict';
  const PD = (window.PD = window.PD || {});

  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  PD.esc = esc;

  const ICONS = [
    '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    '<path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M14 4c3-1 6-1 6-1s0 3-1 6l-6 6-5-5 6-6zM9 10l-3 1-2 3 4 1M14 15l-1 3-3 2-1-4"/>',
    '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z"/><path d="m9 12 2 2 4-4"/>',
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"/>',
    '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'
  ];
  const icon = (i) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[i % ICONS.length]}</svg>`;
  const check = '<svg class="chk" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

  /* Énfasis automático: texto antes de “:” en negrita y una palabra clave en color */
  function emphasize(text, kws, on) {
    const t = esc(text);
    if (!on) return t;
    const c = text.indexOf(':');
    if (c > 2 && c < text.length * 0.45 && c < 60) {
      return `<strong>${esc(text.slice(0, c + 1))}</strong>${esc(text.slice(c + 1))}`;
    }
    for (const k of kws || []) {
      const re = new RegExp('(^|[^\\p{L}])(' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?=[^\\p{L}]|$)', 'iu');
      if (re.test(text)) return t.replace(re, (m, a, b) => `${a}<span class="kw">${b}</span>`);
    }
    return t;
  }

  const lenClass = (s) => {
    const n = (s || '').length;
    return n > 95 ? 't-xl' : n > 60 ? 't-l' : n > 34 ? 't-m' : 't-s';
  };
  const ed = (f) => `data-f="${f}"`;

  function head(s, extra) {
    return `<header class="s-head">${s.kicker ? `<div class="s-kicker" ${ed('kicker')}>${esc(s.kicker)}</div>` : ''}<h2 class="s-title ${lenClass(s.title)}" ${ed('title')}>${esc(s.title)}</h2>${extra || ''}<div class="s-accent"></div></header>`;
  }

  function bulletsHTML(list, ctx, cls, field) {
    field = field || 'bullets';
    return `<ul class="s-list ${cls || ''}">${list.map((b, i) => `<li><span class="mk"></span><span class="tx" ${ed(field + '.' + i)}>${emphasize(b, ctx.kws, ctx.emph)}</span></li>`).join('')}</ul>`;
  }

  const R = {
    cover(s, ctx) {
      const meta = [s.author, s.date].filter(Boolean).map(esc).join('<span class="sep">·</span>');
      return `<div class="s-inner center-v">
        ${s.kicker ? `<div class="s-kicker cover-k" ${ed('kicker')}>${esc(s.kicker)}</div>` : ''}
        <h1 class="s-cover-title ${lenClass(s.title)}" ${ed('title')}>${esc(s.title)}</h1>
        <div class="s-accent big"></div>
        ${s.subtitle ? `<p class="s-cover-sub" ${ed('subtitle')}>${esc(s.subtitle)}</p>` : ''}
        ${meta ? `<div class="s-meta">${meta}</div>` : ''}
      </div>`;
    },
    agenda(s, ctx) {
      const two = s.items.length > 5;
      return `<div class="s-inner">${head(s)}<div class="s-body"><ol class="s-agenda ${two ? 'two' : ''}">${s.items.map((t, i) => `<li><span class="num">${String(i + 1).padStart(2, '0')}</span><span class="tx" ${ed('items.' + i)}>${esc(t)}</span></li>`).join('')}</ol></div></div>`;
    },
    summary(s, ctx) {
      return `<div class="s-inner">${head(s)}<div class="s-body"><ol class="s-summary n${s.items.length}">${s.items.map((t, i) => `<li><span class="num">${i + 1}</span><span class="tx" ${ed('items.' + i)}>${emphasize(t, ctx.kws, ctx.emph)}</span></li>`).join('')}</ol></div></div>`;
    },
    concepts(s) {
      return `<div class="s-inner">${head(s)}<div class="s-body"><div class="s-cloud">${s.keywords.map((k, i) => `<span class="chip w${Math.max(1, Math.round(k.w * 4))} c${i % 3}" ${ed('keywords.' + i + '.term')}>${esc(k.term)}</span>`).join('')}</div></div></div>`;
    },
    divider(s) {
      return `<div class="s-inner center-v">
        <div class="s-bignum">${String(s.number).padStart(2, '0')}</div>
        <h2 class="s-div-title ${lenClass(s.title)}" ${ed('title')}>${esc(s.title)}</h2>
        <div class="s-accent big"></div>
        ${s.subtitle ? `<p class="s-div-sub" ${ed('subtitle')}>${esc(s.subtitle)}</p>` : ''}
      </div>`;
    },
    content(s, ctx) {
      const L = s.layout;
      let body = '';
      if (L === 'highlight' && s.statement) {
        body = `<div class="s-highlight"><blockquote class="stmt" ${ed('statement')}>${esc(s.statement)}</blockquote>${s.bullets.length ? bulletsHTML(s.bullets, ctx, 'compact') : ''}</div>`;
      } else if (L === 'split') {
        const h = Math.ceil(s.bullets.length / 2);
        body = `<div class="s-split"><div>${bulletsHTML(s.bullets.slice(0, h), ctx)}</div><div class="col2">${s.bullets.slice(h).length ? `<ul class="s-list">${s.bullets.slice(h).map((b, i) => `<li><span class="mk"></span><span class="tx" ${ed('bullets.' + (i + h))}>${emphasize(b, ctx.kws, ctx.emph)}</span></li>`).join('')}</ul>` : ''}</div></div>`;
      } else if (L === 'cards') {
        body = `<div class="s-cards n${s.bullets.length}">${s.bullets.map((b, i) => `<div class="card"><div class="card-ico">${icon(i + ctx.index)}</div><p ${ed('bullets.' + i)}>${emphasize(b, ctx.kws, ctx.emph)}</p></div>`).join('')}</div>`;
      } else if (L === 'numbered') {
        body = `<ol class="s-steps n${s.bullets.length}">${s.bullets.map((b, i) => `<li><span class="step">${i + 1}</span><span class="tx" ${ed('bullets.' + i)}>${emphasize(b, ctx.kws, ctx.emph)}</span></li>`).join('')}</ol>`;
      } else if (L === 'image' && s.image) {
        body = `<div class="s-withimg"><div class="txt">${bulletsHTML(s.bullets, ctx, 'compact')}</div><figure class="img"><img src="${esc(s.image.src)}" alt="${esc(s.image.alt)}"></figure></div>`;
      } else {
        body = bulletsHTML(s.bullets, ctx, s.bullets.length <= 3 ? 'airy' : '');
      }
      return `<div class="s-inner">${head(s)}<div class="s-body">${body}</div></div>`;
    },
    image(s) {
      return `<div class="s-inner">${head(s)}<div class="s-body"><figure class="s-figure"><img src="${esc(s.image.src)}" alt="${esc(s.image.alt)}"><figcaption ${ed('caption')}>${esc(s.caption)}</figcaption></figure></div></div>`;
    },
    table(s) {
      const [h, ...rows] = s.rows;
      return `<div class="s-inner">${head(s)}<div class="s-body"><div class="s-table-wrap"><table class="s-table cols${h.length}"><thead><tr>${h.map((c, j) => `<th ${ed('rows.0.' + j)}>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr>${h.map((_, j) => `<td ${ed('rows.' + (i + 1) + '.' + j)}>${esc(r[j] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div></div>`;
    },
    stats(s) {
      return `<div class="s-inner">${head(s)}<div class="s-body"><div class="s-stats n${s.stats.length}">${s.stats.map((x, i) => `<div class="stat c${i % 3}"><div class="val ${x.value.length > 6 ? 'long' : ''}" ${ed('stats.' + i + '.value')}>${esc(x.value)}</div><div class="bar"></div><div class="lbl" ${ed('stats.' + i + '.label')}>${esc(x.label)}</div></div>`).join('')}</div></div></div>`;
    },
    chart(s) {
      const max = Math.max(...s.bars.map((b) => b.value), 1);
      const scale = max <= 100 ? 100 : max;
      return `<div class="s-inner">${head(s)}<div class="s-body"><div class="s-chart">${s.bars.map((b, i) => `<div class="row"><div class="lbl" ${ed('bars.' + i + '.label')}>${esc(b.label)}</div><div class="track"><div class="fill c${i % 3}" style="width:${Math.max(4, (b.value / scale) * 100).toFixed(1)}%"></div></div><div class="v">${esc(b.display)}</div></div>`).join('')}<div class="axis"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div></div></div></div>`;
    },
    timeline(s) {
      return `<div class="s-inner">${head(s)}<div class="s-body"><div class="s-timeline n${s.events.length}"><div class="line"></div>${s.events.map((e, i) => `<div class="ev ${i % 2 ? 'down' : 'up'}"><div class="yr" ${ed('events.' + i + '.label')}>${esc(e.label)}</div><div class="dot"></div><div class="txt" ${ed('events.' + i + '.text')}>${esc(e.text)}</div></div>`).join('')}</div></div></div>`;
    },
    quote(s) {
      return `<div class="s-inner center-v"><div class="s-quote"><div class="qmark">“</div><blockquote class="${lenClass(s.quote)}" ${ed('quote')}>${esc(s.quote)}</blockquote>${s.author ? `<cite ${ed('author')}>— ${esc(s.author)}</cite>` : ''}</div></div>`;
    },
    glossary(s) {
      return `<div class="s-inner">${head(s)}<div class="s-body"><dl class="s-gloss n${s.items.length}">${s.items.map((g, i) => `<div class="g"><dt ${ed('items.' + i + '.term')}>${esc(g.term)}</dt><dd ${ed('items.' + i + '.def')}>${esc(g.def)}</dd></div>`).join('')}</dl></div></div>`;
    },
    conclusions(s, ctx) {
      return `<div class="s-inner">${head(s)}<div class="s-body"><ul class="s-checks">${s.bullets.map((b, i) => `<li><span class="ck">${check}</span><span class="tx" ${ed('bullets.' + i)}>${emphasize(b, ctx.kws, ctx.emph)}</span></li>`).join('')}</ul></div></div>`;
    },
    references(s) {
      return `<div class="s-inner">${head(s)}<div class="s-body"><ol class="s-refs">${s.items.map((r, i) => `<li ${ed('items.' + i)}>${esc(r)}</li>`).join('')}</ol></div></div>`;
    },
    closing(s) {
      return `<div class="s-inner center-v closing">
        <h1 class="s-thanks" ${ed('title')}>${esc(s.title)}</h1>
        <div class="s-accent big"></div>
        <p class="s-q" ${ed('subtitle')}>${esc(s.subtitle)}</p>
        ${s.keywords && s.keywords.length ? `<div class="s-tags">${s.keywords.map((k) => `<span>#${esc(k.replace(/\s+/g, ''))}</span>`).join('')}</div>` : ''}
        <div class="s-meta">${esc(s.kicker || '')}${s.author ? `<span class="sep">·</span>${esc(s.author)}` : ''}</div>
      </div>`;
    }
  };

  /* theme: { tpl, pal, font, vars, opts:{numbers, footer, emphasis}, deckTitle, kws } */
  PD.renderSlide = function (s, index, total, theme) {
    const ctx = { kws: theme.kws || [], emph: theme.opts.emphasis !== false, index };
    const fn = R[s.type] || R.content;
    const big = ['cover', 'closing', 'divider', 'quote'].includes(s.type);
    const foot = !big && (theme.opts.numbers || theme.opts.footer)
      ? `<footer class="s-foot">${theme.opts.footer ? `<span class="ft">${esc(theme.deckTitle || '')}</span>` : '<span></span>'}${theme.opts.numbers ? `<span class="pg">${String(index + 1).padStart(2, '0')}<i> / ${String(total).padStart(2, '0')}</i></span>` : ''}</footer>`
      : '';
    return `<div class="slide tpl-${theme.tpl} type-${s.type} ${s.layout ? 'layout-' + s.layout : ''} ${theme.pal.dark ? 'is-dark' : 'is-light'}" style="${theme.vars}" data-id="${s.id}">
      <div class="s-deco">${PD.decor(theme.tpl, s.type, index)}</div>
      ${fn(s, ctx)}
      ${foot}
    </div>`;
  };

  /* Ajuste automático del texto para que nunca desborde */
  PD.fitSlide = function (el) {
    const slide = el.classList.contains('slide') ? el : el.querySelector('.slide');
    if (!slide) return;
    slide.style.setProperty('--fs', 1);
    const inner = slide.querySelector('.s-inner');
    const body = slide.querySelector('.s-body') || inner;
    if (!inner) return;
    let fs = 1;
    const over = () => body.scrollHeight > body.clientHeight + 1 || inner.scrollHeight > inner.clientHeight + 1 || body.scrollWidth > body.clientWidth + 2;
    let guard = 0;
    while (over() && fs > 0.6 && guard++ < 14) {
      fs -= 0.04;
      slide.style.setProperty('--fs', fs.toFixed(2));
    }
  };
})();
