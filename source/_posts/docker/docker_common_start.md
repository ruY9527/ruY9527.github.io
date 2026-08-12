---
title: "Docker搭建组建手册"
date: 2021-05-09 12:00:00
updated: 2025-12-31 13:04:23
permalink: article/docker_common_start/
categories:
  - "docker"
tags:
  - "docker"
---

> 😀 

> 这里写文章的前言：
记录使用docker搭建的各种组建和手册

# 📝 RocketMQ

## 4.9.1版本

### 拉取镜像 & 运行namesrv

```java

sudo docker pull apache/rocketmq:4.9.3

sudo docker network create rocketmq
```

```java
sudo docker run -d --name rocketmq-namesrv --network rocketmq -p 9876:9876 -v /home/luohong/coding/dockers/rocketmq/namesrv/logs:/root/logs -v /home/luohong/coding/dockers/rocketmq/namesrv/store:/root/store apache/rocketmq:4.9.1 sh mqnamesrv
```

<details><summary>> 查看 rocketmq-namesrv 状态</summary>

(base) luohong@luohong:~/coding/dockers/rocketmq$ sudo docker ps
CONTAINER ID   IMAGE                   COMMAND          CREATED         STATUS        PORTS                                                                   NAMES
4b6a5f523bfe   apache/rocketmq:4.9.1   "sh mqnamesrv"   2 seconds ago   Up 1 second   10909/tcp, 0.0.0.0:9876->9876/tcp, :::9876->9876/tcp, 10911-10912/tcp   rocketmq-namesrv

</details>

docker cp 容器ID:容器内文件位置 本地位置

4b6a5f523bfe : 是自己本地允许的 rocketmq-namesrv的 container id

```java
sudo docker cp 4b6a5f523bfe:/home/rocketmq/rocketmq-4.9.1/conf /home/luohong/coding/dockers/rocketmq/broker
```

### borker启动

修broker.conf配置文件;添加如下内容

172.21.129.80 修改为自己的ip地址

```java
# 设置broker节点所在服务器的ip地址（**这个非常重要,主从模式下，从节点会根据主节点的brokerIP2来同步数据，如果不配置，主从无法同步，brokerIP1设置为自己外网能访问的ip，服务器双网卡情况下必须配置，比如阿里云这种，主节点需要配置ip1和ip2，从节点只需要配置ip1即可）
brokerIP1 = 172.21.129.80
#nameServer地址，分号分割
namesrvAddr=172.21.129.80:9876
#Broker 对外服务的监听端口,
listenPort = 10911
#是否允许Broker自动创建Topic
autoCreateTopicEnable = true
#是否允许 Broker 自动创建订阅组
autoCreateSubscriptionGroup = true
#linux开启epoll
useEpollNativeSelector = true
```

默认启动 和 指定内存大小启动 , 二选一

默认启动

```java
docker run -d --name rocketmq-broker-a --network rocketmq -p 10909:10909 -p 10911:10911 -v /home/docker/mount/rocketmq/broker/broker-a/logs:/root/logs -v /home/docker/mount/rocketmq/broker/broker-a/store:/root/store -v /home/docker/mount/rocketmq/broker/broker-a/conf:/home/rocketmq/rocketmq-4.9.3/conf apache/rocketmq:4.9.3 sh mqbroker -c /home/rocketmq/rocketmq-4.9.3/conf/broker.conf
```

指定内存大小启动

```java
	sudo docker run -d --name rocketmq-broker-a --network rocketmq -p 10909:10909 -p 10911:10911 -v /home/luohong/coding/dockers/rocketmq/broker/logs:/root/logs -v /home/luohong/coding/dockers/rocketmq/broker/store:/root/store -v /home/luohong/coding/dockers/rocketmq/broker/conf:/home/rocketmq/rocketmq-4.9.1/conf -e "JAVA_OPT_EXT=-server -Xms1g -Xmx1g -Xmn512m" apache/rocketmq:4.9.1 sh mqbroker -c /home/rocketmq/rocketmq-4.9.1/conf/broker.conf
```

### 控制台启动

```java
sudo docker run -d --name rocketmq-console --network rocketmq -e "JAVA_OPTS=-Drocketmq.namesrv.addr=rocketmq-namesrv:9876 -Dcom.rocketmq.sendMessageWithVIPChannel=false" -p 8000:8080 apacherocketmq/rocketmq-dashboard:latest
```

## docker-**compose搭建集群**

以下ip和路径都根据自己真实的ip和路径进行调整

创建目录

```java
mkdir -p /home/luohong/coding/dockers/rocketmq/clusters/{logs-nameserver-m,logs-nameserver-s,logs-a,logs-a-s,logs-b,logs-b-s,store-a,store-a-s,store-b,store-b-s,conf}
```

**broker-a.conf**

