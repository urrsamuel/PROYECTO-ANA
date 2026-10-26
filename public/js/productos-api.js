(function () {
  async function solicitar(method, url, datos) {
    const respuesta = await fetch(url, {
      method,
      headers: datos ? { "Content-Type": "application/json" } : {},
      body: datos ? JSON.stringify(datos) : undefined,
    });
    let resultado;
    try {
      resultado = await respuesta.json();
    } catch {
      throw new Error("El servidor devolvió una respuesta no válida.");
    }
    if (!respuesta.ok) {
      throw new Error(resultado.error || `No se pudo completar la solicitud (${respuesta.status}).`);
    }
    return resultado;
  }

  window.productosApi = {
    get: (url = "/api/productos") => solicitar("GET", url),
    post: (url, datos) => solicitar("POST", url, datos),
    patch: (url, datos) => solicitar("PATCH", url, datos),
    delete: (url) => solicitar("DELETE", url),
  };
})();
