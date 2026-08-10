# BibleChat

App personal de estudio bíblico: chatbot con IA + lector bíblico que analiza cada versículo
(contexto histórico/literario, exposición y significado teológico) y conecta las referencias
cruzadas entre sí.

## Estructura

- `server/` — API en Express + TypeScript. Sirve el texto bíblico (proxy cacheado a una fuente
  pública gratuita), el chat (streaming) y el análisis de versículos (IA).
- `client/` — App en React + Vite + TypeScript + Tailwind.

## Requisitos

- Node.js 22+ (usa el módulo nativo `node:sqlite`, sin dependencias de compilación).

## Puesta en marcha

```sh
npm install
cp server/.env.example server/.env
```

Sin configurar nada más, ya puedes navegar toda la Biblia. Para habilitar el chat y el análisis
de versículos con IA, elegí un proveedor en `server/.env` (`AI_PROVIDER=anthropic` o
`AI_PROVIDER=gemini`) y agregá su API key:

```
ANTHROPIC_API_KEY=sk-ant-...
# o
GEMINI_API_KEY=...   # gratis en https://aistudio.google.com/apikey
```

Luego:

```sh
npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:5173

### Opcional: anclar el análisis a fuentes reales

Por defecto el análisis de IA se genera solo con el conocimiento del modelo. Para anclarlo al
comentario de Matthew Henry (dominio público) y a referencias cruzadas verificadas
(openbible.info, basado en Treasury of Scripture Knowledge), corré una vez:

```sh
npm run ingest -w server
```

Descarga ~75MB (unos minutos) y queda guardado en `server/data/study.db`. Es reanudable: si se
corta, volver a correrlo no repite el trabajo ya hecho. No hace falta repetirlo salvo que borres
la base.

## Notas

- La versión Reina Valera 1909 (por defecto) trae algunas referencias cruzadas incrustadas en el
  texto original; se limpian con un filtro heurístico (`server/src/services/bibleTextCleaner.ts`).
  Si ves algún artefacto raro en un versículo, cambia de versión desde el selector — todas las
  versiones disponibles en la fuente están listadas ahí.
- El caché de análisis de versículos vive en `server/data/study.db` (SQLite local, se crea solo).
  Si corrés `npm run ingest` después de haber analizado versículos, esos quedan con la versión
  vieja (sin anclaje) hasta que los borres de la tabla `verse_analysis_cache` o cambies algo del
  pedido.
