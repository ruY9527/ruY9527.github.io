---
title: "hadoop以及Iceberg在win10运行环境配置"
date: 2022-07-02 12:00:00
updated: 2025-12-31 13:03:02
permalink: article/hadoop_iceberg_in_win/
categories:
  - "数据湖"
tags:
  - "数据湖"
  - "hadoop"
  - "hive"
cover: /images/posts/hadoop_iceberg_in_win/img-1.png
---

> 😀 这里写文章的前言：
> 一个简单的开头,简述这篇文章讨论的问题、目标、人物、背景是什么？并简述你给出的答案。

> 可以说说你的故事：阻碍、努力、结果成果，意外与转折。

# 📝 下载包准备

## hadoop下载

下载地址：[https://archive.apache.org/dist/hadoop/common/](https://archive.apache.org/dist/hadoop/common/)

选择我们对应的hadoop版本;比如我这里是是3.1.1就选择3.1.1

![hadoop以及Iceberg在win10运行环境配置](/images/posts/hadoop_iceberg_in_win/img-1.png)

## win10 需要的脚本下载

[https://github.com/cdarlint/winutils/tree/master](https://github.com/cdarlint/winutils/tree/master)

选择我们对应的hadoop的版本

![hadoop以及Iceberg在win10运行环境配置](/images/posts/hadoop_iceberg_in_win/img-2.png)

## 对应版本的脚本拷贝

### 操作一

将 hadoop.ddl 和 winutils.exe 拷贝到 下载的hadoop的版本的bin中

![hadoop以及Iceberg在win10运行环境配置](/images/posts/hadoop_iceberg_in_win/img-3.png)

### 操作二

将 hadoop.ddl 文件同时拷贝一份到 C:\\Windows\\System32 目录

![hadoop以及Iceberg在win10运行环境配置](/images/posts/hadoop_iceberg_in_win/img-4.png)

### 操作三

配置hadoop中的etc\\hadoop的 hadoop-env.cmd 文件的java地址;切换为自己的java路径;

如果是C盘的话，Program Files需要替换为 PROGRA~1 ; 如下

```javascript
set JAVA_HOME=C:\\PROGRA~1\\Java\\jdk1.8.0_161

```

![hadoop以及Iceberg在win10运行环境配置](/images/posts/hadoop_iceberg_in_win/img-5.png)

### 操作四: 配置环境变量

HADOO_HOME配置

![hadoop以及Iceberg在win10运行环境配置](/images/posts/hadoop_iceberg_in_win/img-6.png)

PATH中配置%HADOOP_HOME%\\bin

![hadoop以及Iceberg在win10运行环境配置](/images/posts/hadoop_iceberg_in_win/img-7.png)

### 操作五：测试是否成功

cmd中输入hadoop version;如果可以看到版本，就说明配置是成功的

![hadoop以及Iceberg在win10运行环境配置](/images/posts/hadoop_iceberg_in_win/img-8.png)

## 操作hdfs以及Iceberg

### 注意点:

1. 通过iceberg和hive去读取hdfs的时候，会读取集群的名字;所以这里需要配置根据集群的名字能映射到NameNode(状态为Active的最保险)
1. 比如这里的usdp215对应的active namenode是 172.21.129.218 节点的话;则在host里进行配置即可
1. 到底就可以通过iceberg或者hdfs等api在win10上读取hadoop的数据等

![hadoop以及Iceberg在win10运行环境配置](/images/posts/hadoop_iceberg_in_win/img-9.png)

![hadoop以及Iceberg在win10运行环境配置](/images/posts/hadoop_iceberg_in_win/img-10.png)

![hadoop以及Iceberg在win10运行环境配置](/images/posts/hadoop_iceberg_in_win/img-11.png)

# 🤗 总结归纳

# 📎 参考文章

- [https://blog.csdn.net/qq_42970173/article/details/123714605](https://blog.csdn.net/qq_42970173/article/details/123714605)
- [https://blog.csdn.net/yy8623977/article/details/124047743](https://blog.csdn.net/yy8623977/article/details/124047743)

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
