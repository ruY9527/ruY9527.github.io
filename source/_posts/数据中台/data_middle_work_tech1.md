---
title: "数据中台(技术篇章)"
date: 2022-12-13 12:00:00
updated: 2023-07-23 13:17:03
permalink: article/data_middle_work_tech1/
categories:
  - "数据中台"
tags:
  - "数据中台"
  - "思考"
  - "工具"
---

> 😀 这里写文章的前言：
> 数据中台技术记录

# 📝 数据底座

- CDH闭源前的最后一个版本
- CDP
- USDP
- DataSophon

# 📝 数据交换(数据集成)

从各种数据源采集结构化和非结构化数据，包括实时数据采集和批量数据采集

将来自不同系统和不同格式的数据进行整合，实现一个统一个的数据视图

## 数据交换

- API: 采集第三方的API的数据
- 日志采集： 采集应用日志
- 爬虫:  采集网页数据
- 数据源抽取:  直接通过数据源进行抽取

## 数据集成

### 数据提取(Data Extraction)

### 数据清洗（Data Cleaning)

### 数据转换（Data Transformation）

### 数据加载（Data Loading）

# 数据清洗

对采集的数据进行过滤、修正、归一化等,提高数据质量,修复脏数据。

# 📝 数据开发

## 离线开发

- Spark
- Hive
- Flink

## 实时开发

- Kafka
- Spark Streaming
- Flink

## 算法开发

暂不支持

# 📝 任务调度

- Azkaban
- Airflow
- 海滩调度器

# 📝 数据可视化

通告报表,dashboard等对数据和洞见进行直观的展示;帮助用户理解和决策

- Apache Superset:开源的数据可视化和探索工具
- Grafana:开源的数据监测和可视化工具,用于构建监控面板和报表
- Tableau:商业数据可视化工具,用于数据分析和报表制作

# 数据存储

数据湖,HDFS,数据库等进行存储

- Apache Hive:数据仓库,基于HDFS存储
- Apache HBase:NoSQL数据库,基于HDFS存储
- Apache Kudu:列式存储,基于HDFS存储
- Elasticsearch:搜索引擎,文档型数据库

# 数据治理

管理数据中台的用户、权限、流程等,确保数据中台的高效和稳定运行

# 元数据管理

- Apache Atlas:统一元数据管理平台
- datahub\[[datahub-project/datahub](https://github.com/datahub-project/datahub)\]

# 数据管理和数据权限

- Apache Atlas:数据治理平台
- Apache Ranger:实现权限管理

# 数据应用

通过API、数据服务等形式,将数据和分析能力提供给各业务系统使用

# 开源项目记录

- \[[https://github.com/DTStack](https://github.com/DTStack)\]
- [https://github.com/DTStack/chunjun](https://github.com/DTStack/chunjun)
- [https://github.com/DTStack/Taier](https://github.com/DTStack/Taier)
- [https://github.com/DataLinkDC/dinky](https://github.com/DataLinkDC/dinky)
- [https://github.com/apache/incubator-streampark](https://github.com/apache/incubator-streampark)
- [https://github.com/apache/dolphinscheduler](https://github.com/apache/dolphinscheduler)
- [https://github.com/ververica/flink-cdc-connectors](https://github.com/ververica/flink-cdc-connectors)
- [https://github.com/alldatacenter/alldata](https://github.com/alldatacenter/alldata)
- [https://github.com/WeBankFinTech/WeDataSphere](https://github.com/WeBankFinTech/WeDataSphere)

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
