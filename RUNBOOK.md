# RUNBOOK - link-pilot

## Start the Server
### Local Node
```bash
cd /Users/choiheejae/.openclaw/workspace
node link-pilot/server/src/index.js
```
Expected log:
- `[link-pilot] server listening on http://127.0.0.1:4312`

### Docker Compose (recommended for always-on)
```bash
cd /Users/choiheejae/.openclaw/workspace/link-pilot
docker compose up -d --build
```

Health check:
```bash
curl http://127.0.0.1:4312/health
```

Useful commands:
```bash
docker compose logs -f
docker compose restart
docker compose down
```

## Load Chrome Extension
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `.../link-pilot/extension`

## Shortcut
- Default: `⌘ + ⌥ + ⇧ + B`
- Change at: `chrome://extensions/shortcuts`

## Smoke Test
1. Save from any page with shortcut
2. Open popup and confirm list item appears
3. Change item status (`unread`/`read`) and verify

## 1-Minute Demo
1. Save 2 pages
2. Confirm unread list
3. Run **Summarize/Retry** on first item
4. Add tags to second item
5. Filter by `#ai`
6. Confirm export download

## Troubleshooting
- Save does not work: check `/health`
- Shortcut not firing: resolve shortcut conflicts
- Summary failed: check network and retry (fallback summary is expected)
