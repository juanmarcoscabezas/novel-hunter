# WTR-LAB Novel Downloader & Scraper 📚

Herramienta en línea de comandos (CLI) desarrollada en **Node.js** para buscar, descargar, traducir y fusionar novelas ligeras de [wtr-lab.com](https://wtr-lab.com/en).

Soporta traducción prioritaria de **Google Gemini**, reemplazo automático de glosario de términos oficiales, descifrado nativo **AES-GCM**, fallback y traducción a **Español** vía Google Translate, almacenamiento individual en **TXT**, compilación fusionada (**Merge**) y exportación a **PDF**.

---

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Cumplimiento de Requerimientos](#-cumplimiento-de-requerimientos)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Guía de Uso](#-guía-de-uso)
  - [Modo Interactivo (Recomendado)](#1-modo-interactivo-recomendado)
  - [Modo Comando con Parámetros (Flags)](#2-modo-comando-con-parámetros-flags)
  - [Gestión de Sesión y Autenticación (Bypass Cloudflare)](#3-gestión-de-sesión-y-autenticación)
- [Formato de Selección de Capítulos](#-formato-de-selección-de-capítulos)
- [Mecanismos Internos e Ingeniería Inversa](#-mecanismos-internos-e-ingeniería-inversa)
  - [1. Flujo de Descarga y Prioridad de Motores](#1-flujo-de-descarga-y-prioridad-de-motores)
  - [2. Glosario de Gemini y Reemplazo de Tokens](#2-glosario-de-gemini-y-reemplazo-de-tokens)
  - [3. Descifrado AES-GCM (Servicio Web)](#3-descifrado-aes-gcm-servicio-web)
  - [4. Traducción a Español](#4-traducción-a-español)
  - [5. Evasión de Cloudflare](#5-evasión-de-cloudflare)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Pruebas Automatizadas](#-pruebas-automatizadas)

---

## ✨ Características Principales

- 💾 **Base de Datos Portable SQLite**: Catálogo relacional normalizado en 3NF (`node:sqlite` nativo) que almacena novelas, autores, glosario, capítulos y párrafos atómicos en un solo archivo `data/novels.db`.
- ⚡ **Caché Inteligente y Cero Re-Descargas**: Si un capítulo ya está en la base de datos local, se carga en milisegundos sin consumir peticiones ni arriesgar bloqueos de Cloudflare.
- 📦 **Exportación Offline**: Exporta o fusiona capítulos a TXT o PDF directamente desde la base de datos sin necesidad de conexión a internet.
- 🔍 **Búsqueda Flexible**: Busca por nombre de novela con menú interactivo o pega directamente la URL completa de WTR-Lab.
- 🤖 **Prioridad Gemini Nativa**: Descarga directa de la traducción de Google Gemini (`gemini-3.5-flash-lite`) alojada en la plataforma.
- 📖 **Limpieza de Glosario**: Decodifica y sustituye automáticamente los marcadores `※N⛬` por los nombres de personajes, sectas, píldoras y reinos de cultivo oficiales.
- 🔓 **Descifrador AES-GCM**: Algoritmo criptográfico integrado para descifrar el contenido ofuscado del servicio estándar de WTR-Lab.
- 🇪🇸 **Traducción Opcional a Español**: Traduce con fluidez los capítulos conservando los nombres propios y la coherencia del glosario.
- 📁 **Organización y Fusión**: Guarda cada capítulo por separado (`.txt`) y permite unirlos todos en un único archivo compilado con índice de contenidos.
- 📄 **Exportación a PDF**: Genera libros digitales en PDF con formato tipográfico limpio, portada, encabezados y numeración de página.
- 🛡️ **Anti-Detección Cloudflare**: Cabeceras de navegador real (Chrome 130 Windows), *request throttling* con pausas aleatorias y soporte para cookies de sesión.

---

## 📌 Cumplimiento de Requerimientos

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

### 5. Evasión de Cloudflare

Para evitar bloqueos por bot o activación de retos de Turnstile:
1. **Emulación de Chrome 130**: Envío de cabeceras completas `User-Agent`, `Sec-Ch-Ua`, `Sec-Fetch-*` y `Referer`.
2. **Pausas aleatorias (*Jitter*)**: Cada descarga de capítulo realiza una pausa de entre 900ms y 1900ms antes de la siguiente petición.
3. **Persistencia de sesión**: Admite inyección directa de cookies de Cloudflare (`cf_clearance`, cookies de sesión de Next.js).

---

## 📂 Estructura del Proyecto

```text
nasser_18/
├── bin/
│   └── cli.js               # CLI principal (prompts interactivos y commander)
├── src/
│   ├── config.js            # Configuración, rutas y persistencia de cookies
│   ├── api/
│   │   ├── client.js        # Cliente HTTP con cabeceras anti-bot y cookies
│   │   ├── novel.js         # Búsqueda de novelas, parseo de URLs y lista de capítulos
│   │   └── reader.js        # Descarga con prioridad Gemini y fallback Web
│   ├── crypto/
│   │   └── aes.js           # Descifrador AES-GCM nativo
│   ├── translators/
│   │   ├── gemini.js        # Limpieza de tokens y reemplazo de glosario
│   │   └── google.js        # Traductor por lotes con delimitadores seguros
│   └── storage/
│       ├── writer.js        # Escritura de capítulos individuales en TXT
│       ├── merger.js        # Fusión de capítulos con índice de contenidos
│       └── pdf.js           # Generador de documentos PDF con portada y paginación
├── data/                    # Base de datos SQLite (novels.db)
├── exports/                 # Directorio de salida de novelas exportadas (TXT / PDF)
├── test/
│   └── verify.js            # Suite de pruebas automatizadas
├── package.json             # Manifiesto y dependencias del proyecto
├── req.txt                  # Requerimientos originales del proyecto
└── README.md                # Documentación completa
```

---

## 🧪 Pruebas Automatizadas

El proyecto cuenta con una suite completa de pruebas unitarias y de integración que verifica:
1. Parseo correcto de URLs de WTR-Lab.
2. Búsqueda en vivo de novelas contra la API.
3. Obtención de capítulos.
4. Sustitución de glosario de Gemini.
5. Traducción de Google Translate por lotes.
6. Descarga real de un capítulo con Gemini.
7. Escritura en archivo `.txt`.
8. Fusión de capítulos.
9. Creación y formato de archivo `.pdf`.

Para ejecutar las pruebas:
```bash
npm test
```
o directamente:
```bash
node test/verify.js
```

---

## 📄 Licencia

Este software se distribuye bajo la licencia MIT. Uso personal y educativo.
