---
title: AQS 组件
date: 2022-08-09
categories:
  - 多线程
tags:
  - AQS
---
AQS 是一个 JUC 下构造同步器的框架，用来构造同步器，如 ReentrantLock、倒计时器、以及自定义同步器，他封装了线程间沟通方式

JUC 是指 Java.util.concurrent 包，它是 Java 平台提供的并发编程工具集。提供如线程池、并发容器、原子变量、锁等工具，旨在简化多线程编程并提高程序的并发性能
## 使用方法（模板模式）
继承 AbstractQueuedSynchronizer 并重写指定的方法，定义获取与释放 state 的流程

有关等待队列的步骤不能也不用重写（因为被 final 定义，而且进队列出队列的方式已经被 AQS 写好了）
## 源码分析以及原理
AQS 的核心原理可以简化为三个部分：

1，状态变量 State：一个 volatile int 类型的变量，用于表示同步状态（如锁是否被持有）
```java
    private volatile int state;
```
如果某个线程可以修改 state，标记该线程为可用线程，如果不可获取，则加入等待队列，使用 CAS 实现对 state 的修改（导入了 Unsafe 类），获取资源的流程则是由用户继承后写入的
```java
	protected final int getState() {
	        return state;
	}
	protected final void setState(int newState) {
	        state = newState;
	}
    protected final boolean compareAndSetState(int expect, int update) {
        return U.compareAndSetInt(this, STATE, expect, update);
    }
```
2，CLH 队列：一个双向链表，用于管理获取锁失败的线程。CLH 完成获取资源线程的排队工作，这个队列中装着内部类 Node，AQS 有一套完整的线程等待与唤醒机制
```java
    static final class Node {
        /** Marker to indicate a node is waiting in shared mode */
        static final Node SHARED = new Node();
        /** Marker to indicate a node is waiting in exclusive mode */
        static final Node EXCLUSIVE = null;
        ...
    }
```
3，CAS 操作：通过 Unsafe 类提供的 CAS 功能来原子性地修改 State

核心工作流程：

- 尝试获取锁：如果被请求的共享资源空闲，则将当前请求资源的线程设置为有效的工作线程，并且将共享资源设置为锁定状态
- 入队等待：如果被请求的共享资源被占用（tryAcquire 失败），线程会被封装成 Node 节点加入 CLH 队列尾部
- 阻塞线程：我们需要一套线程阻塞等待以及被唤醒时锁分配的机制，以独占锁为例，节点入队后，线程会被 LockSupport.park 阻塞
- 释放锁：持有锁的线程释放锁时会调用 release 方法，修改 State 并唤醒队列中的后继节点
## 公平锁和非公平锁
ReentrantLock 默认采用非公平锁，因为考虑获得更好的性能，通过 boolean 来决定是否用公平锁（传入 true 则使用公平锁）

对公平锁而言，首先判断 state 是否为0，如果为0，直接判断 CLH 队列中有没有在等待的线程，如果有，它会在后面排队；如果没有则 CAS 拿锁；如果 state 不为0，后面排队
```java
	// 这是公平锁的acquire方法
    public final void acquire(int arg) {
        if (!tryAcquire(arg) &&
            acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            selfInterrupt();
    }
    // 公平锁特有的tryAcquire方法
    protected final boolean tryAcquire(int acquires) {
        final Thread current = Thread.currentThread();
        int c = getState();
        if (c == 0) {
            // 和非公平锁相比，这里多了一个判断：是否有线程在等待
            if (!hasQueuedPredecessors() &&
                compareAndSetState(0, acquires)) {
                setExclusiveOwnerThread(current);
                return true;
            }
        }
        // 这里和非公平锁一样，都是去排队
        else if (current == getExclusiveOwnerThread()) {
            int nextc = c + acquires;
            if (nextc < 0)
                throw new Error("Maximum lock count exceeded");
            setState(nextc);
            return true;
        }
        return false;
    }
```
对非公平锁而言，在调用 lock 函数的时候它会直接 CAS 试试能不能拿锁，然后进入和公平锁差不多的 acquire 方法，**如果发现锁这个时候被释放了（state==0），非公平锁会直接 CAS 抢锁**，其他的步骤与公平锁相似
```java
static final class NonfairSync extends Sync {
    final void lock() {
        // 和公平锁相比，这里会直接先进行一次CAS，成功就返回了
        if (compareAndSetState(0, 1))
            setExclusiveOwnerThread(Thread.currentThread());
        else
            acquire(1);
    }
    // AbstractQueuedSynchronizer.acquire(int arg)
    public final void acquire(int arg) {
        if (!tryAcquire(arg) &&
            acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            selfInterrupt();
    }
    // 非公平锁的tryAcquire，主要执行nonfairTryAcquire方法
    protected final boolean tryAcquire(int acquires) {
        return nonfairTryAcquire(acquires);
    }
}

final boolean nonfairTryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    int c = getState();
    if (c == 0) {
        // 这里没有对阻塞队列进行判断，直接尝试去抢锁
        if (compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(current);
            return true;
        }
    }
    // 如果抢不到，那就算了
    else if (current == getExclusiveOwnerThread()) {
        int nextc = c + acquires;
        if (nextc < 0) // overflow
            throw new Error("Maximum lock count exceeded");
        setState(nextc);
        return true;
    }
    return false;
}
```
如果一个非公平线程进入 CLH 队列了，那它还是会乖乖排队的，但是在排队之前会进行抢锁流程
## 对资源共享的方式
### 独占
只有一个线程可以获取状态，如 ReentrantLock

