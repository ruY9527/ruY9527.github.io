---
title: "Redis存储原理和持久化"
date: 2022-01-09 12:00:00
updated: 2025-12-31 13:04:16
permalink: article/redis_storage_write/
categories:
  - "中间件"
tags:
  - "Redis"
description: "Redis的存储和持久"
cover: /images/posts/redis_storage_write/img-1.png
---

> 😀 这里写文章的前言：
> Redis的存储和持久

# 📝 Redis存储原理

## **📔数据库**

Redis服务端一般有**16**个数据库，默认情况下都在**0号**数据库操作，我们也可以通过命令来实现数据库的切换   --select 1-16 命令

对数据库的增删改查，本质上就是通过客户端指向的数据库，查找里面的字典，匹配对应的key，取出对应的value

![Redis存储原理和持久化](/images/posts/redis_storage_write/img-1.png)

## **📔字典表 dict**

每个数据库都有一个字典结构，这个字典里存着两个hash表（为了之后的扩缩容）

**整体使用了一个大的 hash 表, 因为 hash 能够尽可能的提供 O1 时间复杂度的效率**

而这个hash表里有一个dictEntry 组成的数组，里面存放的就是所有的键值对。这个dictEntry还有指向下一个节点的指针，就是为了在hash冲突的情况，采用拉链法扩展出一个链表

向字典表再添加一个元素 `set name xxx`我们会先对key做散列运算，将得到的值再对哈希表的大小做一个取余，假设得到的值是`1`，那么这个key就会落在`1`的位置,如果多个元素都落在同一个元素，就会形成一个链表，比如：

<details><summary>字典表属性解读</summary>

</details>

![Redis存储原理和持久化](/images/posts/redis_storage_write/img-2.png)

### 字典表扩容

1. Redis 会检查字典表的负载因子，如果超过了负载因子的阈值(默认0.8),则进行扩容
1. Redis会计算出一个新的字典表大小,通常为原来的2倍
1. Redis会遍历原来的字典表，将所有的键值对rehash到新的字典表中,在rehash过程中,Redis会计算每个键值对在新的字典表中的位置，并插入
1. rehash完成后，Redis释放原来的字典表，并使用新的字典表替代
1. 重新计算字典表的负载因子，如果仍然超过了阈值，则重复1到4的过程

### 扩容的影响

## **📔RedisObject**

Redis数据库中的每个键值对的键和值都是RedisObject对象,对应字典表的dictEntry

- Type: 类型，可以是String, List，Hash，Set, sortSet其中一种
- Encoding: 底层数据结构的编码类型， 比如String可能是int，embStr，Raw其中一种，不同编码可以在不同场景上优化使用效率
- lru: 记录对象最后一次被访问的时间

<details><summary>ptr: 如果是整数直接存储数据，否则表示指向该数据的指针</summary>

</details>

比如我们执行一个命令 `set user zhao`在字典上的数据结构大概是这样

![Redis存储原理和持久化](/images/posts/redis_storage_write/img-3.png)

# 💾 Redis持久化

持久化是指将内存中的数据保存到磁盘中，以保证数据持久性。Redis支持两种持久化方式：

## RDB

RDB持久化是指将Redis在内存中的数据以快照的形式写入到磁盘中。快照持久化的优点是备份的数据文件比较小，启动时恢复速度快。RDB持久化采用的是单独的进程进行持久化操作，其优点是对系统的IO压力和性能影响很小，同时可以在指定的时间间隔内产生多个数据快照。而缺点就是由于是定时快照，所以如果Redis意外宕机，就会丢失最后一次快照后的所有数据，因此RDB持久化方式主要适用于数据相对重要性不高，可以承受一定数据丢失的场景。

客户端可向服务端发送save或bgsave命令让服务器生成 rdb 文件;或者通过服务器配置文件(**redis.config**)指定触发RDB条件

![Redis存储原理和持久化](/images/posts/redis_storage_write/img-4.png)

### save

1. 当客户端向服务器发送save命令请求进行持久化时，服务器会阻塞save命令之后的其他客户端的请求，直到数据同步完成
1. 如果数据量太大，同步数据会执行很久，而这期间Redis服务器也无法接收其他请求，所以，**最好不要在生产环境使用**`save`**命令。**

![Redis存储原理和持久化](/images/posts/redis_storage_write/img-5.png)

### bgSave

**与save命令不同，bgsave命令是一个异步操作**

当客户端发服务发出bgsave命令时，**Redis服务器主进程会forks一个子进程来数据同步问题，在将数据保存到rdb文件之后，子进程会退出**。

所以，与save命令相比，Redis服务器在处理bgsave采用子线程进行IO写入，而主进程仍然可以接收其他请求，**但forks子进程是同步的，所以forks子进程时，一样不能接收其他请求，这意味着，如果forks一个子进程花费的时间太久(一般是很快的)，bgsave命令仍然有阻塞其他客户的请求的情况发生**

