/**
 * Hexo 过滤器: 移除全空的表头行
 * Notion 中未开启"表头行"的表格迁移后会产生空 <thead>(markdown 语法强制要求表头),
 * 这里在渲染后把全空表头整个移除,忠实还原 Notion 原始展示效果。
 */
hexo.extend.filter.register('after_render:html', function (html) {
  return html.replace(/<thead>\s*<tr>(?:\s*<th>\s*(?:&nbsp;|<br\s*\/?>)?\s*<\/th>)+\s*<\/tr>\s*<\/thead>/g, '');
});
