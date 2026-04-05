const http = require('http');
const { initDb, createBookmark, listBookmarks, updateBookmark, summarizeBookmark, getSummary, logSummaryRun, getLastSummaryRun, getStats } = require('./db');
const { summarizeFromUrl } = require('./summarizer');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 4312);

initDb();

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, { ok: true });
  }

  if (req.method === 'GET' && req.url.match(/^\/bookmarks\/\d+\/summary$/)) {
    const id = Number(req.url.split('/')[2]);
    const result = getSummary(id);
    if (!result) return send(res, 404, { error: 'not_found' });
    return send(res, 200, result);
  }

  if (req.method === 'GET' && req.url.match(/^\/bookmarks\/\d+\/summary-run$/)) {
    const id = Number(req.url.split('/')[2]);
    const run = getLastSummaryRun(id);
    if (!run) return send(res, 404, { error: 'not_found' });
    return send(res, 200, run);
  }

  if (req.method === 'GET' && req.url === '/stats') {
    return send(res, 200, getStats());
  }

  if (req.method === 'GET' && req.url.startsWith('/bookmarks')) {
    const query = new URL(req.url, `http://${HOST}:${PORT}`);
    const status = query.searchParams.get('status');
    const q = query.searchParams.get('q');
    const tag = query.searchParams.get('tag');
    const sort = query.searchParams.get('sort') || 'desc';
    const data = listBookmarks({ status: status || null, q: q || null, tag: tag || null, sort });
    return send(res, 200, { items: data });
  }

  if (req.method === 'PATCH' && req.url.startsWith('/bookmarks/')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const id = Number(req.url.split('/')[2]);
        const payload = JSON.parse(body || '{}');
        const updated = updateBookmark(id, payload);
        if (!updated) return send(res, 404, { error: 'not_found' });
        send(res, 200, updated);
      } catch (e) {
        send(res, 400, { error: 'invalid_payload', detail: e.message });
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/bookmarks/import') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const items = Array.isArray(payload.items) ? payload.items : [];
        const results = items.map(item => createBookmark(item));
        const deduped = results.filter(x => x.deduped).length;
        const inserted = results.length - deduped;
        send(res, 201, { imported: results.length, inserted, deduped, items: results });
      } catch (e) {
        send(res, 400, { error: 'invalid_payload', detail: e.message });
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/bookmarks/bulk-status') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const status = payload.status;
        const items = listBookmarks({ status: null, q: null, tag: null, sort: 'desc' });
        const updated = [];
        for (const item of items) {
          updated.push(updateBookmark(item.id, { status }));
        }
        send(res, 200, { updated: updated.length });
      } catch (e) {
        send(res, 400, { error: 'invalid_payload', detail: e.message });
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/bookmarks') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const saved = createBookmark(payload);
        send(res, 201, saved);
      } catch (e) {
        send(res, 400, { error: 'invalid_payload', detail: e.message });
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url.match(/^\/bookmarks\/\d+\/summarize$/)) {
    const id = Number(req.url.split('/')[2]);
    const bookmark = listBookmarks({ status: null, q: null }).find(x => x.id === id);
    if (!bookmark) return send(res, 404, { error: 'not_found' });

    try {
      const generated = await summarizeFromUrl(bookmark.url, bookmark.title);
      const result = summarizeBookmark(id, generated);
      const run = logSummaryRun(id, true, null);
      return send(res, 200, { ...result, generated: true, run });
    } catch (e) {
      const fallback = summarizeBookmark(id, {
        shortSummary: `${bookmark.title || '문서'}: 본문 요약 실패(${e.message}), 기본 요약으로 대체`,
        keyPoints: ['네트워크/추출 실패', '나중에 재시도 가능', `원문: ${bookmark.url}`]
      });
      const run = logSummaryRun(id, false, e.message);
      return send(res, 200, { ...fallback, generated: false, error: e.message, run });
    }
  }

  send(res, 404, { error: 'not_found' });
});

server.listen(PORT, HOST, () => {
  console.log(`[link-pilot] server listening on http://${HOST}:${PORT}`);
});
