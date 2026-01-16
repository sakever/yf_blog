---
title: 深入理解 java 多线程安全
date: 2021-05-05
categories:
  - 多线程
tags:
  - 线程
  - 并发
---
所谓的线程安全问题就是对数据的修改丢失，读取的数据比较奇怪的一系列问题

多个线程修改同一个资源的时候会引发安全问题，与数据库类似。那么怎么解决问题呢？答案是让线程间同步
# JAVA 线程安全
java 线程安全由三部分构成，在多线程编程中，只要保证了以下三点就不会出错
## JMM ：Java 内存模型
**JMM 是 java 内存模型，它定义了 Java 程序中多线程并发访问共享内存时的行为规范**，虚拟机需要实现它定义的规范，以**处理并发问题，并且屏蔽操作系统与硬件的内存访问差异**
![JMM](image.png)

在开始之前先复习一下 jvm 知识，运行时内存主要由栈堆方法区构成，栈中分虚拟机栈，本地方法栈，程序计数器，它们都是私有的

而一般的操作系统分内存，catch 高速缓存区，cpu，多线程执行时，多 cpu 无法保证数据有没有被其他 cpu 修改，即缓存不一致问题，需要通过缓存一致性协议或者其他手段来保证可见性

JMM 定义了一组规则来描述线程如何与主内存和工作内存进行交互。包括读操作、写操作、锁定操作、解锁操作等

线程一般修改本地内存中的变量副本，没有修改主内存中的变量

工作内存并不是在内存中分配一块空间给线程，而是 cache 和寄存器的一个抽象，所谓的主内存也是一样，指的是物理的内存
## 内存与缓存的交互
为了解决内存与缓存不一致的问题，java 内存模型定义了8种主内存与工作内存的交互操作，8种操作都是**原子性**的，注意，这是 java 对 jvm 实现方面的规定，不是操作系统的实现。以下举几个例子：

- lock (锁定) - 作用于主内存的变量，它把一个变量标识为一条线程独占的状态，其他线程将无法访问被锁保护的代码块或数据
- unlock (解锁) - 作用于主内存的变量，它把一个处于锁定状态的变量释放出来，释放后的变量才可以被其他线程锁定
- read (读取) - 作用于主内存的变量，读操作是指从主内存中将数据复制到线程的工作内存中进行读取。在读操作期间，线程会获取共享变量的值，并将其复制到自己的工作内存中进行操作
- write (写入) - 作用于主内存的变量，写操作是指将线程工作内存中的数据写入主内存。在写操作期间，线程会将修改后的值写入自己的工作内存，并最终刷新到主内存中

同时，java 内存模型对64位数据（long 和 double），允许虚拟机将没有被 volatile 修饰的64位数据读写操作划分为两次32位操作来进行（**JMM 的每个数据传输操作都固定的运输32位数据**），说人话就是虚拟机在对 long 和 double 操作时可以不满足 load、store、read、write 的原子性，这就是 **long 和 double 的非原子性协议**，这个协议不会对我们的日常编程产生任何影响

经测试，在目前主流平台下商用的 64 位 Java 虚拟机中并不会出现非原子性访问行为，但是对于 32 位的 Java 虚拟机，譬如比较常用的 32 位 x86 平台下的 HotSpot 虚拟机，对 long 类型的数据确实存在非原子性访问的风险
## 原子性
当多个线程访问某个类时，不管运行时环境采用何种调度方式或者这些进程将如何交替执行，并且在主调代码中不需要任何额外的同步或协同，这个类都能表现出正确的行为（满足以下三个特性），那么就称这个类是线程安全的

线程的操作都是原子的，要么全部执行，要么全部不执行，并且不会被其他情况打断

我们可以大致认为，基本数据类型的读写都是原子性的（因为底层的 load、read 等虚拟机实现保证了原子性）。如果需要一个代码块保证原子性，monitorenter 与 monitorexit 这两个字节码提供给了用户这样的能力
## 可见性
某个线程对数据的修改，其他线程会立刻、第一时间、马上获得数据修改之后的最新值

CPU Cache 缓存的是内存数据用于解决 CPU 处理速度和内存不匹配的问题，内存缓存的是硬盘数据用于解决硬盘访问速度过慢的问题

