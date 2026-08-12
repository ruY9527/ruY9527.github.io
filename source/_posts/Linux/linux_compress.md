---
title: "linux上压缩文件"
date: 2020-08-08 12:00:00
updated: 2023-05-30 22:54:00
permalink: article/linux_compress/
categories:
  - "Linux"
tags:
  - "Linux"
description: "Linux上压缩文件"
---

> 😀 这里写文章的前言：
> Linux上压缩以及解压文件

# 📝 压缩 .tar 文件

filename: 替换成你需要的名字

/path/to/directory-or-file:  替换成你要压缩的文件夹路径

```bash
tar -cvf filename.tar /path/to/directory-or-file
```

# 📝 压缩 .tar.gz 文件

filename: 替换成你需要的名字

/path/to/directory-or-file:  替换成你要压缩的文件夹路径

```bash
tar -czvf filename.tar.gz /path/to/directory-or-file
```

# 📝 压缩 .zip 文件

filename: 替换成你需要的名字

/path/to/directory-or-file:  替换成你要压缩的文件夹路径

```bash
zip -r filename.zip /path/to/directory-or-file
```

# 📝 重启nginx

注意此处的 /usr/local/nginx-web/sbin 以及  ./nginx-web  ; 请根据你实际的 nginx 路径 以及 指令来进行重启

如何查看 nginx 的进程和路径：

查看进程:  ps -ef | grep nginx

查看路径： whereis nginx

查看历史记录nginx:  history | grep nginx

```bash
cd /usr/local/nginx-web/sbin
./nginx-web -p ../
```

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
