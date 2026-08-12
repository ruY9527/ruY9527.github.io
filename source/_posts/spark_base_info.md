---
title: "Spark基础知识"
date: 2022-04-08 12:00:00
updated: 2023-07-23 13:13:44
permalink: article/spark_base_info/
categories:
  - "Spark"
tags:
  - "大数据"
  - "Spark"
  - "使用入门"
description: "Spark基础知识"
---

> 😀 这里写文章的前言：
> Hadoop: 海量数据的存储和海量数据的分析计算
> Spark是一种基于内存的快速,通用,可扩展的大数据分析引擎

# 📝 Spark基础概念

## 基本概念

Spark是一种基于内存的快速和通用,可扩展的大数据分析计算引擎

<details><summary>与MR进行对比</summary>

</details>

hadoop MR 框架溢出写磁盘次数多,不合适迭代算,只适合一次计算;Spark框架计算块的原因是中间结果不罗盘,spark的shuffle也是要罗盘的

## 基础模块

- Spark Core : 实现了Spark的基本功能,包含了任务调度,内存管理,错误恢复,与存储系统交互等模块.Spark Core中还包含了对弹性分布式数据集(Resilient Distrubuted DataSet,简称RDD)的API定义
- Spark SQL : Spark用来操作结构化数据的程序包,通过Spark SQL,我们可以使用SQL或者Hive版本的HQL来查询数据;SparkSQL支持多种数据源,比如Hive表,Parquet及Join等
- Spakr Streaming : Spark提供的对实时的数据进行流式计算组件,提供了用来操作数据流的API,并且与Spark Core中的RDD API高度对应
- Spark MLlib : 提供常见的机器学习功能的程序库。包括分类、回归、聚类、协同过滤等，还提供了模型评估、数据 导入等额外的支持功能
- Spark GraphX : 主要用于图形并行计算和图挖掘系统的组件

## 运行模式

   Local : 本地

<details><summary>Standalone模式</summary>

</details>

<details><summary>Mesos模式</summary>

</details>

<details><summary>Yarn模式</summary>

</details>

<details><summary>Spark on yarn client模式</summary>

</details>

<details><summary>Spark on yarn cluster模式</summary>

</details>

SparkSubmit常用参数

|   |   |   |
| --- | --- | --- |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

# 📝 Spark RDD

## 基本概念

RDD是弹性分布式数据集,RDD代表弹性,可分区,不可变,元素可并行计算的计算

<details><summary>弹性</summary>

</details>

<details><summary>不可变</summary>

</details>

<details><summary>可分区</summary>

</details>

<details><summary>可并行计算</summary>

</details>

<details><summary>不存储数据</summary>

</details>

- 一组分区列表: RDD是分布式的,会根据文件切片划分分区,由多少切片就有多少分区
- 作用在每个分区上的计算函数:  RDD每个分区处理不同的切片数据,每个分区计算逻辑是一样
- 对其他RDD的依赖关系: RDD会记录父RDD,后续如果RDD分区数据丢失可以根据依赖关系重新计算得到数据
- 分区器\[可选\]: RDD的分区分布在不同的机器上,后续如果想要将key相同的数据聚在一起,此时必须使用分区器规划key的数据在shuffle之后续落在RDD哪个分区上
- 优先位置: spark在分配task的时候会考虑将计算逻辑分配在数据所在的位置,避免计算的时候通过网络拉取数据影响效率

## 分区

通过本地集合创建RDD分区数:

如果有设置numSlices参数,此时RDD分区数 = 设置numSlices参数

如果没有设置numSlices参数,此时RDD分区数 = defaultParallelism:

1. 如果在sparkConf中有设置spark.default.parallelism参数的值,此时defaultParallelism=spark.default.parallelism参数值
1. 如果没有在sparkconf中设置spark.default.parallelism参数的值
- master=local,此时defaultParallelism=1
- master=local\[N\],此时defaultParallelism=N
- master=local\[\*\],此时defaultParallelism=本地cpu个数
- master=spark://...,此时defaultParallelism = max( 所有executor总核数,2 )

通过读取文件创建RDD分区数

1. 如果有指定minPartition参数值,此时RDD分区数 ≥ 指定minPartition参数值
1. 如果没有指定minPartition参数值,此时RDD分区数 ≥ min(defaultParallelism,2)

通过其它RDD衍生出的新RDD的分区数 = 依赖第一个父RDD的分区数

## 算子

Spark的算子分为两类: Transformation转换算子(生成的是新RDD,不会触发任务计算);Action行动算子(没有返回值或者返回scala数据类型,会触发任务的计算)

|   |   |   |
| --- | --- | --- |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

# 📝 Spark优化

根据木桶效应,最短的木板决定了木桶的容量,因此,对于一只有短板的木桶,其它木板调节得再高也无济于事,最短的木板才是木桶容量的瓶颈

<details><summary>性能优化本质</summary>

</details>

Spark UI提供了丰富的面板,来展示DAG,Stages划分,执行计划,Executor负载均衡情况,GC时间,内存缓存消耗等等详尽的运行时状态数据;对于硬件消耗资源,可利用监控应用进行查看

**性能调优目的: 所有参数计算的硬件资源之间寻求协调与平衡,让硬件资源达到一种平衡,无瓶颈的状态**

# 📝 Spark参数

|   |   |   |
| --- | --- | --- |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
