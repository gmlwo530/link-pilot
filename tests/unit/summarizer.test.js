const test = require('node:test');
const assert = require('node:assert/strict');

const { stripHtml, splitSentences } = require('../../server/src/summarizer');

test('stripHtml removes script/style/tags and normalizes spaces', () => {
  const html = '<style>.x{}</style><script>alert(1)</script><div>Hello <b>World</b></div>';
  const out = stripHtml(html);
  assert.equal(out, 'Hello World');
});

test('splitSentences splits mixed punctuation text into sentences', () => {
  const text = 'First sentence. Second one! 세번째 문장다요 다음.';
  const sentences = splitSentences(text);

  assert.ok(sentences.length >= 3);
  assert.equal(sentences[0], 'First sentence.');
  assert.equal(sentences[1], 'Second one!');
});
