(function () {
  function mostrarEstado(contenedor, mensaje) {
    let estado = contenedor.querySelector(".estado-supabase");
    if (!estado) {
      estado = document.createElement("p");
      estado.className = "estado-supabase";
      estado.setAttribute("role", "status");
      contenedor.prepend(estado);
    }
    estado.textContent = mensaje;
    estado.hidden = !mensaje;
  }

  function imagenProducto(valor) {
    const imagen = String(valor || "").trim();
    if (/^(https?:\/\/|data:image\/)/i.test(imagen) || imagen.startsWith("/")) return imagen;
    if (imagen.startsWith("./")) return `/${imagen.slice(2)}`;
    if (imagen.startsWith("imagenes/")) return `/${imagen}`;
    return imagen ? `/imagenes/${imagen}` : "/imagenes/Logo/LOGO.png";
  }

  function precioProducto(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero)
      ? `$${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(numero)}`
      : String(valor ?? "");
  }

  function crearTarjeta(producto) {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-producto";
    tarjeta.dataset.categoria = producto.categoria || "";
    tarjeta.dataset.color = producto.color || "";
    tarjeta.dataset.idSupabase = String(producto.id);

    const imagen = document.createElement("img");
    imagen.src = imagenProducto(producto.imagen);
    imagen.alt = producto.nombre || "Producto";
    const nombre = document.createElement("h2");
    nombre.textContent = producto.nombre || "";
    const precio = document.createElement("p");
    precio.textContent = precioProducto(producto.precio);
    tarjeta.append(imagen, nombre, precio);

    tarjeta.addEventListener("click", () => {
      window.mostrarProducto(
        producto.nombre || "",
        producto.descripcion || "",
        precioProducto(producto.precio),
        producto.color || "Rojo",
        imagen.src,
      );
    });
    return tarjeta;
  }

  async function actualizarCatalogo() {
    const lista = document.getElementById("lista-productos");
    if (!lista) return;

    try {
      const productos = await window.productosApi.get();
      if (!Array.isArray(productos)) throw new Error("La lista de productos recibida no es válida.");

      const idsActuales = new Set();
      productos.forEach((producto) => {
        const id = String(producto.id);
        idsActuales.add(id);
        const selector = `[data-id-supabase="${CSS.escape(id)}"]`;
        const tarjetaActual = lista.querySelector(selector);
        const tarjeta = crearTarjeta(producto);
        if (tarjetaActual) tarjetaActual.replaceWith(tarjeta);
        else lista.append(tarjeta);
      });
      lista.querySelectorAll("[data-id-supabase]").forEach((tarjeta) => {
        if (!idsActuales.has(tarjeta.dataset.idSupabase)) tarjeta.remove();
      });

      if (typeof window.aplicarFiltros === "function") window.aplicarFiltros();
      if (productos.length > 0) {
        localStorage.setItem("catalogo-supabase-activo", "true");
      }
      const usarSupabase =
        productos.length > 0 || localStorage.getItem("catalogo-supabase-activo") === "true";
      lista.querySelectorAll(".tarjeta-producto:not([data-id-supabase])").forEach((tarjeta) => {
        tarjeta.style.display = usarSupabase ? "none" : "";
      });
      mostrarEstado(lista.parentElement, "");
    } catch (error) {
      console.error("No se pudo cargar el catálogo desde Supabase:", error);
      mostrarEstado(lista.parentElement, `No se pudo actualizar el catálogo: ${error.message}`);
    }
  }

  window.addEventListener("pageshow", actualizarCatalogo);
})();
