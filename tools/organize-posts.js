/**
 * 将 source/_posts 下的文章按 front matter 中的第一个分类归入同名子文件夹
 * - 不影响线上 URL(Notion 文章有固定 permalink,旧文章 URL 由日期+文件名决定)
 * - 分类名大小写归一(取文章数最多的写法,如 java→Java)
 * - 无分类文章归入 未分类/
 */
const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.resolve(__dirname, '..', 'source', '_posts');
const ALIAS = { data_article: '数据开发' };

function firstCategory(fm) {
  const m = fm.match(/^categories:\s*\r?\n((?:\s+-\s+.+\r?\n?)+)/m);
  if (m) {
    const first = m[1].match(/^\s+-\s+(.+)$/m);
    if (first) return first[1].trim().replace(/^["']|["']$/g, '');
  }
  const inline = fm.match(/^categories:\s*\[(.+)\]/m);
  if (inline) return inline[1].split(',')[0].trim().replace(/^["']|["']$/g, '');
  return null;
}

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
const catCount = {};
const fileCat = {};
for (const f of files) {
  const content = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
  const fm = (content.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || '';
  let cat = firstCategory(fm) || '未分类';
  cat = ALIAS[cat] || cat;
  fileCat[f] = cat;
  const key = cat.toLowerCase();
  (catCount[key] = catCount[key] || []).push(cat);
}
// 每个小写 key 选出现最多的写法作为规范目录名
const canonical = {};
for (const [key, variants] of Object.entries(catCount)) {
  const freq = {};
  variants.forEach(v => freq[v] = (freq[v] || 0) + 1);
  canonical[key] = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

let moved = 0;
for (const [f, cat] of Object.entries(fileCat)) {
  const dir = path.join(POSTS_DIR, canonical[cat.toLowerCase()]);
  fs.mkdirSync(dir, { recursive: true });
  fs.renameSync(path.join(POSTS_DIR, f), path.join(dir, f));
  moved++;
}
console.log(`已归类 ${moved} 篇文章:`);
const stats = {};
for (const c of Object.values(fileCat)) { const k = canonical[c.toLowerCase()]; stats[k] = (stats[k] || 0) + 1; }
Object.entries(stats).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ${k}/ (${n} 篇)`));
