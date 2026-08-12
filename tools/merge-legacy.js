/**
 * 合并旧 Hexo 博客(origin/blog 分支)中 Notion 数据库里没有的文章
 * 判定规则: 标题归一化(去掉 源码/阅读/记录/分析/笔记/学习/开发/boot 等修饰词及标点)后比对
 * 未匹配到的旧文章原样复制到 source/_posts/,保留其 front matter 和内容
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'source', '_posts');

const STOP_CHARS = /源码|阅读|记录|分析|笔记|学习|开发|boot|[\s\-_()（）.。:：,，/\\]/gi;
const normalize = (t) => (t || '').replace(STOP_CHARS, '').toLowerCase();

// 1. 已迁移的 Notion 文章标题
const manifest = require('../.notion_manifest.json');
const notionTitles = new Set(manifest.filter(p => p.type === 'Post').map(p => normalize(p.title)));

// 2. 列出 origin/blog 下的所有旧文章
const files = execSync('git -c core.quotepath=false ls-tree -r --name-only origin/blog', { encoding: 'utf8' })
  .split('\n')
  .map(s => s.trim().replace(/^"|"$/g, ''))
  .filter(f => f.startsWith('source/_posts/') && f.endsWith('.md'));

console.log(`旧博客共 ${files.length} 篇文章`);

let merged = 0, skipped = 0;
for (const f of files) {
  const content = execSync(`git show "origin/blog:${f}"`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const title = (m && (m[1].match(/^title:\s*(.+)$/m) || [])[1]?.trim()) || path.basename(f, '.md');

  if (notionTitles.has(normalize(title))) {
    console.log(`跳过(Notion已有): ${title}`);
    skipped++;
    continue;
  }
  // 检查图片引用(旧文章的图片可能不在仓库里)
  const imgs = [...content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(x => x[1]);
  if (imgs.length) console.log(`  ⚠ ${title} 含 ${imgs.length} 张图片引用: ${[...new Set(imgs)].slice(0, 3).join(', ')}`);

  const dest = path.join(POSTS_DIR, path.basename(f));
  if (fs.existsSync(dest)) { console.log(`跳过(文件已存在): ${path.basename(f)}`); skipped++; continue; }
  fs.writeFileSync(dest, content, 'utf8');
  console.log(`合并 ✓ ${title}`);
  merged++;
}
console.log(`\n完成: 合并 ${merged} 篇, 跳过 ${skipped} 篇`);
