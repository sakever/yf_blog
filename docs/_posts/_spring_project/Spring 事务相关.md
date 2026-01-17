---
title: Spring 事务相关
date: 2023-04-03
sidebar: true
categories:
  - Spring 项目
tags:
  - Spring
---
聊过了 MySQL 事务相关内容，来看看 spring 事务有关内容吧。我们都知道在 spring 中用 @Transaction 来管理事务，那它里面的属性是什么意思呢，还有其他方式来管理事务吗

@Transaction 注解用于将某个方法定义为原子的，该方法中的操作要么全部成功，要么全部失败。该注解主要使用场景是引入数据库的情况，我们希望操作数据库后，紧接着的一系列操作不出现异常，如果出现异常，将数据库的操作撤销。这种情况下就需要使用到该注解了
## 编程式事务与声明式事务
使用注解就是声明式事务，声明式事务管理在底层是建立在 AOP 的基础之上的。其本质是对方法前后进行拦截，然后在目标方法开始之前创建或者加入一个事务，在执行完目标方法之后根据执行情况提交或者回滚事务

除此之外还有编程式事务管理方式，编程式事务允许用户在代码中精确定义事务的边界，通过 TransactionTemplate 或者 TransactionManager 手动管理事务，实际应用中很少使用

调用 TransactionTemplate 的 execute 方法来执行事务，传入一个 TransactionCallbackWithoutResult 对象
```java
@Resource
private TransactionTemplate transactionTemplate;
public void test() {

        transactionTemplate.execute(new TransactionCallbackWithoutResult() {
            @Override
            protected void doInTransactionWithoutResult(TransactionStatus transactionStatus) {
                try {
                    // ....  
                } catch (Exception e){
                    //回滚
                    transactionStatus.setRollbackOnly();
                }
            }
        });
}
```
还有一个调用 TransactionManager 的 getTransaction 方法，这里就不写了

那么**声明式事务会回滚什么内容**呢？是不是所有的放在注解里的内容都会被回滚呢？以下是我们可能遇到的几种情况：

- 如果 MySQL、PG 等操作在同一个 Spring 事务中，那么在异常发生时，所有未提交的数据库更改会被回滚。值得注意的是，在一个 spring 事务中的数据库操作是在一个连接一个数据库事务中实现的。这也就是说，如果 spring 事务逻辑太长，会导致上的锁范围过大，我们可能会阻滞其他事务的运行
- Redis 中的操作不会被回滚，可能需要写补偿代码来回滚数据
- 在分布式系统中，如果涉及多个服务和数据库，Spring的声明式事务管理可能不足以处理跨服务的事务一致性。这时可能需要使用分布式事务解决方案，比如 TCC、2PC 等（当然线上不可能这么使用，从业务方面调用 RPC 失败就会删除已经创建好的数据，比如我们创建了订单，调用下游的支付接口失败了，我们直接删除这笔订单然后给用户返回错误信息就行了）
## 事务的隔离级别 isolation
一共五种隔离级别，使用 isolation（隔离）属性来配置

四种隔离级别与 MySQL 的隔离级别相同，分别是读未执行，读已执行，不可重复读，串行化

另外一种是默认隔离级别，使用后端数据库默认的隔离级别

在使用 @Transaction 注解的时候，该属性不要求一定要填入
## 事务传播行为 propagation
当事务方法被另一个事务方法调用时，必须指定事务应该如何传播

使用 propagation（交易）属性来配置传播行为，一共有七种传播行为
```java
public interface TransactionDefinition {
    int PROPAGATION_REQUIRED = 0;
    int PROPAGATION_SUPPORTS = 1;
    int PROPAGATION_MANDATORY = 2;
    int PROPAGATION_REQUIRES_NEW = 3;
    int PROPAGATION_NOT_SUPPORTED = 4;
    int PROPAGATION_NEVER = 5;
    int PROPAGATION_NESTED = 6;
    ......
}
```
Spring 为了方便使用，定义了一个枚举类：Propagation
```java
package org.springframework.transaction.annotation;

import org.springframework.transaction.TransactionDefinition;

public enum Propagation {

    REQUIRED(TransactionDefinition.PROPAGATION_REQUIRED),

    SUPPORTS(TransactionDefinition.PROPAGATION_SUPPORTS),

    MANDATORY(TransactionDefinition.PROPAGATION_MANDATORY),

    REQUIRES_NEW(TransactionDefinition.PROPAGATION_REQUIRES_NEW),

    NOT_SUPPORTED(TransactionDefinition.PROPAGATION_NOT_SUPPORTED),

    NEVER(TransactionDefinition.PROPAGATION_NEVER),

    NESTED(TransactionDefinition.PROPAGATION_NESTED);

    private final int value;

    Propagation(int value) {
        this.value = value;
    }

    public int value() {
        return this.value;
    }

}
```
七种传播行为的详细解释如下，支持外围事务的情况：