```java
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#所属集群名字，同一个集群名字相同
brokerClusterName=rocketmq-cluster
#broker名字
brokerName=broker-a
#0表示master >0 表示slave
brokerId=0
#删除文件的时间点，凌晨4点
deleteWhen=04
#文件保留时间 默认是48小时
fileReservedTime=168
#异步复制Master
brokerRole=ASYNC_MASTER
#刷盘方式，ASYNC_FLUSH=异步刷盘，SYNC_FLUSH=同步刷盘 
flushDiskType=ASYNC_FLUSH
#Broker 对外服务的监听端口
listenPort=10911
#nameServer地址，这里nameserver是单台，如果nameserver是多台集群的话，就用分号分割（即namesrvAddr=ip1:port1;ip2:port2;ip3:port3）
namesrvAddr=172.21.129.80:9876;172.21.129.80:9877
#每个topic对应队列的数量，默认为4，实际应参考consumer实例的数量，值过小不利于consumer负载均衡
defaultTopicQueueNums=8
#是否允许 Broker 自动创建Topic，生产建议关闭
autoCreateTopicEnable=true
#是否允许 Broker 自动创建订阅组，生产建议关闭
autoCreateSubscriptionGroup=true
#设置BrokerIP
brokerIP1=172.21.129.80
```

**broker-b.conf**

```java
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#所属集群名字
brokerClusterName=rocketmq-cluster
#broker名字，注意此处不同的配置文件填写的不一样  例如：在a.properties 文件中写 broker-a  在b.properties 文件中写 broker-b
brokerName=broker-b
#0 表示 Master，>0 表示 Slave
brokerId=0
#删除文件时间点，默认凌晨 4点
deleteWhen=04
#文件保留时间，默认 48 小时
fileReservedTime=168
#Broker 的角色，ASYNC_MASTER=异步复制Master，SYNC_MASTER=同步双写Master，SLAVE=slave节点
brokerRole=ASYNC_MASTER
#刷盘方式，ASYNC_FLUSH=异步刷盘，SYNC_FLUSH=同步刷盘 
flushDiskType=SYNC_FLUSH
#Broker 对外服务的监听端口
listenPort=11911
#nameServer地址，这里nameserver是单台，如果nameserver是多台集群的话，就用分号分割（即namesrvAddr=ip1:port1;ip2:port2;ip3:port3）
namesrvAddr=172.21.129.80:9876;172.21.129.80:9877
#每个topic对应队列的数量，默认为4，实际应参考consumer实例的数量，值过小不利于consumer负载均衡
defaultTopicQueueNums=8
#是否允许 Broker 自动创建Topic，生产建议关闭
autoCreateTopicEnable=true
#是否允许 Broker 自动创建订阅组，生产建议关闭
autoCreateSubscriptionGroup=true
#设置BrokerIP
brokerIP1=172.21.129.80
```

**broker-a-s.conf**

```java
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#所属集群名字
brokerClusterName=rocketmq-cluster
#broker名字，注意此处不同的配置文件填写的不一样  例如：在a.properties 文件中写 broker-a  在b.properties 文件中写 broker-b
brokerName=broker-a
#0 表示 Master，>0 表示 Slave
brokerId=1
#删除文件时间点，默认凌晨 4点
deleteWhen=04
#文件保留时间，默认 48 小时
fileReservedTime=168
#Broker 的角色，ASYNC_MASTER=异步复制Master，SYNC_MASTER=同步双写Master，SLAVE=slave节点
brokerRole=SLAVE
#刷盘方式，ASYNC_FLUSH=异步刷盘，SYNC_FLUSH=同步刷盘 
flushDiskType=SYNC_FLUSH
#Broker 对外服务的监听端口
listenPort=12911
#nameServer地址，这里nameserver是单台，如果nameserver是多台集群的话，就用分号分割（即namesrvAddr=ip1:port1;ip2:port2;ip3:port3）
namesrvAddr=172.21.129.80:9876;172.21.129.80:9877
#每个topic对应队列的数量，默认为4，实际应参考consumer实例的数量，值过小不利于consumer负载均衡
defaultTopicQueueNums=8
#是否允许 Broker 自动创建Topic，生产建议关闭
autoCreateTopicEnable=true
#是否允许 Broker 自动创建订阅组，生产建议关闭
autoCreateSubscriptionGroup=true
#设置BrokerIP
brokerIP1=172.21.129.80
```

**broker-b-s.conf**

```java
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
brokerClusterName=rocketmq-cluster
brokerName=broker-b
#slave
brokerId=1
deleteWhen=04
fileReservedTime=168
brokerRole=SLAVE
flushDiskType=ASYNC_FLUSH
#Broker 对外服务的监听端口
listenPort=13911
#nameServer地址，这里nameserver是单台，如果nameserver是多台集群的话，就用分号分割（即namesrvAddr=ip1:port1;ip2:port2;ip3:port3）
namesrvAddr=172.21.129.80:9876;172.21.129.80:9877
#每个topic对应队列的数量，默认为4，实际应参考consumer实例的数量，值过小不利于consumer负载均衡
defaultTopicQueueNums=8
#是否允许 Broker 自动创建Topic，生产建议关闭
autoCreateTopicEnable=true
#是否允许 Broker 自动创建订阅组，生产建议关闭
autoCreateSubscriptionGroup=true
#设置BrokerIP
brokerIP1=172.21.129.80
```

