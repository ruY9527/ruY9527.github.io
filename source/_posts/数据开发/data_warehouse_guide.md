---
title: "数仓开发规范"
date: 2022-08-12 12:00:00
updated: 2025-12-31 13:04:05
permalink: article/data_warehouse_guide/
categories:
  - "数据开发"
tags:
  - "数据开发"
  - "规范"
description: "数仓开发规范记录"
cover: /images/posts/data_warehouse_guide/img-1.png
---

> 😀 这里写文章的前言：
> 数仓开发规范

# 📝 ETL规范(Execl文件)

## 文档规范

execl表头记录所有表的信息，类似mysql的索引

|   |   |   |   |   |
| --- | --- | --- | --- | --- |
| 序号 | 层次类别 | 表名 | 中文名称 | 备注 |
| 1 | ods | user_list | 用户信息 | 用户信息 |

## 单个表记录(单个execl页)

|   |   |   |   |
| --- | --- | --- | --- |
| 表英文名 | dwd_ls_md_item_store_df | 设计人 | 鲍洋 |
| 表备注 | 商品门店级别 |  |  |
| 备注 | 每天做快照，根据后期需求，再扩展计算指标 | ETL策略 | 日全量 |
|  |  |  |  |
| 源表基本信息 |  |  |  |
| 表中文名称 | 表英文名称 | 别名 | 数据总量 |
| 商品所有基本信息 | ods_erp.o_bas_club_item | ci | 835943 |
| 商品所有基本信息1 | ods_erp.o_bas_club_item1 | ci1 | 835943 |
|  |  |  |  |
| 表关联关系描述 |  |  |  |
| 源表别名1 | 关联类型 | 源表别名2 | 备注 |
| ci | inner join | ci1 |  |
|  |  |  |  |
|  |  |  |  |
| 字段映射描述(组1) |  |  |  |
| 目标表 | 源表 | 规则 |  |
| 列名 | 字段类型 | 列描述 | 列名 |
| club_nbr | bigint | 门店号 | ci.club_nbr |
| item_nbr | bigint | 商品号 | ci.item_nbr |
| item_on_shelf_date | date | 上架日期 | ci.item_on_shelf_date |
| item_off_shelf_dt | date | 下架日期 | ci.item_off_shelf_dt |
| markdown_status_cd | bigint |  | ci.markdown_status_cd |
| item_status_code | string | 商品状态 | ci.item_status_code |
| unit_retail_amt | decimal(25,10) | 单位零售金额 | ci.unit_retail_amt |
| link_item_nbr | bigint | 链接上号号 | ci.link_item_nbr |
| last_change_ts | timestamp | 最近变更时间 | ci.last_change_ts |
| last_change_userid | string | 最近变更人 | ci.last_change_userid |
| non_mbr_upchrg_ind | string |  | ci.non_mbr_upchrg_ind |
| unit_retail_chg_dt | date |  | ci.unit_retail_chg_dt |
| last_markdown_ind | string |  | ci.last_markdown_ind |
| whpk_sell_amt | decimal(25,10) |  | ci.whpk_sell_amt |
| vnpk_cost_amt | decimal(25,10) |  | ci.vnpk_cost_amt |
| last_update_pgm_id | string |  | ci1.last_update_pgm_id |
| item_create_dt | date |  | ci.item_create_dt |
| cancel_whn_out_dt | date |  | ci.cancel_whn_out_dt |
| cncl_unit_rtl_amt | decimal(25,10) |  | ci.cncl_unit_rtl_amt |
| lead_time_qty | smallint |  | ci.lead_time_qty |
| prompt_price_ind | string | 促销价 | ci.prompt_price_ind |
| lease_sales_pct | decimal(25,10) |  | ci.lease_sales_pct |
| lease_eff_date | date |  | ci.lease_eff_date |
| lease_exp_date | date |  | ci.lease_exp_date |
| last_sold_date | date |  | ci.last_sold_date |
| lease_dflt_sls_pct | decimal(25,10) |  | ci.lease_dflt_sls_pct |
| itemfile_source_nm | string |  | ci.itemfile_source_nm |
| max_retail_amt | decimal(25,10) | 最大零售金额 | ci.max_retail_amt |
| whpk_sell_chg_rsn_cd | bigint |  | ci.whpk_sell_chg_rsn_cd |

