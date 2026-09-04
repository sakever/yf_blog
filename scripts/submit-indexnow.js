/**
 * 构建后向 IndexNow 提交 sitemap 中的所有 URL，加速 Bing 等搜索引擎的收录。
 *
 * 用法：npm run build && npm run indexnow
 * 依赖 dist/sitemap.xml（由 vuepress-plugin-sitemap 生成）和
 * public/ 目录下的 key 文件 {INDEXNOW_KEY}.txt。
 */
const fs = require('fs');
const path = require('path');

// IndexNow key 是公开信息（规范要求以纯文本形式托管在站点上）
const KEY = '25c733d689bb49939b5df1150921fd64';
const HOST = 'sakever.github.io';
const BASE = 'https://sakever.github.io/yf_blog';
const KEY_LOCATION = `${BASE}/${KEY}.txt`;
const SITEMAP = path.resolve(__dirname, '../docs/.vuepress/dist/sitemap.xml');

function extractUrls() {
  const xml = fs.readFileSync(SITEMAP, 'utf-8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  return [...new Set(urls)];
}

async function submit(urlList) {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList })
  });

  // 200 = 全部接受；202 = 部分接受/待验证；400/403/422 = 请求或 key 文件有问题
  if (res.status !== 200 && res.status !== 202) {
    throw new Error(`IndexNow 返回 HTTP ${res.status}`);
  }
  return res.status;
}

(async () => {
  if (!fs.existsSync(SITEMAP)) {
    console.error('未找到 sitemap.xml，请先执行 npm run build');
    process.exit(1);
  }

  const urls = extractUrls();
  console.log(`从 sitemap 提取到 ${urls.length} 个 URL`);

  // IndexNow 单次最多接受 10000 个 URL，分批提交
  for (let i = 0; i < urls.length; i += 10000) {
    const batch = urls.slice(i, i + 10000);
    const status = await submit(batch);
    console.log(`批次 ${Math.floor(i / 10000) + 1} 提交成功（HTTP ${status}，${batch.length} 个 URL）`);
  }
})().catch((err) => {
  console.error('IndexNow 提交失败:', err.message);
  process.exit(1);
});