**fork**：在 Linux 系统中，调用 fork() 时，会创建出一个新进程，称为子进程，子进程会拷贝父进程的 page table。如果进程占用的内存越大，进程的 page table 也会越大，那么 fork 也会占用更多的时间。如果 Redis 占用的内存很大，那么在 fork 子进程时，则会出现明显的停顿现象

![Redis存储原理和持久化](/images/posts/redis_storage_write/img-6.png)

<details><summary>**快照生成期间，数据被修改，如何同步最新的数据**</summary>

</details>

### RDB文件

1. 生成临时rdb文件，并写入数据。
1. 完成数据写入，用临时文代替代正式rdb文件。
1. 删除原来的db文件。

### RDB优点

1. 与AOF方式相比，通过rdb文件恢复数据比较快。(因为是二进制压缩文件)
1. rdb文件非常紧凑，适合于数据备份。(因为是二进制压缩文件)
1. 通过RDB进行数据备，由于使用子进程生成，所以对Redis服务器性能影响较小。

### RDB缺点

1. 如果服务器宕机的话，采用RDB的方式会造成某个时段内数据的丢失，比如我们设置10分钟同步一次或5分钟达到1000次写入就同步一次，那么如果还没达到触发条件服务器就死机了，那么这个时间段的数据会丢失。
1. 使用save命令会造成服务器阻塞，直接数据同步完成才能接收后续请求。
1. 使用bgsave命令在forks子进程时，如果数据量太大，forks的过程也会发生阻塞，另外，forks子进程会耗费内存。

## AOF

AOF持久化是指将Redis的写操作以日志的形式记录到磁盘中。AOF持久化在性能和数据完整性方面要优于RDB持久化方式。AOF持久化的优点是数据完整性高，即使Redis宕机，也只会丢失最后一次写操作之后的数据，而对于数据相对重要性比较高的场景，AOF持久化方式是首选。AOF持久化的缺点是对于大量的写操作，日志文件会变得非常大，从而影响恢复速度。

append only file,**AOF持久化方式会记录客户端对服务器的每一次写操作命令，并将这些写操作以Redis协议追加保存到以后缀为aof文件末尾，在Redis服务器重启时，会加载并运行aof文件的命令，以达到恢复数据的目的**

AOF的持久化功能的实现可以分为三个步： 命令追加，文件写入，文件同步

**命令追加: 当 AOF 持久化功能打开时，服务器在执行完一个写命令之后，会将被执行的写命令追加到服务器状态的 aof 缓冲区（aof_buf）的末尾**

**文件写入**与**文件同步: 可能有人不明白为什么将 aof_buf 的内容写到磁盘上需要两步操作，这边简单解释一下**

Linux 操作系统中为了提升性能，使用了页缓存（page cache）。当我们将 aof_buf的内容写到磁盘上时，此时数据并没有真正的落盘，而是在 page cache 中，为了将 page cache 中的数据真正落盘，需要执行 fsync / fdatasync 命令来强制刷盘。这边的文件同步做的就是刷盘操作，或者叫文件刷盘可能更容易理解一些

![Redis存储原理和持久化](/images/posts/redis_storage_write/img-7.png)

### 开启AOF持久化方式

**Redis默认不开启AOF持久化方式，我们可以在配置文件中开启并进行更加详细的配置，如下面的redis.conf文件**

![Redis存储原理和持久化](/images/posts/redis_storage_write/img-8.png)

### 三种写入策略

以上三种策略只是在不同的时机去调用 OS的 fsync()函数;

1. write 只要把日志记录写到内核缓冲区，就返回了, 并不需要等待日志实际写回到磁盘；
1. fsync 需要把日志记录写回到磁盘后才能返回，时间较长。
- Always 策略就是每次写入 AOF 文件数据后，就执行 **fsync**() 函数； (**主线程操作**)
- Everysec 策略就会创建一个异步任务来执行 **fsync**() 函数； (**子线程操作**)
- No 策略就是不执行 **fsync**() 函数, 执行 **write**()函数 , 交给 OS 自己决定调用时机

**如果你不小心执行了 FLUSHALL 命令把所有数据刷掉了**

**但只要 AOF 文件没有被重写，那么只要停止服务器， 移除 AOF 文件末尾的 FLUSHALL 命令， 并重启 Redis ， 就可以将数据集恢复到 FLUSHALL 执行之前的状态**

![Redis存储原理和持久化](/images/posts/redis_storage_write/img-9.png)

### AOF文件重写

AOF将客户端的每一个写操作都追加到aof文件末尾，比如对一个key多次执行incr命令，这时候，aof保存每一次命令到aof文件中，aof文件会变得非常大

![Redis存储原理和持久化](/images/posts/redis_storage_write/img-10.png)

