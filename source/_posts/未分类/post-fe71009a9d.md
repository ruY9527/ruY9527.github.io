---
title: "bin/yarn-session.sh -nm testFlink_流批基础入门"
date: 2021-07-02 12:00:00
updated: 2025-12-31 12:53:15
permalink: article/post-fe71009a9d/
cover: /images/posts/post-fe71009a9d/img-1.png
notion_status: "Invisible"
---

> 😀 这里写文章的前言：
> Flink基础知识入门案例

# 📝 基础知识

Flink分布式处理引擎，用于有界和无界数据流进行有状态计算

<details><summary>Flink特点</summary>

</details>

<details><summary>无界数据流：</summary>

</details>

<details><summary>有界数据流：</summary>

</details>

把流处理需要的额外数据保存成一个“状态”，然后针对这条数据进行处理，并且更新状态，这就是有所的有状态的流处理

- 状态在内存中：优点，速度快;缺点：可靠性差
- 状态在分布式中：优点：可靠性高;缺点：速度慢

# 📝 Flink部署

- 客户端(Client): 代码由客户端获取并作转换，之后交给JobManager
- JobManager是Flink集群里的管事人，对作业进行中央调度管理;而它获取到要执行的作业后，会进一步处理转换，然后分发给真正的TaskManager
- TaskManager：真正干活的人，数据的处理操作都是他们来做的

## Session Mode(会话模式)

先启动一个集群，然后保持会话，在这个会话中通过客户端提交作业。集群启动时所有的资源都已经确定了，所有提交的作业会竞争集群中的资源

会话模式比较适合单个规模小，执行时间短的大量作业

![bin/yarn-session.sh -nm testFlink_流批基础入门](/images/posts/post-fe71009a9d/img-1.png)

## 单作业任务(Per-Job Mode)

回话模式因为资源共享会导致很多问题，所以为了更好的资源隔离，考虑为每个提交的作业启动一个集群，这就是所谓的Per-Job模式

作业完成后，集群就会关闭，所有资源就会释放

这些特性使得单作业模式在生产环境更加稳定，所以是实际应用的首选模式

Flink本身无法直接这样的运行，所以单作业模式一般需要借助一些资源管理框架来启动集群，比如YARN，K8S等

![bin/yarn-session.sh -nm testFlink_流批基础入门](/images/posts/post-fe71009a9d/img-2.png)

## 应用模式

会话模式和单作业模式下，代码都是在客户端上执行;然后由客户端提交到JobManager的;这种方式客户端需要占用大量的网络宽带，去下载依赖和二进制数据发送给JobManager;加上很多情况下我们提交的作业用的是同一个客户端，就会加中客户端所有节点的损耗

所以我们不要客户端了，直接把应用提交到JobManager上运行。

我们需要为每一个提交的应用单独启动JobManager，也就是创建一个集群。

这个JobManager只为执行这一个应用而存在，执行结束之后JobManager关闭了，这就是所谓的应用模式

![bin/yarn-session.sh -nm testFlink_流批基础入门](/images/posts/post-fe71009a9d/img-3.png)

# Yarn运行模式

客户端把Flink应用提交给Yarn的ResourceManager，Yarn的ResourceManager会向Yarn申请容器;在这些容器里，Flink会部署JobManager和TaskManager的实体，从而启动集群

Flink会根据运行在JobManager的作业所需要的slot数量动态的分配TaskManager资源

# 部署方式

## 会话模式部署

Yarn的会话模式与独立集群有不同，需要首先申请一个Yarn会话(Yarn Session)来启动集群

执行脚本向Yarn申请资源，开启一个Yarn会话

<details><summary>参数解读</summary>

</details>

```java
bin/yarn-session.sh -nm test
```

将Jar上传到集群，通过指令对该任务进行提交

```java
bin/flink run -c com.atguigu.wc.SocketStreamWordCount FlinkTutorial-1.0-SNAPSHOT.jar
```

## 单作业模式

```java
bin/flink run -d -t yarn-per-job -c com.atguigu.wc.SocketStreamWordCount FlinkTutorial-1.0-SNAPSHOT.jar
```

<details><summary>如果有错误</summary>

</details>

可以使用命令查看和取消任务

查看: application_XXXX_YY是当前应用的ID

```java
bin/flink list -t yarn-per-job -Dyarn.application.id=application_XXXX_YY
```

取消: <jobId>是作业的ID

```java
bin/flink cancel -t yarn-per-job -Dyarn.application.id=application_XXXX_YY <jobId>
```

## 应用模式部署

应用模式同样非常简单，与单作业模式类似，直接执行flink run-application命令即可

执行命令提交作业：

```java
bin/flink run-application -t yarn-application -c com.atguigu.wc.SocketStreamWordCount FlinkTutorial-1.0-SNAPSHOT.jar
```

在命令中查看或取消作业

查看：

```java
bin/flink list -t yarn-application -Dyarn.application.id=application_XXXX_YY
```

取消：

```java
bin/flink cancel -t yarn-application -Dyarn.application.id=application_XXXX_YY <jobId>
```

<details><summary>上传jar包等环境到hdfs</summary>

</details>

## 历史服务器

运行Flink Job的集群一旦停止，只能去Yarn或者本地磁盘上查看日志，不再可以查看作业挂掉之前的运行的Web UI,很难清楚之前作业挂的那一刻发送了什么

1：创建存储目录

```java
hadoop fs -mkdir -p /logs/flink-job
```

2：在flink-config.yml中添加如下配置

