---
title: "Docker知识"
date: 2021-05-07 12:00:00
updated: 2023-06-05 15:56:14
permalink: article/docker_common1/
categories:
  - "docker"
tags:
  - "docker"
description: "docker基础知识"
cover: /images/posts/docker_common1/img-1.png
---

> 😀 这里写文章的前言：
> 容器化时代,docker是一门必备的知识
> 安装手册: [https://www.runoob.com/docker/docker-architecture.html](https://www.runoob.com/docker/docker-architecture.html)

# 📝 docker原理

## NameSpace

NameSpace是Linux内核的一项功能,该功能对内核资源进行隔离，使得容器的进程都可以在单独的命名空间中运行，并且只可以访问当前容器命名空间的资源

NameSpace可以隔离进程ID，主机名，用户ID，文件名，网络访问和进程通信等相关资源

- pid namespace: 用于隔离进程ID
- net namespace: 隔离网络接口，在虚拟的net namespace内用户可以拥有自己独立的ip，路由，端口等
- mnt namespace: 文件系统挂载点隔离
- ipc namespace: 信号量，消息队列和共享内存的隔离
- uts namespace: 主机命和域名的隔离

## CGroups

Cgroups 是一种linux内核功能，可以限制和隔离进程的资源使用情况(CPU,内存,磁盘I/O,网络等).在容器的实现中,Cgroups通常用来限制容器的cpu和内存等资源的使用

## 联合文件系统

UnionFS,是一种通过创建文件层进程操作的文件系统，因此，联合文件系统非常轻快

## 服务端

![Docker知识](/images/posts/docker_common1/img-1.png)

## docker进程查看

```java
(base) luohong@luohong:~$ ps aux | grep docker
root        3566  0.0  0.4 2202812 74544 ?       Ssl  13:30   0:00 /usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
root       47767  0.0  0.0 1230384 2916 ?        Sl   14:25   0:00 /usr/bin/docker-proxy -proto tcp -host-ip 0.0.0.0 -host-port 2181 -container-ip 172.17.0.2 -container-port 2181
root       47793  0.0  0.0 1230384 3152 ?        Sl   14:25   0:00 /usr/bin/docker-proxy -proto tcp -host-ip :: -host-port 2181 -container-ip 172.17.0.2 -container-port 2181
luohong    48072  0.0  0.0  13996   896 pts/6    S+   14:26   0:00 grep docker
```

```java
(base) luohong@luohong:~$ sudo pstree -l -a -A 3566
dockerd -H fd:// --containerd=/run/containerd/containerd.sock
  |-docker-proxy -proto tcp -host-ip 0.0.0.0 -host-port 2181 -container-ip 172.17.0.2 -container-port 2181
  |   `-7*[{docker-proxy}]
  |-docker-proxy -proto tcp -host-ip :: -host-port 2181 -container-ip 172.17.0.2 -container-port 2181
  |   `-7*[{docker-proxy}]
  `-19*[{dockerd}]
```

## docker运行状态

![Docker知识](/images/posts/docker_common1/img-2.png)

# NameSpace资源隔离

Docker是使用Linux的NameSpace技术实现各种资源隔离的

NameSpace是Linux内核的一项功能，该功能对内核资源进行分区，以使一组进程看到一组资源，而另一组进程看到另一组资源

NameSpace的工作方式通过一组资源和进程设置相同的namesapce而起作用，但是这些namespace引用了不同的资源

资源可能存在于多个NameSpace中

这些资源可以是进程ID,主机名,用户名,与网络访问相关的名称和进程间通信

简单来说，Namespace 是 Linux 内核的一个特性，该特性可以实现在同一主机系统中，对进程 ID、主机名、用户 ID、文件名、网络和进程间通信等资源的隔离

|   |   |   |
| --- | --- | --- |
| Namespace 名称 | 作用 | 内核版本 |
| Mount（mnt） | 隔离挂载点 | 2.4.19 |
| Process ID (pid) | 隔离进程 ID | 2.6.24 |
| Network (net) | 隔离网络设备，端口号等 | 2.6.29 |
| Interprocess Communication (ipc) | 隔离 System V IPC 和 POSIX message queues | 2.6.19 |
| UTS Namespace(uts) | 隔离主机名和域名 | 2.6.19 |
| User Namespace (user) | 隔离用户和用户组 | 3.8 |
| Control group (cgroup) Namespace | 隔离 Cgroups 根目录 | 4.6 |
| Time Namespace | 隔离系统时间 | 5.6 |

虽然 Linux 内核提供了8种 Namespace，但是最新版本的 Docker 只使用了其中的前6 种，分别为Mount Namespace、PID Namespace、Net Namespace、IPC Namespace、UTS Namespace、User Namespac

## Mount NameSpace

它可以用来隔离不同的进程或进程组看到的挂载点。通俗地说，就是可以实现在不同的进程中看到不同的挂载目录。

**使用 unshare 命令可以新建 Mount Namespace，并且在新建的 Mount Namespace 内 mount 是和外部完全隔离的**

## PID NameSpace

隔离进程，在不同的PID NameSpace中,进程可以拥有相同的PID号，利用PID NameSpace可以实现每个容器的主进程为1号进程，而容器内的进程在主机上却拥有不同的pid

## UTS NameSpace

隔离主机名的，它可以让每个 UTS NameSpace 拥有一个独立的主机名。

## IPC NameSpace

隔离进程间通信的。

例如 PID Namespace 和 IPC Namespace 一起使用可以实现同一 IPC Namespace 内的进程彼此可以通信，不同 IPC Namespace 的进程却不能通信

## User NameSpace

User Namespace 主要是用来隔离用户和用户组的

一个比较典型的应用场景就是在主机上以非 root 用户运行的进程可以在一个单独的 User Namespace 中映射成 root 用户

使用 User Namespace 可以实现进程在容器内拥有 root 权限，而在主机上却只是普通用户

## Net NameSpace

隔离网络设备，IP和端口等信息

Net Namespace 可以让每个进程拥有自己独立的ip地址，端口信息和网卡信息

# Cgroups

我们知道使用不同的 Namespace，可以实现容器中的进程看不到别的容器的资源，但是有一个问题你是否注意到？容器内的进程仍然可以任意地使用主机的 CPU 、内存等资源，如果某一个容器使用的主机资源过多，可能导致主机的资源竞争，进而影响业务

那如果我们想限制一个容器资源的使用(如CPU,内存等)应该如何做呢?

cgroups : control groups 是 Linux内核的一个功能,它可以实现限制进程或者资源组的资源（如CPU,内存,磁盘IO等）

<details><summary>cgroups主要功能</summary>

</details>

<details><summary>cgroup主要概念</summary>

</details>

```java
(base) luohong@luohong:~$ sudo mount -t cgroup
请验证人脸或密码:
验证成功
cgroup on /sys/fs/cgroup/systemd type cgroup (rw,nosuid,nodev,noexec,relatime,xattr,name=systemd)
cgroup on /sys/fs/cgroup/blkio type cgroup (rw,nosuid,nodev,noexec,relatime,blkio)
cgroup on /sys/fs/cgroup/rdma type cgroup (rw,nosuid,nodev,noexec,relatime,rdma)
cgroup on /sys/fs/cgroup/hugetlb type cgroup (rw,nosuid,nodev,noexec,relatime,hugetlb)
cgroup on /sys/fs/cgroup/pids type cgroup (rw,nosuid,nodev,noexec,relatime,pids)
cgroup on /sys/fs/cgroup/net_cls,net_prio type cgroup (rw,nosuid,nodev,noexec,relatime,net_cls,net_prio)
cgroup on /sys/fs/cgroup/freezer type cgroup (rw,nosuid,nodev,noexec,relatime,freezer)
cgroup on /sys/fs/cgroup/cpu,cpuacct type cgroup (rw,nosuid,nodev,noexec,relatime,cpu,cpuacct)
cgroup on /sys/fs/cgroup/cpuset type cgroup (rw,nosuid,nodev,noexec,relatime,cpuset)
cgroup on /sys/fs/cgroup/memory type cgroup (rw,nosuid,nodev,noexec,relatime,memory)
cgroup on /sys/fs/cgroup/devices type cgroup (rw,nosuid,nodev,noexec,relatime,devices)
cgroup on /sys/fs/cgroup/perf_event type cgroup (rw,nosuid,nodev,noexec,relatime,perf_event)
```

# docker组成

Docker 整体架构采用 C/S（客户端 / 服务器）模式，主要由客户端和服务端两大部分组成。客户端负责发送操作指令，服务端负责接收和处理指令。客户端和服务端通信有多种方式，即可以在同一台机器上通过`UNIX`套接字通信，也可以通过网络连接远程通信

如何查看本机安装路径: `sudo docker info | grep "Docker Root Dir"`

docker 路径下的东西

```java
root@luohong:~# cd /var/lib/docker/
root@luohong:/var/lib/docker# ls
buildkit  containers  engine-id  image  network  overlay2  plugins  runtimes  swarm  tmp  volumes
root@luohong:/var/lib/docker# ls -l
总用量 52
drwx--x--x  4 root root  4096 3月   6 17:33 buildkit
drwx--x--- 12 root root  4096 5月  25 15:23 containers
-rw-------  1 root root    36 3月   6 17:33 engine-id
drwx------  3 root root  4096 3月   6 17:33 image
drwxr-x---  3 root root  4096 3月   6 17:33 network
drwx--x--- 86 root root 12288 6月   5 05:29 overlay2
drwx------  4 root root  4096 3月   6 17:33 plugins
drwx------  2 root root  4096 6月   5 05:29 runtimes
drwx------  2 root root  4096 3月   6 17:33 swarm
drwx------  2 root root  4096 6月   5 05:29 tmp
drwx-----x 10 root root  4096 6月   5 05:29 volumes
```

<details><summary>docker相关组件</summary>

</details>

## docker

docker是Docker客户端的一个完整实现,它是一个二进制文件

Docker 客户端与服务端的交互过程是：docker 组件向服务端发送请求后，服务端根据请求执行具体的动作并将结果返回给 docker，docker 解析服务端的返回结果，并将结果通过命令行标准输出展示给用户。这样一次完整的客户端服务端请求就完成了

## dockerd

dockerd是docker服务端的后台进程常驻进程，用来接受客户端发送的请求，执行具体的处理任务，处理完后将结果返回给客户端

<details><summary>Docker 客户端可以通过多种方式向 dockerd 发送请求，我们常用的 Docker 客户端与 dockerd 的交互方式有三种- </summary>

</details>

## docker-init

如果你熟悉 Linux 系统，你应该知道在 Linux 系统中，1 号进程是 init 进程，是所有进程的父进程。主机上的进程出现问题时，init 进程可以帮我们回收这些问题进程。同样的，在容器内部，当我们自己的业务进程没有回收子进程的能力时，在执行 docker run 启动容器时可以添加 --init 参数，此时 Docker 会使用 docker-init 作为1号进程，帮你管理容器内子进程，例如回收僵尸进程等

## docker-proxy

docker-proxy 主要是用来做端口映射的。当我们使用 docker run 命令启动容器时，如果使用了 -p 参数，docker-proxy 组件就会把容器内相应的端口映射到主机上来，底层是依赖于 iptables 实现的

## **containerd**

containerd 不仅负责容器生命周期的管理，同时还负责一些其它的功能

- 镜像的管理，例如容器镜像运行前从镜像仓库拉取到镜像本地
- 接受dockerd的请求，通过适当的参数调用runc启动容器
- 管理存储相关资源
- 管理网络相关资源

containerd-shim 将 containerd和真正的进程解耦，使用containerd-shim作为容器进程的父进程，从而实现重启containerd不影响已经启动的容器进程

ctr , 他是 containerd 的客户端,主要用于开发和调试，在没有dockerd的环境中，ctr可以充当docker客户端的角色，直接向contanierd守护进程发送操作容器的请求

## runc

runc是一个标准的OCI容器运行时的实现，它是一个命令行的工具，可以直接来创建和运行容器

![Docker知识](/images/posts/docker_common1/img-3.png)

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
