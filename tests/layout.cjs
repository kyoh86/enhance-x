// Run with: NODE_PATH=/path/to/node_modules node tests/layout.cjs (requires linkedom).
const { parseHTML } = require('linkedom');
const { runInNewContext } = require('node:vm');
const { readFileSync } = require('node:fs');
const assert = require('node:assert/strict');

(async () => {
const { document, Node } = parseHTML(`
  <header><nav>
    <a id="home" href="/home">ホーム</a>
    <div id="explore"><a href="/explore">話題を検索</a></div>
    <a id="grok" href="/i/grok">Grok</a>
    <a id="premium" href="/i/premium_sign_up">プレミアム</a>
    <a id="studio" href="/i/jf/creators/studio">クリエイタース...</a>
    <a id="notifications" href="/notifications">通知</a>
  </nav></header>
  <div data-testid="primaryColumn"><div role="tablist">
    <div id="recommended-wrapper"><a role="tab" aria-selected="true">おすすめ</a></div>
    <div id="following-wrapper"><a role="tab">フォロー中</a></div>
    <button id="add">+</button>
  </div>
    <div id="ad" data-testid="cellInnerDiv"><div data-testid="placementTracking"><div data-testid="top-impression-pixel"></div><article data-testid="tweet">広告の投稿</article></div></div>
    <div id="video" data-testid="cellInnerDiv"><article data-testid="tweet"><div data-testid="placementTracking">通常の動画</div></article></div>
    <div id="ad-word" data-testid="cellInnerDiv"><article data-testid="tweet"><span>広告</span>という言葉を含む通常投稿</article></div>
  </div>
  <div data-testid="sidebarColumn"><div id="sidebar-layout">
    <form id="search"><input placeholder="検索"></form>
    <div id="news-wrapper"><div></div><div><section><h2>本日のニュース</h2></section></div></div>
    <div id="news-alternate"><section><h2>今日のニュース</h2></section></div>
    <div id="recommendations-wrapper"><aside><h2>おすすめユーザー</h2><a href="/someone">user</a></aside></div>
    <div id="subscribe-wrapper"><aside><span>プレミアムにサブスクライブ</span><p>特典を利用できます</p><a href="/i/premium_sign_up">サブスクライブする</a></aside></div>
    <div id="subscribe-en"><section><h2>Subscribe to Premium</h2><button>Subscribe</button></section></div>
    <nav id="footer"><a href="/tos">利用規約</a></nav>
  </div></div>
  <article id="post"><h2>本日のニュース</h2><h3>プレミアムにサブスクライブ</h3><a id="post-explore" href="/explore">話題を検索</a></article>
`);
let clicks = 0;
document.querySelector('#following-wrapper a').click = () => clicks++;
let refresh;
let settingsChanged;
runInNewContext(readFileSync(require.resolve('../settings.js'), 'utf8') + '\n' + readFileSync(require.resolve('../content.js'), 'utf8'), {
  document, Node, URL, location: { pathname: '/home', origin: 'https://x.com' },
  window: { addEventListener() {} },
  requestAnimationFrame: (callback) => callback(),
  getComputedStyle: () => ({ overflow: 'visible' }),
  MutationObserver: class { constructor(callback) { refresh = callback; } observe() {} },
  chrome: { storage: {
    local: { get: async (defaults) => ({ ...defaults }) },
    onChanged: { addListener(callback) { settingsChanged = callback; } },
  } },
});
await Promise.resolve();
const hidden = (id) => Boolean(document.getElementById(id).closest('[data-enhance-x-hidden]'));
assert.equal(hidden('ad'), true, 'Hide the entire ad cell');
assert.equal(hidden('video'), false, 'Keep ordinary videos');
assert.equal(hidden('ad-word'), false, 'Do not classify posts by ad words');
settingsChanged({ ads: { newValue: false } }, 'local');
assert.equal(hidden('ad'), false, 'Restore ads when disabled');
settingsChanged({ ads: { newValue: true } }, 'local');
assert.equal(hidden('ad'), true, 'Hide ads when re-enabled');
document.querySelector('#ad').innerHTML = '<article data-testid="tweet">再利用された通常投稿</article>';
refresh();
assert.equal(hidden('ad'), false, 'Restore reused ad cells');
for (const id of ['recommended-wrapper', 'news-wrapper', 'news-alternate', 'recommendations-wrapper', 'subscribe-wrapper', 'subscribe-en', 'explore', 'grok', 'premium', 'studio']) {
  assert.equal(hidden(id), true, `${id} should collapse`);
}
for (const id of ['following-wrapper', 'add', 'search', 'footer', 'post', 'home', 'notifications', 'post-explore']) {
  assert.equal(hidden(id), false, `${id} should remain`);
}
refresh();
assert.equal(clicks, 1, 'Do not repeat pending tab switches');
document.querySelector('#news-wrapper h2').textContent = '別のコンテンツ';
refresh();
assert.equal(hidden('news-wrapper'), false, 'Restore wrappers reused by X');
const disabled = Object.fromEntries(['trends', 'users', 'news', 'forYou', 'explore', 'grok', 'premium', 'studio']
  .map((key) => [key, { newValue: false }]));
settingsChanged(disabled, 'local');
for (const id of ['recommended-wrapper', 'news-alternate', 'recommendations-wrapper', 'subscribe-wrapper', 'subscribe-en', 'explore', 'grok', 'premium', 'studio']) {
  assert.equal(hidden(id), false, `${id} should reappear when disabled`);
}
settingsChanged({ grok: { newValue: true } }, 'local');
assert.equal(hidden('grok'), true, 'Re-enable individual setting immediately');
assert.equal(hidden('premium'), false, 'Other settings stay disabled');
settingsChanged({ premium: { newValue: true } }, 'local');
assert.equal(hidden('subscribe-wrapper'), true, 'Premium setting also hides Japanese promo');
assert.equal(hidden('subscribe-en'), true, 'Premium setting also hides English promo');
assert.equal(hidden('post'), false, 'Premium heading in a post stays visible');
console.log('Layout regression checks passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
