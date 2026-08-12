/**
 * Notion(NotionNext 数据库) → Hexo Markdown 迁移脚本 v2
 * - 文章 → source/_posts/<slug>.md ; 单页(友链/关于我) → source/<page>/index.md
 * - 图片下载到 source/images/posts/<slug>/,已存在则跳过;下载失败自动回退 Notion 图片代理(带 block id 签名)
 * - 可重复运行:幂等,图片只补缺失
 */
const fs = require('fs');
const path = require('path');

const SITE = 'https://outstanding-scale-83e.notion.site';
const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'source', '_posts');
const IMG_DIR = path.join(ROOT, 'source', 'images', 'posts');
const REPORT = path.join(ROOT, '.migration_report.json');
const manifest = require('../.notion_manifest.json');

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36', 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function pLimit(n) {
  const queue = []; let active = 0;
  const next = () => { if (active >= n || !queue.length) return; active++; const { fn, resolve, reject } = queue.shift(); fn().then(resolve, reject).finally(() => { active--; next(); }); };
  return (fn) => new Promise((resolve, reject) => { queue.push({ fn, resolve, reject }); next(); });
}
const pageLimit = pLimit(3);
const imgLimit = pLimit(6);

/* ---------------- Notion API ---------------- */
async function fetchChunk(pageId, cursor, chunkNumber, attempt = 0) {
  try {
    const res = await fetch(`${SITE}/api/v3/loadCachedPageChunk`, {
      method: 'POST', headers: UA,
      body: JSON.stringify({ page: { id: pageId }, limit: 100, cursor, chunkNumber, verticalColumns: false })
    });
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
  let cursor = { stack: [] }, chunk = 0;
  do {
    const data = await fetchChunk(pageId, cursor, chunk);
    for (const [id, rec] of Object.entries(data?.recordMap?.block || {})) {
      const v = rec?.value?.value || rec?.value;
      if (v && !blocks[id]) blocks[id] = v;
    }
    cursor = data?.cursor || { stack: [] };
    chunk++;
    if (cursor.stack && cursor.stack.length) await sleep(200);
  } while (cursor.stack && cursor.stack.length && chunk < 30);
  return blocks;
}

/* ---------------- 富文本 ---------------- */
function escMd(t) {
  return t.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\*/g, '\\*').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
}
function richText(arr) {
  if (!Array.isArray(arr)) return '';
  let out = '';
  for (const seg of arr) {
    if (!seg) continue;
    let text = String(seg[0] ?? '');
    const fmts = seg[1] || [];
    let link = null, isCode = false, bold = false, italic = false, strike = false;
    for (const f of fmts) {
      if (!Array.isArray(f)) continue;
      if (f[0] === 'a') link = f[1];
      else if (f[0] === 'c') isCode = true;
      else if (f[0] === 'b') bold = true;
      else if (f[0] === 'i') italic = true;
      else if (f[0] === 's') strike = true;
      else if (f[0] === 'e') { out += `$${f[1] || ''}$`; text = null; }
      else if (f[0] === 'd') { text = f[1]?.start_date || text; }
    }
    if (text === null) continue;
    let t = isCode ? '`' + text.replace(/`/g, '\\`') + '`' : escMd(text);
    if (!isCode) {
      if (bold) t = `**${t}**`;
      if (italic) t = `*${t}*`;
      if (strike) t = `~~${t}~~`;
    }
    if (link) t = `[${isCode ? text : t}](${link})`;
    out += t;
  }
  return out;
}

/* ---------------- 图片 ---------------- */
const imgTasks = [];
const usedNames = new Set();
function imageExt(url) {
  try {
    const m = new URL(url).pathname.match(/\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i);
    if (m) return m[0].toLowerCase().replace('.jpeg', '.jpg');
  } catch (e) {}
  return '.png';
}
function queueImage(url, slug, blockId) {
  if (!url) return url;
  if (url.startsWith('/')) url = 'https://www.notion.so' + url;
  let idx = 1, name;
  do { name = `img-${idx++}${imageExt(url)}`; } while (usedNames.has(slug + '/' + name));
  usedNames.add(slug + '/' + name);
  imgTasks.push({ url, blockId, dest: path.join(IMG_DIR, slug, name), localUrl: `/images/posts/${slug}/${name}` });
  return `/images/posts/${slug}/${name}`;
}
async function tryDownload(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA['User-Agent'] } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 50) throw new Error('too small: ' + buf.length);
  fs.writeFileSync(dest, buf);
}
async function downloadImages(report) {
  let skipped = 0;
  await Promise.all(imgTasks.map(t => imgLimit(async () => {
    if (fs.existsSync(t.dest) && fs.statSync(t.dest).size > 50) { skipped++; return; }
    fs.mkdirSync(path.dirname(t.dest), { recursive: true });
    // 候选: 原始URL → Notion 代理(带 block id) → www.notion.so 代理
    const enc = encodeURIComponent(t.url);
    const candidates = [t.url];
    if (t.blockId) {
      candidates.push(`${SITE}/image/${enc}?table=block&id=${t.blockId}&cache=v2`);
      candidates.push(`https://www.notion.so/image/${enc}?table=block&id=${t.blockId}&cache=v2`);
    }
    let done = false, lastErr = '';
    for (const u of candidates) {
      for (let attempt = 0; attempt < 2 && !done; attempt++) {
        try { await tryDownload(u, t.dest); done = true; }
        catch (e) { lastErr = String(e); await sleep(800); }
      }
      if (done) break;
    }
    if (!done) report.imageFailures.push({ url: t.url, dest: t.dest, error: lastErr });
  })));
  console.log(`图片: 跳过已存在 ${skipped}, 新下载 ${imgTasks.length - skipped - report.imageFailures.length}, 失败 ${report.imageFailures.length}`);
}

