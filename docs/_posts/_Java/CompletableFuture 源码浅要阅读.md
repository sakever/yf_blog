---
title: CompletableFuture 源码浅要阅读
date: 2023-03-03

categories:
  - Java
tags:
  - CompletableFuture
---
completablefuture 的使用相当便捷，不过它的方法初次学习起来也相当困难，简单的阅读一下它的实现原理可能会让我们更好的掌握这个类的使用。不过它的源码读起来也和它的使用一样，相当抽象。。。异常抽象
# 注释
进入代码发现它的注释就有老长一段，以下是比较有用的部分：

- CompletableFuture 是一个在完成时可以触发相关方法和操作的 Future，并且它可以视作为 CompletableStage
- CompletableFuture 的取消会被视为异常完成。调用 cancel 方法会和调用 completeExceptionally 方法具有同样的效果
- 如果没有显示指定的 Executor 的参数，则会调用默认的 ForkJoinPool.commonPool()，最好使用指定的线程池，由于守护线程的原因使用默认线程池的话会出现一些奇妙的 bug

它实现了 Future 以及 CompletionStage
```java
public class CompletableFuture<T> implements Future<T>, CompletionStage<T>
```

# 创建一个 CompletableFuture
众所周知，创建一个 CompletableFuture 可以使用 run 组和 supply 组的方法，那么这两者创建的 CompletableFuture 有什么不同呢

supplyAsync 的源码：
```java
    public static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier) {
        return asyncSupplyStage(asyncPool, supplier);
    }

	// 逻辑运行的主要方法
    static <U> CompletableFuture<U> asyncSupplyStage(Executor e,
                                                     Supplier<U> f) {
        if (f == null) throw new NullPointerException();
        // new 一个新的 CompletableFuture
        CompletableFuture<U> d = new CompletableFuture<U>();
        // 进入线程池，此时业务逻辑已经在执行了
        e.execute(new AsyncSupply<U>(d, f));
        // 返回 CompletableFuture
        return d;
    }
```
我们看到进入线程池的是一个 AsyncSupply 对象，里面包含了这个新创建的 CompletableFuture 以及我们重写的 supplier

同时看到 CompletableFuture 直接返回，标志了这是一个异步任务，可以猜测与同步实现的区别就在这

runAsync 的源码：
```java
    static CompletableFuture<Void> asyncRunStage(Executor e, Runnable f) {
        if (f == null) throw new NullPointerException();
        CompletableFuture<Void> d = new CompletableFuture<Void>();
        e.execute(new AsyncRun(d, f));
        return d;
    }
```
看到两者没什么不同，都是条件判断加丢进线程池。区别在于这次丢进去的是 AsyncRun

事实上其他的几个创建 CompletableFuture 的方法都类似这样，也可以猜测 AsyncRun 的实现与 AsyncSupply 大差不差
# AsyncSupply类
AsyncSupply 是 CompletableFuture 的内部类，这是它的所有源码：
```java
    static final class AsyncSupply<T> extends ForkJoinTask<Void>
            implements Runnable, AsynchronousCompletionTask {
        CompletableFuture<T> dep; Supplier<T> fn;
        AsyncSupply(CompletableFuture<T> dep, Supplier<T> fn) {
            this.dep = dep; this.fn = fn;
        }

        public final Void getRawResult() { return null; }
        public final void setRawResult(Void v) {}
        public final boolean exec() { run(); return true; }

        public void run() {
            CompletableFuture<T> d; Supplier<T> f;
            if ((d = dep) != null && (f = fn) != null) {
                dep = null; fn = null;
                // 传入的是一个 new CompletableFuture，它所包含的值为 null 才正常
                if (d.result == null) {
                    try {
                        d.completeValue(f.get());
                    } catch (Throwable ex) {
                        d.completeThrowable(ex);
                    }
                }
                d.postComplete();
            }
        }
    }
```

