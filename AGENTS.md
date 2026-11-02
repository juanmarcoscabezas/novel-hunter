# Reglas y Guía de Desarrollo para LLMs y Agentes de IA (Novel Hunter)

Este documento contiene las reglas mandatorias, convenciones de arquitectura y directrices que **todo LLM, agente autónomo o asistente de código** debe seguir estrictamente al interactuar con o modificar este repositorio.

---

## 🚨 1. Regla de Oro Inquebrantable (User Mandate)

> **"Cada vez que agregues una feature, haz tests, corre los tests, actualiza la documentación de todo y luego commit."**

- **Prohibido hacer commit sin tests**: Si agregas una feature o modificas una funcionalidad, debes escribir la prueba correspondiente.
- **Prohibido hacer commit con pruebas rotas**: Siempre corre y verifica que pasen exitosamente:
  ```bash
  npm test
  node test/test_db.js
  ```
- **Prohibido hacer commit sin actualizar la documentación**: Siempre que se agregue o modifique una característica, se debe actualizar obligatoriamente `README.md` y los archivos especializados en `docs/` (`architecture.md`, `database.md`, `cli-guide.md`, etc.).
- **Integridad de las suites de prueba**: Nunca comentes, desactives o elimines aserciones existentes para "hacer pasar" una prueba. Si una funcionalidad cambia, actualiza las pruebas justificadamente.
- **Aislamiento en pruebas**: Toda prueba que interactúe con la base de datos o el progreso de lectura debe aislarse en memoria (`:memory:`) o restaurar el estado previo para no alterar nunca los datos del usuario en `data/novels.db`.

---

## 🏗️ 2. Arquitectura del Proyecto

**Novel Hunter** es una aplicación de escritorio híbrida para buscar, descargar, traducir, leer offline y narrar novelas ligeras con voces neurales.

- **Frontend**: Vanilla JavaScript (ES Modules), HTML5, CSS3 moderno con variables CSS y tema oscuro (`electron/renderer/`).
  - No usar frameworks pesados (React, Vue, Angular). Mantener el rendimiento ligero y arranque instantáneo.
  - Iconos vectoriales SVG en línea (`ICONS` en `app.js`). Cero emojis rotos o fuentes de iconos externas.
- **Backend de Escritorio**: Electron (`electron/main.js`), `preload.cjs` con `contextBridge` aislado (`window.wtrApi`).
- **Base de Datos**: SQLite normalizada en **Tercera Forma Normal (3NF)** usando el módulo nativo de Node.js (`node:sqlite`).
- **Empaquetado**: `electron-builder` para generar ejecutables portables de Windows con nomenclatura de guión bajo (`dist/Novel_Hunter_1.1.0.exe`).

### Estructura de Directorios Clave:
```
├── electron/
│   ├── main.js             # Proceso principal de Electron e IPC Handlers
│   ├── preload.cjs         # Bridge seguro contextBridge (window.wtrApi)
│   └── renderer/           # Interfaz de usuario (index.html, app.js, styles.css)
├── src/
│   ├── api/                # Cliente HTTP WTR-Lab, scraping y endpoints de lectura
│   ├── crypto/             # Descifrado AES-GCM para contenido web
│   ├── db/                 # Conexión SQLite, esquema 3NF y NovelRepository
│   ├── services/           # TTS (EdgeTTS con marcas de palabra) y Traducción (Google/Gemini)
│   ├── storage/            # Exportación a TXT, PDF y fusión de capítulos
│   └── translators/        # Lógica de Google Translate RPC y tokens Gemini
├── test/
│   ├── verify.js           # Suite de integración integral (31+ pruebas)
│   └── test_db.js          # Suite de verificación unitaria SQLite 3NF (16+ pruebas)
└── dist/                   # Ejecutables compilados de Windows
```

---

## 🗄️ 3. Reglas de Base de Datos (SQLite 3NF)

1. **Relación Canónica vs. Traducción**:
   - La tabla `chapters` representa el capítulo canónico (`novel_id`, `chapter_no`).
   - La tabla `chapter_translations` almacena cada traducción (`chapter_id`, `language`, `engine_id`, `full_text`).
   - **NUNCA dupliques filas en `chapters`** para guardar diferentes idiomas. Un mismo capítulo canónico tiene múltiples traducciones (`en`, `es`).
   - La tabla `paragraphs` almacena párrafos atómicos en 1NF (`translation_id`, `paragraph_order`, `content`).