/* ---------------- Block → Markdown ---------------- */
const CODE_LANG = { 'plain text': '', 'c++': 'cpp', 'c#': 'csharp', 'objective-c': 'objectivec', 'shell': 'bash', 'docker': 'dockerfile', 'html/xml': 'html', 'mermaid': 'mermaid' };
const unhandledTypes = new Set();

function renderBlocks(ids, blocks, ctx, depth = 0) {
  const lines = [];
  const indent = '  '.repeat(depth);
  for (const id of ids || []) {
    const b = blocks[id];
    if (!b) continue;
    const type = b.type;
    const title = richText(b.properties?.title);
    const kids = () => renderBlocks(b.content, blocks, ctx, ['bulleted_list', 'numbered_list', 'to_do', 'toggle'].includes(type) ? depth + 1 : depth);

    switch (type) {
      case 'text':
        lines.push('', indent + title, '');
        if (b.content) lines.push(...kids());
        break;
      case 'header': lines.push('', indent + '# ' + title, ''); break;
      case 'sub_header': lines.push('', indent + '## ' + title, ''); break;
      case 'sub_sub_header': lines.push('', indent + '### ' + title, ''); break;
      case 'header_4': lines.push('', indent + '#### ' + title, ''); break;
      case 'bulleted_list':
        lines.push(indent + '- ' + title);
        lines.push(...kids());
        break;
      case 'numbered_list':
        lines.push(indent + '1. ' + title);
        lines.push(...kids());
        break;
      case 'to_do': {
        const checked = /yes/i.test(b.properties?.checked?.[0]?.[0] || '');
        lines.push(indent + `- [${checked ? 'x' : ' '}] ` + title);
        lines.push(...kids());
        break;
      }
      case 'toggle': {
        if (depth === 0) {
          lines.push('', `<details><summary>${title}</summary>`, '');
          lines.push(...renderBlocks(b.content, blocks, ctx, 0));
          lines.push('', '</details>', '');
        } else {
          lines.push(indent + '- **' + title + '**');
          lines.push(...kids());
        }
        break;
      }
      case 'quote':
        lines.push('', indent + '> ' + title.replace(/\n/g, '\n' + indent + '> '), '');
        if (b.content) lines.push(...kids().map(l => l ? indent + '> ' + l.trimStart() : l));
        break;
      case 'callout': {
        const icon = b.format?.page_icon || '💡';
        lines.push('', indent + `> ${icon} ${title.replace(/\n/g, '\n' + indent + '> ')}`, '');
        if (b.content) lines.push(...kids().map(l => l ? indent + '> ' + l.trimStart() : l));
        break;
      }
      case 'divider': lines.push('', indent + '---', ''); break;
      case 'code': {
        let lang = (b.properties?.language?.[0]?.[0] || '').toLowerCase();
        lang = CODE_LANG[lang] ?? lang;
        const code = (b.properties?.title || []).map(s => s[0]).join('');
        lines.push('', indent + '```' + lang, ...code.split('\n').map(l => indent + l), indent + '```', '');
        break;
      }
      case 'equation': {
        const tex = (b.properties?.title || []).map(s => s[0]).join('');
        lines.push('', indent + '$$', indent + tex, indent + '$$', '');
        break;
      }
      case 'image': {
        const src = b.format?.display_source || b.properties?.source?.[0]?.[0];
        const cap = richText(b.properties?.caption) || '';
        const local = queueImage(src, ctx.slug, id);
        if (!ctx.cover) ctx.cover = local;
        lines.push('', indent + `![${cap || ctx.title}](${local})`, '');
        break;
      }
      case 'bookmark': case 'embed': {
        const link = b.properties?.link?.[0]?.[0] || b.properties?.source?.[0]?.[0];
        lines.push('', indent + `[${title || link}](${link})`, '');
        break;
      }
      case 'table': {
        const cols = (b.format?.table_block_column_order || []).map(c => c.property);
        const hasHeader = !!b.format?.table_block_column_header;
        const rows = (b.content || []).map(rid => {
          const r = blocks[rid];
          return cols.map(c => richText(r?.properties?.[c]).replace(/\|/g, '\\|').replace(/\n/g, '<br>'));
        });
        if (rows.length) {
          lines.push('');
          if (hasHeader) {
            lines.push(indent + '| ' + rows[0].join(' | ') + ' |', indent + '| ' + cols.map(() => '---').join(' | ') + ' |');
            rows.slice(1).forEach(r => lines.push(indent + '| ' + r.join(' | ') + ' |'));
          } else {
            lines.push(indent + '| ' + cols.map(() => ' ').join(' | ') + ' |', indent + '| ' + cols.map(() => '---').join(' | ') + ' |');
            rows.forEach(r => lines.push(indent + '| ' + r.join(' | ') + ' |'));
          }
          lines.push('');
        }
        break;
      }
      case 'column_list': case 'column':
        lines.push(...renderBlocks(b.content, blocks, ctx, depth));
        break;
      case 'page': lines.push('', indent + `📄 **${title}**`, ''); break;
      case 'video': case 'file': case 'pdf': case 'audio': {
        const src = b.properties?.source?.[0]?.[0] || b.format?.display_source || '';
        lines.push('', indent + `[📎 ${title || '附件'}](${src})`, '');
        break;
      }
      case 'collection_view': case 'collection_view_page': case 'transclusion_container': case 'transclusion_reference': break;
      default:
        unhandledTypes.add(type);
        if (title) lines.push('', indent + title, '');
        if (b.content) lines.push(...kids());
    }
  }
  return lines;
}

