---
title: "Redis数据结构"
date: 2022-01-20 12:00:00
updated: 2023-07-23 13:23:31
permalink: article/redis_data_structure/
categories:
  - "中间件"
tags:
  - "Redis"
cover: /images/posts/redis_data_structure/img-1.png
---

> 😀 这里写文章的前言：
> Redis的8大数据结构: String,List,Map,Set,ZSet,bitmaps,hperloglogs,geo
> Redis是C++写的,C的很多操作不是很高效,比如, C传统的字符串需要遍历整个长度得到一个长度,与Redis的高效是不符合的，所以需要自己设计一些数据结构

![Redis数据结构](/images/posts/redis_data_structure/img-1.png)

# 📝 动态字符串(SDS)

![Redis数据结构](/images/posts/redis_data_structure/img-2.png)

c语言的字符串频繁修改一个字符串时，会涉及到内存的重分配，比较消耗性能

Redis中的动态字符串就是利用free和len字段，采用内存预分配和惰性空间释放

1. 空间预分配： 减少修改字符串带来的内存重分配的次数，sds采用一次管够的策略，会多分配一些内存；比如上图的capacity就是实际分配的内存，会比字符串的长度要多
1. 惰性空间释放：对字符串进行缩短操作时，程序不立刻使用内存重新分配回收缩短后多余的字节，而是使用free属性将这些字节的数量记录下来，等待后续使用
- Redis的SDS API是安全的，拼接字符串不会造成缓冲区溢出。SDS在拼接字符串之前会检查SDS空间是否满足需求，如果空间不够会自动扩容，所以不会导致缓冲区溢出的问题
- SDS获取字符串长度的时间复杂度是O(1).因为C语言的字符串并不记录自身的长度

字符串对象底层数据结构实现为简单动态字符串(SDS)和直接内存

![Redis数据结构](/images/posts/redis_data_structure/img-3.png)

## int编码

字符串保存的是整数值，并且这个正式可以用long类型来表示，那么其就会直接保存在redisObject的ptr属性里，并将编码设置为int，如图：

![Redis数据结构](/images/posts/redis_data_structure/img-4.png)

## raw编码

字符串保存的**大于 44 字节的字符串值**，则使用简单动态字符串（SDS）结构，并将编码设置为raw，此时内存结构与SDS结构一致，内存分配次数为两次，创建redisObject对象和sdshdr结构，如图：

![Redis数据结构](/images/posts/redis_data_structure/img-5.png)

## embstr编码

字符串保存的**小于等于 44 字节**的字符串值，使用的也是简单的动态字符串（SDS结构），但是内存结构做了优化，内存分配也只需要一次就可完成，分配一块连续的空间即可，如图：

需要注意的是，redis并未提供任何修改embstr的方式，即embstr是**只读**的形式。对embstr的修改实际上是先转换为raw再进行修改

![Redis数据结构](/images/posts/redis_data_structure/img-6.png)

## 小总结

1. Redis中,存储 long,double 类型的浮点数是先转换为字符串再进行存储
1. raw和embStr编码效果是相同的，不同在于内存的释放，raw两次,embSte一次
1. embStr内存块连续，能更好的利用缓存行的优势(有条件下，尽快控制大小小于39)
1. int编码和embStr编码如果能做到追加字符串等操作，满足条件下会被转换成raw编码,embstr编码的对象是只读的，一般修改会转码到raw

# 双向链表

List类型的底层数据结构是由双向链表或压缩表实现的

数据少时用ziplist,数据量多时用linkedlist

```bash
type struct listNode {
  // 前置节点
   struct listNode *prev;

  // 后置节点
  struct listNode *next;

 // 节点值
  void *value
} listNode
```

![Redis数据结构](/images/posts/redis_data_structure/img-7.png)

链表的特性：

1. 双端：链表两端有分别 pre 和 next 指针指向上下两个节点，找到该节点的上一个节点和下一个节点的复杂度是O(1)
1. 无环：头部和尾部的节点的pre和next节点都是null,访问到null就是到末端了
1. 表头和表尾:链表的头部和尾部分别有head指针和tail指针,能直接找到
1. 长度计数器:直接记录长度信息
1. 你可以添加一个元素到列表的**头部（左边：LPUSH）**或者**尾部（右边：RPUSH）**
1. 在社交网络中建立一个时间线模型，使用**LPUSH**去添加**新的元素**到**用户时间线**中，使用**LRANGE**去检索一些**最近插入的条目**

# 压缩表

**列表元素较少的情况下会使用一块连续的内存存储，这个结构是 ziplist，也即是压缩列表。它将所有的元素紧挨着一起存储，分配的是一块连续的内存,查询更快（用偏移量）,但是更新更耗时**

![Redis数据结构](/images/posts/redis_data_structure/img-8.png)

1. zlbytes: 整个ziplist占字节数
1. zltail:  尾节点相对于首地址偏移量
1. zllen:  节点数
1. entry： 保存了前一个节点长度 + 编码 + 内容
1. zlend: 代表结束

<details><summary>**压缩链表和双向链表总结**</summary>

</details>

# 哈希表

**Redis 的字典相当于 Java 语言里面的 HashMap，它是无序字典。内部实现结构上同Java 的 HashMap 也是一致的，同样的数组 + 链表二维结构。第一维 hash 的数组位置碰撞时，就会将碰撞的元素使用链表串接起来**

## **hash-ziplist**

![Redis数据结构](/images/posts/redis_data_structure/img-9.png)

## **hash-hashtable**

![Redis数据结构](/images/posts/redis_data_structure/img-10.png)

# 跳表

链表 + 二分法

![Redis数据结构](/images/posts/redis_data_structure/img-11.png)

1. 一个跳表有几个层(level)组成
1. 跳表的第一层包含所有的元素
1. 每一层都是一个有序的链表
1. 如果元素x出现在第i层,则所有比i小的层都包含x
1. 第i层的元素都通过一个down指针指向下一层拥有相同值的元素
1. 在每一层，-1和1两个元素都出现(分别表示INT_MIN和INT_MAX)
1. Top指针指向最高层的第一个元素

# 🤗 总结归纳

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
