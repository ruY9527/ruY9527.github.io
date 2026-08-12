---
title: "hive基础知识"
date: 2022-03-02 12:00:00
updated: 2023-07-23 13:16:03
permalink: article/hive_base/
categories:
  - "大数据"
tags:
  - "大数据"
  - "hive"
description: "Hive基础知识"
cover: /images/posts/hive_base/img-1.png
---

> 😀 这里写文章的前言：
> HDFS来存储海量数据,MapReduce来对海量数据进行分布式并行计算,yarn来实现资源管理和作业调度
> 开发人员需要编写MR来对数据进行统计分析难度极大,效率极低,并且对开发者的java功底要求
> Hive可以帮助人员来完成这些苦活(将SQL语句转化MapReduce在yarn上跑)

# 📝 Hive架构模块

![hive基础知识](/images/posts/hive_base/img-1.png)

![hive基础知识](/images/posts/hive_base/img-2.png)

## Client

Cli: command-line interface

JDBC/ODBC: jdbc访问hive

<details><summary>Hive客户端</summary>

1. Thrift Clients: Hive的Server是基于Apache Thrift的,所以支持thrift客户端的查询请求
1. JDBC Clinet: 使用Java的JDBC driver连接Hive, JDBC driver使用 Thrift与Hive进行通信
1. ODBC Client: Hive的ODBC driver使用基于ODBC协议连接hive,与JDBC driver类似,ODBC driver也是通过thrift与Hive server进行通信

</details>

## Metastore

元数据: 表命,表所属的数据库(默认是default),表的拥有者,列/分区字段,表的类型(是否是外部表),表的数据所在的目录

## Hadoop

使用hadoop进行存储,使用MapReduce进行计算

## 驱动器

- SQL Parse(解析器): 将SQL字符串转换成抽象语法树AST(第三方工具);对AST进行语法分析,比如表是否存在,字段是否存在,SQL语义是否错误
- Physical Plan(编译器): 将AST编译生成逻辑执行计划
- Query Optimizer(优化器): 对逻辑执行计划进行优化
  - Execution(执行器): 把逻辑执行计划转换成可以运行的屋里计划,对于Hive来说,就是MR/Spark

## 优缺点

<details><summary>优点</summary>

- 提供了类SQL语法操作接口,具备快速开发的能力(简单,容易上手)
- 避免了去写MapReduce,减少了开发者的学习成本
- Hive优势在于处理大数据,在处理小数据时没有优势,因为Hive的执行延迟较高
- Hive支持用户自定义函数,用户可以根据自己的需求来实现自己的函数

</details>

<details><summary>缺点</summary>

- Hive自动生成MapReduce作业，通常情况下不够智能化;数据挖掘方面不擅长（多个子查询），由于MapReduce数据处理流程的限制，效率更高的算法却无法实现
- Hive的执行延迟比较高，因为Hive常用于数据分析，对实时性要求不高的场合;Hive调优比较困难，粒度较粗
- hive分析的数据是存储在HDFS上的，而HDFS仅支持追加写，所以在hive中不能update和delete，只能select和insert

</details>

Hive 3.x版本之上是可以支持acid的

# 📝 Hive数据类型

|   |   |   |   |
| --- | --- | --- | --- |
| 类型 | 比如 | 备注 | 存储例子 |
| TINYINT |  |  |  |
| SMALINT |  |  |  |
| INT |  |  |  |
| BIGINT |  |  |  |
| BOOLEAN |  |  |  |
| FLOAT |  |  |  |
| DOUBLE |  |  |  |
| STRING |  |  |  |
| TIMESTAMP |  |  |  |
| BINARY |  |  |  |
| STRUCT | struct<street:string, city:string> | 和c语言中的struct类似，都可以通过“点”符号访问元素内容 | 如果某个列的数据类型是STRUCT{first STRING, last STRING},那么第1个元素可以通过字段.first来引用 |
| MAP | map<string, int> | MAP是一组键-值对元组集合，使用数组表示法可以访问数据 | 如果某个列的数据类型是MAP，其中键->值对是’first’->’John’和’last’->’Doe’，那么可以通过字段名\[‘last’\]获取最后一个元素 |
| ARRAY | array<string> | 数组是一组具有相同类型和名称的变量的集合;这些变量称为数组的元素，每个数组元素都有一个编号，编号从零开始 | 数组值为\[‘John’, ‘Doe’\]，那么第2个元素可以通过数组名\[1\]进行引用 |

## 类型转换

<details><summary>隐式类型转换规则</summary>

任何整数类型都可以隐式的转换为一个范围更广的类型,如INT可以转换成BIGINT

所有的整数类型,FLOAT和STRING类型可以隐式转换成DOUBLE

TINTINT,SMALLINT,INT都可以转换为FLOAT

BOOLEAN类型不可以转换成其它的类型

