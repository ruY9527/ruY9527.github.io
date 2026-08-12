---
title: "ThreadLocal源码阅读"
date: 2020-11-01 12:00:00
updated: 2025-12-31 13:05:40
permalink: article/threadLocal_note/
categories:
  - "Java"
tags:
  - "并发编程"
  - "JVM"
  - "Java"
description: "ThreadLocal源码阅读笔记"
cover: /images/posts/threadLocal_note/img-1.png
---

> 😀 这里写文章的前言：
> 一个简单的开头,简述这篇文章讨论的问题、目标、人物、背景是什么？并简述你给出的答案。

> 可以说说你的故事：阻碍、努力、结果成果，意外与转折。

# 📝 **ThreadLocal源码阅读**

ThreadLocal 是来这个公司有过使用一次的感受,所以就学习阅读下源码。 其实Thread 这个里面,就有一个 Map(这里是用ThreadLocal内部类中实现的) , 里面的key就是 ThreadLocal, value 就是存储的值,所以一个Thread是有多个 ThreadLocal

## 参数

```java
private final int threadLocalHashCode = nextHashCode();

/**
 * The next hash code to be given out. Updated atomically. Starts at
 * zero.
   AtomicInteger 是一个线程安全的,实现原理是采用了cas.	
 */
private static AtomicInteger nextHashCode =
    new AtomicInteger();
```

## 方法

### set 赋值

```java
/**
*	首先获取当前线程.
	调用 getMap 方法, 直接调用 t.trheadLocals来获取 ThreadLocalMap。(ThreadLocalMap这里是ThreadLocal内部自己实现的类)
	如果map不是null的话,就进行set值,这里可以看到 set 的key是this,也就是ThreadLocal它自己.
	否则就是调用createMap方法,走这个方法是可以确认 currentThread中的threadLocals的值是null,所以直接new了一个进行赋值即可.
*/
public void set(T value) {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null)
        map.set(this, value);
    else
        createMap(t, value);
}

ThreadLocalMap getMap(Thread t) {
        return t.threadLocals;
}

void createMap(Thread t, T firstValue) {
        t.threadLocals = new ThreadLocalMap(this, firstValue);
}
```

### get方法

get 获取值方法

```java
/**
	这里可以看到,获取ThreadLocalMap,如果ThreadLocalMap的是null的话,就会走setInitialValue方法。
	如果有值的话,就会进行获取值并且返回.
*/
public T get() {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null) {
        ThreadLocalMap.Entry e = map.getEntry(this);
        if (e != null) {
            @SuppressWarnings("unchecked")
            T result = (T)e.value;
            return result;
        }
    }
    return setInitialValue();
}

/**
	如果获取出来的ThreadLocalMap 不是null的话,就会进行set,这个时候set进去的值,value就是null了.
	如果获取出来是nulld
*/
private T setInitialValue() {
        T value = initialValue();
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null)
            map.set(this, value);
        else
            createMap(t, value);
        return value;
}

protected T initialValue() {
        return null;
}
```

### remove方法

remove 方法就是获取map,如果map不是null的话,就调用m.remove(this)，根据当前this来删除

```java
public void remove() {
    ThreadLocalMap m = getMap(Thread.currentThread());
    if (m != null)
        m.remove(this);
}
```

# **📔为什么要将key设计成ThreadLocal的弱引用？**

如果 ThreadLocal 的 Key 是强引用，同样会发生内存泄漏的。如果 ThreadLocal的Key是强引用，引用的ThreadLocal的对象被回收了，但是ThreadLocalMap还持有ThreadLocal的强引用，如果没有手动删除，ThreadLocal不会被回收，发生内存泄露，用强引用100%发生内存泄漏

如果是弱引用的话，引用的`ThreadLocal`的对象被回收了，即使没有手动删除,`ThreadLocal`也会被回收.`value`也会在`ThreadLocalMap`调用 `set()`、`get()`、

`remove()` 的时候会被清除.

所以两种方案比较下来，还是`ThreadLoacl`的`key`为弱引用好一些

![ThreadLocal源码阅读](/images/posts/threadLocal_note/img-1.png)

# 🤗 总结归纳

ThreadLocal里面的方法也比较少,还是比较好理解的。只要弄清楚ThreadLocal和Thread是怎么在存储的,就很好的理解了

注意 : 使用ThreadLocal一定要进行remove,否则容易出现内存泄漏，从而导致内存溢出

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
