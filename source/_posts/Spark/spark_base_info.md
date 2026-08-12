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

1. MR是基于磁盘的,Spark是基于内存
1. MR的task是进程
1. spark的task是线程，在executor进程里执行的线程
1. MR在Container里执行（留有接口方便插入），spark在worker里执行（自己用，没有接口）
1. MR适合做一次计算，Spark适合做迭代计算

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

Master和Worker模式,Master职责负责资源的管理和分配,相当于ReousrceManager;Worker资源节点与任务执行节点(相当于NodeManager);Master和Worker都是随着集群的启动而启动,集群的消失而消失;Master和Worker只有standalone模式才有

</details>

<details><summary>Mesos模式</summary>

使用mesos平台进行资源与任务的调度

</details>

<details><summary>Yarn模式</summary>

Driver职责:

- 将代码转化成job执行
- 提交task到executor
- 监控task执行状况
- 负责程序运行过中ui界面展示

Executor职责:

- 负责执行task

Driver和Executor是随着任务提交而启动的,随着任务完成而消失的

</details>

<details><summary>Spark on yarn client模式</summary>

Driver和Client都在SparkSubmit进程中,此时SparkSubmit进程不能关闭,关闭之后Driver消失程序中止

工作流程

1. 通过bin/sparksubmit提交任务生成SparkSubmit进程,在进程中创建Client客户端与Driver
1. Client向ResourceManager注册任务
1. RM向Client返回路径,任务id
1. Client会将RM返回的路径与任务id拼接成新路径,上传jar包到路径中
1. Client向RM申请启动ApplicationMaster
1. RM会在其中一个NodeManager中启动AM
1. AM向RM申请计算资源
1. RM会将资源列表返回给AM
1. AM会向NM申请启动Executor
1. Executor启动之后会向Driver反向注册
1. Driver提交task到executor执行
1. 执行完之后,AM会注销自己释放资源

</details>

<details><summary>Spark on yarn cluster模式</summary>

Driver在ApplicationMaster进程中,此时SparkSubmit进程关闭不受影响的,程序不会停止

执行流程如下:

1. 通过bin/sparksubmit提交任务生成SparkSubmit进程,在进程中创建Client客户端
1. Client向ResourceManager注册任务
1. RM向Client返回路径,任务id
1. Client会将RM返回的路径与任务id拼接成新路径,上传jar包到路径中
1. Client向RM申请启动ApplicationMaster
1. RM会在其中一个NodeManager中启动AM
1. 在AM中启动Driver线程
1. AM向RM申请计算资源
1. RM会将资源列表返回给AM
1. AM会向NM申请启动Executor
1. Executor启动之后会向Driver反向注册
1. Driver提交task到executor执行
1. 执行完成之后,AM会注销自己释放资源

</details>

SparkSubmit常用参数

|   |   |   |
| --- | --- | --- |
| 参数 | 作用 | 说明 |
| master | 指定任务提交到哪个资源调度器中 | local模式: local/local\[\*\]/local\[N\]<br><br>stanadalone： spark://master主机名:7077,..<br><br>yarn模式: yarn |
| class | 指定待运行的带有main方法object全类名 |  |
| deploy-mode | 指定部署模式\[client/cluster\] |  |
| driver-memory | 指定Driver的内存大小 |  |
| executor-memory | 指定每个executor的内存大小 |  |
| executor-cores | 指定每个executor的cpu个数 |  |
| total-executor-cores | 指定所有executor的cpu总个数\[仅用于standalone模式\] |  |
| num-executors | 指定需要的executor总个数\[仅用于yarn模式\] |  |
| queue | 指定任务提交到哪个资源队列中\[仅用于yarn模式\] |  |

# 📝 Spark RDD

## 基本概念

RDD是弹性分布式数据集,RDD代表弹性,可分区,不可变,元素可并行计算的计算

<details><summary>弹性</summary>

- 存储的弹性: 如果内存充足,中间结果会全部保存在内存中,如果内存不足,数据一部分保存在内存中,一部分保存在磁盘中
- 计算的弹性: 如果计算出错会自动重试
- 容错的弹性: 如果RDD数据丢失可以根据依赖关系+封装的计算逻辑重新读取数据重新计算得到数据
- 分区的弹性: RDD的分区可以自动根据文件的切片动态生成

</details>

<details><summary>不可变</summary>

RDD中只只封装了数据的处理逻辑,如果想要重新改变数据只能生成新的RDD

</details>

<details><summary>可分区</summary>

spark是分布式计算框架,Spark根据文件的切片生成分区,一个切片对应一个分区,后续每个分区计算逻辑是一样,处理的数据不一样,每个分区间是并行的

