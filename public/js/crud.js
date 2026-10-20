(function () {
  const camposObligatorios = ["nombre", "descripcion", "precio", "categoria", "color", "imagen"];
  let productos = [];
  let mensajeEstado;
  let listaProductos;

  function mostrarEstado(mensaje, error = false) {
    mensajeEstado.textContent = mensaje;
    mensajeEstado.hidden = !mensaje;
    mensajeEstado.setAttribute("role", error ? "alert" : "status");
  }

  function prepararFormulario(formulario, sufijo) {
    const categoria = formulario.querySelector(`#categoria-${sufijo}`);
    ["Aretes", "Pulseras"].forEach((nombre) => {
      if ([...categoria.options].some((opcion) => opcion.value === nombre)) return;
      categoria.add(new Option(nombre, nombre));
    });

    const imagen = formulario.querySelector(`#imagen-${sufijo}`);
    imagen.type = "text";
    imagen.placeholder = "URL o ruta de la imagen";

    const vistaPrevia = document.createElement("img");
    vistaPrevia.className = "vista-previa-imagen";
    vistaPrevia.alt = "Vista previa de la imagen del producto";
    vistaPrevia.hidden = true;
    const mensajeImagen = document.createElement("span");
    mensajeImagen.className = "mensaje-imagen";
    mensajeImagen.setAttribute("role", "status");
    imagen.after(vistaPrevia, mensajeImagen);
    imagen.addEventListener("input", () => actualizarVistaPrevia(imagen, vistaPrevia, mensajeImagen));

    const etiquetaDescripcion = document.createElement("label");
    etiquetaDescripcion.htmlFor = `descripcion-${sufijo}`;
    etiquetaDescripcion.textContent = "Descripción";
    const descripcion = document.createElement("textarea");
    descripcion.id = `descripcion-${sufijo}`;
    descripcion.rows = 3;
    formulario.querySelector(`#nombre-${sufijo}`).after(etiquetaDescripcion, descripcion);

    const etiquetaColor = document.createElement("label");
    etiquetaColor.htmlFor = `color-${sufijo}`;
    etiquetaColor.textContent = "Color";
    const color = document.createElement("select");
    color.id = `color-${sufijo}`;
    ["Rojo", "Verde", "Azul"].forEach((nombre) => color.add(new Option(nombre, nombre)));
    categoria.after(etiquetaColor, color);
  }

  function actualizarVistaPrevia(campoImagen, vistaPrevia, mensaje) {
    const ruta = campoImagen.value.trim();
    vistaPrevia.hidden = true;
    mensaje.textContent = "";
    vistaPrevia.onload = () => {
      vistaPrevia.hidden = false;
      mensaje.textContent = "";
    };
    vistaPrevia.onerror = () => {
      vistaPrevia.hidden = true;
      mensaje.textContent = ruta ? "No se pudo cargar la imagen. Usa un enlace directo a un archivo de imagen." : "";
    };
    vistaPrevia.removeAttribute("src");
    if (ruta) vistaPrevia.src = ruta;
  }

  function obtenerValor(formulario, campo, sufijo) {
    return formulario.querySelector(`#${campo}-${sufijo}`).value.trim();
  }

  function productoDesde(formulario, sufijo) {
    const precio = obtenerValor(formulario, "precio", sufijo);
    const producto = {
      nombre: obtenerValor(formulario, "nombre", sufijo),
      descripcion: obtenerValor(formulario, "descripcion", sufijo),
      precio: precio === "" ? "" : Number(precio),
      categoria: obtenerValor(formulario, "categoria", sufijo),
      color: obtenerValor(formulario, "color", sufijo),
      imagen: obtenerValor(formulario, "imagen", sufijo),
    };
    if (!producto.descripcion) {
      producto.descripcion = `${producto.nombre} artesanal color ${producto.color.toLowerCase()}.`;
    }
    if (!producto.imagen) producto.imagen = "/imagenes/Logo/LOGO.png";
    return producto;
  }

  function mostrarProductos() {
    listaProductos.replaceChildren();
    if (productos.length === 0) {
      const sinProductos = document.createElement("li");
      sinProductos.textContent = "Todavía no hay productos agregados.";
      listaProductos.append(sinProductos);
      return;
    }

    productos.forEach((producto) => {
      const fila = document.createElement("li");
      fila.className = "producto-admin-fila";
      const detalle = document.createElement("span");
      detalle.textContent = `#${producto.id} · ${producto.nombre} · $${new Intl.NumberFormat(
        "es-CO",
        { maximumFractionDigits: 0 },
      ).format(Number(producto.precio) || 0)}`;

      const editar = document.createElement("button");
      editar.type = "button";
      editar.className = "boton-editar";
      editar.textContent = "Editar";
      editar.addEventListener("click", () => seleccionarProducto(producto));

      const eliminar = document.createElement("button");
      eliminar.type = "button";
      eliminar.className = "boton-eliminar";
      eliminar.textContent = "Eliminar";
      eliminar.addEventListener("click", () => borrarProducto(producto));

      const acciones = document.createElement("span");
      acciones.className = "acciones-producto";
      acciones.append(editar, eliminar);
      fila.append(detalle, acciones);
      listaProductos.append(fila);
    });
  }

  async function cargarProductos() {
    productos = await window.productosApi.listar();
    if (!Array.isArray(productos)) throw new Error("La lista de Supabase no es válida.");
    mostrarProductos();
  }

  function seleccionarProducto(producto) {
    const formulario = document.querySelector("#formulario-editar");
    formulario.querySelector("#id-edicion").value = producto.id;
    ["nombre", "descripcion", "categoria", "color", "precio", "imagen"].forEach((campo) => {
      formulario.querySelector(`#${campo}-edicion`).value = producto[campo] ?? "";
    });
    const campoImagen = formulario.querySelector("#imagen-edicion");
    actualizarVistaPrevia(
      campoImagen,
      formulario.querySelector(".vista-previa-imagen"),
      formulario.querySelector(".mensaje-imagen"),
    );
    formulario.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function borrarProducto(producto) {
    if (!window.confirm(`¿Eliminar "${producto.nombre}" del catálogo?`)) return;
    try {
      const eliminados = await window.productosApi.eliminar(producto.id);
      if (!Array.isArray(eliminados) || eliminados.length !== 1) {
        throw new Error("Supabase no confirmó la eliminación. Revisa la política SELECT de la tabla.");
      }
      await cargarProductos();
      mostrarEstado("Producto eliminado del catálogo.");
    } catch (error) {
      console.error("No se pudo eliminar el producto:", error);
      mostrarEstado(error.message, true);
    }
  }

  function prepararCrud() {
    const formularios = document.querySelectorAll(".seccion-gestion form");
    if (formularios.length !== 3) return;
    const [agregar, editar, eliminar] = formularios;
    editar.id = "formulario-editar";
    prepararFormulario(agregar, "producto");
    prepararFormulario(editar, "edicion");

    mensajeEstado = document.createElement("p");
    mensajeEstado.className = "estado-supabase";
    mensajeEstado.hidden = true;
    agregar.before(mensajeEstado);

    const panel = document.createElement("section");
    panel.className = "productos-supabase";
    const titulo = document.createElement("h2");
    titulo.textContent = "Productos del catálogo";
    listaProductos = document.createElement("ul");
    panel.append(titulo, listaProductos);
    editar.parentElement.before(panel);

    agregar.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      const producto = productoDesde(agregar, "producto");
      if (
        camposObligatorios.some((campo) => producto[campo] === "" || producto[campo] === undefined) ||
        !Number.isFinite(producto.precio)
      ) {
        mostrarEstado("Completa el nombre y el precio del producto.", true);
        return;
      }
      try {
        const creados = await window.productosApi.crear(producto);
        if (!Array.isArray(creados) || creados.length !== 1) {
          throw new Error("Supabase no confirmó el producto. Revisa la política SELECT.");
        }
        localStorage.setItem("catalogo-supabase-activo", "true");
        agregar.reset();
        await cargarProductos();
        mostrarEstado("Producto agregado y visible en el catálogo.");
      } catch (error) {
        console.error("No se pudo agregar el producto:", error);
        mostrarEstado(error.message, true);
      }
    });

    editar.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      const id = obtenerValor(editar, "id", "edicion");
      if (!productos.some((producto) => String(producto.id) === id)) {
        mostrarEstado("Selecciona un producto de la lista para editarlo.", true);
        return;
      }
      const cambios = productoDesde(editar, "edicion");
      if (!Number.isFinite(cambios.precio)) {
        mostrarEstado("Escribe un precio válido para el producto.", true);
        return;
      }
      try {
        const actualizados = await window.productosApi.actualizar(id, cambios);
        if (!Array.isArray(actualizados) || actualizados.length !== 1) {
          throw new Error("Supabase no confirmó los cambios. Revisa la política SELECT.");
        }
        await cargarProductos();
        mostrarEstado("Producto actualizado en el catálogo.");
      } catch (error) {
        console.error("No se pudo actualizar el producto:", error);
        mostrarEstado(error.message, true);
      }
    });

    eliminar.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      const id = obtenerValor(eliminar, "id", "eliminar");
      const producto = productos.find((elemento) => String(elemento.id) === id);
      if (!producto) {
        mostrarEstado("El ID no corresponde a un producto del catálogo.", true);
        return;
      }
      await borrarProducto(producto);
      eliminar.reset();
    });

    cargarProductos().catch((error) => {
      console.error("No se pudieron cargar los productos:", error);
      mostrarEstado(error.message, true);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", prepararCrud, { once: true });
  } else {
    prepararCrud();
  }
})();
