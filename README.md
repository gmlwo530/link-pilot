# link-pilot

A personal bookmark copilot built with a Chrome Extension, a local server, and SQLite.

## Quick Start
1. Start the server
```bash
cd /Users/choiheejae/.openclaw/workspace
node link-pilot/server/src/index.js
```
2. Open `chrome://extensions` and enable Developer Mode
3. Click **Load unpacked** and select `link-pilot/extension`
4. Test save flow with shortcut: `⌘ + ⌥ + ⇧ + B`

## Documents
### Core
- `README.md` — index + quick start
- `AGENTS.md` — agent operating principles
- `PRODUCT.md` — product goals, scope, priorities
- `ENGINEERING.md` — architecture, APIs, development loop
- `RUNBOOK.md` — setup, validation, demo, troubleshooting
- `.env.example` — environment variable baseline
- `CHANGELOG.md` — change history

## Repository Structure
- `server/` — local API and DB access
- `extension/` — Chrome Extension UI and save trigger