</details>

<details><summary>可并行计算</summary>

每个分区计算逻辑是一样,处理的数据不一样,每个分区间是并行的

</details>

<details><summary>不存储数据</summary>

RDD中只封装了数据的处理逻辑,不存储数据

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
| 算子名字 | 作用 | 备注 |
| map | map（func：RDD元素类型你=>B（任意类型） | map里面的函数是针对RDD每个元素操作，元素有多少个，函数就执行多少次<br>map生成新的RDD元素个数和原RDD的元素个数相同 |
| flatMap | flatMap（func:RDD元素类型=>B(集合)）：转换 + 压平 | flatMap里面的函数是针对每个元素操作的<br>flatMap生成新RDD元素的个数一般是大于等于原RDD元素个数（除非是空集合，可能会是小于）<br>flatMap的应用场景：一对多 |
| filter | filter（func：RDD元素类型 = Boolean）：根据指定条件过滤 | filter里面的函数是针对每个元素操作的<br>filter保留的是函数返回值为true的元素<br>filter的应用场景：过滤数据 |
| mapPartitons() | mapPartitons(func:Iterator\[Rdd元素类型\]=>Iterator\[B\])：一对一转换，原RDD的一个分区计算得到一个新RDD分区 | 函数是针对每个分区操作的，多少分区操作多少次<br>一般用于MySQL/Hbase/redis查询数据，可以减少链接创建与销毁的次数 |
| mapPartitons() | 与map的区别<br>1、函数针对的对象不一样，一个是单个元素，一个是整个分区<br>2、函数的返回值类型不一样<br>3、元素内存回收的实际不一样 | map的函数返回的是新RDD的元素，新Rdd的元素个数=原RDD的个数<br>mapPartitions里面的函数是针对没分翻去，返回的是新RDD分区所有数据，新RDD元素个数不一定 = 原RDD元素个数，但是分区数相等<br>map每个元素操作完成之后就可以进行垃圾回收<br>mapPartitions必须等到分区迭代器遍历完成之后才会垃圾回收，如果RDD分区数据量过大，则可能出现内存溢出的现象（OOM），此时应用map代替之 |
| groupBy | groupBy(func: RDD元素类型=>K ): 按照指定字段进行分组 | groupBy里面函数是针对每个元素操作,元素有多少个,函数就执行多少次<br>groupBy是根据函数的返回值对元素进行分组<br>groupBy返回RDD是KV键值对,K是函数的返回值,V是原RDD中K对应的所有元素的集合<br>groupBy会产生shuffle操作 |
| distinct | 去重 | distinct会产生shuffle操作 |
| coalesce | coalesce(分区数): 合并分区 | coalesce默认只能减少分区数,此时没有shuffle操作<br>coalesce如果想要增大分区数,需要设置shuffle=true，此时会产生shuffle操作<br>coalesce一般用于减少分区数,一般是搭配filter使用 |
| repartition | 重分区 | repartition既可以增大分区数也可以减少分区数,但是都有shuffle操作<br>repartition的使用场景: 增大分区数的时候 |
| coalesce与repartition的区别 |  | coalesce默认只能减少分区数,此时没有shuffle操作,coalesce如果想要增大分区数,需要设置shuffle=true，此时会产生shuffle操作<br>repartition既可以增大分区数也可以减少分区数,但是都有shuffle操作 |
| sortBy | sortBy(func: RDD元素类型=>K，ascending=true/false): 根据指定字段排序 | sortBy里面的函数是针对每个元素,元素有多少个,函数执行多少次<br>sortBy是根据函数的返回值对RDD元素进行排序(true是升序,false是降序)<br>sortBy会产生shuffle |
| intersecetion交集 | intersecetion会产生shuffle操作 |  |
| subtract() | 交集 |  |
| union | 并集 |  |
| zip | 拉链 | 两个RDD要想拉链要求数量条数与分区数都必须一致。 |
| partitionBy | partitionBy(partitioner): 根据指定的分区器重分区 |  |
| groupByKey | groupByKey： 根据key分组 | groupByKey生成的新RDD的元素类型是KV键值对<br>K是分组的key<br>V是key在原RDD中对应的所有的value值 |
| reduceByKey | reduceByKey(func: (value值类型,value值类型)=>Value值类型): 按照key分组,对value值聚合 | reduceByKey里面的函数的第一个参数代表该组上一次的聚合结果,第一个聚合的时候初始值 = 该组第一个value值<br>reduceByKey里面的函数的第二个参数代表该组当前待聚合的value值 |
| reduceByKey与groupByKey的区别 | reduceByKey与groupByKey的区别 | reduceByKey有预聚合操作,性能更高,工作中推荐使用这种高性能shuffle算子<br>groupByKey没有预聚合操作 |
| mapPartitionsWithIndex | mapPartitionsWithIndex | mapPartitionsWithIndex((index,it) |
| 自定义分区器 | 自定义class继承Partitioner | override def numPartitions: Int = num      // 获取新RDD分区<br>override def getPartition(key: Any): Int   // 获取key获取分区号 |

# 📝 Spark优化

根据木桶效应,最短的木板决定了木桶的容量,因此,对于一只有短板的木桶,其它木板调节得再高也无济于事,最短的木板才是木桶容量的瓶颈

<details><summary>性能优化本质</summary>

1. 性能调优不是一锤子买卖，补齐一个短板，其他板子可能会成为新的短板。因此，它是一个动态、持续不断的过程
1. 性能调优的手段和方法是否高效，取决于它针对的是木桶的长板还是瓶颈。针对瓶颈，事半功倍；针对长板，事倍功半
1. 性能调优的方法和技巧，没有一定之规，也不是一成不变，随着木桶短板的此消彼长需要相应的动态切换
1. 性能调优的过程收敛于一种所有木板齐平、没有瓶颈的状态

</details>

Spark UI提供了丰富的面板,来展示DAG,Stages划分,执行计划,Executor负载均衡情况,GC时间,内存缓存消耗等等详尽的运行时状态数据;对于硬件消耗资源,可利用监控应用进行查看

**性能调优目的: 所有参数计算的硬件资源之间寻求协调与平衡,让硬件资源达到一种平衡,无瓶颈的状态**

# 📝 Spark参数

|   |   |   |
| --- | --- | --- |
| 配置项 | 含义 | 使用说明 |
| spark.cores.max | 集群范围内满配CPU核数 |  |
| spark.executor.cores | 单个Executor内CPU参数 |  |
| spark.task.cpus | 单个任务消耗的CPU核数 |  |
| spark.default.parallelism | 未指定分区数时的默认并行度 |  |
| spark.sql.shuffle.partitions | 数据关联,聚合操作中Reducer的并行度 |  |
|  |  |  |
| spark.executor.memory | 单个Executor内堆内内存总大小 |  |
| spark.memory.offHeap.size | 单个Executor内堆外内存总大小(spark.memory.offHeap.enabled为true才生效) |  |
| spark.menory.fraction | 堆内内存中,用于缓存RDD和执行计算的内存比例 |  |
| spark.menory.storageFraction | 用于缓存RDD的内存占比,执行内存占比为1-spark.memory.stroageFraction |  |
| spark.rdd.compress | RDD缓存是否压缩,默认不压缩 |  |
|  |  |  |
| spark.local.dir | 用于缓存RDD和Shuffle中间文件的磁盘目录 |  |
|  |  |  |
| spark.shuffle.file.buffer | Map输出端的写入缓冲区大小 | Map端 |
| spark.reducer.maxSizeInFlight | Reduce输入端的读取缓冲区大小 | Reduce端 |
|  |  |  |
| spark.shuffle.sort.bypassMergeThreshold | Map阶段不进行排序的分区阈值 |  |
|  |  |  |
| spark.sql.adaptive.enabled | 是否启用AQE(Adaptive query execution);默认是禁用的 |  |
|  |  |  |
| spark.sql.adaptive.coalescePartition.enabled | 是否启用AQE中的自动分区合并,默认启用 |  |
| spark.sql.adaptive.advisoryParitionSizeInBytes | 由开发者指定分区合并后的推荐尺寸 |  |
| spark.sql.adaptive.coalescePartitions.minPartitionNum | 分区合并后,数据集的分区数不低于该值 |  |
|  |  |  |
| spark.sql.adaptive.shewJoin.enabled | 是否开启AQE中自动处理数据倾斜的功能,默认开启 |  |
| spark.sql.adaptive.shewJoin.shewdPartitionFactor | 判断数据分区是否倾斜的比例系数 |  |
| spark.sql.adaptive.shewJoin.shewdPartitionThresholdInBytes | 判断数据分区是否倾斜的最低阈值 |  |
| spark.sql.adaptive.advisoryPartitionSizeInBytes | 以字节为单位,拆分倾斜分区的数据粒度 |  |
|  |  |  |
| spark.sql.autoBroadcastJoinThreadld | 数据表采用broadcast join实现方式的最低阈值 |  |
| spark.sql.adaptive.nonEmptyPartitionRatioForBoradcasejoin | 非空分区比例小于该值,才会调整Join策略 |  |

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