**docker-compose.yml 文件**

volumes 挂载前的路径切换为自己的真实的路径

ip 和 端口等信息，也可以根据自己实际的情况来真实的调整

```java
version: '2'
services:
  namesrv1:
    image: apache/rocketmq:4.9.1
    container_name: rmqnamesrv1
    ports:
      - 9876:9876
    volumes:
      - /home/luohong/coding/dockers/rocketmq/clusters/logs-nameserver-m:/home/rocketmq/logs
    environment:
      JAVA_OPT_EXT: -server -Xms512m -Xmx512m -Xmn150m
    command: sh mqnamesrv
  namesrv2:
    image: apache/rocketmq:4.9.1
    container_name: rmqnamesrv2
    ports:
      - 9877:9877
    volumes:
      - /home/luohong/coding/dockers/rocketmq/clusters/logs-nameserver-s:/home/rocketmq/logs
    environment:
      JAVA_OPT_EXT: -server -Xms512m -Xmx512m -Xmn150m
    command: sh mqnamesrv
  broker-a-m:
      image: apache/rocketmq:4.9.1
      container_name: rmqbroker-a-master
      ports:
        - 10909:10909
        - 10911:10911
        - 10912:10912
      volumes:
      - /home/luohong/coding/dockers/rocketmq/clusters/logs-a:/root/logs
      - /home/luohong/coding/dockers/rocketmq/clusters/store-a:/root/store
      - /home/luohong/coding/dockers/rocketmq/clusters/conf/broker-a.conf:/home/rocketmq/rocketmq-4.9.1/conf/broker.conf
      environment:
        JAVA_OPT_EXT: -server -Xms512m -Xmx512m -Xmn150m
        NAMESRV_ADDR: 172.21.129.80:9876;172.21.129.80:9877
      command: sh mqbroker  -c /home/rocketmq/rocketmq-4.9.1/conf/broker.conf
  broker-b-m:
    image: apache/rocketmq:4.9.1
    container_name: rmqbroker-b-master
    ports:
      - 11909:11909
      - 11911:11911
      - 11912:11912
    volumes:
    - /home/luohong/coding/dockers/rocketmq/clusters/logs-b:/root/logs
    - /home/luohong/coding/dockers/rocketmq/clusters/store-b:/root/store
    - /home/luohong/coding/dockers/rocketmq/clusters/conf/broker-b.conf:/home/rocketmq/rocketmq-4.9.1/conf/broker.conf
    environment:
      JAVA_OPT_EXT: -server -Xms512m -Xmx512m -Xmn150m
      NAMESRV_ADDR: 172.21.129.80:9876;172.21.129.80:9877
    command: sh mqbroker  -c /home/rocketmq/rocketmq-4.9.1/conf/broker.conf
  broker-a-s:
    image: apache/rocketmq:4.9.1
    container_name: rmqbroker-a-slave
    ports:
      - 12909:12909
      - 12911:12911
      - 12912:12912
    volumes:
      - /home/luohong/coding/dockers/rocketmq/clusters/logs-a-s:/root/logs
      - /home/luohong/coding/dockers/rocketmq/clusters/store-a-s:/root/store
      - /home/luohong/coding/dockers/rocketmq/clusters/conf/broker-a-s.conf:/home/rocketmq/rocketmq-4.9.1/conf/broker.conf
    environment:
      JAVA_OPT_EXT: -server -Xms512m -Xmx512m -Xmn150m
      NAMESRV_ADDR: 172.21.129.80:9876;172.21.129.80:9877
    command: sh mqbroker  -c /home/rocketmq/rocketmq-4.9.1/conf/broker.conf
  broker-b-s:
    image: apache/rocketmq:4.9.1
    container_name: rmqbroker-b-slave
    ports:
      - 13909:13909
      - 13911:13911
      - 13912:13912
    volumes:
      - /home/luohong/coding/dockers/rocketmq/clusters/logs-b-s:/root/logs
      - /home/luohong/coding/dockers/rocketmq/clusters/store-b-s:/root/store
      - /home/luohong/coding/dockers/rocketmq/clusters/conf/broker-b-s.conf:/home/rocketmq/rocketmq-4.9.1/conf/broker.conf
    environment:
      JAVA_OPT_EXT: -server -Xms512m -Xmx512m -Xmn150m
      NAMESRV_ADDR: 172.21.129.80:9876;172.21.129.80:9877
    command: sh mqbroker  -c /home/rocketmq/rocketmq-4.9.1/conf/broker.conf
    depends_on:
      - namesrv1
      - namesrv2
```

**172.21.129.80和端口修改为自己的;也就是ip和端口**

```java
sudo docker run -d --name rocketmq-console1 -e "JAVA_OPTS=-Drocketmq.namesrv.addr=172.21.129.80:9876;172.21.129.80:9877 -Dcom.rocketmq.sendMessageWithVIPChannel=false" -p 8000:8080 apacherocketmq/rocketmq-dashboard:latest
```

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
