# ENGINEERING - link-pilot

## System Components
- `extension/`: Chrome Extension (save trigger + list UI)
- `server/`: Node.js HTTP API
- `server/bookmark.db`: SQLite storage

## Server Defaults
- Host: `127.0.0.1`
- Port: `4312`
- Health endpoint: `GET /health`

## API Surface
- `POST /bookmarks` — create bookmark
- `GET /bookmarks?status=&q=&tag=&sort=` — list/filter bookmarks
- `PATCH /bookmarks/:id` — update status/tags/memo
- `POST /bookmarks/:id/summarize` — generate summary (with fallback)
- `GET /bookmarks/:id/summary` — fetch summary
- `GET /bookmarks/:id/summary-run` — fetch latest summary run metadata
- `POST /bookmarks/import` — JSON import
- `POST /bookmarks/bulk-status` — bulk status update
- `GET /stats` — basic statistics

## Data Model (Overview)
### Bookmark
- id
- url
- title
- status (`unread` | `read`)
- tags
- memo
- created_at / updated_at

### Summary
- bookmark_id
- short_summary
- key_points[]
- generated_at
- run metadata (success/error)

## Error Handling
- invalid payload: `400`
- not found: `404`
- summary generation failure: return fallback summary + persist run log

## Development Loop (Ralph-style)
- L0 (30–60m): define problem and assumptions
- L1 (60–90m): implement smallest working slice
- L2 (20m): validate with real scenario
- L3 (15m): cleanup + define next loop entry condition

### Loop DoD
- demoable output
- explicit log/error verification path
- one-line next-loop entry condition
- `CHANGELOG.md` updated

## Testing
- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- E2E tests: `tests/e2e/`
- Detailed test-case list: `TESTING.md`

Run all tests:
```bash
npm test
```
