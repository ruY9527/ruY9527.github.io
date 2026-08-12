---
title: "ArrayList源码分析"
date: 2020-06-30 12:00:00
updated: 2025-12-31 13:05:12
permalink: article/arrayList_code/
categories:
  - "Java"
tags:
  - "Java"
  - "源码分析"
description: "ArrayList源码分析"
cover: /images/posts/arrayList_code/img-1.png
---

> 😀 这里写文章的前言：
> 一个简单的开头,简述这篇文章讨论的问题、目标、人物、背景是什么？并简述你给出的答案。

> 可以说说你的故事：阻碍、努力、结果成果，意外与转折。

# 📝 **ArrayList源码分析**

ArrayList 是代码中使用非常频繁的,所以看底层的代码时非常有必须的.

## 数据结构和参数

DEFAULT_CAPACITY : 默认集合大小;默认值是10

EMPTY_ELEMENTDATA : 空的Object数组,用于后续的初始化和赋值

DEFAULTCAPACTITY_EMPTY_ELEMENTDATA: 默认空的Object数组,也是用于后续的判断和赋值

elementData: 存放ArrayList数据的数组

size: 记录ArrayList中元素的个数;size不一定是elementData的长度

 ArrayList 是一个由 Object \[\] 的数组来实现的;transient Object\[\] elementData ,这个变量就是存放数据的

 长度是用 size 这个变量来记录的,而不是直接调用的数组的长度

 如果ArrayList list = new ArrayList(); 只是仅仅new一个集合的话,数组的大小是没有初始化为10的,而是在add()中,进行判断。 如果数组的是为空的数组的话,就会使用 **DEFAULT_CAPACITY** 来进行初始化。也就是要调用add方法才行

```java
if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
    return Math.max(DEFAULT_CAPACITY, minCapacity);
}
```

## 方法

### add方法

add 里面是走了三个方法, size 没有赋值的情况下,就是0

```java
public boolean add(E e) {
    ensureCapacityInternal(size + 1);  // Increments modCount!!
    elementData[size++] = e;
    return true;
}

// 确认容量 , 打个比方我们没有对size进行赋值,那么size + 1 传入到这个里面的值也就是1,那么 elementData 对应的也就是一个空数组
private void ensureCapacityInternal(int minCapacity) {
     ensureExplicitCapacity(calculateCapacity(elementData, minCapacity));
}

//  满足是空数组的话,就会使用默认的值 10 于 minCapcacity 来进行对比,这里返回的10
private static int calculateCapacity(Object[] elementData, int minCapacity) {
        if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
            return Math.max(DEFAULT_CAPACITY, minCapacity);
        }
        return minCapacity;
    }

//  如果 minCapacity  减去 数组的长度是大于0的,就会调用grow来进行扩容
private void ensureExplicitCapacity(int minCapacity) {
        modCount++;

        // overflow-conscious code
        if (minCapacity - elementData.length > 0)
            grow(minCapacity);
 }

// 这里可以看到先对数组的值进行,然后对保存出来的值进行1.5倍扩容,与传入进来的值进行对比,满足条件赋值.这里就要看到 Arrays.copyOf(elementDate,newCapacity); 这才是真正的对数组进行扩容的方法,也就是直接调用Arrays的API. Arrays.copyOf() 里面最后也是调用了 System.arraycopy()的方法
private void grow(int minCapacity) {
        // overflow-conscious code
        int oldCapacity = elementData.length;
        int newCapacity = oldCapacity + (oldCapacity >> 1);
        if (newCapacity - minCapacity < 0)
            newCapacity = minCapacity;
        if (newCapacity - MAX_ARRAY_SIZE > 0)
            newCapacity = hugeCapacity(minCapacity);
        // minCapacity is usually close to size, so this is a win:
        elementData = Arrays.copyOf(elementData, newCapacity);
    }
到这里 ensureCapacityInternal 方法也就是走完了
---------------------------------------------
后面就是使用 数组下标来进行赋值并且返回true。
```

所以add方法的总体流程如下

![ArrayList源码分析](/images/posts/arrayList_code/img-1.png)

### add根据index添加

在上述的add逻辑之前,进行index是否符合规则的校验

```java
public void add(int index, E element) {
    rangeCheckForAdd(index);

    ensureCapacityInternal(size + 1);  // Increments modCount!!
    System.arraycopy(elementData, index, elementData, index + 1,
                     size - index);
    elementData[index] = element;
    size++;
}

// 检查下标是否越界 , ensureCapacityInternal 方法和上面一样
private void rangeCheckForAdd(int index) {
        if (index > size || index < 0)
            throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
}

//  System.arraycopy() 从 elementDate 的 index处开始复制, 复制给后面的elementDate数组的值,从index + 1 开始复制,也就是说 index 相当于修改了 index + 1, 然后index位置就是没有值了,所以elementDate[index] = element的值,size ++.
```

根据下标添加元素的逻辑流程图

![ArrayList源码分析](/images/posts/arrayList_code/img-2.png)

### set方法

根据下标来对久的值进行一种替换,取出对应下标的值,然后下标对应的位置赋值给新值,最后返回旧值回去即可

```java
// 先检查下标是否越界,如果越界就会抛出异常
public E set(int index, E element) {
    rangeCheck(index);

    E oldValue = elementData(index);
    elementData[index] = element;
    return oldValue;
}

// 取出对应下标的值
    @SuppressWarnings("unchecked")
    E elementData(int index) {
        return (E) elementData[index];
    }
```

set方法逻辑

![ArrayList源码分析](/images/posts/arrayList_code/img-3.png)

### remove方法

根据传入进来的值进行删除

```java
// 分为 null 和 不是 null 的情况来进行删除.满足条件的话,最后都会调用到 fastRemove方法中来
public boolean remove(Object o) {
    if (o == null) {
        for (int index = 0; index < size; index++)
            if (elementData[index] == null) {
                fastRemove(index);
                return true;
            }
    } else {
        for (int index = 0; index < size; index++)
            if (o.equals(elementData[index])) {
                fastRemove(index);
                return true;
            }
    }
    return false;
}

//  根据传入进来的 下标来删除数据,System.arraycopy 这个方法并不默认,根据下标的位置来进行复制数组。
//  可以看到最后有一个 将值设置为null的操作,从注释上看是help GC, 帮助GC
private void fastRemove(int index) {
        modCount++;
        int numMoved = size - index - 1;
        if (numMoved > 0)
            System.arraycopy(elementData, index+1, elementData, index,
                             numMoved);
        elementData[--size] = null; // clear to let GC do its work
    }
```

### remove根据下标删除

可以看到根据下标删除的话，会先判断传入进来的下标是否满足条件,就是没有出现越界的情况

然后取出旧值,接下来的代码就是非常的熟悉了,就是fastRemove() 里面的代码了

```java
public E remove(int index) {
        rangeCheck(index);

        modCount++;
        E oldValue = elementData(index);

        int numMoved = size - index - 1;
        if (numMoved > 0)
            System.arraycopy(elementData, index+1, elementData, index,
                             numMoved);
        elementData[--size] = null; // clear to let GC do its work

        return oldValue;
    }
```

根据下标移除元素逻辑

![ArrayList源码分析](/images/posts/arrayList_code/img-4.png)

# 🤗 总结归纳

大致就是看 ArrayList 是如何添加数据的,对数据是怎么保存的,是如何删除数据的,是怎么样进行扩容的,大致弄明白这些就是对ArrayList有一个大致的了解

# 📎 参考文章

> 💡 有关文章的问题，欢迎您在底部评论区留言，一起交流~
