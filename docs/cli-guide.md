# Manual de Usuario del CLI 🚀

Guía completa de comandos y opciones disponibles en la herramienta de línea de comandos `wtr`.

---

## 1. Modo Interactivo (Asistente Guiado)

Si ejecutas el comando sin parámetros, se iniciará el asistente interactivo:
```bash
node bin/cli.js
```

### Flujo interactivo:
1. **Entrada**: Escribe el nombre o pega la URL de la novela.
2. **Selección**: Si hay varias coincidencias, usa las teclas `↑` / `↓` y presiona `Enter`.
3. **Capítulos**: Ingresa qué capítulos deseas (ej: `1-10`, `5`, `all`).
4. **Idioma**: Selecciona con flechas entre `Inglés` (Gemini nativo) o `Español`.
5. **Fusión**: Confirma si deseas unir los capítulos en un solo archivo compilado.
6. **PDF**: Confirma si deseas generar una versión en PDF.

---

## 2. Comando Principal de Descarga (`download`)

Sintaxis general:
```bash
node bin/cli.js [query] [opciones]
```

### Opciones:
| Opción | Alias | Tipo | Descripción |
|---|---|---|---|
| `[query]` | *(argumento)* | Texto | Nombre de la novela o URL directa de WTR-Lab |
| `--chapters <rango>` | `-c` | String | Capítulos a descargar: `1-50`, `5`, `1,3,7-9`, `all` |
| `--lang <idioma>` | `-l` | String | Idioma de salida: `en` (inglés, por defecto) o `es` (español) |
| `--merge` | `-m` | Booleano | Fusiona los capítulos en un único documento con índice |
| `--pdf` | `-p` | Booleano | Exporta además en formato PDF tipográfico |

### Ejemplos prácticos:

#### Descargar novela completa por URL en español y PDF:
```bash
node bin/cli.js "https://wtr-lab.com/en/novel/112330/mortal-wonders-of-the-heavens-enjoying-eternal-life" -c all -l es -m -p
```

#### Descargar un rango rápido por nombre:
```bash
node bin/cli.js "Mortal" -c 1-20 -m
```

#### Descargar solo un capítulo específico:
```bash
node bin/cli.js "Mortal" -c 15
```

---

## 3. Biblioteca Local (`library` / `list`)

Consulta el estado de todas las novelas y capítulos que tienes guardados en tu base de datos SQLite local:

```bash
node bin/cli.js library
# o
node bin/cli.js list
```

### Ejemplo de salida:
```text
=== Mi Biblioteca Local (SQLite) ===

📖 Mortal: Wonders of the Heavens, Enjoying Eternal Life
   ID (raw_id): 112330 | Slug: mortal-wonders-of-the-heavens-enjoying-eternal-life
   Autor: Long Zhi Han
   Capítulos descargados: 20 / 296
   Idiomas disponibles: en, es
   Último leído: Capítulo 20
```

---

## 4. Exportación Offline (`export`)

Genera archivos TXT o libros PDF **directamente desde tu base de datos SQLite** sin necesidad de conexión a internet:

```bash
node bin/cli.js export <slug_o_id> [opciones]
```

### Ejemplos:
```bash
# Exportar capítulos 1 al 20 en PDF y TXT fusionados:
node bin/cli.js export 112330 --chapters 1-20 --lang en --merge --pdf

# Exportar la versión en español de los capítulos 1 al 5:
node bin/cli.js export 112330 --chapters 1-5 --lang es --merge --pdf
```

---

## 5. Gestión de Sesión y Cloudflare (`auth` / `status`)

Para novelas restringidas a usuarios registrados o capítulos VIP:

### Guardar cookie de sesión:
```bash
node bin/cli.js auth
```
Pega tu cookie de navegador cuando el prompt lo solicite.

### Comprobar estado de la sesión:
```bash
node bin/cli.js status
```

### Eliminar la sesión guardada:
```bash
node bin/cli.js auth --clear
```

---

## 6. Consola Integrada y Preferencias de Visualización

- **Consola Terminal en la App de Escritorio**: La pestaña *Consola Terminal* permite ejecutar directamente comandos CLI (`wtr library`, `wtr status`, `wtr export`, etc.) con soporte para salida coloreada ANSI idéntica a la terminal del sistema.
- **Paginación y Acordeones en el Catálogo**: En la pestaña *Configuración* de la app de escritorio, puedes definir la cantidad de capítulos por acordeón (10, 20, 50, etc.). El valor se almacena en `data/settings.json` y se aplica instantáneamente al explorar cualquier novela guardada.
- **Búsqueda y Ordenamiento Reactivo**: En la pestaña *Mi Biblioteca*, la barra de herramientas permite buscar por palabras clave y ordenar por último leído, título A-Z / Z-A, capítulos descargados, autor y progreso de lectura. En los modales de detalle de novela y tabla de contenidos (TOC), se dispone de selectores de orden ascendente (`1 a N`) y descendente (`N a 1`).

---

## 7. Automatización de Compilación y Publicación de Releases (`npm run release`)

Para generar el ejecutable portable de Windows y publicarlo automáticamente como una nueva versión en GitHub:

```bash
# Compilar el .exe y subir la release a GitHub:
npm run release

# Subir a GitHub reutilizando un ejecutable previamente compilado:
npm run release:skip-build

# Simular el proceso de release sin modificar GitHub (Dry-run):
node scripts/release.mjs --dry-run

# Forzar sobrescritura del asset si ya existía en la release:
node scripts/release.mjs --force
```

### Flujo del comando:
1. Inspecciona `package.json` para obtener la versión activa (ej. `1.1.0` -> `v1.1.0`).
2. Resuelve la autenticación con GitHub (variables `GITHUB_TOKEN` / `GH_TOKEN` o mediante el helper `git credential fill`).
3. Compila el ejecutable portable de Windows `dist/Novel_Hunter_<version>.exe`.
4. Valida y sube el tag Git al repositorio remoto.
5. Crea o actualiza la Release en GitHub con el historial de commits.
6. Sube el binario portable a los assets de la release y muestra los enlaces directos de descarga.