而我们的问题就发生在 CPU 一级缓存和二级缓存上，它们存在内存缓存不一致性的问题，这是需要保持可见性的原因

编译器和处理器的优化手段，也会造成可见性问题。比如编译器或处理器为了提高性能，可能对指令进行重排序，但需遵循 as-if-serial 语义，在多线程环境中，这种重排序可能导致其他线程看到不一致的中间状态

有小伙伴可能会疑惑，这种情况不是会造成有序性问题吗，为什么会造成可见性问题？答案是指令重排序通过破坏 Happens-Before （若操作 A happens-before 操作 B，则 A 的结果对 B 可见，但是重新排序后可能 B 指令先执行）关系间接导致可见性问题
## 有序性
有序性主要分指令重排序与存储子系统重排序

由于 Java 和操作系统在编译器以及运行期间的优化，我们输入的代码顺序与计算机执行代码顺序不一样，在单线程时会提升性能，可是在多线程时会出现一些奇妙的问题

1，指令集重排序：这个是针对于 CPU 指令级别来说的，处理器采用了指令集并行技术来将多条指令重叠执行，如果不存在数据依赖性，处理器可以改变语句对应的机器指令执行顺序，即**只有在它们认为重排序后不会对程序结果产生影响的时候才会进行重排序的优化**。举个例子：
```
     a=1;  //1
     b=2;  //2
     c=a+1; //3   
```
编译器优化后可能执行顺序如下
```
     b=2;   //2
     a=1;   //1
     c=a+1; //3   
```
这个例子在单线程下没有问题，但是多线程下：
```java
// 初始：x = y = 0
// 线程1
void thread1() {
    x = 1;      // ①
    ready = true; // ② 编译器可能重排序：②在①之前执行！
}

// 线程2
void thread2() {
    if (ready) {
        System.out.println(x); // 可能看到 x = 0！
    }
}
```
2，存储子系统重排序（内存重排序）：指多个处理器对这两个操作的感知顺序与程序顺序不一致，即这两个操作的顺序看起来像是发生了变化。因为 CPU 缓存使用缓冲区的方式进行延迟写入，这个过程会造成多个 CPU 缓存可见性的问题，这种可见性的问题导致结果的对于指令的先后执行显示不一致，从表面结果上来看好像指令的顺序被改变了，举例说明：

- 写缓冲区（Store Buffer）导致的延迟写入
```
// 初始：x = y = 0（在不同缓存行）
// 线程1在CPU1        | // 线程2在CPU2
x = 1;                | y = 1;
int r1 = y;           | int r2 = x;
// 可能结果：r1 = 0, r2 = 0 （都看到对方的旧值）
```
- 读缓冲区：处理器将读请求发送到读缓冲区，允许后续指令继续执行，无需等待数据实际返回。

在复杂的多线程环境下，**编译器和处理器是根本无法通过语义分析来知道代码指令的依赖关系的**，所以这个问题只有写代码的人才知道，这个时候编写代码的人就需要通过一种方式显示的告诉编译器和处理器哪些地方是存在逻辑依赖的，这些地方不能进行重排序

所以在编译器层面和 CPU 层面都提供了一套内存屏障来禁止重排序的指令，编码人员需要识别存在数据依赖的地方加上一个**内存屏障**指令，那么此时计算机将不会对其进行指令优化
# 多线程通信
## wait 与 sleep 的区别
**sleep 使用者为线程**，一般用于线程休眠，调用后线程进入**定时等待**状态（这里有图有真相）。线程不会失去任何锁的所有权，也就是 sleep 在代码块上锁的情况下是不会放弃锁对象的
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/32ca4aa8b707d33d34d5d0ccbccc0a23.png)
sleep 方法（和有参的 wait）在一段时间后，线程会自动苏醒
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/2cec44e84342d20e9b8eacc97f1a45e5.png)
**wait 使用对象为同步锁对象**，一般用于线程间通信。wait 会放弃锁对象，线程进入等待状态，使用无参的 wait 线程不会自动苏醒，需要 notify、notifyAll
## notify 与 notifyAll 的区别
notify 唤醒在该对象的监视器上等待的单个线程。如果有任何线程正在等待此对象，则会选择其中一个线程进行唤醒。这种选择是任意的，由执行人员自行决定，notifyAll 唤醒所有等待的线程

