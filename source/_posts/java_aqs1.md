---
title: "AbstractQueuedSynchronizer"
date: 2021-10-15 12:00:00
updated: 2025-12-31 13:04:52
permalink: article/java_aqs1/
categories:
  - "Java"
tags:
  - "源码分析"
  - "Java"
description: "AQS"
cover: /images/posts/java_aqs1/img-1.png
---

> 😀 这里写文章的前言：
> 一个简单的开头,简述这篇文章讨论的问题、目标、人物、背景是什么？并简述你给出的答案。

> 可以说说你的故事：阻碍、努力、结果成果，意外与转折。

# 📝 **基本介绍**

AQS(队列同步器)，简称同步锁框架。

同步器是实现锁的关键，利用同步器将锁的语义实现，然后在锁的实现中聚合同步器。

AQS会将请求获取锁失败的线程放入一个队列的尾部：等待获取锁的线程全部处理阻塞状态。当前线程执行完毕（释放锁）后，会激活当前线程的后继节点。

1. 采用模板模式，tryacquire(), release()等方法需要子类覆写。实现了算法主体框架，供外部调用，里面会调用原语操作和钩子操作
1. 原语操作：即定义的抽象方法，子类必须重写
1. 钩子操作：与原语操作类似，也是供子类重写的。区别是钩子可以重写也可以不重写，如果不重写默认使用父类的
1. 一般的lock类都实现Lock接口的，而内部会继承AQS，因为Lock是面向使用者，而AQS这个框架是锁的实现框架，使用者一般不会关注AQS

# CLH队列

## 介绍

CLH锁其实就是一种基于队列(具体为单向链表)排队的自旋锁，由于是Craig、Landin和Hagersten三人一起发明的，因此被命名为CLH 锁，也叫CLH队列锁

简单的CLH锁可以基于单向链表实现，申请加锁的线程首先会通过 CAS操作在单向链表的尾部增加一个节点，之后该线程**只需要在其前驱节点上进行普通自旋**，等待前驱节点释放锁即可

由于CLH锁只有在节点入队时进行一下CAS的操作，在节点加入队列之后，抢锁线程不需要 进行CAS自旋，只需普通自旋即可。因此，在争用激烈的场景下，CLH 锁能大大减少CAS操作的数量，以避免CPU的总线风暴

声明一个node节点，locked是自身，myPred是前一个node节点的引用（组成一个单向链表），因为获取锁的线程，可能是多个，后节点会不断的自旋(**普通自旋**)自己的myPred指向的前一个node的Locked属性，当这个属性探测得到是false的时候，说明前驱节点已经释放了锁，自己应该去抢锁了

![AbstractQueuedSynchronizer](/images/posts/java_aqs1/img-1.png)

# 方法

## 重写方法

|   |   |
| --- | --- |
|  |  |
|  |  |
|  |  |
|  |  |
|  |  |
|  |  |

## 重写模板方法

子类需要重写该方法，AQS中提供的模板方法才可以正常调用

|   |   |
| --- | --- |
|  |  |
|  |  |
|  |  |
|  |  |
|  |  |
|  |  |
|  |  |
|  |  |
|  |  |

## State

volatile关键字进行修饰
0=初始值，没有被线程占用
1=锁已经被抢占（抢占之后调用unlock方法会释放锁，将state=1重置为0

> 1的情况说，说明锁被重入了。举例子：该值等于3，说明已经被重入了3次，最后递减state的时候也应该递减3次，重置为0的时候表示已经释放了锁

```java
/**
* The synchronization state.
*/
private volatile long state;
```

## Node

```java
static final class Node {
        // 共享
        static final Node SHARED = new Node();
        //  独占
        static final Node EXCLUSIVE = null;
        //   当前节点被取消
        static final int CANCELLED =  1;
        // 表示当前节点的后续节点将要或者已经被阻塞，在当前节点释放的时候，
        // 需要unpark唤醒后续节点
        static final int SIGNAL    = -1;
        // 表示当前节点在等待condition，即在condition队列中(在condition队列中)
        static final int CONDITION = -2;
        // 表示releaseShared需要被传播给后续节点(仅在共享模式下使用)
        static final int PROPAGATE = -3;

    	// 等待状态。默认0：无状态，表示当前节点在队列中等待获取锁
        volatile int waitStatus;

       // 上一个节点
        volatile Node prev;

       //  下一个节点
        volatile Node next;

        // 当前线程
        volatile Thread thread;

        // 存储 condition队列中的后续节点
        Node nextWaiter;

    }
```

## AQS的Node

