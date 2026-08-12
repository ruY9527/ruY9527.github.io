/**
 * 修复因 toggle 内容补抓导致的图片序号错位
 * 对含 toggle 的文章: 重新拉取 block,按渲染顺序收集图片 URL,清空重建该文图片目录
 */
const fs = require('fs');
const path = require('path');

const SITE = 'https://outstanding-scale-83e.notion.site';
const ROOT = path.resolve(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'source', 'images', 'posts');
const manifest = require('../.notion_manifest.json');
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchChunk(pageId, cursor, chunkNumber, attempt = 0) {
  try {
    const res = await fetch(`${SITE}/api/v3/loadCachedPageChunk`, { method: 'POST', headers: UA, body: JSON.stringify({ page: { id: pageId }, limit: 100, cursor, chunkNumber, verticalColumns: false }) });
    if (res.status === 429 || res.status >= 500) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    if (attempt >= 4) throw e;
    await sleep(1000 * Math.pow(2, attempt));
    return fetchChunk(pageId, cursor, chunkNumber, attempt + 1);
  }
}
async function fetchAllBlocks(pageId) {
  const blocks = {};
  const fetchInto = async (rootId) => {
    let cursor = { stack: [] }, chunk = 0;
    do {
      const data = await fetchChunk(rootId, cursor, chunk);
      for (const [id, rec] of Object.entries(data?.recordMap?.block || {})) {
        const v = rec?.value?.value || rec?.value;
        if (v && !blocks[id]) blocks[id] = v;
      }
      cursor = data?.cursor || { stack: [] }; chunk++;
      if (cursor.stack?.length) await sleep(200);
    } while (cursor.stack?.length && chunk < 30);
  };
  await fetchInto(pageId);
  for (let round = 0; round < 6; round++) {
    const parents = new Set();
    for (const b of Object.values(blocks)) if ((b.content || []).some(cid => !blocks[cid])) parents.add(b.id);
    parents.delete(pageId);
    if (!parents.size) break;
    for (const pid of parents) { try { await fetchInto(pid); await sleep(120); } catch (e) {} }
  }
  return blocks;
}

// 与渲染器相同的 DFS 顺序收集图片
function collectImages(ids, blocks, out = []) {
  for (const id of ids || []) {
    const b = blocks[id];
    if (!b) continue;
    if (b.type === 'image') {
      const src = b.format?.display_source || b.properties?.source?.[0]?.[0];
      if (src) out.push({ id, src: src.startsWith('/') ? 'https://www.notion.so' + src : src });
    }
    if (b.content) collectImages(b.content, blocks, out);
  }
  return out;
}
function imageExt(url) {
  try { const m = new URL(url).pathname.match(/\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i); if (m) return m[0].toLowerCase().replace('.jpeg', '.jpg'); } catch (e) {}
  return '.png';
}
function slugify(p) {
  if (p.slug && !/^https?:\/\//.test(p.slug)) return p.slug.replace(/[^\w\-一-龥]/g, '_');
  return 'post-' + p.id.replace(/-/g, '').slice(0, 10);
}

(async () => {
  const posts = manifest.filter(p => p.type === 'Post');
  let fixedPosts = 0, fixedImgs = 0;
  for (const p of posts) {
    const blocks = await fetchAllBlocks(p.id);
    const hasToggle = Object.values(blocks).some(b => b.type === 'toggle');
    if (!hasToggle) continue;
    const slug = slugify(p);
    const dir = path.join(IMG_DIR, slug);
    if (!fs.existsSync(dir)) continue; // 无图片目录则无需修复
    const imgs = collectImages(blocks[p.id]?.content, blocks);
    if (!imgs.length) continue;
    console.log(`重建 ${p.title} 的 ${imgs.length} 张图片...`);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    let idx = 0;
    for (const img of imgs) {
      idx++;
      const dest = path.join(dir, `img-${idx}${imageExt(img.src)}`);
      const enc = encodeURIComponent(img.src);
      const candidates = [img.src, `${SITE}/image/${enc}?table=block&id=${img.id}&cache=v2`, `https://www.notion.so/image/${enc}?table=block&id=${img.id}&cache=v2`];
      let ok = false;
      for (const u of candidates) {
        for (let a = 0; a < 2 && !ok; a++) {
          try {
            const res = await fetch(u, { headers: { 'User-Agent': UA['User-Agent'] } });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.length < 50) throw new Error('too small');
            fs.writeFileSync(dest, buf); ok = true;
          } catch (e) { await sleep(600); }
        }
        if (ok) break;
      }
      if (!ok) console.error(`  ✗ img-${idx} 下载失败: ${img.src.slice(0, 80)}`);
      else fixedImgs++;
    }
    fixedPosts++;
    await sleep(200);
  }
  console.log(`\n完成: 重建 ${fixedPosts} 篇文章的 ${fixedImgs} 张图片`);
})();