这里聊一下 wait、notify 和 sychronized 之间的关联，他们在 HotSpot 下的底层实现都是 ObjectMoniter 对象，该对象有特别重要的两个属性：

- 监控区（Entry Set）：锁已被其他线程获取，期待获取锁的线程就进入 Monitor 对象的监控区。在当前拥有锁的线程释放掉锁的时候，处于该对象锁的 entryset 区域的线程都会抢占该锁，但是只能有任意的一个 Thread 能取得该锁，而其他线程依然在 entry set 中等待下次来抢占到锁之后再执行
- 待授权区（Wait Set）：曾经获取到锁，但是调用了 wait 方法，线程进入待授权区。在 wait set 区域的线程获得 Notify/notifyAll 通知的时候，随机的一个 Thread（Notify）或者是全部的 Thread（NotifyALL）从对象锁的 wait set 区域进入了 entry set 中
# synchronized
synchronized 关键字可以保证被它修饰的方法或者代码块在任意时刻只能有一个线程执行
## 使用方法与字节码层面实现
synchronized 有三种使用方法：

一是**同步代码块**，使用 synchronized 方法锁住一个对象（一般设定一个 Object 对象），被框住的代码块同步，synchronized 不建议锁 String、Integer、Long 等对象

在被 javac 编译为字节码之后，调用 synchronized 的地方，使用了 monitorenter， 结束时使用了 monitorexit 这两个字节码指令作标记
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/25d8825155ecc026608329d16111ba1a.png)

二是同步方法，用 synchronized 修饰方法，被修饰方法同步，方法被锁时上锁的对象为调用方法的对象

三是同步静态方法，由于不创建对象，同步静态方法的锁为该方法的 class 对象

以上两种，生成的字节码的方法表中，被修饰的方法加上了 ACC_SYNCHRONIZED 修饰，它的标志名是0x0020，在进入方法的时候就会自动生成同步代码

注意：synchronized 不能对构造方法使用，而且从 jvm 层面来说，构造方法是线程安全的（在划分内存空间时会执行线程安全的判断）

而在 jdk 之下的实现，每次使用 synchronized 会直接从操作系统中获取锁，锁的名字叫 Monitor，又称管程，可以理解成操作系统实现的一个类，封装了互斥同步相关的属性与方法。由于每次使用都要从用户态切换到内核态申请 Monitor，非常消耗资源，在 1.6 之后，工程师们对 synchronized 做了锁升级的优化
## 为什么 synchronized 不建议锁 String、Integer、Long 等对象
Integer 底层的值是不可变的
```java
    /**
     * The value of the {@code Integer}.
     *
     * @serial
     */
    private final int value;
```
因此对对象做增减的时候其实替换了其他一个对象，此时锁失效。而由于方法区中缓存的影响，如果被定义的 Integer 在[-128-127]之间，所生成的对象都是缓存中的。如果多个线程两个业务锁的 String 变量的值相等，则两个锁会冲突，他们看起来锁的是不同对象，其实是同一个对象
```java
    private static class IntegerCache {
        static final int low = -128;
        static final int high;
        static final Integer cache[];

        static {
            // high value may be configured by property
            int h = 127;
            String integerCacheHighPropValue =
                sun.misc.VM.getSavedProperty("java.lang.Integer.IntegerCache.high");
            if (integerCacheHighPropValue != null) {
                try {
                    int i = parseInt(integerCacheHighPropValue);
                    i = Math.max(i, 127);
                    // Maximum array size is Integer.MAX_VALUE
                    h = Math.min(i, Integer.MAX_VALUE - (-low) -1);
                } catch( NumberFormatException nfe) {
                    // If the property cannot be parsed into an int, ignore it.
                }
            }
            high = h;

            cache = new Integer[(high - low) + 1];
            int j = low;
            for(int k = 0; k < cache.length; k++)
                cache[k] = new Integer(j++);

            // range [-128, 127] must be interned (JLS7 5.1.7)
            assert IntegerCache.high >= 127;
        }

        private IntegerCache() {}
    }
```
Long 与 String 同理
## JDK 对 synchronized 做的优化
1.6之前 synchronized 只是简单使用 Monitor，是一个重量级锁

1.6之后对其优化，加入了无锁、偏向锁、轻量锁与重量锁四种状态，只能依次进化（其实有锁退化，不过发生在 GC 的时候，无视就好），由于在多种情况下性能良好，因此被大量使用

