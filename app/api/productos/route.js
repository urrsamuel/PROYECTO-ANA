import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  listarProductos,
} from "../../../lib/productos.js";

export const dynamic = "force-dynamic";

function responder(mensaje, status = 500) {
  return Response.json({ error: mensaje }, { status });
}

async function ejecutar(accion) {
  try {
    return Response.json(await accion());
  } catch (error) {
    return responder(error.message || "No se pudo completar la operación.", error.status || 500);
  }
}

async function leerJson(request) {
  try {
    return await request.json();
  } catch {
    throw Object.assign(new Error("El producto enviado no es JSON válido."), { status: 400 });
  }
}

export async function GET() {
  return ejecutar(listarProductos);
}

export async function POST(request) {
  return ejecutar(async () => crearProducto(await leerJson(request)));
}

export async function PATCH(request) {
  const id = new URL(request.url).searchParams.get("id");
  return ejecutar(async () => actualizarProducto(id, await leerJson(request)));
}

export async function DELETE(request) {
  const id = new URL(request.url).searchParams.get("id");
  return ejecutar(() => eliminarProducto(id));
}
