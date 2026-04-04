const API = 'http://127.0.0.1:4312';
const listEl = document.getElementById('list');
const searchEl = document.getElementById('search');
const sortEl = document.getElementById('sortOrder');
const tagFilterEl = document.getElementById('tagFilter');
const statsEl = document.getElementById('stats');
const toastEl = document.getElementById('toast');
let unreadOnly = true;

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab;
}

async function saveCurrentTab() {
  const tab = await getCurrentTab();
  if (!tab?.url) return;
  await fetch(`${API}/bookmarks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: tab.url, title: tab.title || '' })
  });
  await load();
}

function render(items) {
  listEl.innerHTML = '';
  for (const item of items) {
    const li = document.createElement('li');
    const tags = (() => {
      try { return JSON.parse(item.tags_json || '[]').join(', '); } catch { return ''; }
    })();

    li.innerHTML = `
      <div class="title">${item.title || '(제목 없음)'}</div>
      <div class="meta">${item.status} · <a href="${item.url}" target="_blank">${item.url}</a></div>
      <div class="row">
        <button data-id="${item.id}" data-next="${item.status === 'unread' ? 'read' : 'unread'}">${item.status === 'unread' ? '읽음 처리' : '다시 unread'}</button>
        <button data-summary="${item.id}">요약/재시도</button>
      </div>
      <div class="row">
        <input id="note-${item.id}" placeholder="메모" value="${(item.note || '').replaceAll('"', '&quot;')}" />
      </div>
      <div class="row">
        <input id="tags-${item.id}" placeholder="태그 (쉼표로 구분)" value="${tags.replaceAll('"', '&quot;')}" />
        <button data-save-meta="${item.id}">저장</button>
      </div>
      <div class="row" id="chips-${item.id}"></div>
      <div class="meta" id="summary-${item.id}"></div>
      <ul id="points-${item.id}" style="margin:6px 0 0 14px; padding:0;"></ul>
      <div class="meta" id="run-${item.id}"></div>
    `;
    listEl.appendChild(li);
    const chipsEl = document.getElementById(`chips-${item.id}`);
    const tagList = tags ? tags.split(',').map(x => x.trim()).filter(Boolean) : [];
    for (const t of tagList) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = `#${t}`;
      chip.dataset.tagchip = t;
      chipsEl?.appendChild(chip);
    }
  }
}

async function patchStatus(id, status) {
  await fetch(`${API}/bookmarks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  await load();
}

async function patchMeta(id) {
  const note = document.getElementById(`note-${id}`)?.value || '';
  const tagsText = document.getElementById(`tags-${id}`)?.value || '';
  const tags = tagsText
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);

  await fetch(`${API}/bookmarks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note, tags })
  });

  const runEl = document.getElementById(`run-${id}`);
  if (runEl) runEl.textContent = '메타 저장 완료';
  await load();
}

async function loadStats() {
  const res = await fetch(`${API}/stats`);
  const s = await res.json();
  statsEl.textContent = `전체 ${s.total} · unread ${s.unread} · read ${s.read}`;
}

async function load() {
  const q = searchEl.value.trim();
  const tag = tagFilterEl.value.trim();
  const params = new URLSearchParams();
  if (unreadOnly) params.set('status', 'unread');
  if (q) params.set('q', q);
  if (tag) params.set('tag', tag);
  params.set('sort', sortEl.value || 'desc');
  const res = await fetch(`${API}/bookmarks?${params.toString()}`);
  const data = await res.json();
  render(data.items || []);
  await loadStats();
}

