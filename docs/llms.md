# Contexto del Proyecto para Modelos de Lenguaje (LLMs) & Agentes Autónomos 🤖

Este documento está optimizado específicamente como fuente de verdad y contexto de alta densidad para cualquier LLM o Agente de IA que necesite entender, mantener, depurar o extender este repositorio.

---

## 1. Resumen Ejecutivo del Proyecto

- **Nombre**: `wtr-lab-downloader`
- **Propósito**: Scraper, gestor de biblioteca, traductor y compilador (TXT / PDF) para novelas ligeras de [wtr-lab.com](https://wtr-lab.com/en).
- **Lenguaje / Runtime**: JavaScript (ES Modules), Node.js v18+ (probado en v26 con `node:sqlite`).
- **Interfaces**:
  1. CLI Híbrida (`bin/cli.js`): Modo interactivo guiado por menús y modo flags para terminal.
  2. Aplicación de Escritorio Electron (`electron/`): GUI moderna para búsqueda, biblioteca, consola de comandos y exportación.
- **Base de Datos**: SQLite nativo (`data/novels.db`), esquema relacional en Tercera Forma Normal (3NF).
- **Cero API Keys**: No requiere ninguna clave de pago ni suscripción (Gemini, Cloudflare, Google Translate y SQLite son 100% autónomos y gratuitos).

---

## 2. Mapa Completo del Código Fuente

```text
nasser_18/
├── bin/
│   └── cli.js                  # CLI híbrida: prompts interactivos + subcomandos commander
├── electron/
│   ├── main.js                 # Proceso principal de Electron, creación de ventana e IPC
│   ├── preload.js              # Puente de seguridad contextBridge para exponer APIs
│   └── renderer/               # Interfaz gráfica (HTML5, CSS moderno, JS)
│       ├── index.html          # Vista única con pestañas: Buscar, Biblioteca, Terminal, Ajustes
│       ├── app.js              # Lógica de interacción en el frontend de Electron
│       └── styles.css          # Diseño oscuro moderno tipo dashboard
├── src/
│   ├── config.js               # Constantes globales, rutas, clave estática AES y headers
│   ├── api/
│   │   ├── client.js           # Cliente HTTP con cabeceras de Chrome 130 Windows y jitter
│   │   ├── novel.js            # Búsqueda por texto, parseo de URLs de WTR-Lab y capítulos
│   │   └── reader.js           # Orquestador: Caché SQLite -> Gemini AI -> Fallback Web AES -> Google
│   ├── crypto/
│   │   └── aes.js              # Descifrado nativo AES-GCM (SubtleCrypto) para payloads web
│   ├── db/
│   │   ├── connection.js       # Conexión Singleton a SQLite (node:sqlite) con WAL y FKs
│   │   ├── repository.js       # Repositorio de acceso a datos (3NF) y progreso de lectura
│   │   └── schema.sql          # DDL del esquema relacional (novels, authors, chapters, translations...)
│   ├── storage/
│   │   ├── writer.js           # Guarda capítulos individuales en exports/<slug>/Capitulo_XXX.txt
│   │   ├── merger.js           # Une capítulos secuenciales en exports/<slug>/..._Capitulos_X-Y.txt
│   │   └── pdf.js              # Genera PDFs tipográficos con pdfkit (sin páginas en blanco)
│   └── translators/
│       ├── gemini.js           # Limpieza y sustitución de tokens de glosario (※N⛬ -> término)
│       └── google.js           # Traducción por lotes de párrafos con delimitadores inmunes
├── test/
│   ├── verify.js               # Suite de verificación completa end-to-end
│   └── test_db.js              # Pruebas unitarias de la base de datos SQLite
├── docs/                       # Documentación modular para humanos y agentes
├── exports/                    # Directorio de salida de TXTs y PDFs (ignorado en git)
├── data/                       # Archivo SQLite novels.db (ignorado en git)
├── package.json                # Dependencias, scripts y configuración de electron-builder
└── README.md                   # Documentación general para usuarios
```

---

## 3. Especificaciones de Ingeniería Inversa (WTR-LAB)

Cualquier LLM que trabaje con la red debe conocer los siguientes protocolos:

### A. Endpoints REST
1. `POST https://wtr-lab.com/api/search`
   - Body: `{"text": "<palabra_clave>"}`
   - Retorna: `{ success: true, data: [ { id, raw_id, slug, data: { title, author, description, image }, chapter_count } ] }`
2. `GET https://wtr-lab.com/api/chapters/:raw_id`
   - Retorna: `{ chapters: [ { id, order, title, name, updated_at } ] }`
3. `POST https://wtr-lab.com/api/reader/get`
   - Body: `{"raw_id": number, "chapter_no": number, "language": "en", "translate": "ai" | "web"}`
   - Retorna: `{ success: true, content_url: "/api/v2/reader/content/v1/..." }`

### B. Descifrado Criptográfico AES-GCM
- **Cuándo se usa**: Cuando `translate: "web"` (servicio sin traducción AI).
- **Formato del string**: `arr:IV_BASE64:AUTH_TAG_BASE64:CIPHERTEXT_BASE64`
- **Clave Simétrica**: `"IJAFUUxjM25hyzL2AZrn0wl7cESED6Ru"` (32 bytes UTF-8).
- **API**: `crypto.webcrypto.subtle.decrypt({ name: "AES-GCM", iv }, key, Buffer.concat([ciphertext, authTag]))`.

### C. Tokens de Glosario Gemini
- Los textos generados por Gemini en WTR-Lab usan marcadores como `※29⛬` o `※17〘`.
- La respuesta adjunta `glossary_data.terms = [ [ "Término Inglés", "Término Chino" ], ... ]`.
- Se reemplaza mediante la regex `/※(\d+)[⛬〓〘〙【】]?/g` indexando en `terms[index][0]`.

---

## 4. Esquema Relacional de Base de Datos (SQLite)

La base de datos sigue **Tercera Forma Normal (3NF)**:
- `authors` (`id`, `name UNIQUE`)
- `genres` (`id`, `name UNIQUE`)
- `novels` (`id` PK [raw_id], `slug UNIQUE`, `title`, `author_id FK`, `total_chapters`, `cover_url`, `synopsis`)
- `chapters` (`id` PK, `novel_id FK`, `chapter_no`, `raw_title`, `released_at`, `UNIQUE(novel_id, chapter_no)`)
- `translation_engines` (`id` PK, `name UNIQUE`, `provider`)
- `chapter_translations` (`id` PK, `chapter_id FK`, `engine_id FK`, `language`, `title`, `source_service`, `full_text`, `UNIQUE(chapter_id, language, engine_id)`)
- `paragraphs` (`id` PK, `translation_id FK`, `paragraph_order`, `content`, `UNIQUE(translation_id, paragraph_order)`)
- `glossary_terms` (`id` PK, `novel_id FK`, `raw_term`, `translated_term`, `language`, `UNIQUE(novel_id, raw_term, language)`)
- `reading_progress` (`novel_id PK FK`, `last_read_chapter_no`, `last_read_at`)

### Principio de Caché Inteligente:
Antes de realizar cualquier llamada HTTP externa, `fetchChapter` consulta:
```sql
SELECT c.chapter_no, ct.title, ct.full_text, e.name as model
FROM chapters c
JOIN chapter_translations ct ON ct.chapter_id = c.id
JOIN translation_engines e ON ct.engine_id = e.id
WHERE c.novel_id = ? AND c.chapter_no = ? AND ct.language = ?
```
Si existe, devuelve `{ ...cached, fromDb: true }`, evitando consumir peticiones o arriesgar rate-limits de Cloudflare.

---

## 5. Prevención de Bugs Conocidos

1. **Páginas en blanco en PDFKit**:
   Al renderizar números de página en el pie (`height - 35`), si `margins.bottom` está activo (`54`), PDFKit interpreta desbordamiento e inserta una página en blanco por cada página existente.
   *Regla*: Siempre envolver la escritura de pie de página con `doc.page.margins.bottom = 0` y `{ lineBreak: false }`.
2. **Límite de caracteres en Google Translate RPC**:
   El endpoint público de Google Translate (`client=gtx`) devuelve HTTP 400 si la URL excede ~2500 bytes.
   *Regla*: Mantener el límite de lote en `BATCH_CHAR_LIMIT = 800` caracteres y usar el separador numérico `[[--9999--]]`.
3. **Claves Foráneas en SQLite**:
   Para insertar capítulos o glosario, la novela debe existir previamente en la tabla `novels`.
   *Regla*: Usar `INSERT OR IGNORE INTO novels (id, slug, title) VALUES (?, ?, ?)` antes de registrar glosarios o capítulos huérfanos.

---

## 6. Comandos del CLI y Scripts NPM

- `npm start` -> `node bin/cli.js` (Modo interactivo)
- `node bin/cli.js download [query] -c <rango> -l <en|es> -m -p` (Descarga directa)
- `node bin/cli.js library` (Listado de novelas guardadas en SQLite)
- `node bin/cli.js export <id_o_slug> -c <rango> -l <en|es> -m -p` (Exportación offline)
- `node bin/cli.js auth` (Inyección de cookies de sesión)
- `node bin/cli.js status` (Verificación de sesión)
- `npm test` -> `node test/verify.js` (Pruebas de verificación)
- `npm run electron:start` -> Inicia la aplicación de escritorio Electron
- `npm run electron:build:win` -> Compila el instalador `.exe` para Windows usando `electron-builder`