最开始是无锁状态，此时如果对象被计算过 hash 码就不会变成轻量级锁、偏向锁这些需要占用 MarkWork 的锁，会直接上重量级锁

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/74a6a016f6d455245da2c07de7cbf61b.png)
### 偏向锁
偏向锁是消耗最小的锁，它的目的是消除数据在无竞争情况下的同步原语（CAS），说人话是**减少只有一个线程执行同步代码块时的性能消耗**，即在没有其他线程竞争的情况下，一个线程获得了锁具体的获取锁的流程如下：
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/7221d133a4c3afbf900f34b096e647d6.png)

- 当锁对象第一次被线程获取时，JVM 在对象头（Mark Word）中记录该线程的 ID（偏向线程）（这个操作是 CAS 的，如果其他线程已经对其上锁了，就会升级），并将对象头标记为偏向锁状态
- 判断 Mark Work 中的线程 ID 是否指向当前线程，如果是，则执行同步代码块
- 如果如果不是或者竞争失败，直接升级为轻量级锁
- 使用完之后，线程会将栈帧中的 Displaced Mark Word 放回锁对象的 Mark Word 中

我来讲一下这里的 CAS 操作：
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/08f43745d64e58b2c9cd2526b515a201.png)

CAS 在最开始的时候 V 和 O 的是相等的，N 中的每次线程要进行 CAS 操作时要新放入的值。当要进行 CAS 操作时，要先判断一下 V 和 O，若相等，说明没有 V 中的值还没有被其他线程更改，这时就可以将 N 中的值替换到 V 中。若不相等表明 N 中的值已经被其他的线程所更改，这时直接将 N 中的值返回即可

细心的同学就会发现一个问题，如果这个对象被升级成偏向锁，那原来对象头中的 hashcode 怎么办呢？答案是如果该对象执行过 hashcode 方法后，是不会进入偏向锁状态的，而且就算是偏向锁，执行 hashcode 方法也会立刻将锁升级为重量级锁

在重量级锁的实现中，对象头指向了重量级锁的位置，代表重量级锁的 ObjectMonitor 类里有字段可以记录非加锁状态（标志位为01）下的 Mark Word
### 轻量级锁
轻量级锁出现的前提是设计者发现多数情况下锁不会被多个线程获取，此时我们乐观的认为大多数情况下只有一个线程访问锁，并且重量级锁需要向操作系统申请，需要内核切换，性能实在是太慢了。在这种情况下使用 CAS 来减少传统重量级锁的性能消耗

具体实现和偏向锁类似：

如果锁的对象头不处于上锁状态，JVM 会先在当前线程的栈帧中创建用户存储锁记录的空间, 并将对象头中的 MarkWord 复制到锁记录中

然后有点不一样了，线程会尝试使用 CAS 将对象头中的 MarkWord 替换为**指向栈帧中锁记录 Lock Record 的指针**，并且将锁记录标记为00。如果成功，当前线程获得锁；如果失败，线程开始**自旋**。注意在 java8 以下低版本中轻量级锁是不会自旋的，高版本才会自旋

自旋就是不断使用 CAS 操作尝试对对象加锁，其目的若锁的持有时间很短，自旋等待可能让线程在锁释放后直接获取锁，避免重量级锁的开销。自旋不是轻量级锁，轻量级锁用到了自旋锁的思路。轻量级锁还支持重入
```java
// 伪代码表示轻量级锁获取流程
if (对象处于无锁状态) {
    // 1. 在当前线程栈帧中创建锁记录（Lock Record）
    LockRecord lr = createLockRecordInStack();
    
    // 2. 复制对象头的Mark Word到锁记录（用于恢复）
    lr.displaced_header = object.markWord;
    
    // 3. CAS尝试将对象头指向锁记录
    if (CAS(object.markWord, lr.displaced_header, 
            pointer_to(lr) | 00)) {  // 00是轻量级锁标志
        // 成功：获得轻量级锁
        return;
    } else {
        // 失败：开始自旋尝试
        for (int i = 0; i < spinThreshold; i++) {
            if (CAS(object.markWord, lr.displaced_header, 
                    pointer_to(lr) | 00)) {
                return;  // 自旋成功
            }
        }
        // 自旋失败，膨胀为重量级锁
        inflateToHeavyweightLock();
    }
}
```
如果出现**多个线程争用同一个锁的情况，或者轻量级锁的自旋次数超过阈值**时，那轻量级锁就不再有效，必须要膨胀为重量级锁
### 重量级锁
因此我们应该让锁自旋一段时间就进化来减少消耗，默认情况下自旋10次就会进化了，进化的终点就是**重量级锁**。我们可以通过 jvm 参数调整，并且虚拟机实现了**自适应自旋**。就是程序会自己判断一个锁自旋获取的成功率是高是低，如果比较高，会让线程多等待一会，如果比较低，则让线程减少等待时间

