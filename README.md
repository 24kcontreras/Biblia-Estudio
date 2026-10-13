# Biblia Estudio

Aplicación web para leer y estudiar la Biblia en español con ayuda de IA. La hice para mi propio
estudio: quería poder abrir un versículo y tener a mano el contexto histórico, el comentario
clásico, las referencias cruzadas y el griego original, sin saltar entre cinco pestañas.

## Qué hace

- **Lector bíblico** con varias traducciones al español (Reina Valera 1909, Valera 1602, Biblia
  Libre, Palabra de Dios para Ti, entre otras).
- **Análisis de versículos con IA.** Se selecciona un versículo o un rango y el modelo devuelve
  contexto histórico y literario, una exposición del pasaje, su sentido teológico y referencias
  cruzadas. Cuando están cargados, el análisis usa como base el comentario de Matthew Henry y las
  referencias cruzadas de openbible.info, en lugar de depender solo de lo que "sabe" el modelo.
  Los resultados se cachean en la base de datos y se pueden exportar a PDF.
- **Estudio de palabras (NT).** Muestra el texto griego del versículo palabra por palabra, con su
  número Strong, transliteración, definición y una glosa en español.
- **Chat** para hacer preguntas sobre la Biblia, con las respuestas en streaming. Está acotado al
  estudio bíblico: si le preguntas otra cosa (por ejemplo, cómo escribir un ciclo for), responde
  que solo ayuda con temas bíblicos. Cada respuesta se puede guardar o exportar como un PDF de
  estudio, que incluye la pregunta, la respuesta y la lista de pasajes citados.
- **Búsqueda de texto completo** sobre todas las versiones (SQLite FTS5, sin distinguir tildes).
- **Marcas personales:** favoritos, colores, notas, versículos para memorizar y colecciones.
  No hay cuentas: cada navegador tiene su propio espacio y se puede sincronizar con otro
  dispositivo usando un código.
- **Apócrifos:** una sección separada con el Libro de Enoc, la Epístola de Bernabé y el Pastor de
  Hermas, traducidos al español y con su propio análisis.
- Es una **PWA**, así que se puede instalar en el celular.

## Stack

| Parte         | Tecnologías                                                              |
| ------------- | ------------------------------------------------------------------------ |
| Frontend      | React 18, Vite, TypeScript, Tailwind CSS, React Router, vite-plugin-pwa |
| Backend       | Node.js, Express, TypeScript                                             |
| Base de datos | Turso (SQLite remoto / libSQL)                                           |
| IA            | Gemini o Claude (Anthropic) como proveedor principal, Groq como respaldo |
| Deploy        | Vercel (el frontend como estático y Express como función en `/api`)      |

Además: `react-markdown` para mostrar las respuestas del modelo y `jsPDF` para exportar los
análisis.

## Cómo funciona

```
client/  →  React SPA. Habla con el backend por /api/*
server/  →  API Express
  src/routes/      endpoints (biblia, chat, análisis, marcas, colecciones, apócrifos)
  src/ai/          un proveedor por modelo + un wrapper de respaldo
  src/prompts/     prompts del chat y de los análisis
  src/services/    obtención del texto bíblico y del material de referencia
  scripts/         scripts de ingesta que se corren una sola vez para poblar la base
api/index.ts       punto de entrada para Vercel (reexporta la app de Express)
```

