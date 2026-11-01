# Gemini / Antigravity Rules - Novel Hunter

Consulta [AGENTS.md](./AGENTS.md) para la guía completa de desarrollo, arquitectura y base de datos.

## Directrices Mandatorias para Agentes Gemini / Antigravity:
1. **Regla de Oro**: "Cada vez que agregues una feature, haz tests, corre los tests, actualiza la documentación de todo y luego commit."
2. **Ejecución obligatoria antes de commit**:
   - `npm test`
   - `node test/test_db.js`
3. **Actualización obligatoria de documentación**:
   - Actualizar siempre `README.md` y la carpeta `docs/` (`architecture.md`, `database.md`, `cli-guide.md`).
   - Consultar el skill `.agents/skills/novel-hunter-workflow/SKILL.md` para el ciclo completo.
4. **No romper esquemas relacionales**:
   - Respetar SQLite 3NF (`chapters` canónicos vs `chapter_translations` por idioma y motor).
   - Nunca escribir en `app.asar` al empaquetar.
5. **UI & Estilo**:
   - Vanilla JS modular, iconos SVG en línea, cero dependencias pesadas.
   - Acciones de tarjetas alineadas a 36px de altura exacta.
   - Títulos de vista idénticos a los botones de navegación del menú lateral.
