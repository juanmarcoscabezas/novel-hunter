# Claude Code Rules - Novel Hunter

Refer to [AGENTS.md](./AGENTS.md) for full project rules and architecture.

## Non-Negotiable Directives:
- **Mandatory Workflow**: "Cada vez que agregues una feature, haz tests, corre los tests y luego commit."
- **Testing**: Run and ensure 100% pass on both `npm test` and `node test/test_db.js` before any commit.
- **Database**: SQLite 3NF relational structure (`node:sqlite`). Preserve foreign keys, do not duplicate canonical chapters for translations, isolate tests from user's `data/novels.db`.
- **UI & UX**: Vanilla JS without bloated frameworks, SVG icons, unified 36px action buttons, page headers strictly aligned with sidebar menu titles.
- **Packaging**: Zero writes inside `app.asar`.
