const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');

function waitForServerReady(proc, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server_start_timeout')), timeoutMs);

    proc.stdout.on('data', (chunk) => {
      const text = String(chunk);
      if (text.includes('server listening on')) {
        clearTimeout(timer);
        resolve();
      }
    });

    proc.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`server_exited_${code}`));
    });
  });
}

test('e2e: health -> create bookmark -> list -> summarize fallback', async (t) => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'tmp-db-e2e-'));
  const dbFile = path.join(tempDir, 'bookmark.db');
  const port = 4317;

  const server = spawn('node', ['server/src/index.js'], {
    cwd: path.resolve(__dirname, '../..'),
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(port),
      DB_PATH: dbFile,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  await waitForServerReady(server);

  t.after(() => {
    server.kill('SIGTERM');
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const base = `http://127.0.0.1:${port}`;

  const health = await fetch(`${base}/health`).then(r => r.json());
  assert.equal(health.ok, true);

  const created = await fetch(`${base}/bookmarks`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: 'http://127.0.0.1:9/unreachable', title: 'Fail Summary URL' }),
  }).then(r => r.json());

  assert.ok(created.id);

  const list = await fetch(`${base}/bookmarks`).then(r => r.json());
  assert.equal(Array.isArray(list.items), true);
  assert.equal(list.items.length, 1);

  const summarize = await fetch(`${base}/bookmarks/${created.id}/summarize`, {
    method: 'POST',
  }).then(r => r.json());

  assert.equal(summarize.generated, false);
  assert.ok(summarize.short_summary);
});
