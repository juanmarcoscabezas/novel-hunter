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
   - 4 temas visuales en cascada CSS (`neon-hunter`, `deep-violet`, `midnight-velvet`, `slate-indigo`) seleccionables en Configuración y persistidos en `localStorage`.
   - **Armonización de botones**: Prohibido usar colores fijos (`#334155`, `#3b82f6`, etc.) o gradientes no temáticos en botones nuevos. Todo botón o control interactivo debe usar variables CSS (`var(--primary-gradient)`, `var(--accent-glow)`, `var(--bg-card)`, `var(--border-color)`, `var(--border-focus)`, `var(--badge-primary-bg)`) y responder dinámicamente al tema activo.
   - **Scroll Único en Modales (Cero Doble Scroll)**: En modales con listas (`.download-modal-card`, `#chapters-modal`), fijar cabeceras y opciones con `flex-shrink: 0;`, asignar `overflow: hidden; max-height: none; flex: 1; min-height: 0;` a `.modal-body` y canalizar el scrollbar único a la lista interna (`flex: 1; min-height: 0; overflow-y: auto;`).
