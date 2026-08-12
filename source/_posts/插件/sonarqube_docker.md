---
title: "SonarQube安装使用手册(docker版)"
date: 2021-07-02 12:00:00
updated: 2025-12-31 11:57:24
permalink: article/sonarqube_docker/
categories:
  - "插件"
tags:
  - "工具"
  - "开发"
  - "插件"
  - "SonarQube"
description: "Sonar安装和使用"
cover: /images/posts/sonarqube_docker/img-1.png
---

> 😀 这里写文章的前言：
> SonarQube代码质量检测的工具，对代码进行一定规则的校验等等，算是代码层面的质量和规范                                                             基于docker来进行安装                                                              

# 📝 基于docker安装

## 组件版本

- MySql： 5.7
- SonarQube: 7.8-community

## 启动过程

### MySql初始化

创建一个sonar的数据库(编码最好是utf-8,避免中文相关的乱码问题)

名字也可以自己来取

### docker拉镜像配置

如果你拉取镜像存在问题的话,配置一下加速的地址来拉取,避免一直卡顿等问题

```javascript
  "registry-mirrors": [
    "https://0dj0t5fb.mirror.aliyuncs.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://6kx4zyno.mirror.aliyuncs.com",
    "https://registry.docker-cn.com"
  ]
```

### docker启动指令

```bash
 sudo docker run -itd --name  sonarqube78 -p 10002:9000 \\n  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \\n  -e SONARQUBE_JDBC_USERNAME=root \\n  -e 'SONARQUBE_JDBC_PASSWORD=passwd' \\n  -e 'SONARQUBE_JDBC_URL=jdbc:mysql://ip:port/database?useUnicode=true&characterEncoding=utf8' \\n  -p 9000:9000 sonarqube:7.8-community

```

需要替换的参数

- SONARQUBE_JDBC_USERNAME： 替换为自己数据库的名字
- SONARQUBE_JDBC_PASSWORD:  替换为自己数据库的密码
- SONARQUBE_JDBC_URL:    MySql的连接ip，port，database都替换为自己的

9000:9000： 前面的宿主机的端口映射，可以根据自己的需求来进行配置

## 启动成功

启动成功的初始化的账号和密码: admin/admin

同时也可以看到Mysql的数据库中初始化了许多表相关的信息

![SonarQube安装使用手册(docker版)](/images/posts/sonarqube_docker/img-1.png)

## 本地使用层面

### sonarQube界面key创建

sonar创建一个项目，同时也会有一个key的信息;

比如我这里创建一个项目，对你分析的token也是可以一起生成的

![SonarQube安装使用手册(docker版)](/images/posts/sonarqube_docker/img-2.png)

### 项目本地maven配置

在本地的setting文件,加上sonarqube访问的地址信息

```xml
<proxies>
	<profile>
            <id>sonar</id>
            <activation>
                <activeByDefault>true</activeByDefault>
            </activation>
            <properties>
                <!-- 配置 Sonar Host地址，默认：http://localhost:9000 -->
                <sonar.host.url>
                  http://127.0.0.1:10002
                </sonar.host.url>
            </properties>
        </profile>
  </proxies>
```

### 分析指令

对项目进行mvn sonar分析，但是在分析之前，项目需要进行打包或者build成功才可以，访问会有一个访问不到的错误

```bash
mvn sonar:sonar -Dsonar.projectKey=user-platfor -Dsonar.host.url=http://127.0.0.1:10002 -Dsonar.login=bff12399cf34352faa90cf0c062b64cebe718ad8
```

### 查看结果

查看整个项目的分析结果

![SonarQube安装使用手册(docker版)](/images/posts/sonarqube_docker/img-3.png)

点进去可以看到具体的错误原因和代码的问题

![SonarQube安装使用手册(docker版)](/images/posts/sonarqube_docker/img-4.png)

到此一个基本的流程结束，同时我们也可以通过配置jenkis的流水线或者gitlab ci/cd等钩子函数来对sonarqube进行一个触发

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
