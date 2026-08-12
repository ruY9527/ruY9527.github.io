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

</details>

<details><summary>缺点</summary>

</details>

Hive 3.x版本之上是可以支持acid的

# 📝 Hive数据类型

|   |   |   |   |
| --- | --- | --- | --- |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

## 类型转换

<details><summary>隐式类型转换规则</summary>

</details>

<details><summary>CAST操作显示进行数据类型转换</summary>

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
|  |  |
|  |  |
|  |  |
|  |  |
|  |  |
|  |  |
|  |  |

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
|  |  |
|  |  |
|  |  |
|  |  |
|  |  |
|  |  |
|  |  |

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

|  |  |  |
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

## 窗口函数（开窗函数）

为每行数据进行一次计算,返回一个值

灵活运用窗口函数可以解决很多复杂的问题,如去重,排名,同步以及环比,连续登录等

<details><summary>语法</summary>

</details>

<details><summary>聚合函数</summary>

</details>

<details><summary>排序函数</summary>

</details>

<details><summary>统计比较函数</summary>

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

</details>

<details><summary>group by</summary>

</details>

<details><summary>CBO优化</summary>

</details>

<details><summary>谓词下推</summary>

</details>

<details><summary>MapJoin</summary>

</details>

<details><summary>大表,小表SMB JOIN</summary>

</details>

<details><summary>数据倾斜</summary>

</details>

<details><summary>表单数据倾斜</summary>

</details>

<details><summary>join数据倾斜优化</summary>

</details>

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
