# Claude Code Rules - Novel Hunter

Refer to [AGENTS.md](./AGENTS.md) for full project rules and architecture.

## Non-Negotiable Directives:
- **Mandatory Workflow**: "Cada vez que agregues una feature, haz tests, corre los tests, actualiza la documentación de todo y luego commit."
- **Documentation**: Always update README.md, docs/ and workspace skills before committing.
- **Testing**: Run and ensure 100% pass on both `npm test` and `node test/test_db.js` before any commit.
- **Database**: SQLite 3NF relational structure (`node:sqlite`). Preserve foreign keys, do not duplicate canonical chapters for translations, isolate tests from user's `data/novels.db`.
- **UI & UX**: Vanilla JS without bloated frameworks, SVG icons, unified 36px action buttons, page headers strictly aligned with sidebar menu titles, 4 switchable visual themes in Settings aligned with app icon (`neon-hunter`, `deep-violet`, `midnight-velvet`, `slate-indigo`), and strict button harmonization using theme CSS variables without hardcoded hex colors.
- **Packaging**: Zero writes inside `app.asar`.
