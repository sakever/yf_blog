--- 
title: CompletableFuture 相关用法
date: 2023-03-03

categories:
  - Java
tags:
  - CompletableFuture
--- 
由于 guava 中 Listenablefuture 的成功，在Java 8中，设计师们也新加了一个包含50个方法左右的类 CompletableFuture。它的优点就是异步编程，同时这个类的使用也相当抽象...非常抽象
## 构造
CompletableFuture 它可以直接被 new 出来，此时它被当做 Future 来使用。它的基础方法如下
```java
CompletableFuture<Object> completableFuture = new CompletableFuture<Object>();
//传入参数，这个方法只能调用一次
completableFuture.complete(rpcResponse);
//传入异常，这个方法只能调用一次
completableFuture.completeExceptionally()
//用isDone来判断任务是否执行完毕
completableFuture.isDone();
//输出里面存的值
System.out.println(completableFuture.get());
```
但是在一般的使用中我们不会这么简单，来看看正常的构造
```java
public static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier);
public static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier, Executor executor);

public static CompletableFuture<Void> runAsync(Runnable runnable);
public static CompletableFuture<Void> runAsync(Runnable runnable, Executor executor);
```
supply 族的方法，可以返回异步线程执行之后的结果
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/57c1a3a185f48e72d016f650d8b57305.png)

run 族的方法不会返回结果，像 Runnable 一样就只是执行线程任务。此时的 get 是拿不到数据的
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/e15d526ded5a0129fb391bf2b1939438.png)

而且一般使用带线程池的方法，如果不这么做的话，该方法就会默认使用系统及公共线程池 ForkJoinPool，而且这些线程都是守护线程。如果将我们普通的用户线程设置成守护线程，当我们的程序主线程结束，JVM 中不存在其余用户线程，那么 CompletableFuture 的守护线程会直接退出，造成任务无法完成的问题

总之，不要用默认的线程池！下面是个正常的例子
```java
        CompletableFuture<Object> completableFuture = CompletableFuture.supplyAsync(new Supplier<Object>() {
            @Override
            public Object get() {
                return null;
            }
        }, MyThreadPool.getPoolExecutor());
```
supplyAsync() 方法接受的参数是 Supplier，它是一个功能接口，代表结果的提供者。Supplier 只有一个 get() 方法，可以返回通用类型的值，在这里它的返回值就是 CompletableFuture 里存的值，而接口所传入的参数类型就是返回值的参数类型

## 获取结果
以下是可以拿到 CompletableFuture 中存放的值的方法
```java
public T    get()
public T    get(long timeout, TimeUnit unit)
public T    getNow(T valueIfAbsent)
public T    join()
```
join 和 get 方法都是用来获取 CompletableFuture 异步之后的返回值。get 方法抛出的是经过检查的异常（编译时异常），ExecutionException，InterruptedException 需要用户手动处理
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/58d58ae6a40f4627fbeccc3273ebb2c0.png)
join 方法抛出的是 uncheck 异常（即未经检查的异常)，不会强制开发者处理
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/42ecc8f33f49f85d5953692242cf05ea.png)

## callback
这是 CompletableFuture 的灵魂，我们可以用一些方法对得到的 CompletableFuture 进行进一步的处理，也就是所谓的异步回调过程。我们一般使用 thenRun、thenAccept 和 thenApply 来执行回调过程

thenRun 后面跟的是一个无参数、无返回值的方法，即 Runnable
![这是一个使用 supplyAsync 与 thenAccept 的例子，其他的方法同理。CompletableFuture 要么从 supply 组开始要么从 run 组开始，从 run 组开始就没有下面的组合了](https://i-blog.csdnimg.cn/blog_migrate/f2fb5a05091ef47dd139b9adb07f3830.png)
thenAccept 后面跟的是一个有参数、无返回值的方法，称为 Consumer
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/b9d5e5c1ae6d66d59d5068d47314aae6.png)

thenApply 后面跟的是一个有参数、有返回值的方法，称为 Function。而参数接收的是前一个任务，即 supplyAsync（..）这个任务的返回值。因此这里只能用 supplyAsync，不能用 runAsync。因为 runAsync 没有返回值，不能为下一个链式方法传入参数
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/6e2d4f63885133b9e4b4a687ad6af73f.png)

这三个方法还有一些重载。使用 thenApply 这些方法会导致主线程同步阻塞以等待上一个线程返回信息，如果使用了带 async 后缀的方法，会根据情况再创建一个线程来执行 then 中的代码
```java
public <U> CompletableFuture<U> thenApply(Function<? super T,? extends U> fn)
public <U> CompletableFuture<U> thenApplyAsync(Function<? super T,? extends U> fn)
public <U> CompletableFuture<U> thenApplyAsync(Function<? super T,? extends U> fn, Executor executor)

public CompletableFuture<Void> thenAccept(Consumer<? super T> action)
public CompletableFuture<Void> thenAcceptAsync(Consumer<? super T> action)
public CompletableFuture<Void> thenAcceptAsync(Consumer<? super T> action, Executor executor)

public CompletableFuture<Void> thenRun(Runnable action)
public CompletableFuture<Void> thenRunAsync(Runnable action)
public CompletableFuture<Void> thenRunAsync(Runnable action, Executor executor)
```

