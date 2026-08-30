const baseUrl = (process.env.APP_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const route = process.env.SMOKE_ROUTE || '/';
const pageUrl = new URL(route, `${baseUrl}/`);

async function request(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response;
}

const firstResponse = await request(pageUrl);
const reloadResponse = await request(pageUrl, { headers: { 'cache-control': 'no-cache' } });
const html = await reloadResponse.text();
const assetPaths = [...html.matchAll(/(?:href|src)="(?<path>\/_next\/static\/[^"?]+\.(?:css|js)(?:\?[^\"]*)?)"/g)]
  .map((match) => match.groups?.path)
  .filter(Boolean);
const uniqueAssets = [...new Set(assetPaths)];

if (!uniqueAssets.some((asset) => asset.includes('.css'))) throw new Error('The page does not reference a CSS chunk.');
if (!uniqueAssets.some((asset) => asset.includes('.js'))) throw new Error('The page does not reference a JavaScript chunk.');

const assets = await Promise.all(uniqueAssets.map(async (asset) => {
  const response = await request(new URL(asset, pageUrl));
  return { asset, contentType: response.headers.get('content-type') || '', bytes: (await response.arrayBuffer()).byteLength };
}));

for (const item of assets) {
  if (item.bytes === 0) throw new Error(`Empty production asset: ${item.asset}`);
  if (item.asset.includes('.css') && !item.contentType.includes('text/css')) throw new Error(`Invalid CSS content type for ${item.asset}: ${item.contentType}`);
  if (item.asset.includes('.js') && !/(javascript|ecmascript)/.test(item.contentType)) throw new Error(`Invalid JavaScript content type for ${item.asset}: ${item.contentType}`);
}

console.log(`Production reload OK: ${firstResponse.status}/${reloadResponse.status}, ${assets.filter((item) => item.asset.includes('.css')).length} CSS and ${assets.filter((item) => item.asset.includes('.js')).length} JS assets.`);
