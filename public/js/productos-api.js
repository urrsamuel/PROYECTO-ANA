(function () {
  async function solicitar(url, opciones) {
    const respuesta = await fetch(url || "/api/productos", {
      ...opciones,
      headers: {
        ...(opciones?.body ? { "Content-Type": "application/json" } : {}),
        ...opciones?.headers,
      },
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
    listar: () => solicitar("/api/productos"),
    crear: (producto) =>
      solicitar("/api/productos", { method: "POST", body: JSON.stringify(producto) }),
    actualizar: (id, cambios) =>
      solicitar(`/api/productos?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(cambios),
      }),
    eliminar: (id) =>
      solicitar(`/api/productos?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
  };
})();