```java
// 头节点，指向队列的第一个节点
    private transient volatile Node head;

    // 尾节点，指向队列的最后一个节点
    private transient volatile Node tail;
```

# FIFO队列

![AbstractQueuedSynchronizer](/images/posts/java_aqs1/img-2.png)

## AQS结构

![AbstractQueuedSynchronizer](/images/posts/java_aqs1/img-3.png)

## **AQS执行流程**

node节点会通过CAS算法把自己变成读取到尾部node节点的下一个节点，不成功的继续自旋读取最新的尾节点再CAS

![AbstractQueuedSynchronizer](/images/posts/java_aqs1/img-4.png)

![AbstractQueuedSynchronizer](/images/posts/java_aqs1/img-5.png)

## **acquire 方法**

```java
public final void acquire(long arg) {
        if (!tryAcquire(arg) &&
            acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            selfInterrupt();
    }

    // tryAcquire 失败之后，addWaiter先快速加入尾部，
   // 失败的话进入enq方法，通过自旋的方式加入尾部
    private Node addWaiter(Node mode) {
        Node node = new Node(Thread.currentThread(), mode);
        // Try the fast path of enq; backup to full enq on failure
        Node pred = tail;
        if (pred != null) {
            node.prev = pred;
            if (compareAndSetTail(pred, node)) {
                pred.next = node;
                return node;
            }
        }
        enq(node);
        return node;
    }

   // 自旋，先看队列里有没有，没有就创建一个队列；有就通过cas加入队尾
    private Node enq(final Node node) {
        for (;;) {
            Node t = tail;
            if (t == null) { // Must initialize
                if (compareAndSetHead(new Node()))
                    tail = head;
            } else {
                node.prev = t;
                if (compareAndSetTail(t, node)) {
                    t.next = node;
                    return t;
                }
            }
        }
    }
```

![AbstractQueuedSynchronizer](/images/posts/java_aqs1/img-6.png)

## **acquireQueued 方法**

1. node.predecessor 找到前一个节点，如果是head节点的话，就CAS获取锁（业务执行块的话，前面锁释放了，这时候尝试获取一些）
2. 如果获取成功的话，当前节点设置头节点，将原来的head节点设置为null
3. 如果1 和 2 不成功，走 shouldParkAfterFailedAcquire，检查自己是不是应该park，如果park之后，交给上一个线程去唤醒

```java
final boolean acquireQueued(final Node node, long arg) {
        boolean failed = true;
        try {
            boolean interrupted = false;
            for (;;) {
                final Node p = node.predecessor();
                if (p == head && tryAcquire(arg)) {
                    setHead(node);
                    p.next = null; // help GC
                    failed = false;
                    return interrupted;
                }
                if (shouldParkAfterFailedAcquire(p, node) &&
                    parkAndCheckInterrupt())
                    interrupted = true;
            }
        } finally {
            if (failed)
                cancelAcquire(node);
        }
    }
```

## release 方法

释放锁的时候，会唤起head节点的下一个节点，当后置节点拿到锁之后，会把head指向自己

```java
public final boolean release(long arg) {
        // 释放锁
        if (tryRelease(arg)) {
            Node h = head;
            if (h != null && h.waitStatus != 0)
                // 唤醒其它节点
                unparkSuccessor(h);
            return true;
        }
        return false;
    }

//   释放锁后需要唤醒其它线程
//   Node node 传递进来是头节点
    private void unparkSuccessor(Node node) {
        /*
         * If status is negative (i.e., possibly needing signal) try
         * to clear in anticipation of signalling.  It is OK if this
         * fails or if status is changed by waiting thread.
         */
        int ws = node.waitStatus;
        if (ws < 0)
            compareAndSetWaitStatus(node, ws, 0);

        /*
         * Thread to unpark is held in successor, which is normally
         * just the next node.  But if cancelled or apparently null,
         * traverse backwards from tail to find the actual
         * non-cancelled successor.
         */
        // 判断头节点的下一个节点是否为空或者是取消状态，如果是，找其他节点
        // 如果不是, 直接唤醒下一个节点
        Node s = node.next;
        if (s == null || s.waitStatus > 0) {
            s = null;
            for (Node t = tail; t != null && t != node; t = t.prev)
                if (t.waitStatus <= 0)
                    s = t;
        }
        if (s != null)
            LockSupport.unpark(s.thread);
    }
```

# 🤗 总结归纳

# 📎 参考文章

- [http://ifeve.com/introduce-abstractqueuedsynchronizer/](http://ifeve.com/introduce-abstractqueuedsynchronizer/)

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
