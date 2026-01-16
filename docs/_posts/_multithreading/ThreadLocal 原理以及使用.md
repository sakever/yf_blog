---
title: ThreadLocal 原理以及使用
date: 2023-01-03
categories:
  - 多线程
tags:
  - ThreadLocal
---
在多线程（java web）情况下，在线程类中使用 ThreadLocal 可以为每个线程配置私有的对象
```java
    ThreadLocal<Object> threadLocal = new ThreadLocal<>();
```

# 用法
比如可以这样使用，用 ThreadLocal 保存用户信息。在用户登录拦截时，通过校验的用户可以将该用户常用信息放进 ThreadLocal，在这次请求时可以随时取出来使用，不是公用属性不会存在多线程并发问题：
```java
public class RequestContextCache {

    private static final ThreadLocal<CrmUserInfo> USER_INFO_CACHE = new ThreadLocal<>();

    public static HttpServletRequest getRequest() {
        return (RequestContextHolder.getRequestAttributes()) == null ?
                null : ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
    }

    public static HttpServletResponse getResponse() {
        return ((ServletWebRequest) Objects.requireNonNull(RequestContextHolder.getRequestAttributes())).getResponse();
    }

    public static CrmUserInfo getUser() {
        return USER_INFO_CACHE.get();
    }

    public static void updateStatus(CrmUserStatusEnum crmUserStatusEnum) {
        USER_INFO_CACHE.get().setStatus(crmUserStatusEnum);
    }

    public static void register(CrmUserInfo loginUserInfo) {
        if (USER_INFO_CACHE.get() != null) {
            return;
        }
        USER_INFO_CACHE.set(loginUserInfo);
    }

    public static void clear() {
        USER_INFO_CACHE.remove();
    }
}
```
# 底层结构
这个类中只有一个 ThreadLocal 对象，但是**每一个线程中都有不同的 ThreadLocalMap**，Thread 中定义了 ThreadLocal.ThreadLocalMap threadLocals = null;

**最终的变量是放在了当前线程的 ThreadLocalMap 中，并将 ThreadLocal 这个对象的弱引用作为键**。而 ThreadLocalMap 被定义成了 Thread 类的成员变量
```java
	// ThreadLocal 的 set 方法可以说明一切
    public void set(T value) {
    	// 该方法用于获取当前线程对象
        Thread t = Thread.currentThread();
        // ThreadLocalMap 是 ThreadLocal 的内部类，这让每个线程都有一个 map
        ThreadLocalMap map = getMap(t);
        // map 没有得到，创建一个当前线程的 map
        if (map != null) {
            map.set(this, value);
        } else {
            // 有 map 则向 map 中存值
            createMap(t, value);
        }
    }

    void createMap(Thread t, T firstValue) {
        t.threadLocals = new ThreadLocalMap(this, firstValue);
    }
    
		// new ThreadLocalMap 构造函数
        ThreadLocalMap(ThreadLocal<?> firstKey, Object firstValue) {
        	// INITIAL_CAPACITY = 16，private Entry[] table; table 为散列表
            table = new Entry[INITIAL_CAPACITY];
            // 哈希函数
            int i = firstKey.threadLocalHashCode & (INITIAL_CAPACITY - 1);
            table[i] = new Entry(firstKey, firstValue);
            size = 1;
            // 扩容阈值，散列表中的值超过这个数会触发扩容
            setThreshold(INITIAL_CAPACITY);
        }
```

get 方法如下，如果原先 ThreadLocalMap 中没有值会返回 null，ThreadLocalMap 中的 key 是 ThreadLocal 对象本身，值是我们调用接口存入的值

```java
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
```


存入 map 中的 entry 继承了弱引用
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
因此 Entry 可以转换为：
```java
        static class Entry {
            Object value;
            private ThreadLocal referent;

            Entry(ThreadLocal<?> k, Object v) {
                referent = k;
                value = v;
            }
        }
```

# 为啥要使用弱引用
让一个弱引用当值主要是为了防止内存泄漏，当 ThreadLocal 需要被回收的时候，如果在 map 中的键是强引用，那么这个对象是无法被回收掉的。即使 ThreadLocal 变量生命周期结束了，设置成 null 了，但**如果这个 ThreadLocalMap 中的 Entry 对 ThreadLocal 还是强引用**，此时，这个 ThreadLocal 是不会被销毁的

当然将 ThreadLocal 设置成 static 则是例外，此时它被存放在方法区里

所以 jdk 使用弱引用解决了 Entry 的 key 强引用 ThreadLocal 导致 ThreadLocal 无法回收的问题

就算这么做还是有问题，因为 ThreadLocalMap 的键为弱引用，值为强引用，当所有的线程都没有引用这个对象并且发生 GC 后，键的指向都为 null，**值的指向对象依然没有被回收**，产生了内存泄漏问题

