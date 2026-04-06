const API = 'http://127.0.0.1:4312';
const listEl = document.getElementById('list');
const searchEl = document.getElementById('search');
const sortEl = document.getElementById('sortOrder');
const tagFilterEl = document.getElementById('tagFilter');
const statsEl = document.getElementById('stats');
const toastEl = document.getElementById('toast');
const activeFiltersEl = document.getElementById('activeFilters');
let unreadOnly = true;
let searchDebounce;
let currentItems = [];
const pendingSummaryIds = new Set();

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

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function render(items) {
  listEl.innerHTML = '';

  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <div class="item-head">
        <div>
          <div class="title">아직 저장된 북마크가 없네</div>
          <div class="meta">현재 탭 저장을 눌러 첫 링크를 조용히 쌓아보자.</div>
        </div>
      </div>
    `;
    listEl.appendChild(li);
    return;
  }

  for (const item of items) {
    const li = document.createElement('li');
    li.className = 'item';
    const tags = (() => {
      try { return JSON.parse(item.tags_json || '[]').join(', '); } catch { return ''; }
    })();
    const safeTitle = escapeHtml(item.title || '(제목 없음)');
    const safeUrl = escapeHtml(item.url || '');
    const safeNote = escapeHtml(item.note || '');
    const safeTags = escapeHtml(tags);
    const stateClass = item.status === 'unread' ? 'state unread' : 'state';
    const stateLabel = item.status === 'unread' ? '미읽음' : '읽음';

    li.innerHTML = `
      <div class="item-head">
        <div>
          <div class="title">${safeTitle}</div>
          <div class="meta"><a href="${safeUrl}" target="_blank">${safeUrl}</a></div>
        </div>
        <div class="${stateClass}">${stateLabel}</div>
      </div>
      <div class="row">
        <button class="primary" data-id="${item.id}" data-next="${item.status === 'unread' ? 'read' : 'unread'}">${item.status === 'unread' ? '읽음 처리' : '미읽음으로 변경'}</button>
        <button class="ghost" data-summary="${item.id}">요약/재시도</button>
        <button class="ghost" data-delete="${item.id}">삭제</button>
      </div>
      <div class="row">
        <input id="note-${item.id}" placeholder="메모" value="${safeNote}" />
      </div>
      <div class="row">
        <input id="tags-${item.id}" placeholder="태그 (쉼표로 구분)" value="${safeTags}" />
        <button data-save-meta="${item.id}">저장</button>
      </div>
      <div class="row" id="chips-${item.id}"></div>
      <div class="summary-box">
        <div class="meta" id="summary-${item.id}"></div>
        <ul class="points" id="points-${item.id}"></ul>
        <div class="meta" id="run-${item.id}"></div>
        <div class="summary-state" id="summary-state-${item.id}"></div>
      </div>
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

async function deleteItem(id) {
  const confirmed = confirm('이 북마크를 삭제할까? 요약과 실행 기록도 같이 지워져.');
  if (!confirmed) return;

  const res = await fetch(`${API}/bookmarks/${id}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    showToast('삭제 실패');
    return;
  }

  showToast('북마크 삭제 완료');
  await load();
}

async function loadStats() {
  const res = await fetch(`${API}/stats`);
  const s = await res.json();
  statsEl.textContent = `전체 ${s.total} · 미읽음 ${s.unread} · 읽음 ${s.read}`;
}

function setSummaryState(id, text, kind = 'default') {
  const el = document.getElementById(`summary-state-${id}`);
  if (!el) return;
  el.className = `summary-state${kind ? ` ${kind}` : ''}`;
  el.textContent = text || '';
}

async function hydrateSummaryState(id) {
  if (pendingSummaryIds.has(id)) {
    setSummaryState(id, '요약 생성 중…', 'loading');
    return;
  }

  try {
    const res = await fetch(`${API}/bookmarks/${id}/summary-run`);
    if (!res.ok) {
      setSummaryState(id, '아직 요약 이력이 없습니다. 필요 시 요약을 생성해 주세요.');
      return;
    }
    const run = await res.json();
    if (run.ok) {
      setSummaryState(id, `마지막 요약 성공 (${run.created_at})`, 'ok');
    } else {
      setSummaryState(id, `마지막 요약 실패: ${run.error || '원인 미상'} (${run.created_at})`, 'error');
    }
  } catch {
    setSummaryState(id, '요약 상태를 불러오지 못했습니다.', 'error');
  }
}

function renderActiveFilters() {
  if (!activeFiltersEl) return;

  const chips = [];
  if (unreadOnly) chips.push({ label: '미읽음만 보기', clear: 'unread' });
  if (searchEl.value.trim()) chips.push({ label: `검색: ${searchEl.value.trim()}`, clear: 'q' });
  if (tagFilterEl.value.trim()) chips.push({ label: `태그: ${tagFilterEl.value.trim()}`, clear: 'tag' });
  chips.push({ label: sortEl.value === 'asc' ? '오래된순' : '최신순', clear: null });

  const hasClearable = unreadOnly || Boolean(searchEl.value.trim()) || Boolean(tagFilterEl.value.trim());

  activeFiltersEl.innerHTML = chips.map((chip) => {
    if (!chip.clear) return `<span class="chip">${escapeHtml(chip.label)}</span>`;
    return `<button class="chip-clear" data-clear="${chip.clear}">${escapeHtml(chip.label)} <span>✕</span></button>`;
  }).join('') + (hasClearable ? '<button class="chip-clear" data-clear="all">전체 초기화 ✕</button>' : '');
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
  currentItems = data.items || [];
  render(currentItems);
  renderActiveFilters();
  await Promise.all(currentItems.map((item) => hydrateSummaryState(item.id)));
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
  showToast(`가져오기 완료: 신규 ${data.inserted ?? 0}, 중복 갱신 ${data.deduped ?? 0}`);
}

document.getElementById('saveCurrent').addEventListener('click', saveCurrentTab);
document.getElementById('refresh').addEventListener('click', load);
document.getElementById('showUnread').addEventListener('click', async () => {
  unreadOnly = !unreadOnly;
  await chrome.storage.local.set({ unreadOnly });
  document.getElementById('showUnread').textContent = unreadOnly ? '미읽음만 보기' : '전체 보기';
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
  showToast('전체 미읽음 처리 완료');
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

searchEl.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(load, 220);
});

tagFilterEl.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(load, 220);
});

activeFiltersEl?.addEventListener('click', async (e) => {
  const target = e.target.closest('[data-clear]');
  if (!target) return;

  const mode = target.dataset.clear;
  if (mode === 'unread') unreadOnly = false;
  if (mode === 'q' || mode === 'all') searchEl.value = '';
  if (mode === 'tag' || mode === 'all') tagFilterEl.value = '';
  if (mode === 'all') unreadOnly = false;

  await chrome.storage.local.set({ unreadOnly });
  document.getElementById('showUnread').textContent = unreadOnly ? '미읽음만 보기' : '전체 보기';
  await load();
});

async function summarize(id) {
  const el = document.getElementById(`summary-${id}`);
  if (el) el.textContent = '요약 생성 중...';
  pendingSummaryIds.add(Number(id));
  setSummaryState(id, '요약 생성 중…', 'loading');

  let runData = {};
  try {
    const run = await fetch(`${API}/bookmarks/${id}/summarize`, { method: 'POST' });
    runData = await run.json().catch(() => ({}));
  } catch (e) {
    pendingSummaryIds.delete(Number(id));
    setSummaryState(id, `요약 요청 실패: ${e.message || 'unknown'}`, 'error');
    return;
  }

  const res = await fetch(`${API}/bookmarks/${id}/summary`);
  if (!res.ok) {
    pendingSummaryIds.delete(Number(id));
    if (el) el.textContent = '요약 조회 실패';
    setSummaryState(id, '요약 조회 실패', 'error');
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

  pendingSummaryIds.delete(Number(id));
  if (runData.generated === false) {
    setSummaryState(id, `요약 실패(대체 요약): ${runData.error || '원인 미상'}`, 'error');
  } else {
    setSummaryState(id, '요약 생성 완료', 'ok');
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

  const deleteBtn = e.target.closest('button[data-delete]');
  if (deleteBtn) {
    deleteItem(deleteBtn.dataset.delete);
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

document.addEventListener('keydown', async (e) => {
  const tag = e.target?.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;

  if (e.key.toLowerCase() === 'r') {
    const unreadItem = currentItems.find((item) => item.status === 'unread');
    if (!unreadItem) return;
    await patchStatus(unreadItem.id, 'read');
    showToast('단축키 r: 첫 미읽음 항목을 읽음 처리했습니다.');
  }

  if (e.key.toLowerCase() === 'f') {
    searchEl.focus();
  }
});

async function initPrefs() {
  const pref = await chrome.storage.local.get(['unreadOnly', 'sortOrder']);
  unreadOnly = pref.unreadOnly ?? true;
  sortEl.value = pref.sortOrder || 'desc';
  document.getElementById('showUnread').textContent = unreadOnly ? '미읽음만 보기' : '전체 보기';
}

initPrefs().then(load);
