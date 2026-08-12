---
title: "Redis的过期策略和内存淘汰"
date: 2022-01-15 12:00:00
updated: 2025-12-31 13:04:13
permalink: article/redis_thy_delete/
categories:
  - "中间件"
tags:
  - "Redis"
description: "Redis的过期和淘汰"
cover: /images/posts/redis_thy_delete/img-1.png
---

> 😀 这里写文章的前言：
> Redis的过期删除和内存淘汰策略

# 📝 过期删除策略

<details><summary>Redis的过期删除策略有3种</summary>

</details>

## 惰性删除

是指⼀个 key 过期后，并不会直接删除，⽽是等到该 key 被再次访问时，才执⾏删除

惰性删除对内存不友好，但是对cpu很友好。只有到key被访问了，我们才会去先判断key是否过期，过期就直接删除key，并返回nil。但是如果有key长时间没有被访问到，内存就会一直被占用

Redis在访问或者修改Key之前，都会调用expireIfNeeded函数对其进行检查，检查Key是否过期：

- 如果过期，则删除该 key，至于选择异步删除，还是选择同步删除，根据 `lazyfree_lazy_expire` 参数配置决定（Redis 4.0版本开始提供参数），然后返回 null 客户端
- 如果没有过期，不做任何处理，然后返回正常的键值对给客户端

redis的惰性删除策略由db.c文件中的 `expireIfNeeded` 实现：

```java
int expireIfNeeded(redisDb *db, robj *key) {
//判断 key 是否过期
if (!keyIsExpired(db,key)) return 0;
..../* 删除过期键 */
....// 如果 server.lazyfree_lazy_expire 为 1 表示异步删除，反之同步删除；
return server.lazyfree_lazy_expire ? dbAsyncDelete(db,key) : dbSyncDelete(db,key);
}
```

## 定期删除

**多少秒**去遍历下内存里的key. 如果过期了删除 (**核心在于不要去影响性能， 时间不宜过长， 次数不宜过多**)

定期删除，对CPU和内存都是折中的选择

Redis实现定期删除： 每轮抽查时，会随机选择20个key判断是否过期

Redis定期删除流程：

1. 定期删除时会遍历每个database（16个），检查当前库中指定个数key
1. 检查每个库中这20个key是否过期，并删除已过期的key
1. 如果本轮检查的已过期 key 的数量，超过 5 个（20/4），也就是「已过期 key 的数量」占比「随机抽取 key 的数量」大于 25%，则继续重复步骤 1；如果已过期的 key 比例小于 25%，则停止继续删除过期 key，然后等待下一轮再检查
1. 程序中有一个全局变量记录到秒到了哪个数据库

定期删除是一个循环的流程，Redis为了保证定期删除不会出现循环过度，导致线程卡死现象，为此增加了定期删除流程的时间上限，默认不会超过25ms

## 定时删除

**绑定一个定时器**，这个定时器会在时间到的时候，把这个Key从内存中删了

定时删除是对内存最友好的，但是对 cpu不友好。键只要一过期，我们就立马去删除key，释放内存空间。但是这意味着cpu需要不断的去遍历所有的key，来判断对方有没有过期

## Redis选择

**综合下来，redis最终采用的是惰性删除+定期删除的方式搭配使用，从库不会主动执行定期删除等策略**

# 内存淘汰策略

进行数据淘汰」这一类策略

又可以细分为「在设置了过期时间的数据中进行淘汰」和「在所有数据范围内进行淘汰」这两类策略

- **volatile**lru：从已设置过期时间的key中，移出最近最少使用的key进行淘汰
- **volatile**ttl：从已设置过期时间的key中， 移出将要过期的key
- **volatile**random：从已设置过期时间的key中随机选择key淘汰
- **allkeys**lru：从key中选择最近最少使用的进行淘汰
- **allkeys**random：从key中随机选择key进行淘汰
- **noeviction (默认)**：当内存达到阈值的时候，新写入操作报错, 触发 OOM

# 如何判定Key已过期

每当我们对一个 key 设置了过期时间时，Redis 会把该 key 带上过期时间存储到一个过期字典（expires dict）中，也就是说「过期字典」保存了数据库中所有 key 的过期时间

RedisDB结构：

```java
typedef struct redisDb {
    dict dict;    / 数据库键空间，存放着所有的键值对 */
    dict *expires; /* 键的过期时间 */
    ....
} redisDb;
```

过期字典数据结构结构如下：

- 过期字典的 key 是一个指针，指向某个键对象；
- 过期字典的 value 是一个 long long 类型的整数，这个整数保存了 key 的过期时间；