2. **Entorno Empaquetado y Portabilidad**:
   - El ejecutable portable y el archivo `.asar` son de **solo lectura**.
   - **NUNCA intentes escribir dentro de `app.asar`**. Toda escritura de base de datos (`data/novels.db`), sesiones o descargas debe resolverse mediante `resolveStorageDir()` en `src/config.js` (usando `PORTABLE_EXECUTABLE_DIR` o `userData`).
3. **Claves Foráneas Activas**:
   - Mantén siempre `PRAGMA foreign_keys = ON;`.

---

## 🎨 4. Reglas de Interfaz de Usuario (UI / UX)

1. **Consistencia de Títulos y Menú**:
   - El título principal de cada pantalla debe coincidir con el nombre del botón correspondiente en el menú lateral:
     - `"Buscador"`
     - `"Mi biblioteca"`
     - `"Consola Terminal"`
     - `"Configuración"`
2. **Estilo y Botones**:
   - Las acciones principales de las tarjetas de novela deben tener altura unificada exacta (36px, `box-sizing: border-box`).
   - Las opciones de exportar, abrir carpeta y borrado deben residir dentro del modal de detalle de la novela para evitar duplicidad o saturación visual en la barra global o tarjetas.
   - En el encabezado del detalle de la novela (`#chapters-modal`), mantener visibles las acciones primarias (`Seguir Leyendo`, `Descargar Sig.`, `Traducir a Español`) y agrupar las acciones secundarias (`Descargar Más...`, `Exportar`, `Abrir Carpeta`) y destructivas (`Borrar Capítulos...`, `Eliminar Novela Completa`) dentro del menú desplegable `[Más ▾]` (`#detail-more-btn` / `#detail-more-dropdown`).
3. **Traducción On-Demand**:
   - Si el usuario descargó en inglés, debe tener disponible el botón `🌐 Traducir a Español` tanto en el lector (`#reader-modal`) como en el detalle de la novela (`#chapters-modal`).
   - Debe proveerse retroalimentación visual en tiempo real (barras de progreso, spinners, etiquetas de estado) durante operaciones asíncronas.
4. **Temas y Cromática**:
   - La aplicación implementa 4 temas visuales seleccionables desde Configuración (`neon-hunter`, `deep-violet`, `midnight-velvet`, `slate-indigo`), gestionados mediante variables CSS y el atributo `data-theme` en `<html>`.
   - El tema predeterminado es `neon-hunter`, alineado con la cromática y gradiente del icono oficial. La preferencia del usuario se persiste en `localStorage` (`novel_hunter_theme`).
5. **Armonización de Botones y Controles con el Sistema de Temas (Mandatorio)**:
   - **Prohibido colores fijos ("hardcodeados")**: NUNCA uses colores hexadecimales fijos (ej. `#334155`, `#3b82f6`, `rgba(59, 130, 246, ...)`) ni gradientes no temáticos en botones o controles interactivos nuevos o modificados.
   - **Variables CSS reactivas obligatorias**: Todo botón o control debe adherirse a las variables CSS del tema activo:
     - Primarios (`.btn-primary`): `var(--primary-gradient)` y resplandor `var(--accent-glow)`.
     - Secundarios (`.btn-secondary`): `background-color: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main);`, y en hover `background-color: var(--bg-card-hover); border-color: var(--border-focus); color: #ffffff;`.
     - Contorno (`.btn-outline`): `border: 1px solid var(--border-color); color: var(--text-main);`, y en hover iluminar con `var(--badge-primary-bg)` y `var(--border-focus)`.
     - Fichas interactivas (`.chip`, `.group-size-chip`): `var(--bg-card)` y `var(--border-color)`, y `.chip.active` con `var(--primary-gradient)` y `var(--accent-glow)`.
     - Acciones rápidas y selectores (`.terminal-quick-btn`, `.select-harmonized`, `.btn-icon`): deben reaccionar al color de acento y resplandor del tema (`var(--border-focus)`, `var(--badge-primary-bg)`, `var(--accent-glow)`).
   - **Dimensiones estándar**:
     - Botones de acción principales en tarjetas y modales: altura unificada de 36px (`.btn-sm` / `.btn-action-harmonized`, `box-sizing: border-box`).
     - Botones compactos: 28px (`.btn-xs`).
   - **Cero emojis**: Únicamente iconos vectoriales SVG en línea (`ICONS` en `app.js` o `<svg class="svg-icon">`).
