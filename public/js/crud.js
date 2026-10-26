(function () {
  const formularios = document.querySelectorAll(".seccion-gestion form");

  if (formularios.length !== 3) return;

  const [agregar, editar, eliminar] = formularios;
  const campos = ["nombre", "descripcion", "categoria", "color", "precio", "imagen"];
  let productos = [];
  let mensaje;
  let lista;

  function mostrarMensaje(texto, error = false) {
    mensaje.textContent = texto;
    mensaje.hidden = !texto;
    mensaje.setAttribute("role", error ? "alert" : "status");
  }

  function campo(formulario, nombre, sufijo) {
    return formulario.querySelector(`#${nombre}-${sufijo}`);
  }



  function agregarCampo(formulario, sufijo, nombre, titulo, tipo, opciones = []) {

    const etiqueta = document.createElement("label");

    etiqueta.htmlFor = `${nombre}-${sufijo}`;
    etiqueta.textContent = titulo;

    const etiquetaEntrada = tipo === "select" ? "select" : tipo;
    const entrada = document.createElement(etiquetaEntrada);

    entrada.id = `${nombre}-${sufijo}`;

    if (tipo === "textarea") entrada.rows = 3;
    opciones.forEach((valor) => entrada.add(new Option(valor, valor)));

    const antesDe = nombre === "descripcion" ? campo(formulario, "nombre", sufijo) : campo(formulario, "categoria", sufijo);
    antesDe.after(etiqueta, entrada);

    return entrada;
  }



  function prepararFormulario(formulario, sufijo) {

    const categoria = campo(formulario, "categoria", sufijo);

    ["Aretes", "Pulseras"].forEach((valor) => {
      if (![...categoria.options].some((opcion) => opcion.value === valor)) {
        categoria.add(new Option(valor, valor));
      }
    });

    agregarCampo(formulario, sufijo, "descripcion", "Descripción", "textarea");
    agregarCampo(formulario, sufijo, "color", "Color", "select", ["Negro", "Rojo", "Verde", "Azul"]);

    const entradaImagen = campo(formulario, "imagen", sufijo);
    entradaImagen.placeholder = "Pega el enlace directo de la imagen";

    const imagen = document.createElement("img");
    imagen.className = "vista-previa-imagen";
    imagen.alt = "Vista previa de la imagen del producto";
    imagen.hidden = true;

    const aviso = document.createElement("span");
    aviso.className = "mensaje-imagen";
    entradaImagen.after(imagen, aviso);
    entradaImagen.addEventListener("input", () => mostrarVistaPrevia(formulario, sufijo));
    if (entradaImagen.value.trim()) mostrarVistaPrevia(formulario, sufijo);
  }

  function mostrarVistaPrevia(formulario, sufijo) {

    const ruta = campo(formulario, "imagen", sufijo).value.trim();
    const imagen = formulario.querySelector(".vista-previa-imagen");
    const aviso = formulario.querySelector(".mensaje-imagen");

    imagen.hidden = true;

    aviso.textContent = "";
    imagen.onload = () => { imagen.hidden = false; };
    imagen.onerror = () => { aviso.textContent = "Usa un enlace directo a una imagen válida."; };

    if (ruta) imagen.src = ruta;
    else imagen.removeAttribute("src");
  }

  function leerProducto(formulario, sufijo) {

    const leer = (nombre) => campo(formulario, nombre, sufijo).value.trim();
    const nombre = leer("nombre");
    const color = leer("color");

    return {
      nombre,
      descripcion: leer("descripcion") || `${nombre} color ${color.toLowerCase()}.`,
      categoria: leer("categoria"),
      color,
      precio: Number(leer("precio")),
      imagen: leer("imagen") || "/imagenes/Logo/LOGO.png",
    };
  }



  function mostrarProductos() {

    lista.replaceChildren();

    if (!productos.length) {
      const vacio = document.createElement("li");
      vacio.textContent = "Todavía no hay productos agregados.";
      lista.append(vacio);
      return;
    }

    productos.forEach((producto) => {

      const fila = document.createElement("li");
      fila.className = "producto-admin-fila";

      const detalle = document.createElement("span");
      const precio = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 })
        .format(Number(producto.precio) || 0);

      detalle.textContent = `#${producto.id} · ${producto.nombre} · $${precio}`;

      const acciones = document.createElement("span");
      acciones.className = "acciones-producto";


      [["Editar", "boton-editar", () => seleccionarProducto(producto)],
      ["Eliminar", "boton-eliminar", () => eliminarProducto(producto)]].forEach(
        ([texto, clase, accion]) => {
          const boton = document.createElement("button");
          boton.type = "button";
          boton.className = clase;
          boton.textContent = texto;
          boton.addEventListener("click", accion);
          acciones.append(boton);
        },
      );
      fila.append(detalle, acciones);
      lista.append(fila);
    });
  }

  async function cargarProductos() {
    productos = await window.productosApi.get();
    if (!Array.isArray(productos)) throw new Error("La lista de productos no es válida.");
    mostrarProductos();
  }

  function seleccionarProducto(producto) {
    campo(editar, "id", "edicion").value = producto.id;
    campos.forEach((nombre) => {
      campo(editar, nombre, "edicion").value = producto[nombre] ?? "";
    });
    mostrarVistaPrevia(editar, "edicion");
    editar.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function guardarProducto(evento, esEdicion = false) {
    evento.preventDefault();

    const formulario = esEdicion ? editar : agregar;
    const sufijo = esEdicion ? "edicion" : "producto";
    const producto = leerProducto(formulario, sufijo);
    const precioVacio = !campo(formulario, "precio", sufijo).value.trim();

    if (campos.some((nombre) => nombre !== "precio" && !producto[nombre]) ||
      precioVacio || !Number.isFinite(producto.precio) || producto.precio < 0) {
      mostrarMensaje("Completa los datos del producto y verifica el precio.", true);
      return;
    }

    try {
      const id = campo(formulario, "id", sufijo)?.value;
      if (esEdicion && !productos.some((item) => String(item.id) === id)) {
        mostrarMensaje("Selecciona un producto de la lista antes de editarlo.", true);
        return;
      }

      const respuesta = esEdicion
        ? await window.productosApi.patch(`/api/productos?id=${encodeURIComponent(id)}`, producto)
        : await window.productosApi.post("/api/productos", producto);
      if (!Array.isArray(respuesta) || respuesta.length !== 1) {
        throw new Error("No se confirmó el guardado. Revisa los permisos de Supabase.");
      }

      if (!esEdicion) localStorage.setItem("catalogo-supabase-activo", "true");
      formulario.reset();
      mostrarVistaPrevia(formulario, sufijo);
      await cargarProductos();

      mostrarMensaje(esEdicion ? "Producto actualizado." : "Producto agregado al catálogo.");
    } catch (error) {

      console.error("No se pudo guardar el producto:", error);
      mostrarMensaje(error.message, true);
    }
  }

  async function eliminarProducto(producto) {

    if (!window.confirm(`¿Eliminar "${producto.nombre}" del catálogo?`)) return;
    try {
      const respuesta = await window.productosApi.delete(
        `/api/productos?id=${encodeURIComponent(producto.id)}`,
      );

      if (!Array.isArray(respuesta) || respuesta.length !== 1) {
        throw new Error("No se confirmó la eliminación. Revisa los permisos de Supabase.");
      }

      await cargarProductos();
      mostrarMensaje("Producto eliminado del catálogo.");
    } catch (error) {
      console.error("No se pudo eliminar el producto:", error);
      mostrarMensaje(error.message, true);
    }
  }

  function iniciarCrud() {
    prepararFormulario(agregar, "producto");
    prepararFormulario(editar, "edicion");

    mensaje = document.createElement("p");
    mensaje.className = "estado-supabase";
    mensaje.hidden = true;

    agregar.before(mensaje);
    const panel = document.createElement("section");

    panel.className = "productos-supabase";

    const titulo = document.createElement("h2");
    titulo.textContent = "Productos del catálogo";
    lista = document.createElement("ul");
    panel.append(titulo, lista);
    editar.parentElement.before(panel);

    agregar.addEventListener("submit", (evento) => guardarProducto(evento));
    editar.addEventListener("submit", (evento) => guardarProducto(evento, true));
    eliminar.addEventListener("submit", (evento) => {
      evento.preventDefault();

      const id = campo(eliminar, "id", "eliminar").value.trim();
      const producto = productos.find((item) => String(item.id) === id);
      
      if (producto) eliminarProducto(producto);
      else mostrarMensaje("Escribe el número de un producto de la lista.", true);
    });

    cargarProductos().catch((error) => {
      console.error("No se pudieron cargar los productos:", error);
      mostrarMensaje(error.message, true);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarCrud, { once: true });
  } else iniciarCrud();
})();
