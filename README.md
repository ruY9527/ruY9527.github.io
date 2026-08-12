# YangBao 博客

个人技术博客,基于 **Hexo 7 + Butterfly 4** ,部署在 GitHub Pages。

- 在线地址: https://ruy9527.github.io
- 内容来源: 由 Notion(NotionNext) 全量迁移(78 篇)+ 早期 Hexo 博客存档(9 篇),共 87 篇文章

## 分支结构

| 分支 | 用途 |
|------|------|
| `main` | **源码分支**:Hexo 配置、Markdown 文章、主题配置、workflow。日常写作在此分支 |
| `dev` | 开发/预览分支:推送后自动构建验证并生成预览产物,不发布 |
| `gh-pages` | **部署产物分支**:由 GitHub Actions 自动构建推送,**不要手动修改** |
| `master` / `blog` | 历史存档(2021 年旧 Hexo 博客),仅保留作纪念 |

## 工作流

```
写文章(dev 或 main)→ git push → GitHub Actions 自动构建 → 部署到 gh-pages → 线上更新
```

- `push 到 main` → 触发 `deploy.yml`:构建并发布到 `gh-pages` 分支
- `push 到 dev` / `向 main 提 PR` → 触发 `build-check.yml`:只构建验证,上传预览产物(Artifacts),不发布

## 本地开发

```bash
npm install        # 安装依赖
npm run server     # 本地预览 http://localhost:4000
npm run build      # 构建到 public/
npm run clean      # 清理缓存
```

## 写新文章

在 `source/_posts/` 下新建 `.md` 文件,front matter 示例:

```markdown
---
title: "文章标题"
date: 2026-08-12 12:00:00
categories:
  - Java
tags:
  - JVM
description: "摘要"
permalink: article/my_slug/
---

正文...
```

图片放到 `source/images/posts/<slug>/`,文中引用 `/images/posts/<slug>/xxx.png`。

## 目录说明

```
├── _config.yml              # Hexo 主配置
├── _config.butterfly.yml    # Butterfly 主题配置
├── source/
│   ├── _posts/              # 全部文章(87 篇)
│   ├── images/posts/        # 文章图片(已从 Notion 全部本地化)
│   ├── categories/ tags/    # 分类/标签页
│   └── links/ about/        # 友链/关于我
├── tools/                   # Notion 迁移脚本(一次性,保留备查)
└── .github/workflows/       # 部署/构建检查 workflow
```

## 开启评论(可选)

主题已预置 giscus 配置,到 https://giscus.app 按指引拿到 `repo_id` / `category_id`,
填入 `_config.butterfly.yml` 的 `giscus:` 段,并把 `comments.use` 设为 `Giscus` 即可。
