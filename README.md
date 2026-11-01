# Novel Hunter (WTR-LAB Novel Downloader & Reader) 📚

**Novel Hunter** es una aplicación de escritorio híbrida y herramienta CLI desarrollada en **Node.js** y **Electron** para buscar, descargar, traducir, leer offline y narrar novelas ligeras de [wtr-lab.com](https://wtr-lab.com/en).

Soporta traducción prioritaria de **Google Gemini** con sustitución de glosario oficial, descifrado nativo **AES-GCM**, traducción bajo demanda a **Español** (Google Translate RPC y Gemini Flash), catálogo relacional local **SQLite 3NF** (`node:sqlite`), narración auditiva natural con voces neurales **EdgeTTS** (sincronizada palabra por palabra), lectura ininterrumpida con descarga al vuelo de los siguientes capítulos, gestión de almacenamiento (borrado selectivo y acordeones) y exportación a **TXT** y **PDF** con portadas en alta resolución.

---

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Modo Escritorio (Desktop App)](#-modo-escritorio-desktop-app)
- [Documentación Adicional (`docs/`)](#-documentación-adicional-en-docs)
- [Cumplimiento de Requerimientos](#-cumplimiento-de-requerimientos)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Guía de Uso](#-guía-de-uso)
  - [Modo Interactivo (CLI)](#1-modo-interactivo-cli)
  - [Modo Comando con Parámetros (Flags)](#2-modo-comando-con-parámetros-flags)
  - [Gestión de Sesión y Autenticación (Bypass Cloudflare)](#3-gestión-de-sesión-y-autenticación)
- [Lector Integrado y Continuación de Lectura](#-lector-integrado-y-continuación-de-lectura)
- [Mecanismos Internos e Ingeniería Inversa](#-mecanismos-internos-e-ingeniería-inversa)
  - [1. Flujo de Descarga y Prioridad de Motores](#1-flujo-de-descarga-y-prioridad-de-motores)
  - [2. Glosario de Gemini y Reemplazo de Tokens](#2-glosario-de-gemini-y-reemplazo-de-tokens)
  - [3. Descifrado AES-GCM (Servicio Web)](#3-descifrado-aes-gcm-servicio-web)
  - [4. Traducción a Español](#4-traducción-a-español)
  - [5. Motor de Narración TTS y Word Boundary](#5-motor-de-narración-tts-y-word-boundary)
  - [6. Evasión de Cloudflare](#6-evasión-de-cloudflare)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Pruebas Automatizadas](#-pruebas-automatizadas)

---

## ✨ Características Principales

- 🖥️ **Aplicación de Escritorio Moderna**: Interfaz gráfica rápida en Vanilla JS (ES Modules) impulsada por Electron con navegación lateral (*Buscador*, *Mi biblioteca*, *Consola Terminal*, *Configuración*).
- 📑 **Exploración de Series y Tabla de Contenidos (TOC)**:
  - Al buscar una novela o hacer clic en **"Tabla de Contenidos"**, se presenta la lista completa con los **nombres reales de todos los capítulos**, su número canónico y títulos originales.
  - **Buscador en tiempo real**: Filtra capítulos instantáneamente por palabras clave en el título o por número de capítulo.
  - **Selección ágil de descarga**: Botón *"Seleccionar"* para descargar un capítulo individual y botón *"Hasta aquí"* para construir rangos de descarga con un solo clic.
  - **Modo expandido**: Botón *"Expandir"* para maximizar la tabla de contenidos a toda la altura del modal y explorar cientos de capítulos con total fluidez.
  - **Acciones duales en tarjetas**: Botón *"Tabla de Contenidos"* para explorar el índice y botón *"Descargar"* para configurar opciones de descarga directa.
- 💾 **Base de Datos SQLite en 3NF**: Esquema relacional normalizado con módulo nativo `node:sqlite` que almacena novelas, autores, capítulos canónicos, traducciones independientes (`en`, `es`), párrafos atómicos en 1NF y progreso de lectura en `data/novels.db`.
- 📖 **Lector Offline con Lectura Ininterrumpida (*Binge Reading*)**:
  - Botón directo **"Seguir Leyendo (Cap. X)"** en la biblioteca y en el modal de detalle de la novela.
  - **Descarga al vuelo del capítulo siguiente**: Cuando llegas al último capítulo descargado, el botón *"Siguiente"* se transforma en *"Descargar Sig. (Cap. X+1)"* permitiendo continuar la historia sin interrupciones.
  - Tarjeta interactiva al pie del texto para descargar el siguiente capítulo o los próximos 5 en lote.
  - **Apertura Universal de "Descargar Más..."**: Botón *"Descargar Más..."* accesible tanto en el lector como en el menú *"Más ▾"* del detalle de la novela, desacoplado de las pestañas (`#global-modals`) para emerger con apilamiento Z-Index jerárquico independiente de la vista activa, con preselección inteligente de idioma (`en`/`es`) y cálculo reactivo del siguiente capítulo pendiente. Al completarse la descarga, la biblioteca, el detalle y la navegación del lector se sincronizan automáticamente.
- 🎙️ **Narración Auditiva Neural (TTS)**: Motor `node-edge-tts` con 25 voces neurales naturales multilingües (prioridad en acentos de Colombia y Latinoamérica), sincronización por palabra (`WordBoundary`), salto de narración al hacer clic sobre cualquier palabra (`.reader-word`) y exportación a audiolibro en MP3.
- 🌐 **Traducción Híbrida Inteligente**: Gemini 1.5 Flash (usando API Key configurable en Ajustes) con fallback automático y gratuito a Google Translate RPC. Traducción bajo demanda tanto individual como por lotes.
- 🗂️ **Agrupación, Filtros y Ordenamiento Completo**:
  - **Barra de Herramientas en Mi Biblioteca**: Buscador en tiempo real por título o autor y selector de ordenamiento relacional (`Último leído`, `Título A - Z`, `Título Z - A`, `Más capítulos descargados`, `Menos capítulos descargados`, `Autor A - Z`, `Mayor progreso de lectura`), persistidos automáticamente en `localStorage`.
  - **Experiencia de Usuario Optimizada en Detalle de Novela**: Encabezado limpio con las 3 acciones prioritarias visibles (`Seguir Leyendo`, `Descargar Sig.`, `Traducir a Español`) y un menú desplegable **"Más ▾"** para acciones secundarias (`Descargar Más...`, `Exportar TXT/PDF`, `Abrir Carpeta`) y acciones destructivas protegidas con estilo de advertencia (`Borrar Capítulos...`, `Eliminar Novela Completa`).
  - **Ordenamiento Configurable de Capítulos**: Selector de orden ascendente (`1 a N`) o descendente (`N a 1`) dentro del detalle de la novela, adaptando los bloques de acordeones y preservando la preferencia del usuario.
  - **Ordenamiento en Tabla de Contenidos (TOC)**: Selector de orden `1 a N` o `N a 1` dentro del modal de descarga para explorar capítulos en el orden deseado.
  - Acordeón de capítulos agrupados en bloques configurables (por defecto 20 capítulos por grupo) con botones para expandir/colapsar todos.
  - Diálogo de borrado selectivo de capítulos por idioma y eliminación de novelas completas en cascada 3NF.
- 🎨 **Personalización y Selector de Temas Visuales (4 Estilos)**: Selector interactivo en la pestaña de Configuración con cambio en vivo y persistencia en `localStorage`, alineado con la cromática del icono oficial:
  - **Neon Hunter (Cyberpunk Gradient)** *(Predeterminado)*: Fiel al gradiente completo del icono (Rosa Neón `#ff0078` → Violeta `#8b5cf6` → Azul `#3b82f6`) con resplandores en elementos activos y botones.
  - **Deep Violet (Dark Fantasy)**: Noche púrpura con violeta real (`#8b5cf6`) y lavanda, sobria y descansada para largas sesiones de lectura.
  - **Midnight Velvet (Electric Magenta)**: Fondo negro carbón OLED (`#090a10`) con alto contraste en fucsia neón (`#f43f5e`).
  - **Hybrid Slate & Indigo Glow**: Pizarra fría clásica (`#0b0f19`) con acentos sutiles en índigo (`#6366f1`).
  - **Armonización de Botones y Controles**: Todos los botones primarios, secundarios, contornos, chips de configuración y terminales adaptan su colorimetría dinámicamente mediante variables CSS temáticas sin colores fijos ni destellos visuales.
- ⚡ **Caché Inteligente y Cero Re-Descargas**: Capítulos descargados se leen en milisegundos desde SQLite sin peticiones a internet ni consumo de cuotas.
- 📦 **Exportación Offline**: Exporta a archivos individuales `.txt` o libros digitales `.pdf` con tipografía limpia, portadas incrustadas y tabla de contenidos.
- 🛡️ **Anti-Detección Cloudflare**: Cabeceras de navegador real (Chrome 130 Windows), *request throttling* con pausas aleatorias (*jitter*) y soporte para cookies de sesión.

---

## 🖥️ Modo Escritorio (Desktop App)

Inicia la aplicación de escritorio ejecutando:
```bash
npm run electron
```
O para desarrollo con recarga en vivo de estilos y DevTools:
```bash
npm run dev
```

### Compilación y Empaquetado para Windows (`.exe`)
Para compilar la versión distribuible de Windows:
```bash
# Generar ejecutable portable de Windows:
npm run dist:win

# Generar instalador asistido (NSIS):
npm run dist:win:installer
```
Los ejecutables se generan en el directorio `dist/` siguiendo la convención estandarizada con guiones bajos entre nombre y versión: **`Novel_Hunter_1.0.0.exe`**.

---

## 📚 Documentación Adicional en `docs/`

Para detalles técnicos avanzados y manuales especializados, consulta los documentos de la carpeta `docs/`:

- [docs/architecture.md](docs/architecture.md): Diagrama de arquitectura, endpoints descubiertos, tokens de glosario y descifrado AES-GCM.
- [docs/database.md](docs/database.md): Diseño relacional SQLite en 3NF, diagrama ERD y gestión de respaldos.
- [docs/cli-guide.md](docs/cli-guide.md): Manual completo de uso del CLI interactivo, comandos offline y exportación a TXT/PDF.
- [docs/anti-detection.md](docs/anti-detection.md): Técnicas de evasión de Cloudflare, huellas de navegador y gestión de cookies.

---

| # | Requerimiento Original (`req.txt`) | Implementación |
|---|---|---|
| **1** | Acceder a novelas de `https://wtr-lab.com/en` | Cliente HTTP con emulación de navegador y headers `sec-ch-ua` |
| **2** | Buscar por URL o nombre | Parser de URLs (`/novel/:id/...`) y consulta a `POST /api/search` |
| **3** | Ver listado de capítulos | Consulta a `GET /api/chapters/:raw_id` con títulos y orden |
| **4** | Seleccionar qué capítulos leer/descargar | Selector de rangos (`1-10`, `5`, `1,3,7-9`, `all`) |
| **5** | Descargar el contenido del capítulo (texto) | Extracción de párrafos limpios desde `content_url` |
| **6** | Traducción con Gemini si está disponible, sino Google | Detección automática del servicio `ai` vs `web` |
| **7** | Dar prioridad a la traducción de Gemini | Intento primario con `translate: "ai"`, fallback a `web` |
| **8** | Guardar cada capítulo y permitir fusión (*merge*) | Guardado individual en TXT + función de fusión en TXT y PDF |
| **9** | Evasión de BOTs y bloqueos de Cloudflare | Pausas aleatorias (*jitter*), cabeceras Chrome y cookies de sesión |

---

## 💻 Requisitos Previos

- **Node.js** v18 o superior (probado en Node.js v26 en WSL/Linux/Windows/macOS).
- Conexión a Internet.

---

## 🚀 Instalación

1. Clona o ubícate en la carpeta del proyecto:
   ```bash
   cd nasser_18
   ```

2. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```

---

## 📖 Guía de Uso

El ejecutable se encuentra en `bin/cli.js`. Puedes ejecutarlo con `node bin/cli.js` o mediante el script `npm start`.

### 1. Modo Interactivo (Recomendado)

Ejecuta el programa sin argumentos:
```bash
node bin/cli.js
```
El asistente te guiará con preguntas interactivas:
1. **Buscar novela**: Escribe el nombre (ej: `mortal`) o pega la URL completa.
2. **Seleccionar novela**: Si hay varios resultados, navega con las flechas del teclado `↑` / `↓` y presiona `Enter`.
3. **Seleccionar capítulos**: Ingresa el rango que deseas descargar (ej: `1-10`).
4. **Elegir idioma**: Elige entre `Inglés (Nativo Gemini)` o `Español`.
5. **Confirmar fusión**: Confirma si deseas fusionar los capítulos descargados en un solo archivo.
6. **Exportar a PDF**: Confirma si deseas generar una versión en libro PDF.

---

### 2. Modo Comando con Parámetros (Flags)

Ideal para automatizaciones, scripts o descargas rápidas sin interacción:

```bash
node bin/cli.js [query] [opciones]
```

#### Opciones disponibles:

| Parámetro | Alias | Descripción | Ejemplo |
|---|---|---|---|
| `[query]` | *(primer argumento)* | Nombre de la novela o URL completa de WTR-Lab | `"https://wtr-lab.com/en/novel/112330/..."` |
| `--chapters` | `-c` | Rango o lista de capítulos a descargar | `-c 1-20`, `-c 5`, `-c all` |
| `--lang` | `-l` | Idioma de traducción: `en` (inglés) o `es` (español) | `-l es` (por defecto `en`) |
| `--merge` | `-m` | Fusiona todos los capítulos descargados en un solo archivo | `-m` |
| `--pdf` | `-p` | Genera una copia en formato PDF con portada y paginación | `-p` |

#### Ejemplos prácticos:

- **Descargar capítulos 1 al 10 en español, fusionarlos y crear PDF:**
  ```bash
  node bin/cli.js "https://wtr-lab.com/en/novel/112330/mortal-wonders-of-the-heavens-enjoying-eternal-life" --chapters 1-10 --lang es --merge --pdf
  ```

- **Descargar capítulo 5 en inglés:**
  ```bash
  node bin/cli.js "Mortal Wonders" --chapters 5
  ```

- **Descargar capítulos específicos (1, 3 y del 7 al 9) fusionados:**
  ```bash
  node bin/cli.js "Mortal Wonders" --chapters 1,3,7-9 --merge
  ```

---

### 3. Biblioteca Local y Exportación Offline (SQLite)

La herramienta almacena todas las novelas y capítulos en una base de datos SQLite portable (`data/novels.db`).

#### Ver tu catálogo descargado:
```bash
node bin/cli.js library
# O también:
node bin/cli.js list
```
Muestra qué novelas tienes guardadas, cuántos capítulos descargados, idiomas disponibles y el último capítulo leído.

#### Exportar directamente desde SQLite (Sin conexión a internet):
```bash
# Exportar capítulos 1 al 50 en PDF y TXT fusionados:
node bin/cli.js export <slug_o_id> --chapters 1-50 --lang en --merge --pdf

# Exportar en español a PDF:
node bin/cli.js export <slug_o_id> --chapters 1-20 --lang es --merge --pdf
```

#### Eliminar capítulos o novelas completas:
- **Desde la interfaz gráfica de escritorio**:
  - Todas las acciones de eliminación residen de forma limpia y segura dentro del menú desplegable **"Más ▾"** en el detalle de la novela:
    - **Eliminar novela completa**: Pulsa el botón *"Más ▾"* -> *"Eliminar Novela Completa"* (destacado en rojo preventivo). Elimina en cascada relacional 3NF todos los registros y limpia la carpeta en `exports/`.
    - **Borrar capítulos**: Usa el botón *"Más ▾"* -> *"Borrar Capítulos..."* en el modal de detalle para definir rangos (`1-10`, `all`) e idioma, o el botón individual *"Borrar"* en cada fila de capítulo.
- **Desde la consola integrada o CLI**:
  ```bash
  # Eliminar novela completa de la biblioteca y disco:
  wtr delete <slug_o_id>

  # Borrar capítulos específicos de una novela:
  wtr delete <slug_o_id> -c 1-10 -l en
  ```

#### Paginación y Acordeón Configurable de Capítulos:
- **Agrupación Modular**: En el modal de detalle de cualquier novela guardada, los capítulos se organizan en bloques desplegables (acordeones) para una navegación cómoda y ágil sin sobrecargar la vista.
- **Tamaño Configurable**: En la pestaña **Configuración**, ingresa cualquier valor numérico deseado (ej: `10`, `20`, `50`, etc.) o selecciona uno de los chips predefinidos. Los cambios se persisten de manera transparente en `settings.json`.
- **Controles Globales**: La barra superior del listado incluye un resumen dinámico (`Total: X capítulos en Y grupos (N por acordeón)`) y botones para *"Expandir todos"* y *"Colapsar todos"*.
- **Apertura Contextual**: Al abrir una novela, el acordeón que contiene el último capítulo leído se abre automáticamente para reanudar la lectura sin tener que desplazarse manualmente.

---

### 4. Gestión de Sesión y Autenticación

Para acceder a capítulos bloqueados, novelas reservadas a usuarios registrados o si Cloudflare solicita verificación de usuario:

#### Configurar tus cookies de sesión:
```bash
node bin/cli.js auth
```
Te solicitará que pegues tu cookie de sesión de tu navegador:
1. Abre tu navegador (Google Chrome) e inicia sesión en [wtr-lab.com](https://wtr-lab.com).
2. Abre las herramientas de desarrollo (**F12**) y ve a la pestaña **Network** (o **Application** → **Cookies**).
3. Copia el valor de la cabecera `Cookie` de cualquier petición a `wtr-lab.com`.
4. Pégala en el comando `wtr auth`. La sesión se guardará cifrada en `.wtr-session.json`.

#### Verificar el estado de la sesión:
```bash
node bin/cli.js status
```

#### Eliminar la sesión guardada:
```bash
node bin/cli.js auth --clear
```

---

## 🎯 Formato de Selección de Capítulos

El selector de capítulos (`--chapters` o `-c`) admite múltiples formatos:

- `5`: Descarga únicamente el capítulo 5.
- `1-50`: Descarga del capítulo 1 al 50 de forma correlativa.
- `1, 3, 5, 8`: Descarga solo esos capítulos específicos.
- `1-5, 10, 15-20`: Combina rangos y capítulos individuales.
- `all`: Descarga **todos** los capítulos disponibles de la novela.

---

## 🔬 Mecanismos Internos e Ingeniería Inversa

### 1. Flujo de Descarga y Prioridad de Motores

```
Petición de Capítulo
         │
         ▼
¿Existe versión Gemini ("ai")?
   ├── SÍ ──► Extrae texto en inglés ──► Resuelve glosario (※N⛬) ──► ¿Idioma es 'es'?
   │                                                                     ├── SÍ ──► Traduce a Español
   │                                                                     └── NO ──► Guarda en Inglés
   │
   └── NO ──► Solicita versión "web" ──► Descifra AES-GCM ──► Traduce vía Google Translate
```

### 2. Glosario de Gemini y Reemplazo de Tokens

WTR-Lab procesa las novelas raw chinas con modelos de lenguaje (`gemini-3.5-flash-lite`). Para garantizar consistencia de términos, reemplaza nombres propios por marcadores de posición:
- Texto en crudo: `Over a hundred miles away from the stream where ※29⛬ was in seclusion...`
- Diccionario adjunto en la respuesta (`glossary_data.terms`):
  ```json
  [
    ["Foundation Establishment cultivator", "筑基修士"],
    ...,
    ["Lin Feng", "林枫"]
  ]
  ```
El módulo [src/translators/gemini.js](file:///home/juanmarcos/nasser_18/src/translators/gemini.js) aplica una expresión regular `/※(\d+)[⛬〓]/g` para sustituir cada token por su traducción en inglés oficial antes de guardarlo.

### 3. Descifrado AES-GCM (Servicio Web)

Cuando no existe traducción AI, la plataforma entrega el texto en chino original ofuscado con el esquema:
`arr:IV_BASE64:AUTH_TAG_BASE64:CIPHERTEXT_BASE64`

El módulo [src/crypto/aes.js](file:///home/juanmarcos/nasser_18/src/crypto/aes.js) utiliza la clave simétrica de 256 bits extraída del bundle JavaScript cliente de WTR-Lab (`IJAFUUxjM25hyzL2AZrn0wl7cESED6Ru`) y ejecuta el descifrado mediante `crypto.webcrypto.subtle` de Node.js.

### 4. Traducción a Español

El módulo [src/translators/google.js](file:///home/juanmarcos/nasser_18/src/translators/google.js) utiliza el endpoint RPC de Google Translate sin requerir clave de API. Para procesar capítulos enteros sin romper párrafos ni superar el límite de longitud de URL:
- Agrupa los párrafos en lotes de hasta 2000 caracteres.
- Separa los párrafos con el delimitador numérico `[[--9999--]]` (inmune a traducciones erróneas).
- Reconstruye los párrafos en español manteniendo los saltos de línea originales.

### 5. Motor de Narración TTS y Word Boundary

El módulo [src/services/tts.js](file:///home/juanmarcos/nasser_18/src/services/tts.js) integra `node-edge-tts` para ofrecer síntesis de voz natural:
- Catálogo de 11 voces neuronales en español (España, México, Colombia, Argentina) e inglés (US, UK).
- Emisión de marcas de tiempo por palabra (`WordBoundary`) que permite saltar a cualquier punto del capítulo haciendo clic sobre cualquier palabra (`.reader-word`).
- Exportación directa de capítulos completos a audiolibro en formato MP3 con nombres estandarizados en `exports/<novela>/audio/`.

### 6. Evasión de Cloudflare

Para evitar bloqueos por bot o activación de retos de Turnstile:
1. **Emulación de Chrome 130**: Envío de cabeceras completas `User-Agent`, `Sec-Ch-Ua`, `Sec-Fetch-*` y `Referer`.
2. **Pausas aleatorias (*Jitter*)**: Cada descarga de capítulo realiza una pausa de entre 900ms y 1900ms antes de la siguiente petición.
3. **Persistencia de sesión**: Admite inyección directa de cookies de Cloudflare (`cf_clearance`, cookies de sesión de Next.js).

---

## 📂 Estructura del Proyecto

```text
nasser_18/
├── electron/
│   ├── main.js              # Proceso principal de Electron e IPC Handlers
│   ├── preload.cjs          # ContextBridge seguro (window.wtrApi)
│   └── renderer/            # Interfaz de usuario (index.html, app.js, styles.css)
├── bin/
│   └── cli.js               # CLI principal (prompts interactivos y commander)
├── src/
│   ├── config.js            # Configuración, rutas y persistencia de cookies/settings
│   ├── api/
│   │   ├── client.js        # Cliente HTTP con cabeceras anti-bot y cookies
│   │   ├── novel.js         # Búsqueda de novelas, parseo de URLs y lista de capítulos
│   │   └── reader.js        # Descarga con prioridad Gemini, fallback Web y guardado SQLite
│   ├── crypto/
│   │   └── aes.js           # Descifrador AES-GCM nativo
│   ├── db/
│   │   ├── connection.js    # Conexión nativa node:sqlite con modo WAL y FK activas
│   │   ├── schema.sql       # Esquema relacional en Tercera Forma Normal (3NF)
│   │   └── repository.js    # NovelRepository con soporte de cascada y lectura offline
│   ├── services/
│   │   ├── tts.js           # Motor TTS EdgeTTS con marcas temporales y exportación MP3
│   │   └── translator.js    # Servicio híbrido de traducción Gemini / Google RPC
│   ├── translators/
│   │   ├── gemini.js        # Limpieza de tokens y reemplazo de glosario oficial
│   │   └── google.js        # Traductor por lotes con delimitadores seguros
│   └── storage/
│       ├── writer.js        # Escritura de capítulos individuales en TXT
│       ├── merger.js        # Fusión de capítulos con índice de contenidos
│       └── pdf.js           # Generador de documentos PDF con portada y paginación
├── .agents/
│   └── skills/
│       └── novel-hunter-workflow/ # Skill de ciclo de desarrollo y documentación
├── data/                    # Base de datos SQLite (novels.db) y settings.json
├── exports/                 # Directorio de salida de novelas exportadas (TXT / PDF / MP3)
├── test/
│   ├── verify.js            # Suite integral de verificación (31 pruebas)
│   └── test_db.js           # Suite unitaria SQLite 3NF (16 pruebas)
├── AGENTS.md                # Reglas mandatorias para LLMs y asistentes
├── GEMINI.md                # Directrices específicas para Gemini / Antigravity
├── package.json             # Manifiesto y dependencias del proyecto
└── README.md                # Documentación completa
```

---

## 🧪 Pruebas Automatizadas

El proyecto cuenta con dos suites de pruebas automatizadas completas:

1. **Suite de Integración** (`test/verify.js` - 31 pruebas):
   - Parseo de URLs, búsqueda en vivo, lista de capítulos y glosario Gemini.
   - Descifrado AES-GCM y traductor por lotes Google Translate RPC.
   - Generación de TXT, fusión y PDF con portadas incrustadas.
   - Sincronización palabra por palabra TTS y exportación MP3.
   - Traducción local bajo demanda a español (individual y lotes).
   - Opciones de seguir leyendo y descarga al vuelo de capítulos siguientes.
   - Eliminación selectiva de capítulos y borrado completo de novela.
   - Paginación y acordeones desplegables configurables.
   - Menú desplegable "Más opciones" y UI armonizada a 36px.
   - Reubicación global de modales y apilamiento Z-Index.
   - Opciones de ordenamiento y filtros en Biblioteca, Capítulos y TOC.

2. **Suite Unitaria SQLite 3NF** (`test/test_db.js` - 16 pruebas):
   - Normalización relacional de autores, novelas, glosarios y capítulos.
   - Párrafos atómicos en 1NF y versiones independientes por idioma (`en`, `es`).
   - Registro de progreso de lectura y último leído global con marcas de tiempo precisas.
   - Detección de capítulos pendientes de traducir.
   - Borrado selectivo por idioma y eliminación en cascada completa.
   - Sanitización de párrafos con espacios y líneas en blanco.
   - Opciones de ordenamiento SQL en `listLibrary` (`last_read`, `title_asc`, `title_desc`, `chapters_desc`, `author_asc`, `progress_desc`).

Para ejecutar ambas suites:
```bash
npm test
node test/test_db.js
```

---

## 📄 Licencia

Este software se distribuye bajo la licencia MIT. Uso personal y educativo.