使用重量级锁时线程竞争不用自旋, 不会消耗 CPU。重量级锁膨胀时，会创建一个ObjectMonitor对象，并保存原始Mark Word
```c
// hotspot/src/share/vm/runtime/objectMonitor.hpp
class ObjectMonitor {
    // 保存原始对象头的Mark Word
    volatile markOop _header;      // ← 保存的地方！
    
    // 其他字段
    void* volatile _object;        // 指向原始对象
    void * volatile _owner;        // 当前持有锁的线程
    volatile intptr_t _recursions; // 重入次数
    // ...
};
```

MarkWord 里存放了指向互斥量（重量级锁）的指针，重量级锁是依赖对象内部的 monitor 锁来实现的，而 monitor 又依赖操作系统的 MutexLock(互斥锁)来实现的，这个锁在内核空间中

此时每一次线程的阻塞与唤醒操作都需要进行系统调用，开销十分大
### 锁消除
锁消除是当一个对象只在一个线程一个方法中的调用时它的锁会自动消除以节省资源，锁消除的基础是逃逸分析，和栈上分配等优化方式颜值

逃逸分析会分析对象的作用域是否超出当前线程或方法。如果对象仅在方法内部使用，不会被外部访问，不作为返回值或参数传递到其他方法，那对其上锁锁也没有必要了，因为锁保护的对象不会逃逸到其他线程，不存在多线程竞争的可能性，此时，JVM 会自动消除代码中的锁操作
### 锁粗化
而锁粗化是当一系列操作都对同一对象上锁，会将锁上在这些操作的外面。例如，循环一百次每次对同一对象上锁，频繁的上锁解锁会造成大量性能损失，会优化为对这个对象上锁然后循环一百次
### 自旋锁与自适应自旋锁
**自旋锁**的实质是在多个线程访问一个锁的情况下，我们让后进来的线程等待一会看看之前的线程会不会放开锁。这么做的理由是虚拟机开发者观测到大部分的同步代码执行时间都比较短，让线程阻塞的上下文切换时间比等等一等的消耗要大。自旋其实是使用循环来等待的，因此需要消耗 CPU 资源

因此我们可以猜测，如果锁释放的时间特别短，自旋等待的效果就比较好。但是上锁的线程如果执行 IO 等比较耗时的操作，则会白白消耗 CPU 资源

因此我们有了自适应自旋，如果对于某个锁，自旋很少成功获得过锁，那在以后要获取这个锁时将有可能直接省略掉自旋过程，以避免浪费处理器资源

### 可重入锁
sychronized 内部的偏向锁、轻量级锁、重量级锁都是可重入的，具体实现如下：

偏向锁状态（Biased Locking）：当锁处于偏向模式时，JVM 会通过 Mark Word 中的线程 ID 和重入计数器来记录重入次数。同一线程重入时只需增加重入计数，不涉及任何原子操作或竞争

轻量级锁状态（Thin Lock）：使用栈上的 Lock Record 来记录锁的重入，每次重入都会在栈上添加一个新的 Lock Record，但指向同一个对象头，通过 Lock Record 的计数实现可重入性

重量级锁状态（Inflated Monitor），使用 ObjectMonitor 对象实现，通过 _recursions 字段记录重入次数，与传统的可重入锁实现类似
## sychronized 原理总结
1，在编写代码时加入 sychronized 保证线程安全
2，代码编译为字节码时翻译为 monitorenter、monitorexit、ACC_SYCHRONIZED，并且有锁的自动进化过程
3，sychronized 在机器语言中轻量级的实现，是 lock comxchg 指令，lock 保证原子性，comxchg 代表 CAS 操作，是 CPU 对 CAS 的原语支持；重量级的实现，是对操作系统锁 Mutex Lock 的获取
# volatile
volatile 可以实现线程安全的可见性、有序性，不能实现原子性。volatile 是最轻量级的同步机制，简单来说，volatile 提供的功能是普通变量的值在线程间传递时均需要通过主内存来完成

