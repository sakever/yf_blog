---
title: FutureTask 源码阅读
date: 2023-04-03

sidebar: ture
categories:
  - Java
tags:
  - Java
---
## Future
我们都知道Future这个接口是为了去除主线程的等待时间，以方便用等待时间处理其他复杂的业务逻辑

这个接口总共只有5个方法，通过方法名就可以见名知意
```java
public interface Future<V> {
    boolean cancel(boolean mayInterruptIfRunning);
    boolean isCancelled();
    boolean isDone();
    V get() throws InterruptedException, ExecutionException;
    V get(long timeout, TimeUnit unit)
        throws InterruptedException, ExecutionException, TimeoutException;
}
```
## FutureTast
FutureTast实现了Future接口以及Callable接口，它的作用主要是获取异步任务的返回值、判断任务执行完毕了没有以及取消任务

这是它的几个状态，state 就代表线程目前运行的状态，它下面的属性都有对应解释
```java
    private volatile int state;
    private static final int NEW          = 0;//创建新线程
    private static final int COMPLETING   = 1;//线程执行中
    private static final int NORMAL       = 2;//线程执行结束
    private static final int EXCEPTIONAL  = 3;//线程执行异常exception
    private static final int CANCELLED    = 4;//线程取消
    private static final int INTERRUPTING = 5;//线程中断中
	private static final int INTERRUPTED  = 6;//线程中断成功
```

## 适配器
FutureTask 实现了 RunnableFuture 接口，则 RunnableFuture 接口继承了 Runnable 接口和 Future 接口，所以 FutureTask 既能当做一个 Runnable 直接被 Thread 执行，也能作为 Future 用来得到 Callable 的计算结果

现在先来看看 FutureTask 是怎么被做一个 Runnable 被 Thread 执行的，FutureTask 可以传入一个 Runnable 接口，因为它使用了适配器模式

以下，通过构造方法传入 Runnable 以及返回值
```java
    public FutureTask(Runnable runnable, V result) {
        this.callable = Executors.callable(runnable, result);
        this.state = NEW;       // ensure visibility of callable
    }
```
Executors的callable方法
```java
    public static <T> Callable<T> callable(Runnable task, T result) {
        if (task == null)
            throw new NullPointerException();
        return new RunnableAdapter<T>(task, result);
    }
```
最终构造了适配器类，这个类继承了Callable，因此可以被看做是一个Callable，构造方法传入runnable以及结果，call则是执行方法
```java
    static final class RunnableAdapter<T> implements Callable<T> {
        final Runnable task;
        final T result;
        RunnableAdapter(Runnable task, T result) {
            this.task = task;
            this.result = result;
        }
        public T call() {
            task.run();
            return result;
        }
    }
```

## run
在new了一个FutureTask对象之后，接下来就是在另一个线程中执行这个Task,无论是通过直接new一个Thread还是通过线程池，执行的都是run()方法，接下来就看看run()方法的实现
```java
    public void run() {
		// 如果目前不是新建状态，直接返回
        if (state != NEW ||
            !UNSAFE.compareAndSwapObject(this, runnerOffset,
                                         null, Thread.currentThread()))
            return;
        // 满足条件后
        try {
            Callable<V> c = callable;
            // 判断c是否空指针以及再次判断state是不是新建
            if (c != null && state == NEW) {
                V result;
                // 标识是否执行成功
                boolean ran;
                try {
                	// 尝试去执行call方法并且把ran标识为true
                    result = c.call();
                    ran = true;
                } catch (Throwable ex) {
                	// 失败了，将返回值设为null，ran设置为false，设置异常
                    result = null;
                    ran = false;
                    setException(ex);
                }
                // 如果执行成功，调用set方法赋值
                if (ran)
                    set(result);
            }
        } finally {
            // runner must be non-null until state is settled to
            // prevent concurrent calls to run()
            runner = null;
            // state must be re-read after nulling runner to prevent
            // leaked interrupts
            int s = state;
            // 如果当前处于被打断的状态，进行对应的处理
            if (s >= INTERRUPTING)
                handlePossibleCancellationInterrupt(s);
        }
    }
```
成功则调用set方法
```java
     protected void set(V v) {
        // CAS切换到中间状态COMPLETING
        if (UNSAFE.compareAndSwapInt(this, stateOffset, NEW, COMPLETING)) {
            // 设置返回值
            outcome = v;
            // 设置为正常结束
            // 到达终态后不能再继续转换，因此可以使用lazySet
            UNSAFE.putOrderedInt(this, stateOffset, NORMAL); // final state
            // 唤醒执行期间因get()阻塞的线程
            finishCompletion();
        }
    }
```
## get
get方法用于获取结果，如果state的值不满足条件（任务还没执行完毕），会进入等待方法

这里int s = state;语句用于获取当前值，state是可以被改变的
```java
    public V get() throws InterruptedException, ExecutionException {
        int s = state;
        if (s <= COMPLETING)
        	// 此时表明任务还没有结束(这里的结束包括任务正常执行完毕，任务执行异常，任务被取消)，则会调用awaitDone()进行阻塞等待
            s = awaitDone(false, 0L);
        // 任务已经结束，调用report()返回结果
        return report(s);
    }
```
如果s小于1会让这个线程等待结果，此时由于各种原因没法获得结果，此时这种情况被称之为阻塞，一般情况下阻塞应该不停判断结果好了没有，这样非常消耗CPU资源，为了节省资源该线程只好去等待
```java
    /**
     * Awaits completion or aborts on interrupt or timeout.
     *
     * @param timed 如果使用定时等待，则为true
     * @param nanos 等待时间，如果timed为true
     */
    private int awaitDone(boolean timed, long nanos)
        throws InterruptedException {
        // 计算等待的截止时间
        final long deadline = timed ? System.nanoTime() + nanos : 0L;
        WaitNode q = null;
        boolean queued = false;
        // 等待时一直判断
        for (;;) {
        	// 如果该线程被打断的话，进行节点清理并且抛出异常
            if (Thread.interrupted()) {
                removeWaiter(q);
                throw new InterruptedException();
            }
			// 获取状态并且进行后续操作
            int s = state;
            if (s > COMPLETING) {
                if (q != null)
                    q.thread = null;
                return s;
            }
            // 表示任务已经结束但是任务执行线程还没来得及给outcome赋值
           	// 这个时候让出执行权让其他线程优先执行
            else if (s == COMPLETING) // cannot time out yet
                Thread.yield();
            else if (q == null)
                q = new WaitNode();
            else if (!queued)
                queued = UNSAFE.compareAndSwapObject(this, waitersOffset,
                                                     q.next = waiters, q);
			// 如果设置了定时等待
            else if (timed) {
            	// 计算需要等待的时间
                nanos = deadline - System.nanoTime();
                if (nanos <= 0L) {
                    removeWaiter(q);
                    return state;
                }
                // 阻塞等待特定时间
                LockSupport.parkNanos(this, nanos);
            }
            else
            	// 阻塞等待直到被其他线程唤醒
                LockSupport.park(this);
        }
    }
```