在独占状态下可以实现两种模式，公平锁（排队获取锁）与非公平锁（抢锁）
#### ReentrantLock
锁的使用非常简单，但是需要注意一点，lock 方法下必须使用 try 环绕
```java
// 方式一：Oracle 官方推荐的写法
private val look = ReentrantLock()
fun printNumber() {
    look.lock()
    try {
        // TODO
    } finally {
        look.unlock()
    }
}

// 方式二：错误的写法
private val look = ReentrantLock()
fun printNumber() {
    try {
        look.lock()
    } finally {
        look.unlock()
    }
}
```

方法一是 Oracle 推荐的方式， 并且在 「阿里巴巴JAVA开发手册」 明确规定了不建议使用 方式二， 即不建议将 lock.lock() 写在 try...finally 代码块内部。这么做是为了避免线程还未加锁就抛出异常，解锁时对没有没有被上锁的对象解锁，此时会 unlock 方法会抛出异常，覆盖之前的异常信息

有 tryLock 尝试加锁操作，如果失败了，则会立即返回 false。lockInterruptibly 打断其他线程操作
```java
private val look = ReentrantLock()
fun printNumber() {
    val isLocked = look.tryLock()
    if (isLocked) {
        try {
            // TODO
        } finally {
            look.unlock()
        }
    }
}
```
在构造方法中加入 true 定义此锁为公平锁

可重入锁支持 condition 功能，去唤醒特定的线程，下面是一个 condition 实现消费者生产者的例子：
```java
public class ConditionExample {
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();  // 队列不满条件
    private final Condition notEmpty = lock.newCondition(); // 队列不空条件

    private final Queue<String> queue = new LinkedList<>();
    private final int MAX_SIZE = 5;

    public void produce(String data) throws InterruptedException {
        lock.lock();
        try {
            // 队列已满，等待不满条件
            while (queue.size() == MAX_SIZE) {
                System.out.println("队列已满，生产者等待...");
                notFull.await(); // 生产者在notFull条件上等待
            }

            queue.add(data);
            System.out.println("生产数据: " + data + ", 当前队列大小: " + queue.size());

            // 通知消费者队列不为空 - 精确通知，只唤醒消费者线程
            notEmpty.signal();
        } finally {
            // 必须在finally中释放锁，确保锁一定被释放
            lock.unlock();
        }
    }

    public String consume() throws InterruptedException {
        lock.lock();
        try {
            // 队列为空，等待不空条件
            while (queue.isEmpty()) {
                System.out.println("队列为空，消费者等待...");
                notEmpty.await(); // 消费者在notEmpty条件上等待
            }

            String data = queue.poll();
            System.out.println("消费数据: " + data + ", 当前队列大小: " + queue.size());

            // 通知生产者队列不满 - 精确通知，只唤醒生产者线程
            notFull.signal();
            return data;
        } finally {
            lock.unlock();
        }
    }

    // 使用可中断锁尝试获取数据，带超时控制
    public String consumeWithTimeout(long timeout, TimeUnit unit) throws InterruptedException {
        // 尝试获取锁，可设置超时
        if (!lock.tryLock(timeout, unit)) {
            System.out.println("获取锁超时，放弃消费");
            return null;
        }

        try {
            // 使用超时等待
            if (queue.isEmpty() && !notEmpty.await(timeout, unit)) {
                System.out.println("等待数据超时，放弃消费");
                return null;
            }

            if (!queue.isEmpty()) {
                String data = queue.poll();
                System.out.println("消费数据: " + data + ", 当前队列大小: " + queue.size());
                notFull.signal();
                return data;
            }
            return null;
        } finally {
            lock.unlock();
        }
    }

    public static void main(String[] args) {
        ConditionExample example = new ConditionExample();

        // 创建生产者线程
        Thread producer = new Thread(() -> {
            try {
                for (int i = 1; i <= 10; i++) {
                    example.produce("数据-" + i);
                    Thread.sleep(new Random().nextInt(1000));
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        // 创建消费者线程
        Thread consumer = new Thread(() -> {
            try {
                for (int i = 1; i <= 10; i++) {
                    example.consume();
                    Thread.sleep(new Random().nextInt(1000));
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        producer.start();
        consumer.start();
    }
}
```
#### ReadWriteLock
读写锁

