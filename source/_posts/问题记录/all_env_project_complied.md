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
| 名字 | 作用 | 地址 |
|  | python爬虫学习资料 | [https://vip.fxxkpython.com/?p=4699](https://vip.fxxkpython.com/?p=4699) |
|  |  |  |

# 📝 资源记录相关(主要学习资源记录)

## AI相关

|   |   |   |
| --- | --- | --- |
| 名字 | 作用 | 网址 |
| 内容生成 |  | [writesonic.com](http://writesonic.com/) |
| 针对网络的研究操作系统 |  | [nette.io](http://nette.io/) |
| 生成病毒式推文和话题串 |  | [postwise.ai](http://postwise.ai/) |
| YouTube视频编辑器 |  | [FlexClip.com](http://flexclip.com/) |
| 文本转视频 |  | [synthesia.io](http://synthesia.io/) |
| 设计工具 |  | [designer.microsoft.com](http://designer.microsoft.com/) |

## AI绘画

|   |   |   |
| --- | --- | --- |
| 名字 | 作用 | 网址 |
| 光影文字 | 光影文字 | [https://mp.weixin.qq.com/s/zbQCwOHsMS4GmMLJJIU_1A](https://mp.weixin.qq.com/s/zbQCwOHsMS4GmMLJJIU_1A) |
|  |  |  |
|  |  |  |

## 区块链

|   |   |   |
| --- | --- | --- |
| 名字 | 作用 | 网址 |
| 区块链学习 |  | [https://learnweb3.io/](https://learnweb3.io/) |
|  |  |  |
|  |  |  |

# 📝 IDEA插件记录

|   |   |   |
| --- | --- | --- |
| 插件名称 | 插件作用 | 插件备注 |
| **Simple Object Copy** |  | 一键生成 dto,vo 等插件 |
| **Maven Helper** |  | 查看maven依赖树情况 |
| **EasyCode** |  | 一键生成逆向工程 |
| **Iedis** |  | Redis连接插件 |
| **Lombok** |  | 方法自动生成 |
| **Jrebel** |  | 热部署相关的插件 |
| **Alibaba Java Coding Guidelines** |  | 阿里巴巴代码检测规范 |
| **VisualVM Launcher** |  | 性能监控的插件 |
| **CodeGlance** |  | 左侧窗口的上下滑动框 |
| **Material Theme UI** |  | IDEA的UI框架 |
| **stackoverflow** |  | 链接到   stackoverflow 检查问题 |
| **Codota** |  | 好 |
| **jclasslib bytecode viewer** |  | 字节码编译 |
| **PlantUML** |  | 对象类设计 |
| **Stack trace to UML** |  | 调用链图 |
| **Git Commit Template** |  | git提交规范代码 |
|  |  |  |

# 📝 资讯资源

|   |   |   |
| --- | --- | --- |
| 名字 | 作用 | 网址 |
| 新闻资源 | 国外的新闻资源 | [https://mgreader.com/](https://mgreader.com/) |
|  |  |  |
|  |  |  |
|  |  |  |

# 📝 想看纪录片

|   |   |   |   |
| --- | --- | --- | --- |
| 名字 | 状态 | 总结 |  |
| 诈骗王 |  |  |  |
| 富豪谷底求翻身 |  |  |  |
| 货币崛起 |  |  |  |
| 但是还有书籍 |  |  |  |
| 宇宙 |  |  |  |
| 急诊室的故事 |  |  |  |
| 心智斗争 |  |  |  |
| 女人 |  |  |  |
| 解码比尔盖茨 |  |  |  |
| 绿色星球 |  |  |  |

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
