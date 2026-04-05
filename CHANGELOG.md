# CHANGELOG

## [Unreleased]
### Added
- Added Docker support (`Dockerfile`, `docker-compose.yml`) for always-on local server execution

### Changed
- `server/src/index.js` now supports `HOST` and `PORT` environment variables
- `server/src/db.js` now uses a stable DB path relative to source (`server/bookmark.db`)
- Updated `README.md` and `RUNBOOK.md` with Docker-based startup/ops flow
