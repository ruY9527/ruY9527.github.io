---
title: "CDH6.3.2搭建"
date: 2022-07-02 12:00:00
updated: 2025-12-31 12:52:02
permalink: article/cdh6_3_2_create1/
---

> 😀 这里写文章的前言：
> CDH搭建，减少了hadoop集群生态的维护

# 📝 CDH端口开放

|   |   |   |
| --- | --- | --- |
| 端口号 | 组件 | 备注 |
| 7180 | CDH web UI |  |
| 9870 | HDFS web UI |  |
| 8088 | Yarn web UI |  |
| 19888 | Historyserver web UI |  |
| 8080 |  |  |
| 8888 | Hue（未优化） |  |
| 8889 | Hue（优化） |  |
| 3306 | MySQL |  |
| 6379 | Redis |  |
| 9092 | kafka |  |
| 2181 | zk |  |
| 4040 | Spark |  |
| 18088 | Spark |  |
| 10000 | Hiveserve2 |  |
| 10002 | Hive |  |
| 11000 | Oozie |  |
| 51000 | Sentry |  |
| 8020 | HDFS |  |
|  |  |  |

# 修改主机hosts配置

## host

比如这里的配置,每台集群的机器都需要配置, 具体自身的ip和hostname等进行配置

```java
# 在文件末尾添加每个实例的内网IP及对应的hostname

172.17.79.117   hadoop102       hadoop102
172.17.79.116   hadoop103       hadoop103
172.17.79.118   hadoop104       hadoop104
```

## ssh免密配置

配置所有机器之间相互的免密
CDH的服务是有server和agent概念的，agent收集到往server进行汇报情况

执行ssh-keygen -t rsa并敲三次回车，会在我们的/root/.ssh目录下生成两个文件id_rsa（私钥）、id_rsa.pub（公钥）

```java
ssh-keygen -t rsa
cd .ssh
```

将公钥拷贝到免密登录的目标机器上

ssh-copy-id hadoop102

ssh-copy-id hadoop103

ssh-copy-id hadoop104

每台机器上重复ssh等操作

## 集群同步脚步

vim xsync : 将下面的脚步内容给复制到 xsync 中

chmod u+x xsync : 复制完值，给脚步加上对应的权限

```java
#!/bin/bash
#1. 判断参数个数
if [ $# -lt 1 ]
then
  echo Not Enough Arguement!
  exit;
fi
#2. 遍历集群所有机器
for host in hadoop102 hadoop103 hadoop104
do
  echo ====================  $host  ====================
  #3. 遍历所有目录，挨个发送
  for file in $@
  do
    #4. 判断文件是否存在
    if [ -e $file ]
    then
      #5. 获取父目录
      pdir=$(cd -P $(dirname $file); pwd)
      #6. 获取当前文件的名称
      fname=$(basename $file)
      ssh $host "mkdir -p $pdir"
      rsync -av $pdir/$fname $host:$pdir
    else
      echo $file does not exists!
    fi
  done
done
```

## 同步执行指令脚步