## 带异常的回调
如果上一个任务抛出了异常导致链式无法进行下去，我们可以使用 whenComplete、handle 来处理异常。 当异步操作完成时，无论是否发生异常，都会执行 whenComplete 方法中的逻辑，而 handle 有所不同，只有当异常发生时，才会执行 handler 中的代码
```java
public CompletableFuture<T> whenComplete(BiConsumer<? super T,? super Throwable> action)
public CompletableFuture<T> whenCompleteAsync(BiConsumer<? super T,? super Throwable> action)
public CompletableFuture<T> whenCompleteAsync(BiConsumer<? super T,? super Throwable> action, Executor executor)

public <U> CompletableFuture<U> handle(BiFunction<? super T,Throwable,? extends U> fn)
public <U> CompletableFuture<U> handleAsync(BiFunction<? super T,Throwable,? extends U> fn)
public <U> CompletableFuture<U> handleAsync(BiFunction<? super T,Throwable,? extends U> fn, Executor executor)
```
## 组合
CompletableFuture 提供一些方法按顺序链接两个 CompletableFuture 对象

```java
public <U> CompletableFuture<U> thenCompose(Function<? super T, ? extends CompletionStage<U>> fn)
public <U> CompletableFuture<U> thenComposeAsync(Function<? super T, ? extends CompletionStage<U>> fn)
public <U> CompletableFuture<U> thenComposeAsync(Function<? super T, ? extends CompletionStage<U>> fn,Executor executor)
```
该方法可以按顺序链接两个 CompletableFuture 对象，它会将前一个任务的返回结果作为下一个任务的参数，它们之间存在着业务逻辑上的先后顺序

thenCompose 和 thenApply 同样都是接受上一个 CompletableFuture 的结果，但是两个的实现完全不一样，thenApply 转换的是泛型中的类型，并不会生成新的 CompletableFuture。而 thenCompose 用来连接两个 CompletableFuture，是生成一个新的 CompletableFuture
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/6970e8578e915297f515eb56b15e961e.png)

thenCombine 组同样可以组合两个 CompletableFuture 对象，它会在两个任务都执行完成后，把两个任务的结果合并。两个任务是并行执行的，它们之间并没有先后依赖顺序。同时两个任务中只要有一个执行异常，则将该异常信息作为指定任务的执行结果
```java
public class Thread10_ThenCombine {

    public static void main(String[] args) throws ExecutionException, InterruptedException {
        DeptService deptService = new DeptService();
        UserService userService = new UserService();

        //第1个任务：获取id=1的部门
        CompletableFuture<Dept> deptFuture = CompletableFuture
                .supplyAsync(() -> {
                            return deptService.getById(1);
                        }
                );

        //第2个任务：获取id=1的人员
        CompletableFuture<User> userFuture = CompletableFuture
                .supplyAsync(() -> {
                    try {
                        //int a = 1 / 0;//出了异常就报错
                        return userService.getById(1);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    return null;
                });

        //将上面2个任务的返回结果dept和user合并，返回新的user
        CompletableFuture<User> resultFuture = deptFuture
                .thenCombine(userFuture,
                        new BiFunction<Dept, User, User>() {
                            @Override
                            public User apply(Dept dept, User user) {
                                user.setDeptId(dept.getId());
                                user.setDeptName(dept.getName());
                                return userService.save(user);
                            }
                        }
                );

        System.out.println("线程：" + Thread.currentThread().getName() + " 结果：" + resultFuture.get());
    }
}
```
## 并行运行任务
CompletableFuture 使用静态的 allOf 与 anyOf 来并行运行任务，中间的 task1 到 task6 都是 CompletableFuture 对象
```java
CompletableFuture<Void> headerFuture = CompletableFuture.allOf(task1,.....,task6);
CompletableFuture<Void> headerFuture = CompletableFuture.anyOf(task1,.....,task6);
```
allOf 方法等待所有任务执行完毕之后才返回，join 可以让程序等任务都运行完了之后再继续执行
anyOf 只等待第一个任务执行完毕之后就返回，如果任务错误也会返回异常

下面是一个例子，我们先将一个 list 转换为一个 CompletableFuture list，然后调用 allOf 方法，让主线程在所有的线程执行完毕之后才执行后续操作：

```java
        List<CompletableFuture<Map<String, DuplicateProductTeamPriceVo>>> futures = hotels.stream()
                .map(hotel -> CompletableFuture.supplyAsync(() -> duplicateProductTeamPriceService.getDarenSingleHotelCalendar(hotel)))
                .collect(Collectors.toList());

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]));
        List<Map<String, DuplicateProductTeamPriceVo>> hotelMapList = Lists.newArrayList();
        for (CompletableFuture<Map<String, DuplicateProductTeamPriceVo>> future : futures) {
            hotelMapList.add(future.get());
        }
        duplicateProductTeamPriceService.fillDarenDate(pricevo, hotelMapList, month, hotels.get(0));
```