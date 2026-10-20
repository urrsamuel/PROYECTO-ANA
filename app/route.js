import { readFile } from "node:fs/promises";
import path from "node:path";
import { prepararDocumento } from "./documento";

export async function GET() {
  const html = await readFile(path.join(process.cwd(), "index.html"), "utf8");
  return new Response(prepararDocumento(html), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
