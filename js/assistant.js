/* Lumina Slides — Asistente de chat: entiende peticiones en lenguaje natural (español, y lo
 * más común en inglés) y las convierte en ajustes de la presentación. Funciona por reglas,
 * dentro del navegador, sin enviar nada a ningún servidor. */
(function () {
  'use strict';
  const PD = (window.PD = window.PD || {});
  const norm = (t) => (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

  const NUMS = { una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veinticinco: 25, treinta: 30, cuarenta: 40, cincuenta: 50, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fifteen: 15, twenty: 20 };

  const ELEMENTS = [
    ['perApartado', /\b(cada|un|una|por) apartado|apartados? (separados|aparte|en (su|una) (propia )?(diapositiva|pagina|lamina))|cada seccion en (su|una) (propia )?(diapositiva|pagina)/],
    ['agenda', /\b(indice|agenda|sumario|tabla de contenidos?)\b/],
    ['summary', /\b(resumen ejecutivo|resumen|ideas clave|puntos clave)\b/],
    ['dividers', /\b(separadores?|divisores?|portadillas? de seccion|diapositivas? de seccion)\b/],
    ['chart', /\b(graficos?|graficas?|barras|charts?)\b/],
    ['stats', /\b(datos clave|cifras( clave)?|estadisticas|numeros clave|key figures)\b/],
    ['timeline', /\b(cronologia|linea (de tiempo|temporal)|timeline)\b/],
    ['quote', /\b(citas?( destacadas?)?|frase destacada|quotes?)\b/],
    ['concepts', /\b(conceptos( clave)?|palabras clave|keywords)\b/],
    ['images', /\b(imagenes|fotos|fotografias|figuras|images)\b/],
    ['tables', /\b(tablas?|tables?)\b/],
    ['glossary', /\b(glosario|glossary)\b/],
    ['conclusions', /\b(conclusiones|conclusion|conclusions?)\b/],
    ['references', /\b(referencias|bibliografia|fuentes|references|bibliography)\b/],
    ['closing', /\b(cierre|diapositiva final|gracias|preguntas finales|closing)\b/]
  ];
  const ELEMENT_NAMES = { perApartado: 'un apartado por diapositiva', agenda: 'índice', summary: 'resumen ejecutivo', dividers: 'separadores de sección', chart: 'gráfico de cifras', stats: 'datos clave', timeline: 'cronología', quote: 'cita destacada', concepts: 'conceptos clave', images: 'imágenes', tables: 'tablas', glossary: 'glosario', conclusions: 'conclusiones', references: 'referencias', closing: 'diapositiva de cierre' };

  const COLOR_WORDS = [
    [/\b(azul|azules|blue)\b/, 'oceano'], [/\b(verde|verdes|green)\b/, 'bosque'], [/\b(rojo|roja|rojos|red|vino|granate)\b/, 'vino'],
    [/\b(morado|morada|violeta|lila|purple)\b/, 'lavanda'], [/\b(naranja|anaranjado|orange)\b/, 'atardecer'], [/\b(rosa|rosado|pink)\b/, 'rubi'],
    [/\b(dorado|oro|gold)\b/, 'oro'], [/\b(gris|blanco y negro|monocromo|black and white)\b/, 'mono'], [/\b(beige|sepia|crema)\b/, 'sepia'],
    [/\b(pastel|pasteles)\b/, 'pastel'], [/\b(oscur[oa]s?|negr[oa]|dark|modo oscuro|fondo oscuro)\b/, 'medianoche'], [/\b(clar[oa]s?|fondo claro|light)\b/, 'papel']
  ];
  const FONT_WORDS = [[/\b(seria|formal|clasica|tradicional)\b/, 'clasica'], [/\b(moderna|actual)\b/, 'moderna'], [/\b(elegante|fina)\b/, 'elegante'], [/\b(divertida|amigable|informal|redondeada)\b/, 'amigable'], [/\b(tecnica|tecnologica)\b/, 'tecnica'], [/\b(grande|impactante|de cartel)\b/, 'cartel']];
  const LANGS = [[/\b(espanol|castellano|spanish)\b/, 'es'], [/\b(ingles|english)\b/, 'en'], [/\b(frances|french)\b/, 'fr'], [/\b(aleman|german)\b/, 'de'], [/\b(portugues|portuguese)\b/, 'pt']];
  const LEVELS = [[/\b(esencial|basica|minima)\b/, 1], [/\b(equilibrada|equilibrado|intermedia|normal)\b/, 2], [/\b(detallada|detallado)\b/, 3], [/\b(exhaustiva|exhaustivo|completisima|completa al maximo)\b/, 4]];

  const EXCL = /\b(quita(r|le|me)?|quitale|elimina(r|le)?|borra(r)?|saca(r)?|suprime|omite|omitir|sin|no (incluyas|pongas|quiero|metas|agregues|anadas)|remove|delete|drop|without|no)\b/;
  const INCL = /\b(anade|anadir|agrega|agregar|incluye|incluir|pon(le|me)?|poner|mete|meter|quiero|con|add|include|tambien)\b/;
  const FOCUS = /\b(enfocate|enfocate|enfoca(te)?|centrate|centra(te)?|concentrate|profundiza|dale (mas )?(importancia|peso|enfasis)|destaca|resalta|mas (sobre|de|acerca de)|focus|emphasi[sz]e)\b\s*(en|sobre|a|acerca de|on|in)?\s*/;

  function splitItems(t) {
    return t.split(/\s*(?:,|;|\by\b|\be\b|\band\b|\bo\b|\btambien\b)\s*/).map((x) => x.replace(/^(el|la|los|las|lo|un|una|the|a|an|de|del|sobre|acerca de)\s+/, '').replace(/[.!?¡¿"“”«»]/g, '').trim()).filter((x) => x.length > 1);
  }
  const elementOf = (t) => { for (const [id, re] of ELEMENTS) if (re.test(t)) return id; return null; };

  /* Devuelve { actions: [...], reply: '...', understood: bool } */
  PD.interpret = function (raw, ctx) {
    const actions = [];
    const said = [];
    let text = ' ' + raw.trim() + ' ';
    const n = () => norm(text);

    // Ayuda
    if (/\b(ayuda|que puedes hacer|que puedo pedir|como funciona|help)\b/.test(n())) {
      return { actions: [], understood: true, help: true, reply: 'Puedes pedirme cosas como estas, con tus palabras:' };
    }
    // Reiniciar
    if (/\b(empieza de nuevo|restablece|reinicia|como al principio|deshaz (todo|los cambios)|reset)\b/.test(n())) {
      return { actions: [{ type: 'reset' }], understood: true, reply: 'Listo: quité todas las peticiones del chat y volví a generar la presentación.' };
    }

    // Metadatos de portada (texto libre: se procesa primero sobre el texto original)
    const meta = [
      ['title', /(?:ponle (?:de|como) t[ií]tulo|cambia el t[ií]tulo (?:a|por)|el t[ií]tulo (?:sea|es|debe ser|que diga)|t[ií]tulo\s*[:=]|title\s*[:=])\s*["“«]?([^"”»\n]+?)["”»]?(?=\s*(?:[.;]|$| y (?:el|la|que|pon|quita|a[nñ]ade)))/i, 'el título'],
      ['subtitle', /(?:ponle (?:de|como) subt[ií]tulo|el subt[ií]tulo (?:sea|es|que diga)|subt[ií]tulo\s*[:=])\s*["“«]?([^"”»\n]+?)["”»]?(?=\s*(?:[.;]|$| y (?:el|la|que|pon|quita|a[nñ]ade)))/i, 'el subtítulo'],
      ['author', /(?:presentado por|presenta(?:dor)?\s*[:=]|autor(?:a)?\s*[:=]|mi nombre es|el autor (?:es|sea)|pon(?:le)? (?:mi nombre|como autor)\s*[:=]?)\s*["“«]?([^"”»\n,;]+?)["”»]?(?=\s*(?:[,;]|$| y ))/i, 'el autor'],
      ['date', /(?:fecha\s*[:=]|la fecha (?:sea|es))\s*["“«]?([^"”»\n,;]+?)["”»]?(?=\s*(?:[.,;]|$| y ))/i, 'la fecha']
    ];
    meta.forEach(([field, re, label]) => {
      const m = text.match(re);
      if (m) { const v = m[1].replace(/^[\s:=]+/, '').replace(/[\s.]+$/, '').trim(); if (v) { actions.push({ type: 'meta', field, value: v }); said.push(`Puse ${label}: «${v}».`); } text = text.replace(m[0], ' '); }
    });

    let t = n();
    // Número de diapositivas
    const numRe = /\b(maximo|como maximo|no mas de|menos de|hasta|exactamente|solo|solamente|unas|quiero|que tenga|hazla de|hazla|haz|en)?\s*(\d{1,3}|[a-z]+)\s+(?:diapositivas|diapos|slides|laminas|paginas|transparencias)\b/;
    const nm = t.match(numRe);
    if (nm) {
      let k = /^\d+$/.test(nm[2]) ? +nm[2] : NUMS[nm[2]];
      if (k) {
        if (nm[1] === 'menos de') k -= 1;
        actions.push({ type: 'maxSlides', n: Math.max(3, k) });
        said.push(`La presentación tendrá como máximo ${Math.max(3, k)} diapositivas.`);
        t = t.replace(nm[0], ' ');
      }
    }

    // Idioma
    if (/\b(idioma|traduc|en (espanol|castellano|ingles|frances|aleman|portugues)|in (english|french|german|spanish|portuguese))/.test(t)) {
      for (const [re, id] of LANGS) if (re.test(t)) { actions.push({ type: 'lang', id }); said.push('Cambié el idioma de la presentación.'); t = t.replace(re, ' '); break; }
    }

    // Plantilla
    const tplCtx = /\b(plantilla|estilo|diseno|tema|template|usa|cambia(la)? a|ponla|que parezca|tipo)\b/.test(t);
    for (const tp of PD.templates) {
      const alts = [norm(tp.name), norm(tp.id).replace(/-/g, ' '), norm(tp.name).split(' ')[0]].filter((x, i, arr) => x.length > 2 && arr.indexOf(x) === i);
      const nameRe = new RegExp('\\b(' + alts.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b');
      if (nameRe.test(t) && (tplCtx || norm(tp.name).length > 6 && new RegExp('\\b' + norm(tp.name) + '\\b').test(t))) { actions.push({ type: 'template', id: tp.id }); said.push(`Apliqué la plantilla «${tp.name}».`); t = t.replace(nameRe, ' ').replace(/\b(usa(r)?|pon(le|la)?|cambia(la|r)?( a)?|aplica)?\s*(la |el |un |una )?(plantilla|estilo|diseno|tema|template)\b/g, ' '); break; }
    }
    // Paleta
    const palCtx = /\b(color(es)?|paleta|tonos?|fondo|modo)\b/.test(t);
    let palDone = false;
    for (const pl of PD.palettes) {
      const re = new RegExp('\\b' + norm(pl.name) + '\\b');
      if (re.test(t) && (palCtx || norm(pl.name).length > 6)) { actions.push({ type: 'palette', id: pl.id }); said.push(`Cambié los colores a «${pl.name}».`); palDone = true; break; }
    }
    if (!palDone && palCtx) for (const [re, id] of COLOR_WORDS) if (re.test(t)) { actions.push({ type: 'palette', id }); said.push(`Cambié los colores a «${PD.getPalette(id).name}».`); break; }
    if (actions.some((a) => a.type === 'palette')) t = t.replace(/\b(con |en )?(los |las |la |el )?(colores?|paleta|tonos?|fondo|modo)\b[^,.;]*/g, ' ');
    // Tipografía
    if (/\b(letra|letras|tipografia|fuente|font)\b/.test(t)) {
      let done = false;
      for (const f of PD.fonts) if (new RegExp('\\b' + norm(f.name) + '\\b').test(t)) { actions.push({ type: 'font', id: f.id }); said.push(`Cambié la tipografía a «${f.name}».`); done = true; break; }
      if (!done) for (const [re, id] of FONT_WORDS) if (re.test(t)) { actions.push({ type: 'font', id }); said.push(`Cambié la tipografía a «${PD.getFont(id).name}».`); break; }
    }

    if (actions.some((a) => a.type === 'font')) t = t.replace(/\b(con |en )?(la |una |las )?(letras?|tipografia|fuente|font)\b[^,.;]*/g, ' ');
    // Nivel de detalle
    if (/\b(mas (corta|corto|breve|resumida|concisa|sencilla|simple)|menos (detalle|detallada|diapositivas)|resume mas|resumela|abrevia)\b/.test(t)) { actions.push({ type: 'levelDelta', d: -1 }); said.push('La hice más breve.'); }
    else if (/\b(mas (detallada|detallado|completa|completo|larga|extensa|profunda)|con mas detalle|amplia(la)?|mas diapositivas)\b/.test(t)) { actions.push({ type: 'levelDelta', d: 1 }); said.push('Le di más detalle.'); }
    else if (/\bnivel\b/.test(t)) for (const [re, id] of LEVELS) if (re.test(t)) { actions.push({ type: 'level', id }); said.push(`Usé el nivel ${PD.levels[id - 1].name}.`); break; }

    // Cantidad de texto por diapositiva
    if (/\b(menos texto|mas visual|menos palabras|frases mas cortas|una idea por diapositiva|mas limpia|menos cargada|less text)\b/.test(t)) { actions.push({ type: 'bullets', d: -1 }); said.push('Puse menos texto en cada diapositiva.'); t = t.replace(/\b(menos texto|mas visual|menos palabras|una idea por diapositiva)\b/, ' '); }
    else if (/\b(mas texto|mas puntos|mas informacion por diapositiva|more text)\b/.test(t)) { actions.push({ type: 'bullets', d: 1 }); said.push('Puse más puntos en cada diapositiva.'); }

    // Notas del orador
    if (/\bsin notas\b/.test(t)) { actions.push({ type: 'notes', on: false }); said.push('Quité las notas del orador.'); t = t.replace(/\bsin notas( del orador)?\b/, ' '); }
    else if (/\bcon notas\b/.test(t)) { actions.push({ type: 'notes', on: true }); said.push('Añadí notas del orador.'); }

    // Diapositiva sobre un tema
    const topicRe = /\b(anade|agrega|haz|crea|pon|incluye|mete|quiero|add|make)\s+(una|otra|un|1|an?)\s+(diapositiva|diapo|slide|lamina|pagina|seccion)\s+(sobre|de|acerca de|del|para|que hable de|about|on)\s+([^.;!?]+)/;
    let tm;
    while ((tm = t.match(topicRe))) {
      splitItems(tm[5]).slice(0, 4).forEach((term) => { actions.push({ type: 'addTopic', term }); said.push(`Añadí una diapositiva sobre «${term}».`); });
      t = t.replace(tm[0], ' ');
    }

    // Enfoque
    const fm = t.match(new RegExp(FOCUS.source + '([^.;!?]+)'));
    if (fm) {
      const terms = splitItems(fm[fm.length - 1]).slice(0, 4);
      terms.forEach((term) => { actions.push({ type: 'focus', term }); });
      if (terms.length) said.push(`Daré más espacio a: ${terms.map((x) => '«' + x + '»').join(', ')}.`);
      t = t.replace(fm[0], ' ');
    }

    // Quitar / añadir (elementos, apartados o temas)
    const clauses = t.split(/[.;!?]|\bpero\b|\bademas\b/);
    clauses.forEach((cl) => {
      const ex = cl.match(EXCL), inc = cl.match(INCL);
      const verb = ex && (!inc || ex.index <= inc.index) ? 'ex' : inc ? 'in' : null;
      if (!verb) {
        // «cada apartado en su diapositiva» sin verbo
        if (elementOf(cl) === 'perApartado') { actions.push({ type: 'element', id: 'perApartado', on: true }); said.push('Cada apartado irá en su propia diapositiva.'); }
        return;
      }
      const m = verb === 'ex' ? ex : inc;
      let rest = cl.slice(m.index + m[0].length).replace(/^\s*(que (haya|tenga|salga|aparezca)|la|el|los|las|lo|de|del)\s+/, ' ');
      if (!rest.trim()) return;
      if (elementOf(rest) === 'perApartado' || elementOf(cl) === 'perApartado') {
        actions.push({ type: 'element', id: 'perApartado', on: verb !== 'ex' });
        said.push(verb !== 'ex' ? 'Cada apartado irá en su propia diapositiva.' : 'Los apartados de una misma sección podrán compartir diapositiva.');
        return;
      }
      splitItems(rest).slice(0, 6).forEach((item) => {
        const elId = elementOf(item);
        if (elId) {
          actions.push({ type: 'element', id: elId, on: verb === 'in' });
          said.push((verb === 'in' ? 'Añadí ' : 'Quité ') + (ELEMENT_NAMES[elId] || elId) + '.');
          return;
        }
        if (item.split(' ').length > 6 || /^(que|como|cuando|donde|mas|menos)\b/.test(item)) return;
        const sec = (ctx.sections || []).find((s) => norm(s).includes(norm(item)) || norm(item).includes(norm(s)));
        if (verb === 'ex') {
          if (sec) { actions.push({ type: 'excludeSection', term: item }); said.push(`Quité el apartado «${sec}».`); }
          else { actions.push({ type: 'excludeTerm', term: item }); said.push(`Quité las frases que hablan de «${item}».`); }
        } else if (!/^(mas|menos|muy|un poco)\b/.test(item)) {
          if (sec) { actions.push({ type: 'focus', term: item }); said.push(`Daré más espacio a «${sec}».`); }
          else { actions.push({ type: 'addTopic', term: item }); said.push(`Añadí una diapositiva sobre «${item}».`); }
        }
      });
    });

    // Junta / separa apartados
    if (/\b(junta|agrupa|une|combina)\b.*\b(apartados|secciones|subsecciones)\b/.test(t)) { actions.push({ type: 'element', id: 'perApartado', on: false }); said.push('Los apartados de una misma sección podrán compartir diapositiva.'); }

    if (!actions.length) return { actions: [], understood: false, reply: 'No entendí del todo lo que necesitas. Prueba con frases como estas:' };
    return { actions, understood: true, reply: said.join(' ') };
  };

  PD.assistantExamples = [
    'Quiero 10 diapositivas',
    'Enfócate en los resultados',
    'Quita la cronología y el glosario',
    'Añade una diapositiva sobre la metodología',
    'Menos texto, más visual',
    'Usa la plantilla Boletín con colores azules',
    'Ponle de título: Mi presentación',
    'Hazla en inglés',
    'Hazla más breve',
    'Cada apartado en su diapositiva'
  ];
})();