1，PROPAGATION_REQUIRED：**如果当前存在事务，则加入该事务；如果当前没有事务，创建一个新事务，这个是默认的，并且也使用的最多**

举个例子，当两个方法都用这个传播行为，a 调用 b，此时b中的行为加入a，形成同一个事务，此时b中错误出现回滚a也跟这回滚；a如果是一个普通方法，调用事务方法b，此时b生成一个新事务干自己的事情

2，PROPAGATION_SUPPORTS：如果当前存在事务，则加入该事务；如果当前没有事务，则以非事务的方式继续运行

3，PROPAGATION_MANDATORY：如果当前存在事务，则加入该事务；如果当前没有事务，则抛出异常

4，PROPAGATION_NESTED：如果当前存在事务，则创建一个事务作为当前事务的嵌套事务来运行；如果当前没有事务，创建一个事务。所谓嵌套事务，就是 aMethod 调用 bMethod 时，如果 bMethod 回滚的话，aMethod 不会回滚。如果 aMethod 回滚的话，bMethod 会回滚

不支持外围事务：

1，PROPAGATION_REQUIRES_NEW：创建一个新的事务，如果当前存在事务，则把当前事务挂起

听说过线程挂起听说过事务挂起吗？当事务创建时，就会被绑定到一个线程上。该线程会伴随着事务整个生命周期，直到事务提交、回滚或挂起（临时解绑）。线程和事务的关系是1:1，当线程绑定了一个事务后，其他事务不可以再绑定该线程，反之亦然

了解事务和线程的关系，也很容易理解事务挂起。对事务的配置在 Spring 内部会被封装资源(Resource)，线程绑定了事务，自然也绑定了事务相关的资源。挂起事务时，把这些资源取出临时存储，等待执行完成后，把之前临时存储的资源重新绑定到该线程上

这种情形下，事务 a 调用事务 b，a 在 b 执行完后发生异常，b 不会回滚，因为两个是独立的事务；但是如果 b 抛出异常，并且这个异常没有被捕获的话，a 会回滚

2，PROPAGATION_NOT_SUPPORTED：以非事务方式运行，如果当前存在事务，则把当前事务挂起

3，PROPAGATION_NEVER：以非事务方式运行，如果当前存在事务，则抛出异常
## 事务超时属性 int
所谓事务超时，就是指一个事务所允许执行的最长时间，如果超过该时间限制但事务还没有完成，则自动回滚事务。在 TransactionDefinition 中以 int 的值来表示超时时间，其单位是秒，默认值为-1，这表示事务的超时时间取决于底层事务系统或者没有超时时间
## 指定异常类型 norollbackFor
在阿里编程规范中建议使用事务注解时一定要填入 rollbackFor 属性，该属性用于指定能够触发事务回滚的异常类型，可以指定多个异常类型，比如常见的 runtime 异常、空指针异常，数组越界异常等等

于此对应的是 norollbackFor 属性，该属性意思是发生了或者抛出了指定的异常不会发生回滚操作

比如添加 @Transactional(rollbackFor = NullPointerException.class) 注解，指定了空指针类型异常，而我们抛出的是数组越界异常，结果是该方法没有发生回滚，数据库中数据更新。如果抛出了空指针异常，该方法会发生回滚，数据库中数据不更新

## 大事务优化
也不是任何时候都需要使用注解定义事务，在下单的时候，如果对下单方法进行无脑加注解，很有可能让这个事务变的很大，导致回滚的难度加大。同时，由于占用的资源很多，死锁的概率也变大了