java 为了处理这种问题，定义了方法 replaceStaleEntry，如果系统中 ThreadLocal 变量，调用了它的 get、set 或 remove，三个方法中的任何一个方法，都会**自动触发清理机制**，将 key 为 null 的 value 值清空。如果 key 和 value 都是 null，那么 Entry 对象会被 GC 回收。如果所有的 Entry 对象都被回收了，**属于线程的 ThreadLocalMap 也会被回收了**

但是就算 java 做了这样的处理，也是有可能发生内存泄漏问题的：

1，如果 ThreadLocal 被回收后，一直没有其他的 ThreadLocal 调用 get、set 或 remove 方法，就一定会存在 value 的引用
2，ThreadLocal 如果定义为 static，ThreadLocalMap 是一个线程一个 map。请求进来产生多个线程，线程使用 ThreadLocal，线程结束下一个线程进来。这样的话，ThreadLocal 一直有强引用，无用线程的 ThreadLocalMap 也回收不掉

**所以在开发的时候，需要使用完 ThreadLocal 之后习惯性的调用 ThreadLocal 对象的 remove 方法**（本身来说，直接用 ThreadLocal = null 这种用法就是错误的，应当使用 remove 方法来清除数据）

同时 ThreadLocal 一般会设置为 static，用户请求进来，用一个线程池中线程处理，处理完毕后如果不清理，这个线程可能会处理其他的请求，这时候再调用 ThreadLocal 获取数据，此时会出现问题

那么我们回头来看看 hashMap，弱引用这么好，为什么 hashMap 不使用弱引用优化一下 key 呢？因为没必要，我们不可能使用 map = null 这种语句来删除 key，我们都是调用 remove 方法，因此根本不可能发生内存泄漏
# 碰撞处理
ThreadLocalMap 类似 hashmap，但是所使用的 hash 函数、碰撞处理等方法大不相同

碰撞处理使用**动态寻址法**，当哈希碰撞发生时，从发生碰撞的那个单元起，按照一定的次序，从哈希表中寻找一个空闲的单元，然后把发生冲突的元素存入到该单元。这个空闲单元又称为开放单元或者空白单元

```java
private Entry getEntryAfterMiss(ThreadLocal<?> key, int i, Entry e) {
    Entry[] tab = table;
    int len = tab.length;

    //判断Entry对象如果不为空，则一直循环
    while (e != null) {
        ThreadLocal<?> k = e.get();
        //如果当前Entry的key正好是我们所需要寻找的key
        if (k == key)
            //说明这次真的找到数据了
            return e;
        if (k == null)
            //如果key为空，则清理脏数据
            expungeStaleEntry(i);
        else
            //如果还是没找到数据，则继续往后找
            i = nextIndex(i, len);
        e = tab[i];
    }
    return null;
}
```

为什么不和 hashMap 一样使用列表法呢？它定义了一个 Entry[] 做散列表，最直观的原因是数据量不会像 hashmap 一样，**它的数据量少，因此可以用简单的方法实现，多数线程只有少量 ThreadLocal 变量。并且纯数组结构比链表加节点更易于垃圾回收**

在 ThreadLocalMap.set() 方法的最后，如果执行完启发式清理工作后，未清理到任何数据，且当前散列数组中 Entry 的数量已经达到了列表的扩容阈值(len*2/3)，就开始执行 rehash() 逻辑，也就是扩容处理
```java
// 扩容的入口
private void rehash() {
    // 1. 先全量清理一遍陈旧的Entry（key为null的）
    expungeStaleEntries();
    
    // 2. 清理后如果 size >= threshold × 3/4，则扩容
    // 注意：这里使用 3/4，不是 2/3！
    if (size >= threshold - threshold / 4)
        resize();
}

// 真正的扩容方法
private void resize() {
    Entry[] oldTab = table;
    int oldLen = oldTab.length;
    int newLen = oldLen * 2;  // 双倍扩容
    
    Entry[] newTab = new Entry[newLen];
    int count = 0;
    
    // 3. 遍历旧数组，重新哈希到新数组
    for (int j = 0; j < oldLen; ++j) {
        Entry e = oldTab[j];
        if (e != null) {
            ThreadLocal<?> k = e.get();
            if (k == null) {
                // key已被GC回收，value置null帮助GC
                e.value = null; 
            } else {
                // 重新计算位置：使用新的长度
                int h = k.threadLocalHashCode & (newLen - 1);
                
                // 线性探测找空位（ThreadLocalMap没有链表/红黑树！）
                while (newTab[h] != null)
                    h = nextIndex(h, newLen);
                    
                newTab[h] = e;
                count++;
            }
        }
    }
    
    // 4. 更新数据
    setThreshold(newLen);  // 新阈值 = newLen * 2/3
    size = count;
    table = newTab;
}
```
