---
title: "编译问题记录和各种环境配置"
date: 2022-12-22 12:00:00
updated: 2023-08-02 09:23:00
permalink: article/all_env_project_complied/
categories:
  - "问题记录"
tags:
  - "使用入门"
  - "框架"
---

> 😀 这里写文章的前言：
> 记录编译各种项目以及开源项目遇到的问题
> 
> 本地安装jar包
> pentaho-aggdesigner-algorithm-5.1.5-jhyde
> eigenbase-properties-1.1.4
> greenplum-jdbc-5.1.4

# 📝 缺少jar包本地编译

## pentaho-aggdesigner-algorithm-5.1.5-jhyde

jar包

[📎 pentaho-aggdesigner-algorithm-5.1.5-jhyde.jar](https://github.com/ruY9527/source-notes/blob/master/java/localhostJars/pentaho-aggdesigner-algorithm-5.1.5-jhyde.jar)

本地安装指令:  -Dfile 切换为自己本地下载存放jar的位置

```java
mvn install:install-file -Dfile=/home/luohong/Downloads/pentaho-aggdesigner-algorithm-5.1.5-jhyde.jar -DgroupId=org.pentaho -DartifactId=pentaho-aggdesigner-algorithm -Dversion=5.1.5-jhyde -Dpackaging=jar
```

## eigenbase-properties-1.1.4

jar包

[📎 eigenbase-properties-1.1.4.jar](https://github.com/ruY9527/source-notes/blob/master/java/localhostJars/eigenbase-properties-1.1.4.jar)

本地安装指令: -Dfile 切换为自己本地下载存放jar的位置

```java
mvn install:install-file -DgroupId=eigenbase -DartifactId=eigenbase-properties -Dversion=1.1.4 -Dpackaging=jar -Dfile=/home/luohong/Downloads/eigenbase-properties-1.1.4.jar
```

## greenplum-jdbc-5.1.4

jar包

[📎 greenplum-jdbc-5.1.4.jar](https://github.com/ruY9527/source-notes/blob/master/java/localhostJars/greenplum-jdbc-5.1.4.jar)

本地安装指令: -Dfile 切换为自己本地下载存放jar的位置

```java
mvn install:install-file -DgroupId=com.pivotal -DartifactId=greenplum-jdbc -Dversion=5.1.4 -Dpackaging=jar -Dfile=/home/luohong/Downloads/greenplum-jdbc-5.1.4.jar
```

# 📝 前端环境配置

查看镜像源设置:  npm config get registry

## 设置镜像源

阿里: npm config set registry [https://registry.npm.taobao.org](https://registry.npm.taobao.org/)

## vite问题

'vite' 不是内部或外部命令，也不是可运行的程序 或批处理文件

处理方法:  npm i 进行安装

# 📝 python环境配置

## 设置镜像源

`pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple`

其它镜像源地址

```
清华：https://pypi.tuna.tsinghua.edu.cn/simple

阿里云：http://mirrors.aliyun.com/pypi/simple/

中国科技大学 https://pypi.mirrors.ustc.edu.cn/simple/

华中理工大学：http://pypi.hustunique.com/

山东理工大学：http://pypi.sdutlinux.org/ 

豆瓣：http://pypi.douban.com/simple/
```

## python去除背景方法

- rembg 框架

## python相关资源学习

|   |   |   |
| --- | --- | --- |
|  |  |  |
|  |  |  |
|  |  |  |

# 📝 资源记录相关(主要学习资源记录)

## AI相关

|   |   |   |
| --- | --- | --- |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

## AI绘画

|   |   |   |
| --- | --- | --- |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

## 区块链

|   |   |   |
| --- | --- | --- |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

# 📝 IDEA插件记录

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

# 📝 资讯资源

|   |   |   |
| --- | --- | --- |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

# 📝 想看纪录片

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

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
