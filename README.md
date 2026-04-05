# link-pilot

A personal bookmark copilot built with a Chrome Extension, a local server, and SQLite.

## Quick Start
### Option A) Local Node run
1. Start the server
```bash
cd /Users/choiheejae/.openclaw/workspace
node link-pilot/server/src/index.js
```

### Option B) Docker (recommended for always-on)
1. Start in background
```bash
cd /Users/choiheejae/.openclaw/workspace/link-pilot
docker compose up -d --build
```
2. Check health
```bash
curl http://127.0.0.1:4312/health
```
3. Stop
```bash
docker compose down
```

Then:
1. Open `chrome://extensions` and enable Developer Mode
2. Click **Load unpacked** and select `link-pilot/extension`
3. Test save flow with the popup's **현재 탭 저장** button (shortcut can be set manually later in `chrome://extensions/shortcuts`)

## Documents
### Core
- `README.md` — index + quick start
- `AGENTS.md` — agent operating principles
- `PRODUCT.md` — product goals, scope, priorities
- `ENGINEERING.md` — architecture, APIs, development loop
- `RUNBOOK.md` — setup, validation, demo, troubleshooting
- `.env.example` — environment variable baseline
- `CHANGELOG.md` — change history
- `TESTING.md` — test strategy and test cases (unit/integration/e2e)

## Repository Structure
- `server/` — local API and DB access
- `extension/` — Chrome Extension UI and save trigger