# ODS作业规范(Execl文件)

## 模板说明(首页execl)

|   |   |   |   |
| --- | --- | --- | --- |
| 基本信息 |  |  |  |
| 制定人 | 鲍某 | 编写时间 | 2022/9/28 |
| 审核人 |  | 审核时间 |  |
| 版本 | V1.0 |  |  |
|  |  |  |  |
|  |  |  |  |
| 文档修订历史 |  |  |  |
| 序号 | 版本号 | 修订章节 | 修订原因 |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

## 工程情况(单页execl)

|   |   |   |   |   |
| --- | --- | --- | --- | --- |
| 版本时间 | 工程 | 调度数 | >=100W数量表 | 备注 |
| 2022/9/1 | ods_user | 2 | 0 |  |
|  |  |  |  |  |

## ods作业梳理

|   |   |   |   |   |   |   |   |   |   |   |   |   |   |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TASK | 属主 | SRC_TBL | TGT_DB | TGT_TBL | 抽取方式 | 上线时间 | 调度频率 | 调度时间 | 更新时间 | 平台 | 当前状态 | 数据量 | 备注 |
| 目标表名 | userdb | 源表名 | ods_userdb | o_\[源表名\]_di | 增量 | 2022/9/1 | 每天一次 | 每天02:01 |  | dolphinscheduler | 激活 | 1379 |  |
| 目标表名 | userdb | 源表名 | ods_userdb | o_\[源表名\]_df | 全量 | 2022/9/1 | 每天一次 | 每天02:01 |  | dolphinscheduler | 激活 | 1379 |  |

# 数仓命名规范

## 库命名规范

|   |   |   |
| --- | --- | --- |
|  | 正式库 | 临时库 |
|  | ods_\[source database name \] | ods_\[source database name \]_tmp |
|  | dwd_db | dwd_db_tmp |
|  | dws_db | dws_db_tmp |
|  | ads_db | ads_db_tmp |
|  | dim_db | dim_db_tmp |

## 表命名规范

- 所有层级表必须要加字段包括：etl_load_ts
- 表命名使用英文小写字母，单词之间用下划线分开，总长度不能超过 40 个字符

## 表类型

明细表：dtl 中间表：mid 信息：info 配置表：cfg
拉链表：zip 临时表：tmp 汇总表：sum 日志表：log
手工填报：imp(开头) 实时表：re

## 数据周期

时全量：hf 时增量：hi 时快照：hs
日全量：df 日增量：di 日快照：ds
周全量：wf 周增量：wi 周快照：ws
月全量：mf 月增量：mi 月快照：ms
注： df 每天全量（表没有分区），di 每天增量（每天一个分区），ds 每天增量保留
历史到目前记录（一天一个分区）

## ods命名规范

- 增量：ods_源库名.o_{表名}_di
- 全量：ods_源库名.o_{表名}_df
- 接口：ods_源库名.o_api_\[api 数据名称\]_\[数据周期\]
- 文件：ods_源库名.o_flie_\[业务数据名称\]_\[数据周期\]
- 数据量：历史数据量小于 50W 条记录，且未来增长慢的全量同步
- 字段命名规范：字段默认使用源系统的字段名
- 字段名与关键字冲突：在源字段名后加上_col，即源字段名_col

## dwd命名规范

{库}.{层级}*{业务域}*{数据域}*{业务内容}*{表类型}*{数据周期} 例如：dwd_db.dwd_ds_user*{order_info}_dtl_di

## dws命名规范

{库}.{层级}*{业务域}*{数据域}*{业务内容}*{表类型}*{数据周期} 例如：dws_db.dws_ds_user*{order_info}_sum_di

## dim命名规范

{库}.{层级}*{pub/维度内容}*{数据周期} 

例如：dim_db.dim_pub_area_df 

**其中的 pub 与具体业务无关，各个业务部都可以共用，例如时间维度**

## ads命名规范

{库}.{层级}*{项目内容|自定义}*{表类型}_{数据周期} 例如：ads_db.ads_user_dmp_sum_df

## 临时表

{临时库}.{表名}_tmp{序号} 例如：

