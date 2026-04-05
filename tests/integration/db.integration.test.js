const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

function loadDbModule(dbFilePath) {
  process.env.DB_PATH = dbFilePath;
  const modPath = path.resolve(__dirname, '../../server/src/db.js');
  delete require.cache[modPath];
  return require(modPath);
}

test('db integration: create, dedupe, update, stats', () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'tmp-db-int-'));
  const dbFile = path.join(tempDir, 'bookmark.db');
  const db = loadDbModule(dbFile);

  db.initDb();

  const first = db.createBookmark({ url: 'https://example.com/a', title: 'A', tags: ['ai'] });
  assert.equal(first.deduped, undefined);

  const deduped = db.createBookmark({ url: 'https://example.com/a', title: 'A2', tags: ['tool'] });
  assert.equal(deduped.deduped, true);
  assert.equal(deduped.title, 'A2');

  const updated = db.updateBookmark(first.id, { status: 'read', note: 'done' });
  assert.equal(updated.status, 'read');
  assert.equal(updated.note, 'done');

  const listed = db.listBookmarks({ status: 'read', q: null, tag: null, sort: 'desc' });
  assert.equal(listed.length, 1);

  const stats = db.getStats();
  assert.equal(stats.total, 1);
  assert.equal(stats.read, 1);
  assert.equal(stats.unread, 0);

  fs.rmSync(tempDir, { recursive: true, force: true });
});
