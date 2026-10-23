# PROYECTO-ANA

## Guía del backend y del CRUD

Esta guía explica cómo se conectan la aplicación, la API de productos y Supabase. Está escrita para poder seguir el camino de un producto desde que se escribe en el formulario hasta que queda guardado en la base de datos.

La idea sencilla es pensar en una tienda:

- **El navegador** es el cliente que hace un pedido.
- **La API de Next.js** es la recepción: identifica si se quiere consultar, crear, actualizar o eliminar un producto.
- **`lib/productos.js`** es quien realiza el trabajo con Supabase.
- **Supabase** es el almacén donde se guardan los productos.
- **`public/js`** contiene los ayudantes del navegador para enviar pedidos y mostrar resultados.

El navegador no se conecta directamente a Supabase para modificar datos. Primero llama a la API propia del proyecto y el servidor hace la petición a Supabase.

## Índice

1. [Estructura relacionada](#estructura-relacionada)
2. [Cómo inicia y sirve las páginas Next.js](#cómo-inicia-y-sirve-las-páginas-nextjs)
3. [Conexión y configuración de Supabase](#conexión-y-configuración-de-supabase)
4. [API de productos](#api-de-productos)
5. [Operaciones del CRUD, paso a paso](#operaciones-del-crud-paso-a-paso)
6. [Archivos del navegador en `public`](#archivos-del-navegador-en-public)
7. [Pruebas unitarias](#pruebas-unitarias)
8. [Ejecutar el proyecto](#ejecutar-el-proyecto)
9. [Problemas comunes](#problemas-comunes)

## Estructura relacionada

```text
app/
  api/
    productos/
      route.js          API: GET, POST, PATCH y DELETE
  [...ruta]/
    route.js            Sirve páginas y recursos originales
  documento.js          Prepara el HTML antes de enviarlo al navegador
  route.js              Sirve index.html en la ruta /

lib/
  productos.js          Validación y conexión servidor-Supabase
  total-productos.mjs   Cálculo pequeño usado por las pruebas

public/
  css/
    aplicacion.css      Ajustes visuales añadidos por Next.js
  js/
    productos-api.js    Ayudante HTTP del navegador
    crud.js             Formularios y acciones del CRUD
    catalogo.js         Sincroniza los productos en el catálogo

supabase/
  policies.sql          Políticas RLS usadas por la tabla productos

tests/
  total-productos.test.mjs

.env.local              Configuración local; no se sube a GitHub
```

También se conservan en la raíz los archivos originales, entre ellos `index.html`, `crud.html`, `script.js`, `styles.css` y `crud.css`.

## Cómo inicia y sirve las páginas Next.js

El proyecto tiene tres rutas de servidor que cumplen tareas diferentes.

### `app/route.js`: la página principal

Cuando alguien abre `/`, Next.js ejecuta esta ruta. Lee el archivo original `index.html`, lo prepara y lo devuelve como HTML:

```js
const html = await readFile(path.join(process.cwd(), "index.html"), "utf8");
return new Response(prepararDocumento(html), {
  headers: { "Content-Type": "text/html; charset=utf-8" },
});
```

`process.cwd()` significa “la carpeta raíz desde donde se está ejecutando el proyecto”.

### `app/[...ruta]/route.js`: los archivos originales y recursos

Esta es una ruta comodín. Atiende direcciones como `/crud.html`, `/styles.css`, `/script.js` e imágenes que están dentro de `imagenes/`.

La ruta:

1. Lee el nombre solicitado.
2. Comprueba que sea un archivo permitido.
3. Resuelve la ruta dentro del proyecto.
4. Devuelve el archivo con su tipo correcto, por ejemplo `text/html`, `text/css` o `image/jpeg`.
5. Si es una página HTML, la pasa por `prepararDocumento`.

La comprobación de carpeta evita servir archivos que queden fuera de las carpetas admitidas. Los archivos que no existen devuelven `404`.

El favicon es una excepción: `/favicon.ico` entrega `imagenes/Logo/LOGO_FONDO.png`.

### `app/documento.js`: preparar el HTML

`prepararDocumento(html)` recibe el texto de una página original y añade los recursos comunes:

- El favicon.
- `public/css/aplicacion.css`.
- Los scripts que necesita esa página.

Si detecta que el HTML es el CRUD, añade `productos-api.js` y `crud.js`. Para el catálogo, añade `productos-api.js` y `catalogo.js`.

```js
const scripts = html.includes('class="seccion-gestion"')
  ? '<script src="/js/productos-api.js" defer></script><script src="/js/crud.js" defer></script>'
  : '<script src="/js/productos-api.js" defer></script><script src="/js/catalogo.js" defer></script>';
```

`defer` permite que el navegador termine de leer el HTML antes de ejecutar el JavaScript.

## Conexión y configuración de Supabase

### Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_clave_publishable
```

Usa los valores de tu propio proyecto de Supabase. No escribas las claves reales en este README ni las guardes en archivos que se suban a GitHub. `.gitignore` excluye `.env*` para evitar subir configuraciones locales.

Aunque los nombres incluyen `NEXT_PUBLIC_`, en esta implementación se leen dentro de `lib/productos.js`, que se ejecuta en el servidor. No se debe copiar la clave a `public/js` ni incluirla en el HTML.

Después de cambiar `.env.local`, reinicia el servidor de desarrollo para que Next.js vuelva a cargar las variables.

### Tabla esperada

La API trabaja con una tabla de Supabase llamada `productos`. Usa estos campos:

| Campo | Uso |
|---|---|
| `id` | Identificador numérico del producto; lo genera la base de datos. |
| `nombre` | Nombre que se muestra en el catálogo. |
| `descripcion` | Texto mostrado al abrir el producto. |
| `precio` | Precio numérico. |
| `categoria` | Por ejemplo, `Manillas`, `Cadenas`, `Collares`, `Aretes` o `Pulseras`. |
| `color` | Color del producto. |
| `imagen` | URL o ruta de la imagen. |

La aplicación espera que `id` sea numérico y que los demás campos existan en la tabla.

### RLS y `supabase/policies.sql`

RLS significa **Row Level Security**: reglas de Supabase que deciden qué filas puede leer o cambiar una petición.

El archivo `supabase/policies.sql` contiene políticas para permitir a los roles `anon` y `authenticated` leer, insertar, actualizar y eliminar productos. El SQL se ejecuta desde el editor SQL de Supabase si esas políticas hacen falta.

**Importante:** las políticas actuales permiten operaciones públicas sobre todos los productos. Son útiles para el comportamiento actual de la aplicación, pero no son apropiadas para un catálogo administrativo en producción sin protección adicional. Para producción, configura autenticación y políticas que limiten quién puede modificar o borrar registros. La clave publishable no reemplaza esas reglas.

## API de productos

La ruta es:

```text
/api/productos
```

El archivo `app/api/productos/route.js` recibe las peticiones web y las dirige a las funciones de `lib/productos.js`. Es como una recepción que deriva cada pedido al área adecuada.

| Método | Dirección | Acción |
|---|---|---|
| `GET` | `/api/productos` | Devuelve los productos ordenados por ID. |
| `POST` | `/api/productos` | Crea un producto con el JSON del cuerpo. |
| `PATCH` | `/api/productos?id=12` | Actualiza el producto con ID 12. |
| `DELETE` | `/api/productos?id=12` | Elimina el producto con ID 12. |

Ejemplo de producto enviado en un `POST`:

```json
{
  "nombre": "Pulsera azul",
  "descripcion": "Pulsera artesanal color azul.",
  "precio": 22000,
  "categoria": "Pulseras",
  "color": "Azul",
  "imagen": "/imagenes/manillas_azules/manilla_azul6.jpeg"
}
```

Las respuestas de éxito contienen el resultado que devuelve Supabase. Si algo falla, la API devuelve un JSON de error y un código HTTP:

```json
{
  "error": "El precio debe ser un número mayor o igual a cero."
}
```

### Cómo despacha las peticiones `route.js`

Simplificado, el archivo contiene esta idea:

```js
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
```

`leerJson` convierte el cuerpo de la petición en un objeto JavaScript. Si el cuerpo no es JSON válido, se responde con `400 Bad Request`. `ejecutar` convierte el resultado en una respuesta JSON y transforma los errores en respuestas HTTP.

## Operaciones del CRUD, paso a paso

### 1. El navegador hace una petición: `public/js/productos-api.js`

Este archivo es un ayudante pequeño para no repetir `fetch` en el CRUD y el catálogo. Expone cuatro métodos, con nombres fáciles de reconocer:

```js
window.productosApi = {
  get: (url = "/api/productos") => solicitar("GET", url),
  post: (url, datos) => solicitar("POST", url, datos),
  patch: (url, datos) => solicitar("PATCH", url, datos),
  delete: (url) => solicitar("DELETE", url),
};
```

Por ejemplo:

```js
const productos = await window.productosApi.get();
const creados = await window.productosApi.post("/api/productos", producto);
```

La función `solicitar` usa `fetch`, convierte los datos a JSON y revisa si el servidor respondió con error. Por eso la interfaz puede escribir peticiones como `get` o `post`, aunque no se instaló Axios.

### 2. Crear un producto: `public/js/crud.js`

Al enviar el formulario de agregar:

1. Se leen los valores de nombre, descripción, precio, categoría, color e imagen.
2. Si no se escribió descripción, se genera una descripción sencilla usando el nombre y el color.
3. Se comprueba que estén los datos y que el precio sea un número igual o mayor que cero.
4. Se llama a `productosApi.post`.
5. La API valida el producto y lo envía a Supabase.
6. Si Supabase confirma el alta, se vuelve a cargar la lista.
7. El catálogo podrá mostrar el producto al consultarla.

Versión resumida del envío:

```js
const respuesta = await window.productosApi.post("/api/productos", producto);
if (!Array.isArray(respuesta) || respuesta.length !== 1) {
  throw new Error("No se confirmó el guardado.");
}
await cargarProductos();
```

### 3. Leer productos

`cargarProductos()` pide la lista a la API y comprueba que haya recibido un arreglo:

```js
async function cargarProductos() {
  productos = await window.productosApi.get();
  if (!Array.isArray(productos)) {
    throw new Error("La lista de productos no es válida.");
  }
  mostrarProductos();
}
```

En el CRUD, `mostrarProductos()` construye una fila para cada elemento. Cada fila incluye botones de editar y eliminar.

### 4. Editar un producto

Al pulsar **Editar** en una fila, sus datos se copian al formulario de edición. Al enviar ese formulario:

1. Se revisa que el ID corresponda a un producto cargado.
2. Se valida el resto de los campos.
3. Se llama a `productosApi.patch` con el ID en la URL y los datos nuevos en el cuerpo.
4. La API pasa el ID y los cambios a `actualizarProducto`.
5. Se vuelve a pedir la lista para que la interfaz muestre el valor actualizado.

Ejemplo del patrón:

```js
await window.productosApi.patch(
  `/api/productos?id=${encodeURIComponent(id)}`,
  cambios,
);
```

`PATCH` se usa porque indica una actualización del registro identificado por el ID.

### 5. Eliminar un producto

La interfaz pide confirmación antes de eliminar. Si el usuario confirma:

1. Se envía `DELETE /api/productos?id=...`.
2. El servidor verifica el ID.
3. Supabase elimina la fila.
4. La interfaz vuelve a cargar la lista.

```js
if (!window.confirm(`¿Eliminar "${producto.nombre}" del catálogo?`)) return;

await window.productosApi.delete(
  `/api/productos?id=${encodeURIComponent(producto.id)}`,
);
await cargarProductos();
```

Cancelar el diálogo no envía la petición.

### Validaciones en `lib/productos.js`

Este archivo es la parte que conversa con Supabase. La función `solicitarSupabase` arma la URL de PostgREST:

```text
https://tu-proyecto.supabase.co/rest/v1/productos
```

Agrega los encabezados, envía el método HTTP y revisa la respuesta. Si faltan las variables de entorno, devuelve un error `503`. Si falla la conexión, informa un error `502`. Si Supabase responde con error, conserva su código y mensaje.

Antes de crear o actualizar, `validarProducto` comprueba que:

- Los datos sean un objeto.
- No se envíen columnas que la aplicación no conoce.
- Para un producto nuevo, estén todos los campos.
- Para una actualización parcial, se envíe al menos un campo.
- El precio sea numérico y no sea negativo.

Las funciones públicas de este archivo son:

```js
listarProductos()
crearProducto(producto)
actualizarProducto(id, cambios)
eliminarProducto(id)
```

Las funciones de actualización y eliminación exigen un ID numérico. Así se evita enviar una operación sin identificar correctamente el registro.

### Imágenes de productos

El campo `imagen` guarda una dirección, no sube el archivo a Supabase Storage. Puede ser una URL pública o una ruta del proyecto, por ejemplo:

```text
/imagenes/manillas_rojas/manilla_roja1.jpeg
https://sitio-publico.com/imagen.jpg
```

El CRUD muestra una vista previa del enlace antes de guardar. El catálogo convierte rutas relativas del proyecto a rutas utilizables en el navegador. Para un enlace externo, el sitio que aloja la imagen debe permitir que el navegador la cargue.

## Archivos del navegador en `public`

Los archivos dentro de `public` no se ejecutan como rutas de servidor; Next.js los sirve como recursos estáticos. El navegador los descarga y ejecuta.

### `public/js/productos-api.js`

Es el cliente HTTP compartido por el CRUD y el catálogo. En términos sencillos, ofrece métodos cortos para hablar con `/api/productos`.

### `public/js/crud.js`

Controla los formularios originales de `crud.html`. Como los archivos HTML originales se conservan, el script agrega con JavaScript algunos campos que necesita la tabla, como descripción y color. También construye la lista de productos y sus botones.

El CRUD maneja errores mostrando un mensaje en la página y escribiendo detalles en la consola del navegador. No guarda directamente en Supabase: utiliza `productos-api.js`, que llama a la ruta del servidor.

### `public/js/catalogo.js`

Consulta la misma API cuando se muestra el catálogo. Crea o actualiza las tarjetas usando los productos recibidos. También elimina tarjetas dinámicas que ya no estén en la respuesta y conserva los filtros existentes.

### `public/css/aplicacion.css`

Contiene ajustes que se agregan encima de los estilos originales. No participa en el acceso a Supabase ni en las operaciones del CRUD.

## Pruebas unitarias

Las pruebas actuales comprueban la función que suma precios. No conectan con Next.js ni con Supabase; por eso son **unitarias**: prueban una función pequeña de forma aislada.

La función está en `lib/total-productos.mjs`:

```js
export function calcularTotalProductos(productos) {
  return productos.reduce(
    (total, producto) => total + Number(producto.precio),
    0,
  );
}
```

La prueba `tests/total-productos.test.mjs` revisa tres casos:

```js
test("suma los precios de todos los productos", () => {
  const productos = [
    { nombre: "Aretes", precio: 25000 },
    { nombre: "Collar", precio: 35000 },
    { nombre: "Pulsera", precio: 22000 },
  ];

  assert.equal(calcularTotalProductos(productos), 82000);
});
```

También se prueba que acepte precios como texto —por ejemplo `"40000"`— y que una lista vacía devuelva cero.

El comando de pruebas está configurado en `package.json`:

```json
{
  "scripts": {
    "test": "node --test"
  }
}
```

Ejecutar desde la raíz del proyecto:

```bash
npm test
```

El resultado esperado es `3 pass` y `0 fail`.

## Ejecutar el proyecto

Instala las dependencias una vez:

```bash
npm install
```

Después de configurar `.env.local`, inicia Next.js:

```bash
npm run dev
```

Abre estas direcciones:

```text
http://localhost:3000/              Catálogo
http://localhost:3000/crud.html     Administración de productos
http://localhost:3000/api/productos API JSON
```

Para revisar las pruebas:

```bash
npm test
```

Para preparar una compilación de producción:

```bash
npm run build
npm start
```

## Problemas comunes

### La API responde que falta configurar Supabase

Comprueba que `.env.local` esté en la raíz, que contenga ambas variables y que hayas reiniciado `npm run dev`.

### Supabase responde con un error de permisos

Revisa que RLS y las políticas de la tabla permitan la operación que intentas. La lectura también es necesaria para que la lista del CRUD y las respuestas de escritura funcionen.

### La API devuelve una lista vacía

La conexión puede estar funcionando correctamente y simplemente no haber filas visibles para el rol usado. Comprueba los datos y la política `SELECT`.

### La imagen no aparece

Verifica que el enlace sea directo y accesible desde el navegador. Las rutas locales deben corresponder a un archivo que realmente exista dentro de `imagenes/`.

### No aparece el formulario o la lista del CRUD

Comprueba que `/crud.html` se esté sirviendo y que se hayan cargado `/js/productos-api.js` y `/js/crud.js`. La consola del navegador muestra errores de JavaScript; la pestaña Network muestra si la API respondió con un error.