```java
jobmanager.archive.fs.dir: hdfs://hadoop102:8020/logs/flink-job
historyserver.web.address: hadoop102
historyserver.web.port: 8082
historyserver.archive.fs.dir: hdfs://hadoop102:8020/logs/flink-job
historyserver.archive.fs.refresh-interval: 5000
```

3：启动历史服务器

```java
bin/historyserver.sh start
```

4：停止历史服务器

```java
bin/historyserver.sh stop
```

# Flink运行架构

![bin/yarn-session.sh -nm testFlink_流批基础入门](/images/posts/post-fe71009a9d/img-4.png)

## JobManager：作业管理器

JobManager是一个Flink集群中任务管理和调度的核心，是控制应用执行的主进程。也就是，每个应用都应该被唯一的JobManager所控制执行

### JobMaster

JobMaster是JobManager的核心组件，负责处理单独的作业（Job）;所以 JobMaster和具体的Job是一一对应的，多个Job可以同时运行在一个Flink集群中，每个Job都有自己的JobMaster

早期的Flink版本中，没有JobMaster的概念，而JobManager的概念范围较小，实际指的就是现在所说的JobMaster

作业提交时，JobMaster会接收到要执行的应用。JobMaster会把JobGraph转换成一个物理层面的数据流图，这个图被叫做“执行图”（ExecutionGraph）,它包含了所有可以并发执行的任务

JobMaster会向资源管理器(ResourceManager)发出请求，申请执行任务必要的资源

一旦获取到足够的资源，就会将执行图分发到真正运用它们的TaskManager上

而在运行过程中，JobMaster会负责所有需要中央协调的操作，比如说检查点（checkpoints）的协调

### ResourceManager

主要负责资源的分配和管理，在flink集群中只有一个;所谓“资源”，主要是指TaskManager的任务槽(task slots)

任务槽就是Flink集群中的资源调配单元，包含了机器用来执行计算的一组CPU和内存资源;每个task都需要分配到一个slot上执行

### Dispatcher分发器

Dispather主要负责提供一个REST接口，用来提交应用，并且负责为每一个新提交的作业启动一个新的JobManager组件

Dispatcher也会启动一个Web UI，用来方便地展示和监控作业执行的信息。Dispatcher在架构中并不是必需的，在不同的部署模式下可能会被忽略掉

## TaskManager（任务管理器）

TaskManager是Flink中的工作进程，数据流的具体计算就是它来做的;Flink集群必须有一个TaskManager，每个TaskManager都包含了一定数量的任务槽（task slots）。slot是资源调度最小单位，slot的数量限制了TaskManager能够并行处理的任务数量

启动之后，taskManager会向资源管理器注册它的slots，收到资源管理器的指令后，TaskManager就会将一个或多个槽位提供给JobManager调用，JobManager就可以分配任务来执行

在执行过程中，TaskManager可以缓冲数据，还可以跟其他运行同一应用的TaskManager交换数据

## 核心概念

### 并行度

当处理的数据量特别大的时候，可以把一个算子操作，“复制”到多个节点上，数据来了之后就可以到其中任意一个来执行。这样一来，一个算子任务就被拆分成了多个并行的“子任务”（subTask），再将它们分发到不同节点，就真正实现了并行计算

一个特定的算子的子任务(subTask)的个数被称之为并行度(parallelism)

包含并行子任务的数据，就是并行数据流，它需要多个分区(stream partition)来分配并行任务

![bin/yarn-session.sh -nm testFlink_流批基础入门](/images/posts/post-fe71009a9d/img-5.png)

并行设置

- stream.map(word -> Tuple2.of(word, 1L)).setParallelism(2); 代码中进行设置
- bin/flink run –p 2 –c com.atguigu.wc.SocketStreamWordCount ./FlinkTutorial-1.0-SNAPSHOT.jar 提交应用的时候指定
- flink-conf.yaml 中 parallelism.default: 2 配置文件修改指定

### 算子链

算子间的数据传输

一个数据在算子之间传输数据的形式可以是一对一的(one to one)的直通(forwarding),也可以是重分区（redistributing）模式

<details><summary>一对一模式</summary>

</details>

<details><summary>重分区</summary>

</details>

![bin/yarn-session.sh -nm testFlink_流批基础入门](/images/posts/post-fe71009a9d/img-6.png)

### 合并算子链

Flink中，并行度相同的一对一(one to one)算子操作，可以直接链接在一起形成一个”大”的任务（task），这样原来的原子就成为了真正任务里的一部分。

每个task会被一个线程执行，这样的技术成为“算子链”

将算子链接成task是非常有效的优化，可以减少线程之间的切换和基于缓存区的数据交换，在减少时延的同时提升吞吐量

![bin/yarn-session.sh -nm testFlink_流批基础入门](/images/posts/post-fe71009a9d/img-7.png)

## 任务槽（Task Slots）

Flink中的TaskManager都是一个JVM进程，它可以启动多个独立的线程，来并行的执行多个子任务(subTask)

TaskManager的计算资源是有限的，并行的任务越多，每个线程的资源就会越少。

为了控制并发量，我们需要在TaskManager上对每个任务运行所占用的资源作出明确的划分，这就是所谓的任务槽(task slots)

每个task slot其实表示了TaskManager拥有计算资源的一个固定大小的子集。这些资源就是用来独立执行一个子任务的

![bin/yarn-session.sh -nm testFlink_流批基础入门](/images/posts/post-fe71009a9d/img-8.png)

<details><summary>任务槽配置</summary>

</details>

<details><summary>任务槽和并行度</summary>

</details>

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