6. **Scroll Único en Modales Complejos (Cero Doble Scroll)**:
   - En modales con listas de capítulos (`.download-modal-card`, `#chapters-modal`), el contenedor `.modal-body` debe configurarse con `overflow: hidden; max-height: none; flex: 1; min-height: 0;`.
   - Los paneles superiores (portada, búsqueda, configuración) y los botones inferiores del pie deben mantenerse estables con `flex-shrink: 0;`.
   - El desplazamiento debe residir exclusivamente en la lista interna (`.modal-toc-list` o `.chapters-list-wrapper`) con `flex: 1; min-height: 0; max-height: none; overflow-y: auto;`, erradicando barras de scroll duplicadas o conflictivas.
   - En el modal de descarga (`.download-modal-card`), estructurar la vista en 2 columnas (`.download-sidebar-col` de 320px a la izquierda y `.download-toc-section` a la derecha) para dotar al listado de capítulos del 100% de la altura vertical disponible (más de 500px), garantizando visibilidad simultánea de 12 a 16 capítulos.

---

## 🎙️ 5. Reglas de Narración Auditiva (TTS)

- El motor TTS utiliza `node-edge-tts` con un catálogo de 25 voces neurales naturales multilingües, priorizando voces colombianas (`es-CO-SalomeNeural`, `es-ES-XimenaNeural`, `es-CO-GonzaloNeural`) y una amplia selección femenina de Latinoamérica y España.
- El selector agrupa las voces con `<optgroup>` y persiste la preferencia del usuario en `localStorage`.
- Debe preservarse la sincronización de marcas de tiempo por palabra (`WordBoundary`) que permite al usuario hacer clic en cualquier palabra del texto (`.reader-word`) para iniciar la lectura inmediatamente desde esa posición.
- Para exportaciones de audio completas, empaquetar en lotes controlados para evitar límites de tiempo en WebSocket.

---

## 🌐 6. Reglas de Traducción

- Si el usuario configuró una API Key de Gemini en Ajustes, el sistema puede intentar traducir con **Gemini 1.5 Flash**.
- Si no hay API Key o si ocurre cualquier error, el sistema debe recurrir automáticamente y sin fallar a **Google Translate RPC** (`src/translators/google.js`), el cual es gratuito, rápido y sin límites de clave.
- Las traducciones a español deben actualizar automáticamente SQLite, generar el archivo individual `.txt` en `exports/<novela>/` y cambiar la interfaz a español.

---

## 📦 7. Convenciones de Commits y Control de Versiones

- Formato de mensajes: **Conventional Commits**:
  - `feat(...)`: Nueva funcionalidad.
  - `fix(...)`: Corrección de bug o comportamiento inesperado.
  - `refactor(...)`: Reorganización sin cambio de comportamiento.
  - `test(...)`: Añadir o actualizar pruebas.
  - `docs(...)`: Documentación o reglas.
- **Archivos no deseados en Git**:
  - No añadir ejecutables pesados (`dist/*.exe`) al historial de git si no es explícitamente requerido.
  - No añadir archivos temporales de iconos en alta resolución o basura generada en `scratch/`.
- **Publicación de Releases**:
  - Usar `npm run release` (`scripts/release.mjs`) para compilar el binario portable oficial y subirlo automáticamente como asset a GitHub Releases mediante la API de GitHub, manteniendo el repositorio Git liviano.
- **Flujo de Trabajo Obligatorio**:
  1. Modificar código respetando los lineamientos.
  2. Escribir o actualizar pruebas en `test/verify.js` o `test/test_db.js`.
  3. Ejecutar `npm test && node test/test_db.js`.
  4. **Actualizar la documentación de todo** (`README.md`, `docs/`, `AGENTS.md`).
  5. Si todo pasa al 100% y la documentación está al día, proceder con `git add` y `git commit`.

---

## 📖 8. Reglas de Documentación Continua (Mandatorio)

- **Sincronización Total de Documentación**: Ninguna funcionalidad se considera completada hasta que su documentación esté escrita y actualizada.
- **Archivos a Actualizar**:
  - `README.md`: Tabla de características, requerimientos, guía de uso y nuevas opciones de interfaz.
  - `docs/architecture.md`: Flujo del sistema, IPC handlers, arquitectura de componentes.
  - `docs/database.md`: Esquema SQLite 3NF, relaciones en cascada, nuevos métodos en `NovelRepository`.
  - `docs/cli-guide.md`: Nuevos comandos CLI o paridad con terminal embebida.
  - `.agents/skills/novel-hunter-workflow/SKILL.md`: Guía de workflow para agentes y asistentes de IA.