vim [xcall.sh](http://xcall.sh/)

chmod u+x [xcall.sh](http://xcall.sh/)

```java
#! /bin/bash

for i in hadoop102 hadoop103 hadoop104
do
        echo --------- $i ----------
        ssh $i "$*"
done
```

## 防火墙检测是否关闭

查看状态: sudo systemctl status firewalld

禁用：    sudo systemctl disable firewalld

停止：    sudo systemctl disable firewalld

## 检查hostname是否成功

hostname

hostnamectl status

## 禁用SELinux mode

**安全增强的Linux (SELinux)允许通过策略设置访问控制。如果在部署CDH时遇到困难，请在将CDH部署到集群之前，在每个主机上将SELinux设置为permissive模式**

getenforce

<details><summary>如果输出结果为Permissive 或Disabled</summary>

1. 打开 /etc/selinux/config 文件
1. 将SELINUX = enforcing 这一行改为 SELINUX= permissive
1. 保存并关闭文件
1. 重新启动系统或运行 setenforce 0 命令来立即禁用 SELinux

</details>

## 禁用透明大页配置

在每台服务器上分别执行

```java
echo never > /sys/kernel/mm/transparent_hugepage/defrag
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo 'echo never > /sys/kernel/mm/transparent_hugepage/defrag' >> /etc/rc.local
echo 'echo never > /sys/kernel/mm/transparent_hugepage/enabled' >> /etc/rc.local
```

```java
# 前两行代码只能暂时生效，当重启后配置会消失
[root@hadoop102 parcel-repo]# echo never > /sys/kernel/mm/transparent_hugepage/defrag
[root@hadoop102 parcel-repo]# echo never > /sys/kernel/mm/transparent_hugepage/enabled

# 永久生效需要把信息加到启动项中
[root@hadoop102 parcel-repo]# echo 'echo never > /sys/kernel/mm/transparent_hugepage/defrag' >> /etc/rc.local
[root@hadoop102 parcel-repo]# echo 'echo never > /sys/kernel/mm/transparent_hugepage/enabled' >> /etc/rc.loca
```

## 启动NTP服务

CDH要求在集群中的每台机器上配置一个网络时间协议(NTP)服务。大多数操作系统使用时间同步的ntpd服务。
注：RHEL 7兼容的操作系统默认使用chronyd而不是ntpd。如果chronyd正在运行，Cloudera Manager将使用它来确定主机时钟是否同步。否则，Cloudera Manager使用ntpd

```java
ps -ef |grep chronyd
```

# yum需要安装的源

```java
yum -y install httpd

systemctl status httpd

systemctl start httpd

# 设置开机自启
systemctl enable httpd.service
```

## yum源工具安装

yum -y install yum-utils createrepo

```java
yum -y install yum-utils createrepo
```

## 导入 cm 资源包

创建/var/www/html/cm文件夹

将资料包中cm文件夹下的文件放入/var/www/html/cm文件夹中

```java
创建/var/www/html/cm文件夹
mkdir cm
```

## 创建 repo

使用createrepo命令创建本地yum源;在/etc/yum.repos.d/文件夹下创建新的yum repo文件

```java
使用createrepo命令创建本地yum源
```

配置了hosts文件的情况下我们可以直接使用hadoop102作为域名访问

```java
===========手动编写repo============
vim /etc/yum.repos.d/cloudera-manager.repo
===========把下面五行代码写入repo文件中=========
[cloudera-manager]
name=Cloudera Manager, Version yum
baseurl=http://hadoop102/cm
gpgcheck=0
enabled=1
```

## 清除缓存

清除缓存并建立新的元数据缓存

```java
// 清除缓存
yum clean all

// 建立元数据缓存
yum makecache

```

```java
xsync /etc/yum.repos.d/cloudera-manager.repo 
yum clean all
yum makecache

# 验证源是否配置生效
yum list | grep cloudera-manager
```

# CM及依赖组件安装

## java环境

xcall yum -y install oracle-j2sdk1.8.x86_64

配置java的环境变量，因为我们在上面已经把/etc/profile中的内容追加到/root/.bashrc中，所以我们现在只需要配置/root/.bashrc文件即可

vim /root/bin/setjavahome.sh

```java
sed -i '$a\# JAVA_HOME' /root/.bashrc
sed -i '$a\export JAVA_HOME=/usr/java/jdk1.8.0_181-cloudera' /root/.bashrc
sed -i '$a\export PATH=$JAVA_HOME/bin:$PATH' /root/.bashrc
sed -i '$a\export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar' /root/.bashrc

xsync /root/bin/setjavahome.sh

# 在三台上同时执行添加环境变量的和同步环境变量的操作
xcall  bash /root/bin/setjavahome.sh && source /root/.bashrc

# 验证java是否安装成功
xcall.sh java -version
```

## mysql安装

```java
wget -v http://repo.mysql.com/mysql-community-release-el7-5.noarch.rpm
sudo rpm -ivh mysql-community-release-el7-5.noarch.rpm
sudo yum -y update
sudo yum -y install mysql-server
sudo systemctl start mysqld

sudo systemctl stop mysqld
```

InnoDB log files 做备份

```java
mkdir /root/backup/
mv /var/lib/mysql/ib_logfile0 /var/lib/mysql/ib_logfile1 /root/backup/
```

/etc/my.cnf文件修改

```java
[mysqld]
datadir=/var/lib/mysql
socket=/var/lib/mysql/mysql.sock
# To prevent deadlocks, set the isolation level to READ-COMMITTED.
transaction-isolation = READ-COMMITTED
# Disabling symbolic-links is recommended to prevent assorted security risks;
# to do so, uncomment this line:
symbolic-links = 0

key_buffer_size = 32M
max_allowed_packet = 16M
thread_stack = 256K
thread_cache_size = 64
query_cache_limit = 8M
query_cache_size = 64M
query_cache_type = 1

#Allow 100 maximum connections for each database and then add 50extra connections. For example, for two databases, set the maximum connections to 250. If you store five databases on one host (the databases for Cloudera Manager Server, Activity Monitor, Reports Manager, Cloudera Navigator, and Hive metastore), set the maximum connections to 550.
max_connections = 550
#expire_logs_days = 10
#max_binlog_size = 100M

#log_bin should be on a disk with enough free space.
#Replace '/var/lib/mysql/mysql_binary_log' with an appropriate path for your
#system and chown the specified folder to the mysql user.
#如果需要替换mysql的log文件存放位置，需要此处拥有足够的空间并且把文件夹的属主改为mysql用户
log_bin=/var/lib/mysql/mysql_binary_log

#In later versions of MySQL, if you enable the binary log and do not set
#a server_id, MySQL will not start. The server_id must be unique within
#the replicating group.
server_id=1

binlog_format = mixed

read_buffer_size = 2M
read_rnd_buffer_size = 16M
sort_buffer_size = 8M
join_buffer_size = 8M

# InnoDB settings
innodb_file_per_table = 1
innodb_flush_log_at_trx_commit  = 2
innodb_log_buffer_size = 64M
innodb_buffer_pool_size = 4G
innodb_thread_concurrency = 8
#The default settings in the MySQL installations in most distributions use conservative buffer sizes and memory usage. Cloudera Management Service roles need high write throughput because they might insert many records in the database. Cloudera recommends that you set the innodb_flush_method property to O_DIRECT.
innodb_flush_method = O_DIRECT
innodb_log_file_size = 512M

[mysqld_safe]
log-error=/var/log/mysqld.log
pid-file=/var/run/mysqld/mysqld.pid
sql_mode=STRICT_ALL_TABLES
```

初始化mysql

配置my.cnf完成后，启动MySQL;需要注意:

1. 因为当前无密码，所以启动时直接回车
1. Disallow root login remotely 选项需要输入 N , 这样 root 用户才能远程访问

```java
sudo systemctl enable mysqld

sudo systemctl start mysqld

sudo /usr/bin/mysql_secure_installation

[...]这里需要配置密码，密码可以为简单密码，例如123456
Enter current password for root (enter for none):（这里需要直接回车）
OK, successfully used password, moving on...
[...]
Set root password? [Y/n] Y
New password:（这里输入自定义的密码）
Re-enter new password:（这里输入自定义的密码）
Remove anonymous users? [Y/n] Y
[...]
Disallow root login remotely? [Y/n] N
[...]
Remove test database and access to it [Y/n] Y
[...]
Reload privilege tables now? [Y/n] Y
All done!
```

将JDBC的jar放入到/usr/share/java文件夹中

```java
mkdir -p /usr/share/java/

cd /usr/share/java/
wget https://cdh-sgg.oss-cn-shenzhen.aliyuncs.com/fileshare/mysql-connector-java-5.1.46-bin.jar

mv mysql-connector-java-5.1.46-bin.jar mysql-connector-java.jar
```

创建各用户数据库（注意hive的数据库叫metastore）

|   |   |   |
| --- | --- | --- |
| Service | Database | User |
| Cloudera Manager Server | scm | scm |
| Activity Monitor | amon | amon |
| Reports Manager | rman | rman |
| Hue | hue | hue |
| Hive Metastore Server | metastore | hive |
| Sentry Server | sentry | sentry |
| ~~Cloudera Navigator Audit Server~~ | ~~nav~~ | ~~nav~~ |
| ~~Cloudera Navigator Metadata Server~~ | ~~navms~~ | ~~navms~~ |
| Oozie | oozie | oozie |

```java
mysql -u root -p
Enter password:
# 建表及修改权限的格式：
CREATE DATABASE <database> DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
GRANT ALL ON <database>.* TO '<user>'@'%' IDENTIFIED BY '<password>';
# 以下是需要执行的SQL语句
# 替换之后需要执行的SQL为：
CREATE DATABASE scm DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE DATABASE amon DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE DATABASE rman DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE DATABASE hue DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE DATABASE metastore DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE DATABASE sentry DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE DATABASE nav DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE DATABASE navms DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE DATABASE oozie DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
GRANT ALL ON scm.* TO 'scm'@'%' IDENTIFIED BY 'scm';
GRANT ALL ON amon.* TO 'amon'@'%' IDENTIFIED BY 'amon';
GRANT ALL ON rman.* TO 'rman'@'%' IDENTIFIED BY 'rman';
GRANT ALL ON hue.* TO 'hue'@'%' IDENTIFIED BY 'hue';
GRANT ALL ON metastore.* TO 'hive'@'%' IDENTIFIED BY 'hive';
GRANT ALL ON sentry.* TO 'sentry'@'%' IDENTIFIED BY 'sentry';
GRANT ALL ON nav.* TO 'nav'@'%' IDENTIFIED BY 'nav';
GRANT ALL ON navms.* TO 'navms'@'%' IDENTIFIED BY 'navms';
GRANT ALL ON oozie.* TO 'oozie'@'%' IDENTIFIED BY 'oozie';
#####注意此处再授权一个本主机名地址，不然web页面配置很容易出错，注意修改本地主机名hostname
GRANT ALL ON amon.* TO 'amon'@'hadoop102' IDENTIFIED BY 'amon';

FLUSH PRIVILEGES;

show grants for 'amon'@'%';  
show grants for 'rman'@'%';  
show grants for 'hive'@'%';
show grants for 'hue'@'%';
show grants for 'oozie'@'%';

quit

systemctl restart mysql.service
```

## 通过yum安装daemons,agent,server

```java
yum list | grep cloudera-manager
yum -y  install cloudera-manager-daemons cloudera-manager-agent cloudera-manager-server

yum list | grep cloudera-manager
yum -y  install cloudera-manager-daemons cloudera-manager-agent
```

```java
[root@hadoop102 ~]# sudo /opt/cloudera/cm/schema/scm_prepare_database.sh mysql scm scm
Enter SCM password: (scm)

JAVA_HOME=/usr/java/jdk1.8.0_181-cloudera
Verifying that we can write to /etc/cloudera-scm-server
Creating SCM configuration file in /etc/cloudera-scm-server
Executing:  /usr/java/jdk1.8.0_181-cloudera/bin/java -cp /usr/share/java/mysql-connector-java.jar:/usr/share/java/oracle-connector-java.jar:/usr/share/java/postgresql-connector-java.jar:/opt/cloudera/cm/schema/../lib/* com.cloudera.enterprise.dbutil.DbCommandExecutor /etc/cloudera-scm-server/db.properties com.cloudera.cmf.db.
log4j:ERROR Could not find value for key log4j.appender.Alog4j:ERROR Could not instantiate appender named "A".
[2021-06-22 21:14:01,762] INFO     0[main] - com.cloudera.enterprise.dbutil.DbCommandExecutor.testDbConnection(DbCommandExecutor.java) - Successfully connected to database.
All done, your SCM database is configured correctly!
```

## 配置本地Parcel存储库

```java
systemctl start cloudera-scm-server
# 重启命令为：systemctl start cloudera-scm-server

# 可以用下面命令查看server的信息
tail -f /var/log/cloudera-scm-server/cloudera-scm-server.log
# 另开启一个窗口，监控日志中是否提示启动成功
tail -f /var/log/cloudera-scm-server/cloudera-scm-server.log|grep "Started Jetty server"
# 也可以用下面命令查看端口号占用情况
netstat -tunlp | grep 7180

# 当你看到以下信息时候 证明启动成功
INFO WebServerImpl:com.cloudera.server.cmf.WebServerImpl: Started Jetty server. 
下面可能会出现报错信息，这个是因为2021年CDH开始正式收费，从官方网站渠道已经无法拉取到任何安装包和校验文件，所以我们在4.4章节中手动上传文件进行校验。
2022-03-01 14:08:23,203 ERROR ParcelUpdateService:com.cloudera.parcel.components.ParcelDownloaderImpl: Failed to download manifest. Status code: 401 URI: https://archive.cloudera.com/p/cdh6/6.3.4/parcels/manifest.json
2022-03-01 14:08:23,203 ERROR ParcelUpdateService:com.cloudera.parcel.components.ParcelDownloaderImpl: Could not retrieve repository info for repo https://archive.cloudera.com/cdh6/6.3/parcels/. Got HTTP response code 401

# 此时登录网页
http://你的hadoop102的IP地址:7180
# 就能访问CDH集群 
默认的用户名：admin
默认的密码为：admin
```

# 参数配置

- dfs.client.use.datanode.hostname
- yarn.nodemanager.resource.cpu-vcores
- yarn.scheduler.maximum-allocation-vcore
- yarn.scheduler.maximum-allocation-mb
- yarn.nodemanager.resource.memory-mb
- spark.dynamicAllocation.enabled

调度相关参数设置:

yarn.scheduler.capacity.root.queues
yarn.scheduler.capacity.root.capacity
yarn.scheduler.capacity.root.spark.capacity
yarn.scheduler.capacity.root.hive.capacity

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