举个例子，我们有时候可能会 debug 线上代码，如果走到了事务逻辑中，我们会长时间占用数据库资源，可能会给表中上大量的锁，导致其他的事务阻塞

在使用事务的时候，需要尽可能注意以下几点：

- 将查询方法放到事务外，因为一般情况下这类方法是不需要事务
- 事务中避免远程调用，理由同上，如果不需要调用拿数据（就算放在事务中也回滚不了，Spring 的声明式事务管理在默认情况下并不支持分布式事务），直接异步处理一下就可以了
- 事务中避免一次性处理太多数据，如果一次批量更新1000条数据，这样会导致大量数据锁等待，特别在高并发的系统中问题尤为明显
## 事务失效情况
不是只要加了注解事务就一定会回滚的，如果代码写的不是很好，事务失效也是很有可能的，以下是常见的几种情况：

- 未指定回滚异常。**@Transactional 注解默认的回滚异常类型是运行时异常**（RuntimeException），如果我们自定义了一个异常直接继承了 Exception，事务 AOP 是监控不到的
- 当抛出的异常被 try-catch 捕获并且吞掉时，事务也会失效，原因是 AOP 操作需要拿到方法中抛出的异常才会执行回滚逻辑，处理方案可以是在 catch 中将这个异常抛出来
- **只有目标方法在外部进行调用，目标方法才会由 Spring 生成的代理对象来进行管理**。这个是 AOP 相关知识。但是如果你使用 aspectJ 就不用考虑这个问题了。同理，方法被 private 或者 final 修饰导致 AOP 不能生成同级或者子类方法，也会导致事务失效
- 数据库不支持事务，比如 mysql 的 myisam
- 如果事务中使用了两个线程，比如 @Async 或者 CompletableFuture 异步，事务回滚只会回滚主逻辑中的内容而不会回滚异步代码中的内容

## 事务传播行为原理
有没有想过 spring 事务是如何实现的？实现事务可能会遇到以下问题：

1，请求 A 需要开启事务，过程为使用线程1，连接到数据库，执行 SQL，未提交。此时请求 B 也需要开启一个事务处理问题，如果此时复用了线程1，请求 B 会看到请求 A 未提交的数据。因为**同一个数据库连接通常只能处理一个事务。如果在一个未完成的事务上再次发起新的事务，可能会导致错误或不确定的状态**。这是因为数据库连接在处理事务时会被锁定，无法处理其他请求

解决方案是**每个线程必须有自己的数据库连接和事务上下文**，就是每个线程开一个连接，同时使用连接池在不影响事务的情况下复用连接

连接池可以有效管理数据库连接。通过为每个并发事务分配不同的连接，可以避免事务之间的干扰。在大多数现代数据库驱动和 ORM 中，都支持连接池的功能

那如果一个线程上开了多个事务怎么办，也就是事务的传播行为如何实现？Spring 使用 ThreadLocal 巧妙的解决了这个问题

用户请求执行事务方法时，ThreadLocal 初始化，检查当前线程是否已有事务（从 ThreadLocal 取，ThreadLocalMap 存放数据库为 key，连接为 value 的映射）。根据 @Transactional 配置决定是加入已有事务、开启新事务等等操作，然后再做 ThreadLocal 存储，在业务代码执行完毕后执行 ThreadLocal 清理，释放连接回连接池

ThreadLocal 会保存很多信息，当前活动的连接、当前事务状态、挂起的事务资源等等
```java
// Spring TransactionSynchronizationManager 中的 ThreadLocal
private static final ThreadLocal<Map<Object, Object>> resources = 
    new NamedThreadLocal<>("Transactional resources");

private static final ThreadLocal<Set<TransactionSynchronization>> synchronizations = 
    new NamedThreadLocal<>("Transaction synchronizations");

private static final ThreadLocal<String> currentTransactionName = 
    new NamedThreadLocal<>("Current transaction name");

private static final ThreadLocal<Boolean> currentTransactionReadOnly = 
    new NamedThreadLocal<>("Current transaction read-only status");

private static final ThreadLocal<Integer> currentTransactionIsolationLevel = 
    new NamedThreadLocal<>("Current transaction isolation level");

private static final ThreadLocal<Boolean> actualTransactionActive = 
    new NamedThreadLocal<>("Actual transaction active");
```