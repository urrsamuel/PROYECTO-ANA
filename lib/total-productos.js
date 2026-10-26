export function calcularTotalProductos(productos) {
  return productos.reduce((total, producto) => total + Number(producto.precio), 0);
}
  