const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(process.cwd(), 'link-pilot', 'server', 'bookmark.db');
const db = new DatabaseSync(dbPath);

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      title TEXT,
      status TEXT NOT NULL DEFAULT 'unread',
      note TEXT,
      tags_json TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookmark_id INTEGER NOT NULL,
      short_summary TEXT,
      key_points_json TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS summary_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookmark_id INTEGER NOT NULL,
      ok INTEGER NOT NULL,
      error TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id)
    );
  `);
}


function createBookmark({ url, title = '', note = '', tags = [] }) {
  if (!url) throw new Error('url_required');

  const existing = db.prepare('SELECT * FROM bookmarks WHERE url = ? ORDER BY id DESC LIMIT 1').get(url);
  if (existing) {
    const mergedNote = note || existing.note || '';
    const mergedTags = (() => {
      try {
        const prev = JSON.parse(existing.tags_json || '[]');
        return [...new Set([...(Array.isArray(prev) ? prev : []), ...(Array.isArray(tags) ? tags : [])])];
      } catch {
        return Array.isArray(tags) ? tags : [];
      }
    })();

    const updated = db.prepare(`
      UPDATE bookmarks
      SET title = ?, note = ?, tags_json = ?, updated_at = datetime('now')
      WHERE id = ?
      RETURNING *;
    `).get(title || existing.title, mergedNote, JSON.stringify(mergedTags), existing.id);
    return { ...updated, deduped: true };
  }

  const stmt = db.prepare(`
    INSERT INTO bookmarks (url, title, note, tags_json, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'unread', datetime('now'), datetime('now'))
    RETURNING *;
  `);
  return stmt.get(url, title, note, JSON.stringify(tags));
}

function listBookmarks({ status, q, tag, sort = 'desc' }) {
  const order = sort === 'asc' ? 'ASC' : 'DESC';
  const clauses = [];
  const params = [];

  if (status) {
    clauses.push('status = ?');
    params.push(status);
  }
  if (q) {
    clauses.push('(url LIKE ? OR title LIKE ? OR note LIKE ?)');
    const keyword = `%${q}%`;
    params.push(keyword, keyword, keyword);
  }
  if (tag) {
    clauses.push('tags_json LIKE ?');
    params.push(`%${tag}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const stmt = db.prepare(`SELECT * FROM bookmarks ${where} ORDER BY id ${order};`);
  return stmt.all(...params);
}

function getStats() {
  const total = db.prepare('SELECT COUNT(*) AS c FROM bookmarks').get().c;
  const unread = db.prepare("SELECT COUNT(*) AS c FROM bookmarks WHERE status = 'unread'").get().c;
  const read = db.prepare("SELECT COUNT(*) AS c FROM bookmarks WHERE status = 'read'").get().c;
  return { total, unread, read };
}

function updateBookmark(id, payload) {
  if (!id) return null;
  const allowedStatus = ['unread', 'read'];
  const status = payload.status;
  const note = payload.note;
  const tags = payload.tags;

  if (status && !allowedStatus.includes(status)) {
    throw new Error('invalid_status');
  }

  const current = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id);
  if (!current) return null;

  const nextStatus = status || current.status;
  const nextNote = note !== undefined ? note : current.note;
  const nextTagsJson = tags !== undefined ? JSON.stringify(tags) : current.tags_json;

  const stmt = db.prepare(`
    UPDATE bookmarks
    SET status = ?, note = ?, tags_json = ?, updated_at = datetime('now')
    WHERE id = ?
    RETURNING *;
  `);
  return stmt.get(nextStatus, nextNote, nextTagsJson, id);
}

function summarizeBookmark(id, summaryPayload) {
  const bookmark = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id);
  if (!bookmark) return null;

  const domain = (() => {
    try { return new URL(bookmark.url).hostname; } catch { return 'unknown'; }
  })();

  const shortSummary = summaryPayload?.shortSummary || `${bookmark.title || '제목 없음'} 관련 링크입니다. (${domain})`;
  const keyPoints = summaryPayload?.keyPoints || [
    '핵심 내용을 빠르게 확인하기 위한 임시 요약',
    '필요 시 원문을 열어 세부 확인',
    `출처 도메인: ${domain}`
  ];

  db.prepare('DELETE FROM summaries WHERE bookmark_id = ?').run(id);
  const inserted = db.prepare(`
    INSERT INTO summaries (bookmark_id, short_summary, key_points_json, created_at)
    VALUES (?, ?, ?, datetime('now'))
    RETURNING *;
  `).get(id, shortSummary, JSON.stringify(keyPoints));

  return inserted;
}

function logSummaryRun(bookmarkId, ok, error = null) {
  return db.prepare(`
    INSERT INTO summary_runs (bookmark_id, ok, error, created_at)
    VALUES (?, ?, ?, datetime('now'))
    RETURNING *;
  `).get(bookmarkId, ok ? 1 : 0, error);
}

function getSummary(bookmarkId) {
  return db.prepare('SELECT * FROM summaries WHERE bookmark_id = ? ORDER BY id DESC LIMIT 1').get(bookmarkId) || null;
}

function getLastSummaryRun(bookmarkId) {
  return db.prepare('SELECT * FROM summary_runs WHERE bookmark_id = ? ORDER BY id DESC LIMIT 1').get(bookmarkId) || null;
}

module.exports = { initDb, createBookmark, listBookmarks, updateBookmark, summarizeBookmark, getSummary, logSummaryRun, getLastSummaryRun, getStats };
