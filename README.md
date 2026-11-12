# Lumina Slides — Documentos convertidos en presentaciones

Aplicación web que convierte artículos, informes, revistas, tesis o libros en presentaciones diseñadas al detalle, lista para descargar en **PDF**. Todo el procesamiento ocurre **en el navegador**: los documentos nunca se envían a un servidor.

## Cómo usarla

No requiere instalación ni compilación. Sirve la carpeta con cualquier servidor estático:

```bash
python3 -m http.server 8080
# y abre http://localhost:8080
```

(También puede publicarse tal cual en GitHub Pages, Netlify, Vercel, etc.)

## Flujo

1. **Documento** — arrastra o selecciona un archivo, pega texto o prueba el artículo de ejemplo. Lumina muestra lo que encontró: palabras, secciones, cifras, fechas, idioma y conceptos clave.
2. **Diseño** — 8 plantillas (Aurora, Editorial, Suizo, Corporativo, Neón, Académico, Geométrico, Minimal), 13 paletas + paleta personalizada, 10 combinaciones tipográficas. Vista previa en vivo.
3. **Contenido** — 4 niveles de detalle (Esencial, Equilibrado, Detallado, Exhaustivo) con el número estimado de diapositivas, y control de cada elemento: índice, resumen ejecutivo, separadores, datos clave, gráfico, cronología, cita, conceptos, imágenes, tablas, glosario, conclusiones, referencias y cierre. Título, subtítulo, autor y fecha editables.
4. **Editar y exportar** — edita cualquier texto directamente sobre la diapositiva, reordena arrastrando, duplica, elimina, cambia la distribución, añade puntos, escribe notas del orador y deshaz con Ctrl+Z. Presenta a pantalla completa (flechas, N para notas, cronómetro) y descarga:
   - **PDF de alta fidelidad** (1920–3840 px, opcionalmente con páginas de notas).
   - **PDF vectorial** con texto seleccionable (vía «Guardar como PDF» del navegador).

## Formatos admitidos

PDF, DOCX/DOCM/DOTX, DOC (extracción heurística), PPTX, ODT/ODP/ODS, EPUB, RTF, TXT, Markdown, HTML/XHTML, XML, JSON, CSV/TSV, XLSX e imágenes (PNG, JPG, WEBP, BMP, GIF, TIFF) mediante OCR (Tesseract, se descarga solo al usarlo).

## Qué hace el motor de análisis (`js/analyzer.js`)

- Reconstruye la estructura: títulos (por tamaño de fuente en PDF, estilos en Word, etc.), elimina encabezados/pies repetidos y números de página, une palabras cortadas por guiones.
- Si el documento no tiene títulos, lo segmenta por cohesión temática y nombra cada parte.
- Puntúa cada frase con TF‑IDF, posición, señales discursivas («en conclusión», «los resultados muestran»…) y presencia de datos.
- Extrae palabras clave (incluidas expresiones de dos palabras), cifras con su contexto, cronologías, citas textuales, definiciones para el glosario, tablas, imágenes y referencias.
- Condensa frases en viñetas sin cortar ideas a medias y resalta automáticamente los conceptos clave.
- Detecta español/inglés y adapta las etiquetas.

## Estructura

```
index.html          Interfaz
css/app.css         Estilos de la aplicación
css/slides.css      Estilos de las 8 plantillas (1280×720)
js/parsers.js       Lectura de formatos
js/analyzer.js      Análisis del texto
js/generator.js     Guion de diapositivas por nivel de detalle
js/render.js        Renderizado y ajuste automático del texto
js/themes.js        Plantillas, paletas, tipografías, decoraciones
js/export.js        Exportación a PDF
js/app.js           Lógica de la interfaz
js/sample.js        Documento de ejemplo
vendor/             pdf.js, mammoth, JSZip, html2canvas, jsPDF (incluidas localmente)
```
