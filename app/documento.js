export function prepararDocumento(html) {
  let documento = html;
  if (documento.includes("<head>")) {
    documento = documento.replace(
      "<head>",
      '<head><link rel="icon" type="image/png" href="/favicon.ico"><link rel="stylesheet" href="/css/aplicacion.css">',
    );
  }
  documento = documento.replace(
    "<h1>ANNETA Accesorios</h1>",
    '<h1 class="logo-principal"><img src="/imagenes/Logo/LOGO.png" alt="ANNETA Accesorios"></h1>',
  );
  const scripts = html.includes('class="seccion-gestion"')
    ? '<script src="/js/productos-api.js" defer></script><script src="/js/crud.js" defer></script>'
    : '<script src="/js/productos-api.js" defer></script><script src="/js/catalogo.js" defer></script>';
  documento = documento.replace("</body>", `${scripts}</body>`);
  return documento;
}