**只关心引用，对象的改变它不知道**，举例说明：
```java
class Data {
    int value = 0;
    
    void setValue(int newValue) {
        this.value = newValue;  // 普通写入
    }
    
    int getValue() {
        return this.value;      // 普通读取
    }
}

public class VolatileObjectExample {
    // volatile只保证引用本身的可见性
    private volatile Data data = new Data(0);
    
    // 线程1
    public void writer() {
        // 场景1：修改引用 ✅ 保证可见
        data = new Data(42);  // volatile写，其他线程能看到新引用
        
        // 场景2：通过引用修改对象 ❌ 不保证可见
        data.setValue(42);    // 普通写，可能对其他线程不可见
    }
    
    // 线程2  
    public void reader() {
        // 保证看到最新的data引用
        Data localRef = data;  // volatile读
        
        // 但是！读取的value可能是旧值！
        int value = localRef.getValue();  // 普通读，可能看不到writer的修改
    }
}
```

volatile 有以下特性

1，使用 volatile 来修饰类中定义的变量或者对象（不能修饰方法中的），volatile 也只能修饰变量或者对象

2，在字节码层面，变量池中使用 ACC_VOLATILE 来标识此变量是 volatile 变量。JMM 对 volatile 的实现要求是通过 JMM 定义的8个原子操作拼接而成的（控制主内存与工作内存之间的交互，注意这是定义，其实现还是需要 JVM 的编写者调用操作系统指令实现）。整体来说，需要达到以下三点要求：线程每次使用变量前都必须先从主内存刷新最新的值、线程每次修改变量后都必须立刻同步回主内存中、不会被指令重排序优化

3，操作系统层面，被标记的变量在读写操作时生成内存屏障来维持可见性与有序性。内存屏障是什么呢，我们看一下以下一个例子
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/d7863328657720ac4afcaeba1d4c217c.png)
图中的 lock 开头的汇编指令（lock addl$0x0，(%esp)）就是内存屏障，内存屏障又分读写屏障（有 LoadLoad、StoreStore、LoadStore、StoreLoad 这些），它的功能很多比如：**每次修改之后都同步主存储器**、**该写入动作也会引起别的处理器或者别的内核无效化**、**并且内存屏障的两边不能进行指令重排序**，因为我们会在变量两边生成内存读写操作，因为在运行读写操作时之前的操作都完成了，因此有序

内存屏障的实现挺多的：

- 锁总线
- MESI 缓存行一致性协议

当处理器执行 lock 前缀指令时，lock 是通过在执行期间锁定总线，阻止其他处理器对共享内存的访问。具体来说，**lock 前缀指令会将指令执行过程中涉及到的内存地址加锁，防止其他处理器同时对该内存地址进行读写操作，锁定系统总线可以保证对共享内存的独占访问**。其本质是加锁

需要注意的是，lock 前缀指令会引入额外的开销，因为它需要占用总线资源并阻塞其他处理器的访问。因此，在编写汇编代码时，应该谨慎使用 lock 前缀指令，只在必要的情况下使用

当然后来计算机对这个指令做了优化，现代处理器通常使用**缓存锁定**替代总线锁定，仅锁定缓存行而非整个总线
## 总线
那么总线是什么呢？总线提供了计算机不同组件之间传输数据的功能，常见总线类型如下：

- 数据总线（Data Bus）：在 CPU 与 RAM（随机存取存储器，用于临时存储计算机正在运行的程序和数据）之间来回传送需要处理或是需要储存的数据
- 地址总线（Address Bus）：用来指定在 RAM 之中储存的数据的地址
- 控制总线（Control Bus）：将微处理器控制单元（Control Unit）的信号，传送到周边设备
- 扩展总线（Expansion Bus）：外部设备和计算机主机进行数据通信的总线，例如 ISA 总线，PCI 总线
- 局部总线（Local Bus）：取代更高速数据传输的扩展总线
## MESI 缓存行一致性协议
大家有没有注意到 lock 提供了写入动作也会引起别的处理器或者别的内核无效化的功能，这其实是 MESI 缓存行一致性协议提供的，MESI 用于解决多处理器系统中的缓存一致性问题，它是协议，**而内存屏障在一定程度上支持了 MESI 协议的实现**

