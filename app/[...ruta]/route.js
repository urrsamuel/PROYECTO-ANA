import { readFile } from "node:fs/promises";
import path from "node:path";
import { prepararDocumento } from "../documento";

const raiz = process.cwd();
const archivosPublicos = new Map([
  ["index.html", "text/html; charset=utf-8"],
  ["crud.html", "text/html; charset=utf-8"],
  ["styles.css", "text/css; charset=utf-8"],
  ["crud.css", "text/css; charset=utf-8"],
  ["script.js", "text/javascript; charset=utf-8"],
  ["jpeg", "image/jpeg"],
  ["jpg", "image/jpeg"],
  ["png", "image/png"],
]);

function estaDentroDeLaCarpeta(base, archivo) {
  return archivo.startsWith(`${base}${path.sep}`);
}

export async function GET(_request, { params }) {
  const { ruta } = await params;
  const rutaRelativa = ruta.join(path.sep);
  const nombre = rutaRelativa.toLowerCase();
  if (nombre === "favicon.ico") {
    const favicon = await readFile(path.join(raiz, "imagenes", "Logo", "LOGO_FONDO.png"));
    return new Response(favicon, {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-cache" },
    });
  }

  const recursoRaiz = archivosPublicos.get(nombre);
  const esImagen = nombre.startsWith(`imagenes${path.sep}`);
  const tipoImagen = esImagen ? archivosPublicos.get(path.extname(nombre).slice(1)) : null;

  if (!recursoRaiz && !tipoImagen) {
    return new Response("No encontrado", { status: 404 });
  }

  const base = path.resolve(raiz, esImagen ? "imagenes" : ".");
  const archivo = path.resolve(raiz, rutaRelativa);
  if (!estaDentroDeLaCarpeta(base, archivo)) {
    return new Response("No encontrado", { status: 404 });
  }

  let contenido;
  try {
    contenido = await readFile(archivo);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      return new Response("No encontrado", { status: 404 });
    }
    throw error;
  }

  const tipo = tipoImagen || recursoRaiz;
  if (tipo.startsWith("text/html")) {
    contenido = Buffer.from(prepararDocumento(contenido.toString("utf8")));
  }

  if (nombre === "styles.css") {
    contenido = Buffer.concat([
      contenido,
      Buffer.from(
        "\n.icono-red-social{filter:brightness(0) saturate(100%) invert(63%) sepia(44%) saturate(627%) hue-rotate(5deg) brightness(94%) contrast(91%)}\n",
      ),
    ]);
  }

  return new Response(contenido, {
    headers: {
      "Content-Type": tipo,
      "Cache-Control": "no-cache",
    },
  });
}
