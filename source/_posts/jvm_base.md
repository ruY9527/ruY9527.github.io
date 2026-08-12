---
title: "JVM基础"
date: 2021-11-02 12:00:00
updated: 2025-12-31 13:04:42
permalink: article/jvm_base/
categories:
  - "JVM"
tags:
  - "JVM"
  - "Java"
description: "JVM基础"
cover: /images/posts/jvm_base/img-1.png
---

> 😀 这里写文章的前言：
> JVM基础知识的学习

# 📝 为什么用JVM

1. 可以轻松实现Java代码的跨平台执行
2. JVM 提供**内存管理**、**垃圾回收**、编译时动态校验等功能
3. 使用JVM能够让我们的编程工作更轻松、高效节省公司成本，提示社会化的整体开发效率，我们只关注和业务相关的程序逻辑的编写，其他业务无关但对于编程同样重要的事情交给JVM来处理

![JVM基础](/images/posts/jvm_base/img-1.png)

# **📔 JVM是怎样运行字节码的**

1. 从虚拟机视角来看，执行 Java 代码首先需要将它编译而成的 class 文件加载到 Java 虚拟机中。
2. 加载后的 Java 类会被存放于方法区（Method Area）中。实际运行时，虚拟机会执行方法区内的代码。
3. 而且，Java 虚拟机同样也在内存中划分出堆和栈来存储运行时数据。不同的是，Java 虚拟机会将栈细分为面向 Java 方法的 Java 方法栈，面向本地方法（用 C++ 写的 native 方法）的本地方法栈，以及存放各个线程执行位置的 PC 寄存器

![JVM基础](/images/posts/jvm_base/img-2.png)

# **📔 执行过程**

1. 在运行过程中，每当调用进入一个 Java 方法，Java 虚拟机会在当前线程的 Java 方法栈中生成一个**栈帧**，**用以存放局部变量以及字节码的操作数**。
2. 这个栈帧的大小是**提前计算**好的，而且 Java 虚拟机不要求栈帧在内存空间里连续分布。
3. 当退出当前执行的方法时，不管是正常返回还是异常返回，Java 虚拟机均会弹出当前线程的当前栈帧，并将之舍弃

![JVM基础](/images/posts/jvm_base/img-3.png)

# 插件安装

## jvisualvm

1. visualvm新访问地址：[https://visualvm.github.io/index.html](https://visualvm.github.io/index.html)

找到自己jdk对应的版本

1. 进入jvisualvm的插件管理  —→ 工具  —> 插件 ；在"设置"中修改url地址为刚才我们在github上找到的对应我们JDK版本的地址
1. 安装VisualGC插件
1. 重启即可看到VisualGC

![JVM基础](/images/posts/jvm_base/img-4.png)

# 🤗 总结归纳

# 📎 参考文章

- [http://www.oracle.com/technetwork/java/visualgc-136680.html](http://www.oracle.com/technetwork/java/visualgc-136680.html)
- [http://www.oracle.com/technetwork/java/javase/tech/vmoptions-jsp-140102.html](http://www.oracle.com/technetwork/java/javase/tech/vmoptions-jsp-140102.html)

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