## 奇怪的地方
等等等等，你们发现了一个奇怪的地方吗
```java
        CompletableFuture<T> dep; Supplier<T> fn;
        AsyncSupply(CompletableFuture<T> dep, Supplier<T> fn) {
            this.dep = dep; this.fn = fn;
        }
        ...
        public void run() {
            CompletableFuture<T> d; Supplier<T> f;
            if ((d = dep) != null && (f = fn) != null)
            ...
```
为什么要定义两次 CompletableFuture 以及 Supplier 呢，这么做有什么好处吗？

run 方法中的判断 (d = dep) != null && (f = fn) != null 是为了确保在执行任务之前，依赖的 CompletableFuture 和 Supplier 都没有被意外地修改或清空。主要是为了避免并发问题，多个线程可能同时访问和修改 dep 和 fn 字段。通过将 dep 和 fn 赋值给局部变量 d 和 f，可以确保在执行任务时使用的是这些字段的当前值（因为保存到栈帧中了），而不是可能被其他线程修改后的值

这里还可以减少不必要的检查，在 run 方法中，直接使用局部变量 d 和 f 而不是多次访问 dep 和 fn，可以减少不必要的内存访问，提高性能

它还可以防止空指针异常，如果 dep 或 fn 在任务执行前被其他线程设置为 null，那么在调用 f.get() 时会抛出 NullPointerException。通过这个判断，可以提前检查并避免这种情况
## d.completeValue(f.get()) 语句
该方法使用 UNSAFE 类的 CAS 操作，将 supplier 结果设置给 CompletableFuture 的 RESULT
```java
    final boolean completeValue(T t) {
        return UNSAFE.compareAndSwapObject(this, RESULT, null,
                                           (t == null) ? NIL : t);
    }
```
那 CompleteThrowable 一定就是异常的处理了
```java
    final boolean completeThrowable(Throwable x) {
        return UNSAFE.compareAndSwapObject(this, RESULT, null,
                                           encodeThrowable(x));
    }
```
链式调用的代码，实现在 postComplete 中
```java
    final void postComplete() {
    	// 初始化当前 CompletableFuture
        CompletableFuture<?> f = this; Completion h;
        // 循环直到 f 的 stack 为空，如果 f 不是当前实例但其 stack 不为空也好进行循环
        while ((h = f.stack) != null ||
               (f != this && (h = (f = this).stack) != null)) {
            CompletableFuture<?> d; Completion t;
            // 使用 compareAndSet 方法原子地更新 f 的 stack，确保线程安全
            if (STACK.compareAndSet(f, h, t = h.next)) {
            	// 如果 t 不为空，表示还有更多的 Completion 需要处理
                if (t != null) {
                    if (f != this) {
                    	// 压栈
                        pushStack(h);
                        continue;
                    }
                    NEXT.compareAndSet(h, t, null); // try to detach
                }
                // 调用 h.tryFire(NESTED) 尝试触发当前的 Completion 任务
                f = (d = h.tryFire(NESTED)) == null ? this : d;
            }
        }
    }
```
postComplete 方法的主要目的是在 CompletableFuture 完成后，递归地触发所有依赖于它的 Completion 任务，确保整个依赖链上的所有任务都能正确地完成。通过使用 CAS 操作和栈来管理依赖关系，确保了线程安全和高效的处理

压进栈中的是 CompletionStage，那 CompletionStage 是什么
# CompletionStage
官方定义中，一个 Function，Comsumer 或者 Runnable 都可以被描述为一个 CompletionStage

CompletionStage 是一个可能执行异步计算的**阶段**，这个阶段会在另一个 CompletionStage 完成时调用去执行动作或者计算，一个 CompletionStage 会以正常完成或者中断的形式完成，并且它的完成会触发其他依赖的CompletionStage。CompletionStage 接口的方法一般都返回新的 CompletionStage，因此构成了链式的调用