**Texto bíblico.** La mayoría de las versiones se piden en el momento a la API pública de
[HelloAO](https://bible.helloao.org) (traducciones libres de ebible.org). Algunas versiones se
cargan desde archivos locales a la tabla `local_bible_text` y se leen desde ahí.

**Proveedores de IA.** Todos los modelos implementan la misma interfaz (`streamChat`,
`analyzeVerse`, `analyzeApocrypha`). El proveedor principal se elige con `AI_PROVIDER`. Si hay
una key de Groq configurada, las llamadas quedan envueltas en un `FallbackProvider`: si el
proveedor principal falla (cuota agotada, error de red), se reintenta con Groq y se le avisa al
usuario en la interfaz.

**Anclaje a fuentes.** Antes de pedir un análisis, el backend busca en la base el comentario de
Matthew Henry para ese pasaje y las referencias cruzadas más votadas, y las incluye en el prompt.
Así el modelo trabaja sobre material verificable y no inventa referencias.

**Usuarios sin login.** La primera vez que se abre la app, el navegador genera un UUID anónimo y
lo manda en el header `X-User-Id` en cada petición. Las marcas, colecciones y guardados se filtran
por ese ID, así que cada visitante del demo tiene su propio espacio. En la página Guardado se
puede copiar el código y pegarlo en otro dispositivo para ver lo mismo. Los cachés de análisis sí
se comparten entre todos, porque no tienen datos personales.

**Límite de uso de la IA.** Como el demo es público, solo se cuentan las llamadas que de verdad
generan algo (las respuestas cacheadas no cuentan). Hay un límite por IP por hora y un tope global
por día, configurables con `AI_RATE_LIMIT_PER_HOUR` y `AI_DAILY_LIMIT`. Los contadores se guardan
en la base y no en memoria, porque en Vercel cada instancia de la función tendría su propio
contador. El usuario definido en `OWNER_USER_ID` no tiene límite.

**Ingesta de datos.** El material de referencia se carga con scripts aparte:

| Script                                | Qué carga                                                          |
| ------------------------------------- | ------------------------------------------------------------------ |
| `npm run ingest -w server`            | Comentario de Matthew Henry + referencias cruzadas (openbible.info) |
| `npm run ingest:search -w server`     | Índice de búsqueda FTS5 con todas las versiones                    |
| `npm run ingest:words -w server`      | Diccionario Strong griego + NT griego etiquetado (STEPBible)       |
| `npm run ingest:apocrypha -w server`  | Apócrifos desde Wikisource, traducidos con un modelo local (Ollama) |

El primero es reanudable: si se corta, al volver a correrlo no repite lo que ya está cargado.

## Correrlo localmente

Requiere Node.js 22 o superior y una base de datos en [Turso](https://turso.tech) (el plan
gratuito alcanza).

```sh
npm install
cp server/.env.example server/.env
```

En `server/.env` completa:

- `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`
- `AI_PROVIDER` (`gemini` o `anthropic`) y la key correspondiente (`GEMINI_API_KEY` o
  `ANTHROPIC_API_KEY`)
- `GROQ_API_KEY` es opcional, solo para el respaldo
- `OWNER_USER_ID` es opcional: tu código de sincronización, para no tener límite de uso de la IA

Después:

```sh
npm run dev
```

El backend queda en http://localhost:3001 y el frontend en http://localhost:5173. Las tablas se
crean solas al arrancar. Sin correr los scripts de ingesta ya se puede leer y usar el chat; la
búsqueda, el estudio de palabras y el anclaje del análisis necesitan sus scripts respectivos.

## Deploy

El repo está configurado para Vercel (`vercel.json`): se construye el cliente como sitio estático
y todo `/api/*` va a la app de Express, que corre como una sola función. Las variables de entorno
son las mismas de `server/.env`.

## Fuentes y licencias del contenido

- Traducciones bíblicas de dominio público vía [ebible.org](https://ebible.org) / HelloAO.
- Comentario de Matthew Henry (dominio público).
- Referencias cruzadas de [openbible.info](https://www.openbible.info/labs/cross-references/),
  basadas en el Treasury of Scripture Knowledge.
- Diccionario griego de Strong ([openscriptures](https://github.com/openscriptures/strongs)) y
  NT griego etiquetado de [STEPBible](https://github.com/STEPBible/STEPBible-Data) (CC BY 4.0).
- Textos apócrifos de Wikisource (traducciones al inglés en dominio público).