和数据库的读写锁定义一样
```java
        ReadWriteLock lock = new ReentrantReadWriteLock();
        Lock lock1 = lock.readLock();
        Lock lock2 = lock.writeLock();
```
### 共享
多个资源都可以访问状态，如信号量、倒计时器、循环栏列等，一般来说有一个上限
#### CountDownLatch（倒计时器）
计算减少锁，中文翻译为倒计时器，基于 AQS

**作用是调用 await 方法让一个或者多个线程阻塞，直至一些线程调用 countDown 方法将减少计数内部的 state 减少为0**，被阻塞的方法才会继续执行

以下是一些常用方法
```java
CountDownLatch(int count); //构造方法，创建一个值为count 的计数器。
​
await();//阻塞当前线程，将当前线程加入阻塞队列。
​
await(long timeout, TimeUnit unit);//在timeout的时间之内阻塞当前线程,时间一过则当前线程可以执行，
​
countDown();//对计数器进行递减1操作，当计数器递减至0时，当前线程会去唤醒阻塞队列里的所有线程。
```
比如如果多个线程执行完毕之后，才可以打印日志，此时可以使用这个类，注意，这个倒计时器只能使用一次。以下是一些使用示例
```java
        CountDownLatch latch = new CountDownLatch(priceKeyList.size());
        List<String> hotel = priceKeyList.stream().map(t -> {
        			try {
                        return intToList.apply(hotelPriceQueryParam);
                    } finally {
                        latch.countDown();
                    }
                })
        ).collect(Collectors.toList());

        try {
            latch.await(timeout, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
        	e.sout;
        }
```

#### CyclicBarrier（循环栅栏）
**它的作用是调用 await 方法让线程等待并且将栅栏中的 state 加1，直到屏障满了才会让它们继续执行并且调用栅栏中的方法，和人满发车一个道理**，以下是它的使用方法：
```java
//循环屏障的定义
CyclicBarrier cyclicBarrier = new CyclicBarrier(20, () -> {System.out.println("ready");});
//在线程中使用这个方法让线程等待
cyclicBarrier.await();
```
它与 CountDownLatch 的最大区别在倒计时器计数到0就打开，无法重置。可重复栅栏凑够人就放行，然后重置继续用
#### Semphore（信号量）
信号量在 Linux 中也是一个比较重要的进程间通信方式

**它定义最多有几个线程同时执行，只有抢到 state 的线程才会运行，抢到 state 的线程可能有多个，其他的线程会在 CLH 队列中等待，如果其中某一个线程运行完毕调用 release 方法，信号量会自动唤醒等待队列中的线程**

信号量最大的作用就是限制一定数目的线程同时访问某个资源，因此，在某些业务资源需要被更改的情况需要特别注意
```java
//定义最多有两个线程同时运行
Semaphore semaphore = new Semaphore(2);
//得到运行许可
semaphore.acquire();
//释放运行许可
semaphore.release();
```

除了以上这些之外，还有 BlockingQueue 族（用来解决生产者消费者问题）等一些其他 API，都在 JUC 包中

## 自定义示例
我们可以继承 AQS 来实现自己的锁，下面是一个 lock 的示例

注意在实现中，tryAcquire 和 acquire 是两个核心方法，它们的关系可以概括为：acquire 是框架提供的模板方法，实现完整的锁获取逻辑（包括尝试、入队、阻塞等），而 tryAcquire 是需要子类实现的钩子方法，即定义是否可以获取锁的具体判断逻辑

```java
import java.util.concurrent.locks.AbstractQueuedSynchronizer;

// 自定义互斥锁（独占锁）
public class MutexLock {
    // 内部继承AQS实现同步器
    private static class Sync extends AbstractQueuedSynchronizer {
        // 尝试获取锁（State=0表示锁未被占用）
        @Override
        protected boolean tryAcquire(int arg) {
            if (compareAndSetState(0, 1)) {
                setExclusiveOwnerThread(Thread.currentThread()); // 标记当前线程持有锁
                return true;
            }
            return false;
        }

        // 尝试释放锁
        @Override
        protected boolean tryRelease(int arg) {
            if (getState() == 0) throw new IllegalMonitorStateException();
            setExclusiveOwnerThread(null);
            setState(0); // 释放锁，State设为0
            return true;
        }

        // 判断当前是否是独占状态
        @Override
        protected boolean isHeldExclusively() {
            return getState() == 1;
        }
    }

    private final Sync sync = new Sync();

    // 加锁方法
    public void lock() {
        sync.acquire(1);
    }

    // 解锁方法
    public void unlock() {
        sync.release(1);
    }

    // 测试示例
    public static void main(String[] args) {
        MutexLock lock = new MutexLock();
        
        Runnable task = () -> {
            lock.lock();
            try {
                System.out.println(Thread.currentThread().getName() + " 获取到锁");
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            } finally {
                lock.unlock();
                System.out.println(Thread.currentThread().getName() + " 释放锁");
            }
        };

        new Thread(task, "Thread-1").start();
        new Thread(task, "Thread-2").start();
    }
}
```