MESI 协议通过在处理器之间共享缓存行的状态信息，实现了对共享数据的一致性维护。当一个处理器对共享数据进行修改时，它会将其他处理器的缓存行置为 Invalid （无效）状态，从而保证其他处理器在读取该数据时能够获取到最新的值，并且将数据第一时间同步回主内存

MESI 的实现导致了几个问题：

CAS 这种操作，会经常修改 volatile 修饰的数据结构，会导致缓存行乒乓（Cache Line Bouncing）

```
状态说明：
M（Modified）: 已修改，与内存不一致，独占
E（Exclusive）: 独占，与内存一致
S（Shared）:  共享，与内存一致
I（Invalid）: 无效，不能使用

时间线示例（两个CPU修改同一缓存行）：
1. CPU1读数据 → 状态:E（独占）
2. CPU2读数据 → CPU1状态:S，CPU2状态:S（共享）
3. CPU1写数据 → CPU1状态:M，发送Invalidate给CPU2
4. CPU2读数据 → CPU1写回内存，状态:S，CPU2重新加载
5. CPU2写数据 → CPU2状态:M，发送Invalidate给CPU1
6. 如此反复... 这就是"乒乓"！
```
或者总线风暴
```
1. 线程A CAS成功，修改缓存行状态为M（Modified）
2. 必须发送"失效"消息给所有持有该缓存行副本的CPU
3. 线程B、C、D...同时也在CAS，都发送失效消息
4. 内存总线被这些消息塞满
5. 正常的内存访问也受影响
6. 整个系统性能急剧下降

严重时表现：
- CPU使用率100%，但吞吐量几乎为0
- 系统响应时间激增
- 甚至可能触发内核watchdog超时
```
# CAS
compare and swap，简称 CAS，又称非阻塞同步，CAS 是乐观锁的一种实现

- 悲观锁：总是假设最坏的情况，每次去拿数据的时候都认为别人会修改，所以每次在拿数据的时候都会上锁，这样别人想拿这个数据就会阻塞，直到它拿到锁
- 乐观锁：总是假设最好的情况，每次去拿数据的时候都认为别人不会修改，所以不会上锁，只在更新的时候会判断一下在此期间别人有没有去更新这个数据

**CAS 的实现简单来说就是每次向主内存写入数据时，会先比较主内存中的数据，如果是期望值，写入；如果不是，撤销或重做**，大部分的 CAS 指令不管操作成功与否，都会返回旧值
## CAS 本身操作的原子性
还有一个问题，CAS 操作中，比较和修改是两个动作，怎么就能保证 CAS 本身操作的原子性呢？万一比较完了，数据被别人修改了怎么办？

其实利用 CPU 的原语来实现的。我们知道 Java 方法无法直接访问底层系统，需要通过本地（Native）方法来访问，Unsafe 相当于一个桥梁，基于该类可以连接底层的操作系统直接操作特定的内存数据

通过这个本地 native 方法，JVM 会帮我们实现出 CAS 汇编指令，这是一种完全依赖于硬件的功能，通过它实现了原子操作，因为原语的执行必须是连续的，在执行过程中不允许被中断，也就是说 CAS 是一条 CPU 的原子指令

那原子操作既然是连续的，那和上锁并且执行一段代码有什么区别呢。只能说在 JVM 层面上锁的开销比较大，而在 CPU 层面执行一串连贯的操作开销比较少

我们为了满足程序的线程安全，一定要保证操作与冲突检测这两个步骤都是原子的。如果通过软件来实现开销太大，因此所有的 CAS 乐观指令都是随着硬件的发展而出现的。从语义上看我们貌似干了很多事情，都是这多个操作都是通过一条处理器指令来实现的

常见的乐观指令有：Test-and-Set、Fetch-and-Increment、cmpxchg、Swap，以及在x86系统下特有的 Compare-and-Swap，即 CAS

该方式是比较乐观的实现，而一般这种乐观的实现都比较消耗 CPU 资源
## ABA 问题
指因为期望值是个定数，其他线程可能将期望值改了一遍又改回来的情况，大多数 ABA 问题不会影响到程序并发的正确性，可以通过使用版本号或者 Boolean 类型来解决