```java
public interface CompletionStage<T> {

    public <U> CompletionStage<U> thenApply(Function<? super T,? extends U> fn);

    public <U> CompletionStage<U> thenApplyAsync
        (Function<? super T,? extends U> fn);
	...
```
可以看到，CompletableFuture 的所有后续操作都在 CompletionStage 中被定义

选择一个简单的后续操作，看看在 CompletableFuture 中的实现
```java
    public <U> CompletableFuture<U> thenApply(
        Function<? super T,? extends U> fn) {
        return uniApplyStage(null, fn);
    }

    private <V> CompletableFuture<V> uniApplyStage(
        Executor e, Function<? super T,? extends V> f) {
        // 异常判断
        if (f == null) throw new NullPointerException();
        CompletableFuture<V> d =  new CompletableFuture<V>();
        // 条件判断，线程池是否为null以及CompletableFuture是否已经运行
        if (e != null || !d.uniApply(this, f, null)) {
            UniApply<T,V> c = new UniApply<T,V>(e, d, this, f);
            //放进栈中
            push(c);
            c.tryFire(SYNC);
        }
        return d;
    }
```

此方法就是判断当前 CompletableFuture 是否已经运行，如果没运行，将新创建的 CompletableFuture、执行该方法的 CompletableFuture、线程池、我们重写的 Function 打包成一个 UniApply，并且放入这个 CompletableFuture 的栈中

那么这个栈是个什么东西，这个 UniAccept 又是什么？
# UniAccept
该类的构造方法就是简单的赋值
```java
    static final class UniApply<T,V> extends UniCompletion<T,V> {
        Function<? super T,? extends V> fn;
        UniApply(Executor executor, CompletableFuture<V> dep,
                 CompletableFuture<T> src,
                 Function<? super T,? extends V> fn) {
            // dep: 新创建的CompletableFuture
  			// src: 驱动thenAccept的CompletableFuture
            super(executor, dep, src); this.fn = fn;
        }
        
        final CompletableFuture<V> tryFire(int mode) {
            CompletableFuture<V> d; CompletableFuture<T> a;
            if ((d = dep) == null ||
                !d.uniApply(a = src, fn, mode > 0 ? null : this))
                return null;
            dep = null; src = null; fn = null;
            return d.postFire(a, mode);
        }
    }
```

可以看到它的构造方法调用了它的父类方法，那它的父类是什么？
# Completion
```java
abstract static class Completion extends ForkJoinTask<Void>
        implements Runnable, AsynchronousCompletionTask {
        volatile Completion next;      
        abstract CompletableFuture<?> tryFire(int mode);
        abstract boolean isLive();

        public final void run()                { tryFire(ASYNC); }
        public final boolean exec()            { tryFire(ASYNC); return true; }
        public final Void getRawResult()       { return null; }
        public final void setRawResult(Void v) {}
    }
```
Completion 是一个抽象类，分别实现了 Runnable、AsynchronousCompletionTask 接口，继承了 ForkJoinPoolTask 类，而 ForJoinPoolTask 抽象类又实现了 Future 接口，因此 Completion 可以简单的看成一个 Future

我们看到 Completion 类中有一个 next，说明它是一个链表结构

而之前那个问题，栈是什么，栈就是 CompletableFuture 中的一个属性 stack，而这个 stack 就是 Completion 类的

这里面的一个方法 tryFire，就是尝试启动下一个 Completion 的意思
# 总结
以上，我们简单过了一遍 CompletableFuture 的创建以及后续操作的实现

- CompletableFuture 的创建是使用 CAS 操作将我们的传入的方法以及最后的实现参数赋值给 CompletableFuture 中的属性
- CompletableFuture 中对于各个组的实现大同小异
- 后续操作是从 postComplete 方法中引出来的，后续操作定义在 CompletionStage 接口中，后续操作的实现是通过 Compition 类的链表结构实现的
- 每次调用后续操作方法都会生成一个新的 CompletableFuture