function showToast(message) {
  toastEl.textContent = message;
  setTimeout(() => {
    if (toastEl.textContent === message) toastEl.textContent = '';
  }, 2500);
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportBookmarks() {
  const res = await fetch(`${API}/bookmarks?sort=desc`);
  const data = await res.json();
  downloadJson('link-pilot-export.json', data.items || []);
}

async function importBookmarks(file) {
  const text = await file.text();
  const items = JSON.parse(text);
  if (!Array.isArray(items)) throw new Error('invalid_import_format');
  const res = await fetch(`${API}/bookmarks/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items })
  });
  const data = await res.json();
  await load();
  showToast(`Import 완료: 신규 ${data.inserted ?? 0}, 중복갱신 ${data.deduped ?? 0}`);
}

document.getElementById('saveCurrent').addEventListener('click', saveCurrentTab);
document.getElementById('refresh').addEventListener('click', load);
document.getElementById('showUnread').addEventListener('click', async () => {
  unreadOnly = !unreadOnly;
  await chrome.storage.local.set({ unreadOnly });
  document.getElementById('showUnread').textContent = unreadOnly ? 'Unread만' : '전체 보기';
  await load();
});

document.getElementById('exportJson').addEventListener('click', exportBookmarks);
document.getElementById('importJson').addEventListener('click', () => {
  document.getElementById('importFile').click();
});
document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    await importBookmarks(file);
  } finally {
    e.target.value = '';
  }
});

document.getElementById('clearTagFilter').addEventListener('click', async () => {
  tagFilterEl.value = '';
  await load();
});

document.getElementById('markAllRead').addEventListener('click', async () => {
  await fetch(`${API}/bookmarks/bulk-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'read' })
  });
  showToast('전체 읽음 처리 완료');
  await load();
});

document.getElementById('markAllUnread').addEventListener('click', async () => {
  await fetch(`${API}/bookmarks/bulk-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'unread' })
  });
  showToast('전체 unread 처리 완료');
  await load();
});

tagFilterEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') load();
});

sortEl.addEventListener('change', async () => {
  await chrome.storage.local.set({ sortOrder: sortEl.value });
  await load();
});

searchEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') load();
});
async function summarize(id) {
  const el = document.getElementById(`summary-${id}`);
  if (el) el.textContent = '요약 생성 중...';

  const run = await fetch(`${API}/bookmarks/${id}/summarize`, { method: 'POST' });
  const runData = await run.json().catch(() => ({}));

  const res = await fetch(`${API}/bookmarks/${id}/summary`);
  if (!res.ok) {
    if (el) el.textContent = '요약 조회 실패';
    return;
  }
  const data = await res.json();
  if (el) {
    const badge = runData.generated === false ? ' (fallback)' : '';
    el.textContent = `요약${badge}: ${data.short_summary}`;
  }

  const pointsEl = document.getElementById(`points-${id}`);
  if (pointsEl) {
    pointsEl.innerHTML = '';
    const points = JSON.parse(data.key_points_json || '[]');
    for (const p of points) {
      const li = document.createElement('li');
      li.textContent = p;
      li.style.fontSize = '11px';
      li.style.marginBottom = '2px';
      pointsEl.appendChild(li);
    }
  }

  const runEl = document.getElementById(`run-${id}`);
  if (runEl && runData.run) {
    const when = runData.run.created_at || '';
    runEl.textContent = runData.generated === false
      ? `마지막 실패: ${when} (${runData.error || 'unknown'})`
      : `마지막 성공: ${when}`;
  }
}

listEl.addEventListener('click', (e) => {
  const statusBtn = e.target.closest('button[data-id]');
  if (statusBtn) {
    patchStatus(statusBtn.dataset.id, statusBtn.dataset.next);
    return;
  }

  const summaryBtn = e.target.closest('button[data-summary]');
  if (summaryBtn) {
    summarize(summaryBtn.dataset.summary);
    return;
  }

  const saveMetaBtn = e.target.closest('button[data-save-meta]');
  if (saveMetaBtn) {
    patchMeta(saveMetaBtn.dataset.saveMeta);
    return;
  }

  const chip = e.target.closest('[data-tagchip]');
  if (chip) {
    tagFilterEl.value = chip.dataset.tagchip;
    load();
  }
});

async function initPrefs() {
  const pref = await chrome.storage.local.get(['unreadOnly', 'sortOrder']);
  unreadOnly = pref.unreadOnly ?? true;
  sortEl.value = pref.sortOrder || 'desc';
  document.getElementById('showUnread').textContent = unreadOnly ? 'Unread만' : '전체 보기';
}

initPrefs().then(load);