在 java 中可以使用这两个类来实现：

AtomicMarkableReference：原子更新带有标记的引用类型，只有 true 与 false 两种状态，使用 boolean mark 来标记 reference 是否被修改过，可以降低 ABA 问题发生的几率。每次尝试修改的时候，需要修改这个 mark 以及 reference，两个一致才算比较成功

AtomicStampedReference ：原子更新带有版本号的引用类型，该类将整数值与引用关联起来，可以解决使用 CAS 进行原子更新时可能出现的 ABA 问题
## Unsafe
Unsafe 是 java 提供的包装直接访问系统内存资源、自主管理内存资源、CAS 操作的类

里面大部分都是 native 方法与属性

如果我们使用 Unsafe 提供的静态方法 getUnsafe 获取  Unsafe 实例的话，这个看上去貌似可以用来获取 Unsafe 实例。但是，当我们直接调用这个静态方法的时候，会抛出 SecurityException 异常
```java
Exception in thread "main" java.lang.SecurityException: Unsafe
 at sun.misc.Unsafe.getUnsafe(Unsafe.java:90)
 at com.cn.test.GetUnsafeTest.main(GetUnsafeTest.java:12)
```
这是因为在 getUnsafe 方法中，会对调用者的 classLoader 进行检查，判断当前类是否由 Bootstrap classLoader 加载，来防止这些方法在不可信的代码中被调用。因为 Unsafe 提供的功能过于底层，安全隐患也比较大

我们可以用 Java 命令行命令 -Xbootclasspath/a 把调用 Unsafe 相关方法的类 A 所在 jar 包路径追加到默认的 bootstrap 路径中，使得 A 被引导类加载器加载；也可以使用发射获取 java 中已经生成好的单例对象 theUnsafe

我们看一下 Unsafe 里面的部分代码实现，原子类的 CAS 操作由 Unsafe 支持，最终在 hotspot 源码实现中都会调用统一的 cmpxchg 函数，这也是虚拟机层面的实现：直接调用 C 语言代码，由汇编语言直接支持 CAS 操作，即经典的 lock comxchg

jdk 的底层源码用了大量的 Unsafe，该类是实现乐观锁主要的类，同时被 native 修饰，可以理解为是对操作系统的乐观锁的封装，在 jdk 源码中大量使用到了这个类

cmpxchg 函数源码
```java
jbyte Atomic::cmpxchg(jbyte exchange_value, volatile jbyte*dest, jbyte compare_value) {
		 assert (sizeof(jbyte) == 1,"assumption.");
		 uintptr_t dest_addr = (uintptr_t) dest;
		 uintptr_t offset = dest_addr % sizeof(jint);
		 volatile jint*dest_int = ( volatile jint*)(dest_addr - offset);
		 // 对象当前值
		 jint cur = *dest_int;
		 // 当前值cur的地址
		 jbyte * cur_as_bytes = (jbyte *) ( & cur);
		 // new_val地址
		 jint new_val = cur;
		 jbyte * new_val_as_bytes = (jbyte *) ( & new_val);
		  // new_val存exchange_value，后面修改则直接从new_val中取值
		 new_val_as_bytes[offset] = exchange_value;
		 // 比较当前值与期望值，如果相同则更新，不同则直接返回
		 while (cur_as_bytes[offset] == compare_value) {
		  // 调用汇编指令cmpxchg执行CAS操作，期望值为cur，更新值为new_val
			 jint res = cmpxchg(new_val, dest_int, cur);
			 if (res == cur) break;
			 cur = res;
			 new_val = cur;
			 new_val_as_bytes[offset] = exchange_value;
		 }
		 // 返回当前值
		 return cur_as_bytes[offset];
}
```

## Atomic 类族
所谓原子类说简单点就是具有原子/原子操作特征的类

可以被分为以下几类

1，基本类型原子类：AtomicInteger、AtomicLong等
2，引用类原子类：AtomicReference、AtomicStampedReference等
3，数组类型原子类：AtomicLongArray等
4，对象属性修改类型原子类：AtomicIntegerFieldUpdater等

java 中还提供了累加器，在高并发场景下累加器的比传统 AtomicLong 更加具有优势
