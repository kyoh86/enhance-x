// Render deterministic vector icons and demo captures with Edge DevTools (Node 22+).
// Usage: node scripts/store-assets.mjs [http://127.0.0.1:9222]
import fs from 'node:fs/promises';
const endpoint = process.argv[2] || 'http://127.0.0.1:9222';
const root = new URL('../', import.meta.url);
const read = name => fs.readFile(new URL(name, root), 'utf8');
const write = (name, data) => fs.writeFile(new URL(name, root), data);
const target = await (await fetch(`${endpoint}/json/new?about:blank`, {method:'PUT'})).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, {once:true}));
let seq = 0;
const pending = new Map();
socket.addEventListener('message', event => {
  const response = JSON.parse(event.data);
  const task = pending.get(response.id);
  if (!task) return;
  pending.delete(response.id);
  response.error ? task.reject(response.error) : task.resolve(response.result);
});
function call(method, params={}) {
  return new Promise((resolve,reject) => {
    const id=++seq; pending.set(id,{resolve,reject}); socket.send(JSON.stringify({id,method,params}));
  });
}
async function evaluate(expression) {
  const result = await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function page(html,width,height) {
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  const {frameTree}=await call('Page.getFrameTree');
  await call('Page.setDocumentContent',{frameId:frameTree.frame.id,html});
  await evaluate('document.fonts.ready.then(() => true)');
}
async function capture(name,width,height) {
  const {data}=await call('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height,scale:1}});
  await write(name,Buffer.from(data,'base64'));
}
try {
  await call('Page.enable');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect x="16" y="16" width="96" height="96" rx="24" fill="#123d3b"/><path d="M38 43h52M38 62h34M38 81h22" stroke="#fff" stroke-width="9" stroke-linecap="round"/><path d="m78 79 9 9 17-21" fill="none" stroke="#79e2bb" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  await write('icons/icon.svg',svg+'\n');
  await page('<html><body></body></html>',128,128);
  for(const size of [16,32,48,128]) {
    const data=await evaluate(`(async()=>{const image=new Image();image.src=${JSON.stringify('data:image/svg+xml,'+encodeURIComponent(svg))};await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=${size};canvas.getContext('2d').drawImage(image,0,0,${size},${size});return canvas.toDataURL('image/png').split(',')[1]})()`);
    await write(`icons/icon${size}.png`,Buffer.from(data,'base64'));
  }
  const base=`<style>*{box-sizing:border-box}body{margin:0;background:#edf3ef;color:#152b29;font-family:system-ui,'Noto Sans',sans-serif} .hero{padding:38px 56px 28px}.eyebrow{font-size:15px;letter-spacing:3px;color:#326d5d;font-weight:700}h1{font-size:38px;letter-spacing:-1px;margin:10px 0} .sub{font-size:18px;color:#536b65;margin:0}.demo{margin:0 56px;background:white;border:1px solid #dce4e0;border-radius:16px;overflow:hidden;height:510px;display:flex}.left{width:225px;flex-shrink:0;border-right:1px solid #eee;padding:22px}.left a{display:block;color:#152b29;text-decoration:none;font-size:18px;padding:12px}.main{width:560px;border-right:1px solid #eee}.tabs{display:flex;border-bottom:1px solid #eee;height:54px}.tabwrap{flex:1;text-align:center;padding:15px}.tabs a{font-weight:700;color:#152b29;text-decoration:none}.compose{padding:24px;color:#7b8c87;border-bottom:1px solid #eee}article{padding:24px;border-bottom:1px solid #eee;line-height:1.8}article b{display:block}.handle{font-size:13px;color:#80918a}.post-image{margin-top:16px;background:#e3f0e9;border-radius:12px;padding:22px;color:#366b55}.right{padding:22px;flex:1}.search{border:1px solid #ddd;border-radius:28px;padding:12px;color:#8a9590}.card{border:1px solid #ddd;border-radius:12px;margin-top:16px;padding:12px}.legal{margin-top:20px;font-size:12px;color:#8a9590}.foot{margin:20px 56px;font-size:13px;color:#687e74}</style>`;
  const nav = [['ホーム','/home'],['話題を検索','/explore'],['通知','/notifications'],['フォローする','/i/connect_people'],['Grok','/i/grok'],['プレミアム','/i/premium_sign_up'],['クリエイタースタジオ','/i/jf/creators/studio'],['プロフィール','/demo']].map(([label,href])=>`<a href="${href}">${label}</a>`).join('');
  const html=`<!doctype html><html lang="ja"><meta charset="utf-8">${base}<div class="hero"><div class="eyebrow">ENHANCE X</div><h1>見たいタイムラインに、集中。</h1><p class="sub">おすすめ・ニュース・不要なメニューを非表示に。</p></div><div class="demo"><header class="left"><nav>${nav}</nav></header><main class="main" data-testid="primaryColumn"><div class="tabs" role="tablist"><div class="tabwrap"><a role="tab" aria-selected="false">おすすめ</a></div><div class="tabwrap"><a role="tab" aria-selected="true">フォロー中</a></div></div><div class="compose">いまどうしてる？</div><article><b>サンプルユーザー <span class="handle">@sample_user · 10分</span></b>散歩の途中で、気になっていたカフェへ。<br>今日はゆっくり読書する日にしました。<div class="post-image">COFFEE & A GOOD BOOK<br>日常の小さな楽しみ。</div></article><article><b>デザインノート <span class="handle">@design_sample · 30分</span></b>余白があると、大事なものが見えてくる。</article></main><div class="right" data-testid="sidebarColumn"><div class="search" role="search">検索</div><div class="card"><section><h2>本日のニュース</h2>サンプルニュース</section></div><div class="card"><aside><h2>おすすめユーザー</h2>サンプル</aside></div><div class="legal"><a>利用規約</a> · プライバシー · Cookie</div></div></div><p class="foot">機能紹介用のデモ画面です。投稿・アカウントは架空で、Xの実画面とは異なります。</p></html>`;
  await write('store/assets/timeline-demo.html',html);
  await page(html,1280,800);
  const defaults=await read('settings.js');
  const content=(await read('content.js')).replace('location.pathname','"/home"').replace('location.origin','"https://x.com"');
  await evaluate(`globalThis.chrome={storage:{local:{get:async defaults=>({...defaults})},onChanged:{addListener(){}}}};`);
  await evaluate('(()=>{'+defaults+'\n'+content+'})()');
  await evaluate(`document.head.insertAdjacentHTML('beforeend',${JSON.stringify('<style>'+await read('content.css')+'</style>')}); new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
  await capture('store/assets/screenshot-1-timeline.png',1280,800);
  console.log('Timeline browser text:',await evaluate('document.querySelector("header").innerText'));
  const popup = (await read('popup.html')).replace(/<script[^>]*><\/script>/g,'').replace(/<link[^>]*>/g,'').replace(/<!doctype html>|<\/?html[^>]*>|<head>[\s\S]*?<\/head>|<\/?body>/gi,'');
  const popupCSS=(await read('popup.css')).replace(/(^|})([^{}]+)\{/g, (_, end, selectors) => end + selectors.split(',').map(selector => [':root', 'body'].includes(selector.trim()) ? '.popup' : '.popup ' + selector.trim()).join(',') + '{');
  await page(`<!doctype html><html lang="ja"><meta charset="utf-8">${base}<style>${popupCSS}.settings-scene{display:flex;margin:0 90px;gap:90px;align-items:center}.popup{width:350px;padding:22px;background:white;border:1px solid #dce4e0;border-radius:16px;box-shadow:0 15px 40px #123d3b12}.copy{max-width:530px}.copy h2{font-size:30px}.copy p{font-size:20px;line-height:1.8}.copy small{font-size:14px;color:#687e74}</style><div class="hero"><div class="eyebrow">ENHANCE X / SETTINGS</div><h1>隠す項目は、自分で選べる。</h1><p class="sub">拡張アイコンから、9項目を個別に切り替え。</p></div><div class="settings-scene"><div class="popup">${popup}</div><div class="copy"><h2>チェックするだけ。</h2><p>設定は自動保存。<br>開いているXにも、そのまま反映。</p><p>外部通信なし。<br>設定はこのブラウザー内に保存。</p><small>左は実際の設定画面の表示です。<br>掲載用ページ上で設定APIを再現しています。</small></div></div></html>`,1280,800);
  await evaluate('globalThis.chrome={storage:{local:{get:async defaults=>({...defaults}),set:async()=>{}}}}');
  await evaluate('(()=>{'+defaults+'\n'+await read('popup.js')+'})()');
  await capture('store/assets/screenshot-2-settings.png',1280,800);
  await page(`<!doctype html><html><meta charset="utf-8"><style>body{margin:0;background:#123d3b;color:white;font-family:system-ui,sans-serif;padding:30px}h1{font-size:34px;margin:4px 0 14px}p{font-size:20px;line-height:1.6;margin:0;color:#c5ecdc}.mark{width:72px;height:72px;margin-left:-10px}</style><div class="mark">${svg}</div><h1>Enhance X</h1><p>見たいタイムラインに、集中。<br>非表示項目を、自分で選べる。</p></html>`,440,280);
  await capture('store/assets/promo-440x280.png',440,280);
  console.log('Assets rendered with Edge; no installed-extension test was performed.');
} finally {
  socket.close();
  await fetch(`${endpoint}/json/close/${target.id}`);
}
