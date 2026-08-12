---
title: "Unsafe类"
date: 2021-10-30 12:00:00
updated: 2025-12-31 13:04:49
permalink: article/unsafe_read1/
categories:
  - "Java"
tags:
  - "Java"
description: "unsafe阅读"
cover: /images/posts/unsafe_read1/img-1.png
---

> 😀 这里写文章的前言：
> 一个简单的开头,简述这篇文章讨论的问题、目标、人物、背景是什么？并简述你给出的答案。

> 可以说说你的故事：阻碍、努力、结果成果，意外与转折。

# 📝 主旨内容

![Unsafe类](/images/posts/unsafe_read1/img-1.png)

# **堆外内存**

- 对垃圾会搜停顿的改善,由于堆外内存是直接受操作系统管理而不是JVM,所以当我们使用堆外内存的时候,即可保持较小的堆内内存规模.从而在GC时减少回收停顿对于应用的影响
- 提升程序I/O操作的性能,通常在I/O通信过程中,会存在堆内内存到堆外内存的数据拷贝,对于需要频繁进行内存间数据拷贝且生命周期较短的暂存数据,都建议存储到堆外内存.

# 🤗 总结归纳

# 📎 参考文章

- [https://tech.meituan.com/2019/02/14/talk-about-java-magic-class-unsafe.html](https://tech.meituan.com/2019/02/14/talk-about-java-magic-class-unsafe.html)

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
