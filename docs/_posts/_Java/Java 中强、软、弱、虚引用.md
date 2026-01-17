---
title: Java 中强、软、弱、虚引用
date: 2021-11-05

sidebar: true
categories:
  - Java
tags:
  - Java
---
## 强引用
```java
    Object object1 = new Object();
```
平时我们写的所有带等号将引用指向对象的引用方式都是强引用

它的特点是如果一个对象有根节点的强引用，那么 GC 绝对不会回收它；如果这个对象没有被引用指向，那么它就会被回收

## 软引用
```java
    SoftReference<Object> object2 = new SoftReference<>(new Object());
```
需要使用 SoftReference（reference 查询）来让一个引用软指向一个对象

它的特点是一个对象有软引用时，当内存不够时，GC 会回收这个对象

它常常用来做缓存，存放一些数据量较大的数据，比如图片，富文本之类的

## 弱引用
```java
    WeakReference<Object> Object3 = new WeakReference<>(new Object());
```
使用 WeakReference 来让一个引用弱指向一个对象

GC 会回收只被弱引用指向的对象，不管内存够不够，注意，不管是软引用还是弱引用，被回收的都是对象，引用是不被回收的。被弱引用关联的对象只能生存到下一次垃圾收集发生为止

ThreadLocal 中的键值对，就是一个弱引用，准确的说是继承了一个弱引用
```java
        static class Entry extends WeakReference<ThreadLocal<?>> {
            /** The value associated with this ThreadLocal. */
            Object value;

            Entry(ThreadLocal<?> k, Object v) {
                super(k);
                value = v;
            }
        }
```
弱引用代码
```java
public class WeakReference<T> extends Reference<T> {

    public WeakReference(T referent) {
        super(referent);
    }
    
    public WeakReference(T referent, ReferenceQueue<? super T> q) {
        super(referent, q);
    }
}
```
父类 Reference 的部分代码
```java
public abstract class Reference<T> {
	...
	private T referent;
	volatile ReferenceQueue<? super T> queue;

    public T get() {
        return this.referent;
    }

	public void clear() {
        this.referent = null;
    }

    Reference(T referent) {
        this(referent, null);
    }

    Reference(T referent, ReferenceQueue<? super T> queue) {
        this.referent = referent;
        this.queue = (queue == null) ? ReferenceQueue.NULL : queue;
    }
}
```

## 虚引用
```java
    private ReferenceQueue<Object> queue = new ReferenceQueue<>();
    PhantomReference<Object> object4 = new PhantomReference<>(new Object(), queue);
```

使用 PhantomReference 来让一个引用虚指向一个对象，**我们无法通过一个虚引用来取得一个对象实例**，虚引用的 get 方法始终返回 null，它一般需要配合一个队列来使用
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/e6f3a4ad320928fe5d66b569911eafe6.png)

它的唯一作用就是为了能在这个对象被回收的时候可以收到一个系统通知，一般用来管理堆外内存

JVM 可以控制一些不再堆中的内存，这些内存是操作系统的，使用堆外内存的好处是当数据从网上下载时不用操作系统拷贝数据给 JVM。NIO 以及 Netty 的 zero copy 都使用了这种技术

JVM 使用一个对象来代表这些堆外内存，这个对象叫 DirectByteBuffer。当 DirectByteBuffer 这个对象被回收的时候我们应该回收对应的堆外内存，不然会造成资源浪费

我们使用一个虚引用指向 DirectByteBuffer，当 DirectByteBuffer 被回收时，说明我们不需要这个堆外内存中的数据了，虚引用会将对应信息放入**引用队列**中。GC 线程监视着这个队列，如果有东西进来了，它会调用函数清理对应的堆外内存（这里的函数是我们定义的，相当于虚引用提供了一个回调功能）

引用的构造函数必须指定引用队列，而其他引用类型没有引用队列一样可以运行，**强引用无法放进引用队列**。引用队列主要用于存放软引用、弱引用和虚引用对象
## 终结器引用
四大天王有五个是常识。终结器引用用来执行对象的 finalize 方法

没有强引用引用对象时，并且该对象重写了 finalize() 方法时，在对象即将被 GC 前，虚拟机会创建终结器引用并且加入引用队列，在本次垃圾回收过程中，对象会被标记为可回收状态，但此时并不会立即回收它

一个优先级很低的线程 Finalizer 查看引用队列中是否有终结器引用，通过终结器引用找到这个对象调用对象的 finallize 方法，然后进行垃圾回收

因此，终结器一般用于**对象的回收跟踪**

finalize 方法执行完成后（有可能在这个方法中对象又被重新引用，从而复活），对象会被再次检查。如果此时对象仍然没有被引用，才会被真正回收

finalize 方法的执行是没有保障的，因为 Finalizer 线程优先级很低，在系统繁忙的时候可能不会被及时执行。滥用 finalize 方法会严重影响垃圾回收的性能，甚至可能导致内存泄漏

从 Java 9 开始，finalize 方法已经被标记为过时，推荐使用 try-with-resources 或者 AutoCloseable 接口来替代它