![Redis的过期策略和内存淘汰](/images/posts/redis_thy_delete/img-1.png)

字典表实际上是hash表，hash的最大好处就是让我们可以用 O(1) 的时间复杂度快速查找。当我们查询一个key时，redis首先检查该key是否存在于过期字典中

- 如果不存在，则正常读取键值
- 如果存在，则会获取该key的过期时间，然后与当前系统时间进行对比;如果比系统时间大，那就没有过期，否则判定该key已过期，在根据过期删除策略执行对应的操作

![Redis的过期策略和内存淘汰](/images/posts/redis_thy_delete/img-2.png)

# LRU淘汰算法

LRU 全称是 Least Recently Used 翻译为最近最少使用，会选择淘汰最近最少使用的数据

~~ 传统的LRU算法的实现都是基于 链表 结构，链表中的元素按照操作顺序从前往后排列，最新操作的键会被移动到表头，当需要淘汰的时候，只需要删除链表尾部的元素即可，因为链表尾部的元素就代表最久未被使用的元素 ~~

但是Redis并没有采用这种方法实现 LRU 算法，传统的LRU存在两个问题：

- 需要用链表管理所有的缓存数据，这会带来额外的开销
- 当有数据被访问时，需要在链表上把该数据移动到头端，如果大量数据被访问，就会带来很多链表移动操作，会很耗时，进而降低Redis缓存性能

Redis是如何实现LRU的呢？

Redis实现一种近似LRU算法，目的是为了更好的节约内存，它的实现方式是Redis对象结构体中添加一个额外的字段，用于记录此数据的最后一次访问时间

当redis进行内存淘汰的时候，会在字典表中使用随即采样的方法来淘汰，它是随机5个值（可配置），然后淘汰最久没有使用的那个

Redis实现LRU的优点：

- 不用为所有的数据维护一个大链表，节省了内存空间
- 不用在每次数据访问时都移动链表项，提升了缓存的性能

<details><summary>问题（缓存污染）：</summary>

</details>

# LFU

LFU 全称是 Least Frequently Used 翻译为最近最不常用，LFU 算法是根据数据访问次数来淘汰数据的

如果数据过去被访问多次，那么将来被访问的频率也更高

所以， LFU 算法会记录每个数据的访问次数。当一个数据被再次访问时，就会增加该数据的访问次数。这样就解决了偶尔被访问一次之后，数据留存在缓存中很长一段时间的问题，相比于 LRU 算法也更合理一些

LFU算法相比LRU，多记录了 数据访问的频次 ， Redis对象结构如下：

Redis对象头的24 bits 的lru字段被分成两段来存储，高 16 bits 存储ldt(Last Decrement Time),低8bit存储logc(Logistic Counter)

- ldt: 用来记录key的访问时间戳
- logc: 记录key的访问频次，它的值越小表示使用的频率越低，越容易淘汰，每个新加入的key的logc初始值为5

注意，logc 并不是单纯的访问次数，而是访问频次（访问频率），因为 logc 会随时间推移而衰减的

在每次 key 被访问时，会先对 logc 做一个衰减操作，衰减的值跟前后访问时间的差距有关系，如果上一次访问的时间与这一次访问的时间差距很大，那么衰减的值就越大，这样实现的 LFU 算法是根据访问频率来淘汰数据的，而不只是访问次数。访问频率需要考虑 key 的访问是多长时间段内发生的。key 的先前访问距离当前时间越长，那么这个 key 的访问频率相应地也就会降低，这样被淘汰的概率也会更大

对logc做完衰减操作后，就开始对logc进行增加操作，增加操作并不是单纯的+1，而是根据概率增加，如果logc越大的key，它的logc就越难再加

1. 先按照上次访问距离当前的时长，来对 logc 进行衰减；
1. 然后，再按照一定概率增加 logc 的值

redis.conf 提供了两个配置项，用于调整 LFU 算法从而控制 logc 的增长和衰减：

- `lfu-decay-time` 用于调整 logc 的衰减速度，它是一个以分钟为单位的数值，默认值为1，lfu-decay-time 值越大，衰减越慢；
- `lfu-log-factor` 用于调整 logc 的增长速度，lfu-log-factor 值越大，logc 增长越慢

```java
typedef struct redisObject {
...
// 24 bits，用于记录对象的访问信息
unsigned lru:24;  
    ...
} robj;
```

![Redis的过期策略和内存淘汰](/images/posts/redis_thy_delete/img-3.png)

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