</details>

<details><summary>CAST操作显示进行数据类型转换</summary>

CAST(’1’ as INT) 将字符串转换整数

强制类型转换失败,如执行CAST(’x’ as INT),表达式就会返回null

</details>

# 📝 Hive语句

## 数据库语句

```sql
CREATE DATABASE [IF NOT EXISTS] database_name
[COMMENT database_comment]
[LOCATION hdfs_path]
[WITH DBPROPERTIES (property_name=property_value, ...)];
```

避免要创建的数据库已经存在错误,增加if nof exists判断

```sql
create database if not exists bigdata;
```

### 查询数据库的信息

```sql
-- 过滤显示查询的数据库
show databases like 'bigdata*';

-- 显示数据库信息
desc database bigdata;
```

### 操作数据库

```sql
-- bigdata2可能不存在,加 ifx exists 进行判断
drop database if exists bigdata2;

-- 如果数据库不为空,可以使用 cascade 强制删除
drop database bigdata cascade;
```

## 表语句

### 创建表

```sql
CREATE [EXTERNAL] TABLE [IF NOT EXISTS] table_name 
[(col_name data_type [COMMENT col_comment], ...)] 
[COMMENT table_comment] 
[PARTITIONED BY (col_name data_type [COMMENT col_comment], ...)] 
[CLUSTERED BY (col_name, col_name, ...) 
[SORTED BY (col_name [ASC|DESC], ...)] INTO num_buckets BUCKETS] 
[ROW FORMAT row_format] 
[STORED AS file_format] 
[LOCATION hdfs_path]
[TBLPROPERTIES (property_name=property_value, ...)]
[AS select_statement]
[LIKES existing_table_or_view_name]

-- 修改表
ALTER TABLE table_name RENAME TO new_table_name

-- 更新列
ALTER TABLE table_name CHANGE [COLUMN] col_old_name col_new_name column_type [COMMENT col_comment] [FIRST|AFTER column_name]

-- 增删除列
ALTER TABLE table_name ADD|REPLACE COLUMNS (col_name data_type [COMMENT col_comment], ...)
```

|   |   |
| --- | --- |
| 建表字段 | 属性意义 |
| LOCATION | 在建表的同时可以指定一个指向实际数据的路径 |
| COMMENT | 为表和列添加注释 |
| PARTITIONED BY | 创建分区表 |
| CLUSTERED BY | 创建分桶表 |
| SORTED BY | 对桶中的一个或多个列另外排序 |
| STORE AS | 指定存储文件类型 |

### 删除表

清除表中数据（Truncate） : Truncate只能删除管理表，不能删除外部表中数据

```sql
drop table test2;
```

## DML语句

### load语句

```sql
load data [local] inpath '数据的path' [overwrite] into table table_name [partition (partcol1=val1,…)];

-- 创建表时,通过Location指定加载数据路径
create external table if not exists student5(
              id int,
              name string
)
row format delimited fields terminated by '\t'
location '/input/student';
```

|   |   |
| --- | --- |
| 属性 | 属性含义 |
| load data | 加载数据 |
| local | 表示从本地加载数据到hive表，否则是从HDFS加载数据到Hive表 |
| Inpath | 加载数据的路径 |
| Overwrite | 表示覆盖表中已有数据,否则表示追加 |
| Into table | 加载数据到那张表中 |
| Partition | 加载数据到指定的分区 |

## 分区表

### 分区表

- 分区表实际上就是对应一个HDFS文件系统上的独立的文件夹
- 该文件夹下是该分区所有的数据文件
- Hive中的分区就是分目录，把一个大的数据集根据业务需要分割成小的数据集
- 在查询时通过WHERE子句中的表达式选择查询所需要的指定的分区，这样的查询效率会提高很多

### 分区操作

创建表指定分区字段 : 在查询时通过WHERE子句中的表达式选择查询所需要的指定的分区，这样的查询效率会提高很多

增加分区 : alter table dept_partition add partition(day='20200404') 

删除分区 : alter table dept_partition drop partition (day='20200406')

### 二级分区

创建表指定分区字段 : partitioned by (day string, hour string)

hdfs存储的路径 : /user/hive/warehouse/mydb.db/dept_partition2/day=20200401/hour=14;

### 动态分区

对分区表insert数据时候,数据库自动会根据分区字段的值,将数据插入到相应的分区中

设置开启动态分区 : set hive.exec.dynamic.partition=true;

设置为非严格模式 : set hive.exec.dynamic.partition.mode=nonstrict

整个MR Job中,最大可以创建多少个HDFS文件,默认是100000; set hive.exec.max.created.files=100000;

在每个执行MR的节点上,最大可以创建多少个动态分区: set hive.exec.max.dynamic.partitions.pernode=100;

在所有执行MR的节点上,最大一共可以创建多少个动态分区,默认是1000; set hive.exec.max.dynamic.partitions=1000;

