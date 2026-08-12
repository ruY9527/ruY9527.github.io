---
title: "Java CAS理解"
date: 2021-10-10 12:00:00
updated: 2025-12-31 13:04:54
permalink: article/java_cas1/
categories:
  - "Java"
tags:
  - "Java"
  - "使用入门"
  - "源码分析"
description: "CAS"
---

> 😀 这里写文章的前言：
> 一个简单的开头,简述这篇文章讨论的问题、目标、人物、背景是什么？并简述你给出的答案。

> 可以说说你的故事：阻碍、努力、结果成果，意外与转折。

# 📝 **介绍**

锁在并发处理中占据一席之地，但是使用锁有一个不好的地方，就是当一个线程没有获取到锁的时候会被阻塞挂起来，这会导致线程上下文的切换和重新调度开销。
java提供了非阻塞volatile关键字来解决共享变量的可见性问题，这在一定程度上弥补了锁带来的开销问题，但是volatile只能保证共享可见的问题，不能解决读一改一写的原子性问题。CAS即CompareAndSwap（比较交换），即是JDK提供非阻塞原子性操作

# CAS机制

它包含3个参数CAS（V,E,N），V表示要更新变量的值，E表示预期值，N表示新值。仅当V值等于E值的时候，才会将V的值设置为N;如该V与E的值不一样，则说明已经有其他线程做了更新，则当前线程什么都做不了。最后，CAS返回当前V的真实值
比如看：AtomicInteger#getAndIncrement 的方法

```java
public final int getAndIncrement() {
        return unsafe.getAndAddInt(this, valueOffset, 1);
    }
```

最后调用到 Unsafe 类中
var1:  AtomicInteger 这个对象a
var2:  偏移量(有效地址值)
var5:  AtomicInteger 这个对象a在地址var2上的期待的值
var5 +var4: 是值操作 + 1

```java
public final int getAndAddInt(Object var1, long var2, int var4) {
        int var5;
        do {
            var5 = this.getIntVolatile(var1, var2);
        } while(!this.compareAndSwapInt(var1, var2, var5, var5 + var4));

        return var5;
    }
```

# 底层原理

接着上面的跟进,compareAndSwapInt方法:
var1: 操作对象
var2: 操作对象a的地址偏移量,有效地址
var4: 我们期待这个a是什么值
var5: 表示a的实际值

```java
// native 原生方法
public final native boolean 
	compareAndSwapInt(Object var1, long var2, int var4, int var5);
```

再往下跟,C语言的代码
首先使用 jint 计算了 value 的地址值，然后根据这个地址，使用了 Atomic 的 cmpxchg 方法进行比较交换。将问题抛给了 cmpxchg

```java
UNSAFE_ENTRY(jboolean, Unsafe_CompareAndSwapInt(JNIEnv *env, jobject unsafe, 
                                            jobject obj, jlong offset, jint e, jint x))
  UnsafeWrapper("Unsafe_CompareAndSwapInt");
  oop p = JNIHandles::resolve(obj);
  // 根据偏移量valueOffset，计算 value 的地址
  jint* addr = (jint *) index_oop_from_field_offset_long(p, offset);
  // 调用 Atomic 中的函数 cmpxchg来进行比较交换
  return (jint)(Atomic::cmpxchg(x, addr, e)) == e;
UNSAFE_END
```

cmpxchg函数代码:
现在不同操作系统下会调用不同的 cmpxchg  重载函数

```java
unsigned Atomic::cmpxchg(unsigned int exchange_value,
                         volatile unsigned int* dest, 
                         unsigned int compare_value) {
    assert(sizeof(unsigned int) == sizeof(jint), "more work to do");
  /*
   * 根据操作系统类型调用不同平台下的重载函数，
     这个在预编译期间编译器会决定调用哪个平台下的重载函数
  */
    return (unsigned int)Atomic::cmpxchg((jint)exchange_value, 
                     (volatile jint*)dest, (jint)compare_value);
}
```

再往下跟
move 指令表示是将后面的值移动到前面的寄存器上，然后调用 LOCK_IF_MP 和 下面的 cmpxchg 汇编指令进行了比较交换。
cas指令最终由操作系统汇编指令完成

```java
inline jint Atomic::cmpxchg (jint exchange_value, volatile jint* dest, 
                            jint compare_value) {
  int mp = os::is_MP();
  __asm {
    mov edx, dest
    mov ecx, exchange_value
    mov eax, compare_value
    LOCK_IF_MP(mp)
    cmpxchg dword ptr [edx], ecx
  }
}

inline jint Atomic::cmpxchg (jint exchange_value, 
                             volatile jint* dest, jint compare_value) {
  //1、 判断是否是多核 CPU
  int mp = os::is_MP();
  __asm {
    //2、 将参数值放入寄存器中
    mov edx, dest   
    mov ecx, exchange_value
    mov eax, compare_value 
    //3、LOCK_IF_MP指令
    cmp mp, 0
    //4、 如果 mp = 0，表明线程运行在单核CPU环境下。此时 je 会跳转到 L0 标记处，直接执行 cmpxchg 指令
    je L0
    _emit 0xF0
//5、这里真正实现了比较交换
    L0:
    /*
     * 比较并交换。简单解释一下下面这条指令，熟悉汇编的朋友可以略过下面的解释:
     *   cmpxchg: 即“比较并交换”指令
     *   dword: 全称是 double word 表示两个字，一共四个字节
     *   ptr: 全称是 pointer，与前面的 dword 连起来使用，表明访问的内存单元是一个双字单元 
     * 这一条指令的意思就是：
            将 eax 寄存器中的值（compare_value）与 [edx] 双字内存单元中的值进行对比，
            如果相同，则将 ecx 寄存器中的值（exchange_value）存入 [edx] 内存单元中。
     */
    cmpxchg dword ptr [edx], ecx
  }
}
```

# CAS优缺点

# 优点

cas是一种乐观锁，而且还是非阻塞的轻量级的乐观锁。

一个线程想要获取锁，对方会给一个回应表示这个锁能不能获得。

在资源竞争不激烈的情况下性能高，相对 synchronized 重量锁，synchronized会进行比较复杂的加锁，解锁和唤醒操作

# 缺点

缺点也是一个非常重要的知识点，因为涉及到了一个非常著名的问题，叫做ABA问题。假设一个变量 A ，修改为 B之后又修改为 A，CAS 的机制是无法察觉的，但实际上已经被修改过了。这就是ABA问题，

ABA问题会带来大量的问题，比如说数据不一致的问题等等。我们可以举一个例子来解释说明。

你有一瓶水放在桌子上，别人把这瓶水喝完了，然后重新倒上去。你再去喝的时候发现水还是跟之前一样，就误以为是刚刚那杯水。如果你知道了真相，那是别人用过了你还会再用吗

# 🤗 总结归纳s

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
