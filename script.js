let categoriaSeleccionada = "Todo";
let colorSeleccionado = null;

function limpiarFiltros() {
  categoriaSeleccionada = "Todo";
  colorSeleccionado = null;

  document.querySelectorAll(".filtros button, .filtros-color button").forEach((boton) => {
    boton.classList.remove("activo");
  });
  document.getElementById("boton-todos").classList.add("activo");

  document.body.classList.remove("rojo", "verde", "azul");
  aplicarFiltros();
}

function cambiarCategoria(categoria) {
  const boton = document.getElementById(`boton-${categoria.toLowerCase()}`);

  if (categoriaSeleccionada === categoria) {
    categoriaSeleccionada = "Todo";
    boton?.classList.remove("activo");
    document.getElementById("boton-todos").classList.add("activo");
  } else {
    categoriaSeleccionada = categoria;
    document.querySelectorAll(".filtros button").forEach((elemento) => {
      elemento.classList.remove("activo");
    });
    boton?.classList.add("activo");
  }

  aplicarFiltros();
}

function cambiarColor(color) {
  const boton = document.getElementById(`boton-${color.toLowerCase()}`);

  if (colorSeleccionado === color) {
    colorSeleccionado = null;
    boton?.classList.remove("activo");
    document.body.classList.remove("rojo", "verde", "azul");
  } else {
    colorSeleccionado = color;
    document.querySelectorAll(".filtros-color button").forEach((elemento) => {
      elemento.classList.remove("activo");
    });
    boton?.classList.add("activo");

    document.body.classList.remove("rojo", "verde", "azul");
    document.body.classList.add(color.toLowerCase());
  }

  aplicarFiltros();
}

function aplicarFiltros() {
  const tarjetas = document.querySelectorAll(".tarjeta-producto");
  let productosVisibles = 0;

  tarjetas.forEach((tarjeta) => {
    const categoria = tarjeta.dataset.categoria;
    const color = tarjeta.dataset.color;
    const coincideCategoria = categoriaSeleccionada === "Todo" || categoria === categoriaSeleccionada;
    const coincideColor = !colorSeleccionado || color === colorSeleccionado;
    const esVisible = coincideCategoria && coincideColor;

    tarjeta.style.display = esVisible ? "block" : "none";
    if (esVisible) productosVisibles++;
  });

  document.getElementById("mensaje-sin-productos").style.display =
    productosVisibles === 0 ? "block" : "none";
}

function mostrarProducto(titulo, descripcion, precio, color, imagen) {
  document.getElementById("titulo-producto").innerText = titulo;
  document.getElementById("descripcion-producto").innerText = descripcion;
  document.getElementById("precio-producto").innerText = precio;
  document.getElementById("imagen-producto").src = imagen.trim();

  const contenidoVentana = document.getElementById("contenido-producto");
  contenidoVentana.classList.remove("rojo", "verde", "azul");
  contenidoVentana.classList.add(color.toLowerCase());

  document.getElementById("ventana-producto").style.display = "block";
}

function cerrarProducto() {
  const ventana = document.getElementById("ventana-producto");
  ventana.classList.add("desapareciendo");
  setTimeout(() => {
    ventana.style.display = "none";
    ventana.classList.remove("desapareciendo");
  }, 500);
}

window.onclick = (evento) => {
  const ventana = document.getElementById("ventana-producto");
  if (evento.target === ventana) cerrarProducto();
};
