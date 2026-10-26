const campos = "id,nombre,descripcion,precio,categoria,color,imagen";
const columnas = new Set(["nombre", "descripcion", "precio", "categoria", "color", "imagen"]);

async function solicitarSupabase(method, { id, body, order } = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!baseUrl || !apiKey) {
    throw Object.assign(new Error("Falta configurar Supabase en .env.local."), { status: 503 });
  }
  
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/rest/v1/productos`);
  url.searchParams.set("select", campos);
  if (id) url.searchParams.set("id", `eq.${id}`);
  if (order) url.searchParams.set("order", order);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        apikey: apiKey,
        Accept: "application/json",
        Prefer: "return=representation",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw Object.assign(new Error("No fue posible conectar con Supabase."), { status: 502 });
    }
    throw error;
  }

  const texto = await response.text();
  let resultado;
  try {
    resultado = texto ? JSON.parse(texto) : null;
  } catch {
    resultado = texto;
  }

  if (!response.ok) {
    const mensaje =
      typeof resultado === "object" && resultado !== null
        ? resultado.message || resultado.error || JSON.stringify(resultado)
        : resultado || `Supabase respondió con estado ${response.status}.`;
    throw Object.assign(new Error(mensaje), { status: response.status });
  }

  return resultado;
}

function validarProducto(producto, parcial = false) {
  if (!producto || typeof producto !== "object" || Array.isArray(producto)) {
    return "Los datos del producto no son válidos.";
  }

  const camposEnviados = Object.keys(producto);
  if (camposEnviados.some((campo) => !columnas.has(campo))) {
    return "El producto contiene campos no permitidos.";
  }
  if (!parcial && [...columnas].some((campo) => producto[campo] === undefined || producto[campo] === "")) {
    return "Completa todos los campos del producto.";
  }
  if (camposEnviados.length === 0) return "Indica al menos un dato para actualizar.";
  if (
    Object.hasOwn(producto, "precio") &&
    (!Number.isFinite(Number(producto.precio)) || Number(producto.precio) < 0)
  ) {
    return "El precio debe ser un número mayor o igual a cero.";
  }
  return null;
}

export function listarProductos() {
  return solicitarSupabase("GET", { order: "id.asc" });
}

export async function crearProducto(producto) {
  const error = validarProducto(producto);
  if (error) throw Object.assign(new Error(error), { status: 400 });
  return solicitarSupabase("POST", { body: producto });
}

export async function actualizarProducto(id, cambios) {
  if (!/^\d+$/.test(id || "")) {
    throw Object.assign(new Error("Indica un ID numérico válido para actualizar."), { status: 400 });
  }
  const error = validarProducto(cambios, true);
  if (error) throw Object.assign(new Error(error), { status: 400 });
  return solicitarSupabase("PATCH", { id, body: cambios });
}

export async function eliminarProducto(id) {
  if (!/^\d+$/.test(id || "")) {
    throw Object.assign(new Error("Indica un ID numérico válido para eliminar."), { status: 400 });
  }
  return solicitarSupabase("DELETE", { id });
}
