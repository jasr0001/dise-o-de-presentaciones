/* Lumina Slides — Exportación a PDF (imagen de alta resolución o vectorial vía impresión) */
(function () {
  'use strict';
  const PD = (window.PD = window.PD || {});

  async function waitImages(el) {
    const imgs = [...el.querySelectorAll('img')];
    await Promise.all(imgs.map((im) => (im.complete ? null : new Promise((r) => { im.onload = im.onerror = r; setTimeout(r, 4000); }))));
  }

  PD.exportPDF = async function (slides, theme, opts) {
    const { quality = 2, notes = false, fileName = 'presentacion', onProgress } = opts || {};
    await Promise.all([PD.loadScript('vendor/html2canvas.min.js'), PD.loadScript('vendor/jspdf.umd.min.js')]);
    await PD.loadFont(theme.font);
    if (document.fonts && document.fonts.ready) await document.fonts.ready;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1280, 720], hotfixes: ['px_scaling'], compress: true });
    pdf.setProperties({ title: theme.deckTitle || fileName, creator: 'Lumina Slides', subject: 'Presentación generada con Lumina Slides' });

    const stage = document.createElement('div');
    stage.className = 'export-stage';
    stage.style.cssText = 'position:fixed;left:-20000px;top:0;width:1280px;height:720px;overflow:hidden;z-index:-1;';
    document.body.appendChild(stage);

    try {
      for (let i = 0; i < slides.length; i++) {
        stage.innerHTML = PD.renderSlide(slides[i], i, slides.length, theme);
        const el = stage.firstElementChild;
        await waitImages(el);
        PD.fitSlide(el);
        const canvas = await window.html2canvas(el, {
          scale: quality, useCORS: true, allowTaint: false, backgroundColor: null, logging: false,
          width: 1280, height: 720, windowWidth: 1280, windowHeight: 720
        });
        const data = canvas.toDataURL('image/jpeg', 0.94);
        if (i > 0) pdf.addPage([1280, 720], 'landscape');
        pdf.addImage(data, 'JPEG', 0, 0, 1280, 720, undefined, 'FAST');

        if (notes && slides[i].notes) {
          pdf.addPage([1280, 720], 'landscape');
          pdf.setFillColor(248, 248, 250);
          pdf.rect(0, 0, 1280, 720, 'F');
          pdf.addImage(data, 'JPEG', 60, 60, 480, 270, undefined, 'FAST');
          pdf.setDrawColor(220, 220, 228);
          pdf.rect(60, 60, 480, 270);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(13);
          pdf.setTextColor(120, 120, 135);
          pdf.text(`DIAPOSITIVA ${i + 1} · NOTAS DEL ORADOR`, 600, 80);
          pdf.setFontSize(24);
          pdf.setTextColor(25, 25, 35);
          const t = pdf.splitTextToSize(slides[i].title || '', 620);
          pdf.text(t.slice(0, 2), 600, 118);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(16);
          pdf.setTextColor(55, 55, 70);
          const lines = pdf.splitTextToSize(slides[i].notes.replace(/\s+/g, ' '), 1160);
          pdf.text(lines.slice(0, 18), 60, 380, { lineHeightFactor: 1.5 });
        }
        onProgress && onProgress((i + 1) / slides.length, i + 1);
        await new Promise((r) => setTimeout(r, 0));
      }
    } finally {
      stage.remove();
    }
    const safe = (fileName || 'presentacion').replace(/[\\/:*?"<>|]+/g, '').slice(0, 80) || 'presentacion';
    pdf.save(safe + '.pdf');
  };

  /* PDF vectorial con texto seleccionable mediante el diálogo de impresión */
  PD.printVector = async function (slides, theme) {
    await PD.loadFont(theme.font);
    let root = document.getElementById('print-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'print-root';
      document.body.appendChild(root);
    }
    root.innerHTML = slides.map((s, i) => `<div class="print-page">${PD.renderSlide(s, i, slides.length, theme)}</div>`).join('');
    await waitImages(root);
    root.querySelectorAll('.slide').forEach((el) => PD.fitSlide(el));
    document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); root.innerHTML = ''; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => window.print(), 120);
  };
})();