dwd_db_tmp.dwd_order_info_dtl_di_tmp01 dwd_db_tmp.dwd_order_info_dtl_di_tmp02

## 分区表

分区字段：

- 分 mi（00-59） 如 28
- 时 hh（00-23） 如 10
- 日 yyyy-mm-dd 如 2022-09-28
- 月 yyyy-mm    如 2022-09
- 年 yyyy       如 2022

区分表：分区表取数必须要加分区限制,分区注释必须注明根据那个字段进行分区

表分区到**时、分**分区级别时，表设计使用多级分区 ，如 时分区表；ts：表示日，hh： 表示时；分分区表：ts：表示日，hh：表示时；mi:表示分

## 实时表命名规范

- 各数仓层次表设计以 re_ 开头
- ODS 层表设计：{库}.re_{ods}*{业务域}*{数据域}*{业务内容}*{数据周期}，其他命 名规范见
- DWD 层表设计：{库}.re_{dwd}*{业务域}*{数据域}*{业务内容}*{数据周期}，其他命 名规范见
- DWS 层表设计：{库}.re_{dws}*{业务域}*{数据域}*{业务内容}*{数据周期}，其他命 名规范见
- DIM 层表设计：{库}.re_{dim}*{pub/维度内容}*{数据周期}，其他命名规范见

# 字段类型规范

- 字符：字符串类型使用string
- 数字：整形最大值 10 位以上：bigint ; 整形最大值在 3 位到 9 位：int（不考虑）; 非整形数字类型：decimal(25,10)
- 时间类型：最小粒度为天： date ；时间： timestamp
- 布尔类型是否判断：is_{业务}，不允许出现空值 ; 0: 表示否， 1：表示是

# 工作流命名

## ods

工作流: job_{ods_库名}_{序号} 例如：job_ods_ams

task: 目标表名 例如：o_order_info_df

## dwd

工作流: job_dwd_{业务域}*{数据域}*{序号} 例如：job_dwd_ds_user

task: 目标表名 例如：dwd_ds_user_xxx_df

## dws

工作流：job_dws_{业务域}*{数据域}*{序号} 例如：job_dws_ds_user

task：目标表名 例如：dws_ds_user_xxx_df

## ads

工作流：job_ads_{业务域}_{序号} 例如：job_ads_ds

task: 目标表名 例如：ads_user_dmp_xxx_df

# 数据模型设计

## 横向分层

### ods

操作数据层，即原始数据层。ODS 层有些时候会细分为两层，一个 STG 数据缓冲层，存原 始数据，一个 ODS，存简单清洗的数据

### dwd

明细数据层，对数据进行清洗、代码统一、字段统一、格式统一、简单聚合等工作。DWD 层存在的意义是做数据的标准化，为后续的处理提供干净、统一、标准的数据

### dws

数据汇总层，按照业务目标，对已经处理好的数据进行横向汇聚、纵向汇总。按照宽表模型 进行数据冗余和预计算，以空间换时间

### dim

维度层，即存储所有维度（可以理解为码表）。其实 DIM 不应该单独作为一层，因为从 DWD 层开始向上的所有层都需要用到 DIM 中的内容，是横跨多层的

### ads

应用服务层，一般就直接对接 OLAP 分析，或者业务层数据调用接口

## 纵向分域

主题域通常是联系较为紧密的数据主题的集合，方便寻找和使用数据

### dw层

正式库： dw_db 临时库：dw_db

划分依据：按照业务或业务过程划分,比如一个靠销售广告位置的门户网站主题域可能会有 广告域，客户域等，而广告域可能就会有广告的库存，销售分析、内部投放分析等主题

### DIM层

正式库： dim_db 临时库：dim_db_tmp 

划分依据：按照公司主数据划分

### DM层

正式库： dm_db 临时库：dm_db_tmp 

划分依据：按照主题域进行划分

### ADS层

正式库： ads_db_tables 临时库：ads_db_tmp

划分依据：

1. 根据需求方划分：比如需求方为财务部，就可以设定对应的财务主题域（业务场景）， 而财务主题域里面可能就会有员工工资分析
1. 根据项目划分

![数仓开发规范](/images/posts/data_warehouse_guide/img-1.png)

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
