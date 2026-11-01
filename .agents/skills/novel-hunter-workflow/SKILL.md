---
name: novel-hunter-workflow
description: >-
  Procedimiento de ciclo de vida mandatorio para desarrollo, refactorización y adición de features en Novel Hunter. Usar cada vez que se agregue o modifique una funcionalidad para cumplir la regla inquebrantable: 1) implementación con UI unificada y SQLite 3NF, 2) creación de pruebas automatizadas, 3) ejecución y verificación de suites de tests, 4) actualización obligatoria de toda la documentación (README.md, docs/, AGENTS.md), y 5) commit con Conventional Commits.
---

# Flujo de Desarrollo Obligatorio de Novel Hunter 🚀

Este skill define el protocolo riguroso y secuencial que todo desarrollador o agente de IA debe seguir al trabajar en este repositorio.

---

## 🚨 Regla de Oro Inquebrantable

> **"Cada vez que agregues una feature, haz tests, corre los tests, actualiza la documentación de todo y luego commit."**

---

## 📋 Pasos del Ciclo de Vida de Desarrollo

### 1. Implementación de la Funcionalidad
- Mantener la arquitectura desacoplada:
  - **Backend**: Electron IPC seguro con `contextBridge` aislado (`electron/main.js`, `electron/preload.cjs`).
  - **Frontend**: Vanilla JS modular, HTML5 y CSS3 moderno con variables CSS (`electron/renderer/`).
  - **Base de Datos**: SQLite normalizado en Tercera Forma Normal (3NF) nativo con `node:sqlite`. Jamás escribir en `app.asar`.
  - **UI / UX**: Altura fija unificada de 36px (`box-sizing: border-box`) para botones de acción. Iconos vectoriales SVG en línea (`ICONS`), cero emojis rotos.

### 2. Creación o Actualización de Pruebas
- **Toda nueva funcionalidad debe tener su prueba asociada**:
  - Pruebas de integración global en [`test/verify.js`](file:///home/juanmarcos/nasser_18/test/verify.js).
  - Pruebas unitarias de base de datos en [`test/test_db.js`](file:///home/juanmarcos/nasser_18/test/test_db.js).
- **Aislamiento**: Las pruebas deben usar bases de datos en memoria (`:memory:`) o limpiar cualquier registro temporal para no alterar la biblioteca del usuario en `data/novels.db`.

### 3. Ejecución y Validación de Suites (Cero Errores)
- Antes de documentar o hacer commit, ambas suites deben pasar al 100%:
  ```bash
  npm test
  node test/test_db.js
  ```
- Prohibido comentar aserciones para forzar el paso de pruebas.

### 4. Actualización Obligatoria de Toda la Documentación 📖
**Paso mandatorio antes de commit**: Cada adición o cambio debe quedar perfectamente reflejado en la documentación del proyecto:
1. **[`README.md`](file:///home/juanmarcos/nasser_18/README.md)**:
   - Resumen del proyecto, nuevas características principales, tablas de capacidades y guías de uso actualizadas.
2. **Documentos Especializados en [`docs/`](file:///home/juanmarcos/nasser_18/docs/)**:
   - [`docs/architecture.md`](file:///home/juanmarcos/nasser_18/docs/architecture.md): Diagramas de flujo, capas de software, flujos de IPC y componentes actualizados.
   - [`docs/database.md`](file:///home/juanmarcos/nasser_18/docs/database.md): Diagrama ERD, esquema de tablas, relaciones de cascada y nuevos métodos de consulta.
   - [`docs/cli-guide.md`](file:///home/juanmarcos/nasser_18/docs/cli-guide.md): Comandos interactivos, terminal embebida y paridad con la GUI.
3. **Reglas y Convenciones de Agentes**:
   - Actualizar [`AGENTS.md`](file:///home/juanmarcos/nasser_18/AGENTS.md), [`GEMINI.md`](file:///home/juanmarcos/nasser_18/GEMINI.md), [`.cursorrules`](file:///home/juanmarcos/nasser_18/.cursorrules) y [`CLAUDE.md`](file:///home/juanmarcos/nasser_18/CLAUDE.md) si se agregaron nuevas directrices.

### 5. Control de Versiones (Commit)
- Formato de mensajes: **Conventional Commits**:
  - `feat(...)`: Nueva funcionalidad.
  - `fix(...)`: Corrección de bug.
  - `docs(...)`: Actualización de documentación.
  - `test(...)`: Adición de pruebas.
  - `refactor(...)`: Reestructuración de código sin alterar comportamiento.
- Nunca incluir archivos binarios compilados no deseados (`dist/*.exe`), temporales o cachés.
