---
title: "hadoop基础知识"
date: 2022-02-04 12:00:00
updated: 2023-07-23 13:14:51
permalink: article/hadoop_base/
categories:
  - "大数据"
tags:
  - "大数据"
  - "hdfs"
  - "hadoop"
  - "yarn"
description: "Hadoop基础模块"
cover: /images/posts/hadoop_base/img-1.png
---

> 😀 这里写文章的前言：
> hadoop基础知识学习概念
> 大数据的特点: volume大量;velcity高速;variety多样;value低价值密度

# 📝 hadoop框架组件

## Hdfs

Hadoop Distributed File System:分布式文件系统

- NameNode: 存储文件的元数据
- DataNode: 存储文件的块数据,以及校验和
- Secondary NameNode: 每隔一段时间备份元数据

## Yarn

Yet Another Resource Negotiator: 另一种资源协调者;hadoop的资源管理器

- Resource: 管理整个集群资源
- DataManager: 单个节点资源管理器的老大
- Application Master: 单个运行任务的老大
- Container: 容器,封装了一个任务运行所需的资源

## MapReduce

Map阶段并行处理输入数据

Reduce阶段对Map结果进行汇总

# 📝 HDFS

一种系统来管理多台机器上的文件,分布式文件管理;适合一次写入,多次读出的场景

<details><summary>优点</summary>

</details>

<details><summary>缺点</summary>

</details>

## NameNode

管理hdfs的名称空间,配置副本策略,管理数据块映射信息,处理客户端的读写请求

## DataNode

存储实际块;NameNode发出命令,DataNode执行客户端的读写指令

一个数据块在DataNode上以文件形式存储在磁盘上,包括两个文件,一个是数据本身,一个是元数据包括数据块的长度,块数据的检验以及时间戳

DataNode启动后向NameNode注册,通过后,周期性(6小时)向NameNode上报所有的快信息;心跳是每3秒一次,心跳返回结果带有NameNode给该DataNode的命令如复制块数据到另一台机器,或删除某个数据块;如果超过10分钟+30s没有收到某个DataNode的心跳,则认为该节点不可用

<details><summary>数据完整性</summary>

</details>

<details><summary>**块大小或者块太多问题**</summary>

</details>

块大小的设置,最好根据磁盘的传输速度来决定

## Yarn

Yarn是一个资源调度平台,负责为程序提供服务器运行资源;相当于一个分布式操作系统平台;而MapReduce等运行程序则相当于运行于操作系统之上的应用程序

### resourceManager

- 集群资源的分配和调度
- 管理nodeManager
- 管理/启动AppMaster
- 处理客户端请求

### nodeManager

- 处理resoureManager命令
- 处理AppMaster命令
- 管理单个节点上的资源调配

### AppMaster

- 管理单个任务的资源申请和分配
- 对任务的监控和容错

### Container

- 封装某个节点上的资源,cpu,ram,rom等

### 调度器和调度算法

- 先进先出调度器(FIFO): 单队列,根据作业提交的顺序,先来先处理;不支持多队列,紧急的job无法插队
- 容量调度器(Capacity Scheduler): 多队列,每个队列采用fifo策略,分配一定的资源;容量可进行设置;多租户,支持多用户共享集群,多任务并行防止同一用户作业占据所有资源
- 公平调度器(Fair Scheduler): 优先资源缺额比较大的;fifo,fair,drf(同时考虑不同资源将不同资源按比例分配)

### 一个作业流程

<details><summary>作业提交</summary>

</details>

<details><summary>作业初始化</summary>

</details>

<details><summary>任务分配</summary>

</details>

<details><summary>任务运行</summary>

</details>

<details><summary>进度和状态更新</summary>

</details>

<details><summary>作业完成</summary>

</details>

### yarn工作机制

1. MR程序提交到客户端所在节点
1. YarnRunner向ResourceManager申请一个Application
1. RM将该应用程序的资源路径返回YarnRunner
1. 该程序运行所需要资源提交到HDFS上
1. 程序资源提交完毕后,申请运行mrAppMaster
1. RM将用户的请求初始化成一个Task
1. 其中一个NodeManager领取到Task任务
1. 该NodeManager创建容器Container,并产生MRAppmaster
1. Container从HDFS上拷贝资源到本地
1. MRAppMaster向RM申请运行MapTask资源
1. RM将运行MapTask任务分配给另外两个NodeManager,另两个NodeManager分别领取任务并创建容器
1. MR向两个接受到任务的NodeManager发送程序启动脚本,这两个NodeManager分别启动MapTask,MapTask对数据分区排序
1. MrAppMaster等待所有MapTask运行完毕后,向RM申请容器,运行ReduceTask
1. ReduceTask向MapTask获取相应分区的数据
1. 程序运行完毕后,MR会向RM申请注销自己

## Secondary NameNode

辅助NameNode,定期合并fsimages和edits,并推送给nn;紧急情况辅助恢复NameNode

## HDFS写流程

![hadoop基础知识](/images/posts/hadoop_base/img-1.png)

# 📝 HA模式

![hadoop基础知识](/images/posts/hadoop_base/img-2.png)

HA集群中包含的进程职业各不同,为了使主节点和备用节点的状态一致,采用了Quorum Journal Manager(QJM)方案解决了主备节点共享存储问题

- Active NameNode: 负责执行整个文件系统中命名空间的所有操作;维护着数据的元数据,包括文件名,副本数,文件的blockId以及Block块所对应的节点信息;另外还接受Client端读写请求和DataNode汇报Block信息
- Standby NameNode: 它是Active NameNode的备用节点,一旦主节点宕机,备节点会切换成主节点对外提供服务.它主要是监听JournalNode Cluster上editlog变化,以保证当前命名空间尽可能的与主节点同步。
- JouranlNode Cluster: 用于主备节点共享editlog日志文件的共享存储系统;它负责存储editlog日志文件,当Active Node执行了修改命名空间操作时,它会定期将执行的操作记录在editlog中,并写入journalNode Cluster中;Standby NameNode会一直监听JournalNode Cluster上editlog的变化;如果发现editlog有改动,备用主节点会读取journalNode上的editlog并于自己当前的命名空间合并,从而实现了主备节点的数据一致
- ZKFailoverController: ZKFC以独立进程进行,每个ZKFC都监控自己负责的NameNode,它可以实现NameNode自动故障切换:即当前主节点的ZKFC则会断开与Zookeeper的连接,释放分布式锁;监控备用节点的ZKFC进程会去释放,同步把备用NameNode切换成主NameNode
- Zookeeper: 为ZKFC进行实现自动故障转移提供统一协调服务;通过Zookeeper中Watcher监听机制,通知ZKFC异常NameNode下线;保证同一时刻只有一个主节点

## Fsimage

让一个NameNode生成数据,让其它机器NameNode同步

## Edits

需要引进新的模块JournalNode来保证edits的文件数据一致性

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
