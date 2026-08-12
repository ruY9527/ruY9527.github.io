---
title: "记录奇怪的SQL"
date: 2021-07-02 12:00:00
updated: 2023-10-23 14:25:03
permalink: article/mysql_special_sql/
categories:
  - "Java"
tags:
  - "mysql"
  - "问题记录"
---

> 😀 这里写文章的前言：
> 记录不同篇章数据库的一些奇怪操作的SQL语句;会持续的记录

# 📝 MySql篇章

## 去重排序后的SQL

简单的一个明细表

```sql
CREATE TABLE `t_directory_browse_detail_info` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `user_id` bigint(20) DEFAULT NULL COMMENT '用户id',
  `dept_id` bigint(20) DEFAULT NULL COMMENT '租户id',
  `type_id` bigint(20) DEFAULT NULL COMMENT '类型id',
  `type_number` varchar(50) DEFAULT NULL COMMENT '类型对应的number编码',
  `type_value` varchar(32) DEFAULT NULL COMMENT '类型type',
  `browse_count` bigint(20) DEFAULT NULL COMMENT '浏览次数',
  `create_by` bigint(20) DEFAULT NULL COMMENT '创建人id',
  `update_by` bigint(20) DEFAULT NULL COMMENT '更新人id',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '修改时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8 COMMENT='浏览表明细表'
```

### Q1: 根据type_number,type_value去重取最新的数据,并且根据update_time排序取最新的

错误SQL编写1: 可以看到提示的信息

Expression #1 of ORDER BY clause is not in SELECT list, references column 't_directory_browse_detail_info.update_time' which is not in SELECT list; this is incompatible with DISTINCT

```sql
SELECT  DISTINCT type_id,type_value  from t_directory_browse_detail_info order by update_time desc;

```

错误SQL编写2:我们先排序出一张表，然后根据这张表去做去重处理
问题: 你会发现查询出来的数据不是你想要的数据

```sql
SELECT  DISTINCT type_id,type_value from 
 (
 SELECT 
 type_id,type_value
from t_directory_browse_detail_info order by update_time desc
 ) a
```

正确SQL1:采用分组,然后取最大的update_time或者取最大的id的值

```sql
SELECT
	type_id as typeId ,
	type_value as typeValue
from
	t_directory_browse_detail_info
group by
	type_id,
	type_value
order by
	max(id) desc
```

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
