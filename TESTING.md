# TESTING

This project includes three test layers:

## 1) Unit Tests
Path: `tests/unit/`

Purpose:
- Validate small, isolated logic without external systems.

Current cases:
- `summarizer.test.js`
  - strips HTML/script/style correctly
  - splits text into sentence units

Run:
```bash
npm run test:unit
```

## 2) Integration Tests
Path: `tests/integration/`

Purpose:
- Validate module collaboration (DB schema + CRUD flow) using a temporary SQLite file.

Current cases:
- `db.integration.test.js`
  - create bookmark
  - dedupe on same URL
  - update status/note
  - list filtered data
  - validate stats
  - delete bookmark and cascade related summary/run cleanup

Run:
```bash
npm run test:integration
```

## 3) E2E Tests
Path: `tests/e2e/`

Purpose:
- Validate real API flow via running server process.

Current cases:
- `api.e2e.test.js`
  - health check
  - create bookmark through HTTP
  - list bookmarks through HTTP
  - trigger summarize endpoint and verify fallback path
  - delete bookmark through HTTP

Run:
```bash
npm run test:e2e
```

## Full Test Suite
```bash
npm test
```

## Test Design Notes
- Tests use Node built-in `node:test` runner (no extra framework dependency).
- Integration/E2E tests use temporary DB files via `DB_PATH` env to avoid polluting local data.
- E2E test runs server on a separate port and interacts only through HTTP APIs.
