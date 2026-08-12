---
title: "Hadoop_HA机制"
date: 2022-03-01 12:00:00
updated: 2025-12-31 12:52:25
permalink: article/hadoop_ha1/
cover: /images/posts/hadoop_ha1/img-1.png
notion_status: "Invisible"
---

> 😀 这里写文章的前言：
> HA : High Availablity,高可用
> 高可用最关键的策略是 消除单点故障

# 📝 HA

同时出现两个 active 状态,namenode的术语叫脑裂

<details><summary>防止脑裂</summary>

</details>

![Hadoop_HA机制](/images/posts/hadoop_ha1/img-1.png)

## 问题记录

怎么保证三台namenode的数据一致:

1. Fsimages : 让一台 nn 生成数据，让其它机器nn同步
1. Edits:     需要引进新的模块JournalNode来保证edits的文件和数据一致性

怎么让同时只有一台nn是active,其它的都是standby

- 手动分配
- 自动分配

2nn在ha架构中并不存在，定期合并fsimage和edtis的活谁来干

由standby的nn来干

如果nn真的发生了问题，怎么让其他的nn上位干活

- 手动故障转移
- 自动故障转移

# YARN HA

![Hadoop_HA机制](/images/posts/hadoop_ha1/img-2.png)

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
