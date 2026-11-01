# Reglas y Guía de Desarrollo para LLMs y Agentes de IA (Novel Hunter)

Este documento contiene las reglas mandatorias, convenciones de arquitectura y directrices que **todo LLM, agente autónomo o asistente de código** debe seguir estrictamente al interactuar con o modificar este repositorio.

---

## 🚨 1. Regla de Oro Inquebrantable (User Mandate)

> **"Cada vez que agregues una feature, haz tests, corre los tests y luego commit."**

- **Prohibido hacer commit sin tests**: Si agregas una feature o modificas una funcionalidad, debes escribir la prueba correspondiente.
- **Prohibido hacer commit con pruebas rotas**: Siempre corre y verifica que pasen exitosamente:
  ```bash
  npm test
  node test/test_db.js
  ```
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
- **Empaquetado**: `electron-builder` para generar ejecutables portables de Windows (`dist/Novel Hunter 1.0.0.exe`).

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
│   ├── verify.js           # Suite de integración integral (23+ pruebas)
│   └── test_db.js          # Suite de verificación unitaria SQLite 3NF (12+ pruebas)
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
   - Las opciones de exportar y abrir carpeta deben residir dentro del modal de detalle de la novela para evitar duplicidad en la barra global.
3. **Traducción On-Demand**:
   - Si el usuario descargó en inglés, debe tener disponible el botón `🌐 Traducir a Español` tanto en el lector (`#reader-modal`) como en el detalle de la novela (`#chapters-modal`).
   - Debe proveerse retroalimentación visual en tiempo real (barras de progreso, spinners, etiquetas de estado) durante operaciones asíncronas.

---

## 🎙️ 5. Reglas de Narración Auditiva (TTS)

- El motor TTS utiliza `node-edge-tts` con voces neurales naturales multilingües (español e inglés, con acentos de ES, MX, AR, CO, US, GB).
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
- **Flujo de Trabajo Obligatorio**:
  1. Modificar código respetando los lineamientos.
  2. Escribir o actualizar pruebas en `test/verify.js` o `test/test_db.js`.
  3. Ejecutar `npm test && node test/test_db.js`.
  4. Si todo pasa al 100%, proceder con `git add` y `git commit`.