function toMarkdown(blocks, rootId, ctx) {
  const root = blocks[rootId];
  return renderBlocks(root?.content || [], blocks, ctx, 0).join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/* ---------------- front matter ---------------- */
function slugify(p) {
  if (p.slug && !/^https?:\/\//.test(p.slug)) return p.slug.replace(/[^\w\-一-龥]/g, '_');
  return 'post-' + p.id.replace(/-/g, '').slice(0, 10);
}
function fmtDate(d) { return d && (d.length > 10 ? d : d + ' 12:00:00'); }
function fmtTs(ts) {
  const d = new Date(ts); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function frontMatter(p, ctx) {
  const q = (s) => JSON.stringify(String(s ?? ''));
  const fm = ['---'];
  fm.push(`title: ${q(p.title)}`);
  fm.push(`date: ${fmtDate(p.date)}`);
  if (p.last_edited_time) fm.push(`updated: ${fmtTs(p.last_edited_time)}`);
  fm.push(`permalink: article/${ctx.slug}/`);
  if (p.category) fm.push(`categories:\n  - ${q(p.category)}`);
  if (p.tags?.length) fm.push('tags:' + p.tags.map(t => `\n  - ${q(t)}`).join(''));
  if (p.summary) fm.push(`description: ${q(p.summary)}`);
  if (ctx.cover) fm.push(`cover: ${ctx.cover}`);
  if (p.status !== 'Published') fm.push(`notion_status: ${q(p.status)}`);
  fm.push('---', '');
  return fm.join('\n');
}

/* ---------------- 主流程 ---------------- */
(async () => {
  const report = { ok: [], failed: [], imageFailures: [], unhandledTypes: [] };
  fs.mkdirSync(POSTS_DIR, { recursive: true });

  const posts = manifest.filter(p => p.type === 'Post');
  const pages = manifest.filter(p => p.type === 'Page' && p.slug && !/^https?:/.test(p.slug));
  console.log(`开始迁移 ${posts.length} 篇文章, ${pages.length} 个单页...`);

  const convertOne = async (p, i, total) => {
    const slug = slugify(p);
    const blocks = await fetchAllBlocks(p.id);
    const ctx = { slug, title: p.title, cover: null };
    const md = toMarkdown(blocks, p.id, ctx);
    return { p, slug, out: frontMatter(p, ctx) + '\n' + md, nblocks: Object.keys(blocks).length };
  };

  await Promise.all(posts.map((p, i) => pageLimit(async () => {
    try {
      const { slug, out, nblocks } = await convertOne(p, i, posts.length);
      fs.writeFileSync(path.join(POSTS_DIR, slug + '.md'), out, 'utf8');
      report.ok.push({ slug, title: p.title, blocks: nblocks });
      console.log(`[${i + 1}/${posts.length}] ✓ ${p.title} (${nblocks} blocks)`);
    } catch (e) {
      report.failed.push({ title: p.title, error: String(e) });
      console.error(`[${i + 1}/${posts.length}] ✗ ${p.title}: ${e.message}`);
    }
    await sleep(150);
  })));

  // 单页: 友链 → source/links/index.md, 关于我 → source/about/index.md
  for (const pg of pages) {
    try {
      const dir = pg.slug === 'links' ? 'links' : (pg.slug === 'message' || pg.slug === 'about') ? 'about' : pg.slug;
      const { out } = await convertOne(pg, 0, 0);
      const target = path.join(ROOT, 'source', dir);
      fs.mkdirSync(target, { recursive: true });
      fs.writeFileSync(path.join(target, 'index.md'), out, 'utf8');
      console.log(`单页 ✓ ${pg.title} → source/${dir}/index.md`);
    } catch (e) { console.error(`单页 ✗ ${pg.title}: ${e.message}`); }
  }

  console.log(`\n转换完成: 成功 ${report.ok.length}, 失败 ${report.failed.length}`);
  await downloadImages(report);
  report.unhandledTypes = [...unhandledTypes];
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.log('报告已写入 .migration_report.json');
})();