动态分区的模式,默认strict,表示必须指定至少一个分区为静态分区,nonstrict模式表示许所有的分区字段都可以使用动态分区

当有空分区生成时,是否抛出异常;一般不需要设置,默认false; set hive.error.on.empty.partition=false;

## 分桶表

分桶是将数据集分解成更容易管理的若干部分的另一种技术

分区针对的是数据存储路径(细分文件夹);分桶针对的是数据文件(按规则多文件放一起)

创建分桶表

要想将表创建为4个桶,需要将hive中mapreduce.job.reduces参数设置为 ≥ 4或设置为 -1

```sql
create table stu_bucket(id int, name string)
clustered by(id) 
into 4 buckets
row format delimited fields terminated by '\t';
```

分桶规则: Hive的分桶采用对分桶字段的值进行哈希(hash),然后除以桶的个数求余的方 式决定该条记录存放在哪个桶当中

mapreduce.job.reduces=-1,让Job自行决定需要用多少个reduce或者将reduce的个数设置为大于等于分桶表的桶数

# 📝 Hive函数

## 内置函数

show function: 查询系统自带的函数

desc function 函数名: 显示自带的函数的用法

desc function extended 函数名: 展开详细说明

| 作用 | 函数 | 功能 |
| --- | --- | --- |
| 空字段赋值-NVL（防止空字段参与计算） | NVL(value,default_value) | 如果value为NULL，则NVL函数返回default_value的值，否则返回value的值<br>如果两个参数都为NULL ，则返回NULL |
| CASE WHEN THEN ELSE END | CASE a WHEN b THEN c \[WHEN d THEN e\]\* \[ELSE f\] END | 根据不同的数据,返回不同的值<br>当a=b时，返回c；当a=d时，返回d；当a=e时，放回e；其他情况返回f |
| 行转列（组函数） | CONCAT(string A/col, string B/col…) | 返回输入字符串连接后的结果，支持任意个输入字符串 |
| 行转列（组函数） | CONCAT_WS(separator, str1, str2,...) | 指定字符separator，连接str<br>sparator: 分割符<br>分割符将被加到被连接的字符串之间 |
| 行转列（组函数） | COLLECT_SET(col) | 函数只接受基本数据类型;<br>它的主要作用是将某字段的值进行去重汇总,产生array类型字段 |
| 行转列（组函数） | COLLECT_LIST(col) | 函数值接受基本数据类型;<br>它的主要作用是将某字段的值进行不去重汇总,产生array类型字段 |
| 列转行 | EXPLODE(col) | 将hive表的一列中复杂的array或者map结构拆分成多行;<br>会出现改行与其它字段行数不匹配报错<br>因此<br>必须和lateral view连用 |
| 列转行 | SPLIT(string str, string regex) | 按照regex字符串分割str，会返回分割后的字符串数组 |
| 列转行 | LATERAL VIEW | 用于和split,explode等UDF一起使用,它能够将一列数据拆成多行数据,在次基础上可以对拆分后的数据进行聚合<br>lateral view首先为原始表的每行调用UDTF,UDTF会报一行拆分成一行或者多行,lateral view再把结果组合,产生一个支持别名表的虚拟表 |

## 窗口函数（开窗函数）

为每行数据进行一次计算,返回一个值

灵活运用窗口函数可以解决很多复杂的问题,如去重,排名,同步以及环比,连续登录等

<details><summary>语法</summary>

Function（arg1 ……） over（\[partition by arg1 ……\] \[order by arg1 ……\] \[<window_expression>\]）

</details>

<details><summary>聚合函数</summary>

sum()、max()、min()、avg()

</details>

<details><summary>排序函数</summary>

- rank() 排序相同时会重复,总数不变
- row_number() 排序相同时会重复,总数会减少
- dens_rank() 会根据顺序计算,不重复不减少
- ntile() Ntile函数,为已排序的行,均分为指定数量的组,组号按顺序排列,返回组号;不支持rows between;ntile(5) over(order by orderdate) sorted from business

</details>

<details><summary>统计比较函数</summary>

lead()

lag(): LAG (scalar_expression \[,offset\] \[,default\]) OVER (\[query_partition_clause\] order_by_clause); lag函数用于统计窗口内往上的第n行值;参数scalar_pexpression为列名,参数offset为往上几行,参数default是设置的默认值(当往上第n行为null时,取默认值,否则就是null)

first_value(): 返回partition by的第一个分区

</details>

## 自定义函数

- UDF(User-Defined-Function) : 一进一出
- UDAF(User-Defined-Aggregation Function): 聚合函数,多进一出,类似:max,count,min
- UDTF(User-Defined Table-Generating Functions): 炸裂函数,一进多出

引入过程:

1. 添加jar: add jar linux_jar_path
1. 创建function: function \[dbname.\]function_name AS class_name;
1. 在hive的命令行窗口删除函数: drop \[temporary\] function \[if exists\] \[dbname.\]function_name;

## 创建临时函数

create temporary function my_len as "com.atguigu.hive. MyStringLength";

临时函数只和会话有关系,跟库没有关系,只要创建临时函数的会话不断,再当前会话下,任意一个库都可以使用,其它会话全部不能使用

# 📝 Hive优化

## 执行计划

Explain : EXPLAIN \[EXTENDED | DEPENDENCY | AUTHORIZATION\] query

查看执行语句运行时的信息/详细信息

## Hive建表优化

分区表: 先用where过滤缩小查询范围,减小数据量

分桶表: 提供一个隔离数据和优化查询的便利方式

合格的文件格式: 采用压缩: 输入端/map输出端/reduce输出端

## HQl语法优化

<details><summary>列裁剪和分区裁剪</summary>

只读取查询中所需要的列,忽视其它的列,这样可以做可以节省读取开销

1. 列裁剪: 查询时只读取需要的列
1. 分区裁剪: 查询时只读取需要的分区

</details>

<details><summary>group by</summary>

map端聚合参数设置: set hive.map.aggr = true

map端进行聚合操作的条目数目: set hive.groupby.mapaggr.checkinterval = 100000

有数据倾斜的时候进行负载均衡（默认是false）: set hive.groupby.skewindata = true

当开启数据负载的时候,会生成两个查询计划会有两个MRJob:

1. 第一个MRJob中，Map的输出结果会随机分布到Reduce中，每个Reduce做部分聚合操作，并输出结果，这样处理的结果是相同的Group By Key有可能被分发到不同的Reduce中，从而达到负载均衡的目的
1. 第二个MRJob再根据预处理的数据结果按照Group By Key分布到Reduce中（这个过程可以保证相同的Group By Key被分布到同一个Reduce中），最后完成最终的聚合操作

</details>

<details><summary>CBO优化</summary>

CBO成本优化器,代价最小的执行计划就是最好的执行计划;Hive在提供最终执行前,优化每个查询的执行逻辑和物理逻辑执行计划

join的时候表的顺序关系: 前面的表都会被加载到内存中,后面的表进行磁盘顺序扫描

通过 "hive.cbo.enable" 来开启。在 Hive 1.1.0 之后，这个属性是默认开启的，它可以自动优化HQL中多个Join的顺序，并选择合适的Join算法

</details>

<details><summary>谓词下推</summary>

保证结果正确的前提下,将SQL语句中的where谓词逻辑都尽可能提前执行,减少下游处理的数据量

通过谓词下推,过滤条件将在map端提前执行,减少map端的输出,降低了数据IO,节约资源,提升性能

set hive.optimize.ppd = true; #谓词下推，默认是true

</details>

<details><summary>MapJoin</summary>

MapJoin 是将 Join 双方比较小的表直接分发到各个 Map 进程的内存中，在 Map 进程中进行 Join 操 作，这样就不用进行 Reduce 步骤，从而提高了速度

用MapJoin把小表全部加载到内存在Map端进行Join，避免Reducer处理

设置自动选择MapJoin,set hive.auto.convert.join=true; #默认为true

大表小表阈值设置(默认25M以下认为是小表): set hive.mapjoin.smalltable.filesize=25000000;

</details>

<details><summary>大表,小表SMB JOIN</summary>

sort merge bucket join

</details>

<details><summary>数据倾斜</summary>

数据倾斜现象: 一个或者少数几个任务执行的很慢甚至最终执行失败

数据过量现象: 所有任务都执行的很慢

按照key分组后,少量的任务负载着绝大部分数据的计算,也就是说,产生数据倾斜的HQL中一定存在着分组的操作;单表携带了Group by字段的查询和两表(多表)join的查询

</details>

<details><summary>表单数据倾斜</summary>

参数优化：

- 在Map端进行聚合，默认为True: set hive.map.aggr = true
- Map端进行聚合操作的条目数目: set hive.groupby.mapaggr.checkinterval = 100000
- 数据倾斜的时候进行负载均衡（默认是false）
- set hive.groupby.skewindata = true

增加reduce数量:

- 每个reduce处理的数据量默认是256MB: set hive.exec.reducers.bytes.per.reducer=256000000; 每个任务最大的reduce数,默认是1009,set hive.exec.reducers.max=1009;N=min(参数2,总输入数据量/参数1)
- 调整reduce个数方法,set mapreduce.job.reduces = 15;

</details>

<details><summary>join数据倾斜优化</summary>

- join的键对应的记录条数超过这个值则会进行分拆,值根据具体数据量设置;set hive.skewjoin.key=100000;
- join过程中出现倾斜应该设置为true;set hive.optimize.skewjoin=false;

</details>

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
