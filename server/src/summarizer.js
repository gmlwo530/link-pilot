function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?다요])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

async function summarizeFromUrl(url, title = '') {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'BookmarkLocal/0.1 (+local)'
    }
  });
  if (!res.ok) throw new Error(`fetch_failed_${res.status}`);

  const html = await res.text();
  const text = stripHtml(html);
  const sentences = splitSentences(text).slice(0, 5);

  const shortSummary = sentences.length
    ? `${title || '문서'}: ${sentences.slice(0, 2).join(' ').slice(0, 260)}`
    : `${title || '문서'}: 본문 추출이 제한되어 요약이 축약되었습니다.`;

  const keyPoints = [
    sentences[0] || '본문 첫 문장을 찾지 못했습니다.',
    sentences[1] || '핵심 요약 2는 추출 실패로 생략되었습니다.',
    sentences[2] || '원문 확인이 필요할 수 있습니다.'
  ];

  return { shortSummary, keyPoints };
}

module.exports = { summarizeFromUrl, stripHtml, splitSentences };
