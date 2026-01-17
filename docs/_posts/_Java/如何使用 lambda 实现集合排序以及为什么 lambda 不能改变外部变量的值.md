---
title: 如何使用 lambda 表达式实现排序
date: 2021-09-05

sidebar: true
categories:
  - Java
tags:
  - lambda
---

## 如何实现排序
向某些可以排序的类传入一个 Comparator 的接口，这个接口中的 compare 可以实现排序功能，默认从小到大排序

如果是(o1, o2) -> o1 - o2，从小到大排序
如果是(o1, o2) -> o2 - o1，从大到小排序

## 匿名内部类
一个方法中传入接口时，可以new一个接口并且重写接口里的方法
```java
public class MainTest {

    @Test
    public void whatTest(){
        MainTest.catSay(new what() {
            @Override
            public void cat() {
                System.out.println("cat say what das fox say!");
            }
        });
    }

    public static void catSay(what w){
        w.cat();
    }
}

interface what{
    void cat();
}

```

使用lambda表达式可以让其实现的更加简单括号里面是参数，右边是重写的方法，如果只有一条语句或者只有返回值，不用写大括号
```java
MainTest.catSay(() -> System.out.println("cat say lambda"));
```


## 自然排序
在构造储存对象类的时候实现Comparable接口，并重写compareTo方法，在集合中使用add方法向集合中添加元素的时候，集合会自动排序
## 选择排序
在定义集合对象时传入自定义比较器Compartor，需要实现比较器中的compare方法，在集合中使用add方法进行排序

## 使用 sort 方法排序
在Arrays中的sort方法可以排序任何数组
在Collations中的sort方法可以排序大多数集合（不能排序 HashMap）
```java
        ArrayList<Integer> l = new ArrayList<>();
        l.add(5);
        l.add(3);
        l.add(13);
        l.add(9);
        l.add(1);
        Collections.sort(l, (o1, o2) -> o1 - o2);
```
其中集合是可以传入数组的，所以也可以实现按数组的一号元素、二号元素等大小进行排序

请注意，不要使用这种形式来排序：
```java
Comparator<Integer> c = (o1, o2) -> {
    if (o1 > o2) {
        return 1;
    } else {
        return -1;
    }
};
```
上面的比较器就没有满足可逆性，当o1和o2相等时，o1和o2比较，返回-1，表示o1小于o2；但是当这两个元素交换位置时，o2比o1，结果返回还是-1，表示o2小于o1。这样就有两个元素互换比较，o1<o2并且o2<o1这两个结果相互矛盾，在某些极端情况下会出现异常，下面给出一个例子：
![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/b84663b30f6907a4c803b7915b2de3a8.png)
例子：
```java
        Integer[] array =
                {0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 2, 1, 0, 0, 0, 2, 30, 0, 3};
```

**这也是 idea 推荐我们在比较器中返回0的原因**
## 为什么 Java 中 lambda 表达式不能改变外部变量的值
Lambda 表达式本质上是一个闭包，**它会捕获外部变量的值，而非变量本**身。在底层实现中，这些被捕获的变量会被当作构造参数传递给 Lambda 对象

匿名内部类外面的 value 和里面的 value 不是同一个内存地址。在匿名内部类被创建的时候，被捕获的局部变量发生了复制。如果我们允许在匿名内部类中执行 value++ 操作，带来的后果就是，匿名内部类中的 value 的拷贝被更新了，但是原先的 value 不会受到任何影响（因为它可能已经不存在了）。你看上去好像两个 value 是同一个地址，同一份数据，但是实际上发生了拷贝，和方法调用的值传递如出一辙

同时，java8 做了一个语法糖：假如一个局部变量在整个生命周期中都没有被改变（指向），那么它就是 effectively final 的——换句话说，不是 final，胜似 final。这样的局部变量也允许被 lambda 表达式或者匿名内部类所捕获，不过可以读取，但是不能修改

同时，你可以注意到在 lambda 中可以对一下集合或者 map 做修改，因为他们是堆中分配的，因此可以将 int 转换为 AtomicInteger 来在 lambda 中修改数据，这跟线程安全没有半毛钱关系，纯粹是利用了这样一个技巧：AtomicInteger 可以当作 int 的容器。因为它是在堆上被分配的，我们完全没有改变这个局部变量的指向