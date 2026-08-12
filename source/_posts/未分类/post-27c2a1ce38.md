---
title: "大数据组件知识_记录"
date: 2021-12-23 12:00:00
updated: 2025-12-31 12:52:11
permalink: article/post-27c2a1ce38/
---

> 😀 这里写文章的前言：
> 大数据组件需学知识记录

# 📝 Zookeeper

- 选举机制
- 使用场景
- Paxos算法
- CAP原则

# 📝 Kafka

- 基础架构
- 副本数
- 压测
- 台数
- 分区数
- 保存策略
- 消费者策略
- 监控
- topic数
- 数据量
- 积压/borker/数据重复/kafka宕机/可重复/高效读写

# 📝 Hive

- 客户端，JDBC，编译器，优化器，执行器
- 内部表，外部表
- order by ： 全局排序    sort by ： 分区内排序   distribute by ： 分区      clsuter by 相当于 distribute by & sort by 相同字段
- 系统函数
- 自定义函数
- Hive优化
- 数据倾斜

# 📝 Spark

- 部署模式
- RDD
- 计算分区/计算逻辑/血缘依赖/分区器/移动数据
- 共享变量: 累加器/广播变量/cache&Checkpoint
- 算子
- 手动重分区
- 行动算子
- 几种划分： 划分job/划分stage/划分task set/划分task
- 宽窄依赖
- SparkSQL: hive on spark / spark on hive
- Spark Streaming

# 📝 Flink

- 部署模式： standalone / yarn / k8s / mesos
- 基本算子:  map/flatmap/filter/connect/union/shffled/rebalance/rescale
- keyBy算子
- 连接算子:  connect/union
- interval join
- WaterMark
- 窗口
- 端到端的一致性
- Flink CEP
- Flink SQL
- Flink优化,反压,数据倾斜

# 数据调度

- Azkaban
- 海豚调度器

# 数据治理

- 元数据管理: altas
- 数据治理:  1.数据治理监控  2.重复数据监控 3.空值监控

指标: 完整行，及时性，重复性，一致性，合规性，准确性

<details><summary>描述事情</summary>

</details>

# 权限管理

- sentry
- ranger

# 离线数仓

ods: 分区表,避免全表扫描;压缩;保持数据原貌,起到备份作用

dwd+dim: 数据清洗,分区表,压缩,列式存储parquet,维度退化

dws: 对一段时间指标的积累,避免重复计算,开始时间,结束时间,这段时间

ads: 指标(活跃,复购,GMV,转换,留存,拉新)

<details><summary>事实表</summary>

</details>

<details><summary>同步策略</summary>

</details>

# 实时数仓

ods: MaxWell,到kafka的topic来

dwd+dim: 测输出流,分topic;

业务数据:

- 事实表: 存kafka,动态分流(1.MySql创建一张配置表,定制了那些表要去哪里;2.FlinkCDC读取配置表,广播出去⇒动态分流)
- 维度表: 存Hbase,Kafka不支持随机查询,hbase支持随机查询,长远考虑,没有做维度退化

dwm层: 预先处理的宽表,过滤层,避免拉宽表的时候,重复计算事实表与事实表的关联

- 事实表与事实表: 双流 join ⇒ interval join
- 事实表与维度表: 通过Phoenix查询HBase, 优化一: 旁路缓存, 优化二:异步IO

dws层: 拉宽表,join查维度;宽表存clickhouse

ads层: 

监控:

- kafka: eagle
- Flink: prometheus + grafana
- clickhouse: prometheus + grafana

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