为了解决这个问题，Redis支持aof文件重写，通过重写aof，可以生成一个恢复当前数据的最少命令集，比如上面的例子中那么多条命令，可以重写为

![Redis存储原理和持久化](/images/posts/redis_storage_write/img-11.png)

### 重写时机

1. auto-aof-rewrite-min-size: 表示运行AOF重写时文件的最小大小，默认为64MB
1. auto-aof-rewrite-percentage: 这个值的计算方法是：当前AOF文件大小和上一次重写后AOF文件大小的差值，再除以上一次重写后AOF文件大小。也就是当前AOF文件比上一次重写后AOF文件的增量大小，和上一次重写后AOF文件大小的比值

```bash
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

在重写即将开始之际，redis会创建（fork）一个"重写子进程"，这个子进程会首先读取现有的AOF文件，并将其包含的指令进行分析压缩并写入到一个临时文件中

与此同时，主工作进程会将新接收到的写指令一边累积到内存缓冲区中，一边继续写入到原有的AOF文件中，这样做是保证原有的AOF文件的可用性，避免在重写过程中出现意外

当"重写子进程"完成重写工作后，它会给父进程发一个信号，父进程收到信号后就会将内存中缓存的写指令追加到新AOF文件中,当追加结束后，redis就会用新AOF文件来代替旧AOF文件，之后再有新的写指令，就都会追加到新的AOF文件中了

![Redis存储原理和持久化](/images/posts/redis_storage_write/img-12.png)

### AOF后台重写存在的问题

AOF 后台重写使用子进程进行从写，解决了主进程阻塞的问题，但是仍然存在另一个问题：子进程在进行 AOF 重写期间，服务器主进程还需要继续处理命令请求，新的命令可能会对现有的数据库状态进行修改，从而使得当前的数据库状态和重写后的 AOF 文件保存的数据库状态不一致

### **如何解决 AOF 后台重写存在的数据不一致问题**

为了解决上述问题，**Redis 引入了 AOF 重写缓冲区（aof_rewrite_buf_blocks）**，这个缓冲区在服务器创建子进程之后开始使用，当 Redis 服务器执行完一个写命令之后，它会同时将这个写命令追加到 AOF 缓冲区和 AOF 重写缓冲区

![Redis存储原理和持久化](/images/posts/redis_storage_write/img-13.png)

### AOF优点

AOF只是追加日志文件，因此对服务器性能影响较小，**速度比RDB要快，消耗的内存较少**

### AOF缺点

- AOF方式生成的**日志文件太大，即使通过AOF重写，文件体积仍然很大****。**
- **恢复数据的速度比RDB慢，需要解析语句**

## 混合持久化

### 描述:

混合持久化并不是一种全新的持久化方式，而是对已有方式的优化。混合持久化只发生于 AOF 重写过程。使用了混合持久化，重写后的新 AOF 文件前半段是 RDB 格式的全量数据，后半段是 AOF 格式的增量数据

整体格式为：\[RDB file\]\[AOF tail\]

### 开启

混合持久化的配置参数为 aof-use-rdb-preamble，配置为 yes 时开启混合持久化，在 redis 4 刚引入时，默认是关闭混合持久化的，但是在 redis 5 中默认已经打开了

**混合持久化本质是通过 AOF 后台重写（bgrewriteaof 命令）完成的**，不同的是当开启混合持久化时，fork 出的子进程先将当前全量数据以 RDB 方式写入新的 AOF 文件，然后再将 AOF 重写缓冲区（aof_rewrite_buf_blocks）的增量命令以 AOF 方式写入到文件，写入完成后通知主进程将新的含有 RDB 格式和 AOF 格式的 AOF 文件替换旧的的 AOF 文件

### 优点: 结合 RDB 和 AOF 的优点, 更快的重写和恢复

### **缺点**：AOF 文件里面的 RDB 部分不再是 AOF 格式，可读性差

## **📔持久化文件损坏**

在写入aof日志文件时，如果Redis服务器宕机，则aof日志文件文件会出格式错误，在重启Redis服务器时，Redis服务器会拒绝载入这个aof文件，可以通过以下步骤修复aof并恢复数据

1. 备份现在aof文件，以防万一。
1. 使用redis-check-aof -fix 命令修复aof文件，该命令格式如下

修复aof日志文件

<details><summary>redis-check-aof -fix file.aof</summary>

</details>

## **📔RDB和AOF总结**

1. RDB优点：采用了子进程生成RDB文件，减少对Redis主线程的阻塞，保证Redis的性能;RDB是内存快照，恢复效率高
1. RDB不足: RDB是间隔一段时间生成一次,两次RDB创建之前,如果Redis发生故障,会发生数据丢失
1. AOF优点：采用always配置项时，可以每个命令做一次持久化，可靠性相比RDB更高
1. AOF不足: AOF文件较大,会触发AOF重写，重写时会竞争内部资源；AOF恢复是回放命令操作，速度慢于RDB

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
