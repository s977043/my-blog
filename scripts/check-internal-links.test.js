const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { checkTarget, extractTargets } = require('./check-internal-links');

test('Zenn URL contract and local existence', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zenn-links-'));
  try {
    fs.mkdirSync(path.join(root, 'articles'));
    fs.mkdirSync(path.join(root, 'images'));
    fs.writeFileSync(path.join(root, 'articles', 'example-article.md'), 'fixture');
    fs.writeFileSync(path.join(root, 'images', 'example.png'), 'fixture');
    for (const url of ['/articles/example-article', '/articles/example-article#section',
      'https://zenn.dev/articles/example-article', 'https://zenn.dev/articles/example-article/?q=1']) {
      assert.match(checkTarget(url, root), /著者名が欠落/);
    }
    for (const url of ['https://zenn.dev/minewo/articles/example-article',
      '/minewo/articles/example-article', 'https://zenn.dev/minewo/articles/example-article/?q=1#section']) {
      assert.equal(checkTarget(url, root), null);
    }
    assert.match(checkTarget('https://zenn.dev/minewo/articles/missing-article', root), /存在しない/);
    assert.equal(checkTarget('https://zenn.dev/another/articles/example-article', root), null);
    assert.equal(checkTarget('https://example.com/articles/example-article', root), null);
    assert.equal(checkTarget('#section', root), null);
    assert.equal(checkTarget('/images/example.png', root), null);
    assert.match(checkTarget('/images/missing.png', root), /画像リンク切れ/);
    assert.deepEqual(extractTargets('[a](https://zenn.dev/minewo/articles/example-article#x) ![b](/images/example.png)'),
      ['https://zenn.dev/minewo/articles/example-article#x', '/images/example.png']);
    assert.deepEqual(extractTargets('[a](/articles/example-article)'), ['/articles/example-article']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
