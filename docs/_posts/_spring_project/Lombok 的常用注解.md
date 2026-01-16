---
title: Lombok 的常用注解
date: 2023-01-03
sidebar: ture
categories:
  - Spring 项目
tags:
  - Lombok
---

该框架用来简化开发，使代码变的更易于阅读和维护
# @Getter 和 @Setter
这两个注解可以加在非 final 成员变量上，用来生成get和set方法，如果加在 final 成员变量上会报错
```java
    @Getter
    @Setter
    private Integer item1;
    
    @Getter
    @Setter
    private Integer item2;
```
同时也可以加在类上，用于为每个成员变量生成 getter和 setter
```java
@Getter
@Setter
public class JustItem {
```
# @AllArgsConstructor、@NoArgsConstructor、@RequiredArgsConstructor
这三个注解用来加在类上以生成构造函数，通过他们的名字就可以了解他们是干什么的

@AllArgsConstructor用于生成为每个成员变量接受参数的构造函数

@RequiredArgsConstructor 将创建带有每个 final成员变量参数的构造函数

@NoArgsConstructor将创建没有参数的构造函数

# @NonNull
该注解用于加在方法中的入参上，用于判断该入参是否为空，如果为空，报错
```java
public void nonNullDemo(@NonNull Employee employee, @NonNull Account account) {
	...
}
```
等同与下面代码
```java
public void nonNullDemo(Employee employee, Account account) {
    if (employee == null) {
        throw new IllegalArgumentException("Employee is marked @NonNull but is null");
    }
    if (account == null) {
        throw new IllegalArgumentException("Account is marked @NonNull but is null");
    }
    ...
}
```
# @ToString
在你的数据类上覆盖 toString 方法是有助于记录日志的良好实践。该注解等同于 IDE 生成的 toString
# @EqualsAndHashCode
我们都知道对象的相等是基于业务规则定义的。比如假如我们认为两个对象中有两个主要属性相等这两个对象就相等，其他的次要属性对判断相等没有影响

此时我们需要重写hashcode，否则在使用hashmap的时候或者需要其他判断的时候会出现错误的数据

也就是说如果需要在重写equals后重写hashcode的话，代码可能需要多出来这个
```java
@Override
public int hashCode() {
    final int prime = 31;
    int result = 1;
    result = prime * result + ((bodyType == null) ? 0 : bodyType.hashCode());
    result = prime * result + ((make == null) ? 0 : make.hashCode());
    result = prime * result + ((model == null) ? 0 : model.hashCode());
    return result;
}
```
为什么集合是累加后一个个乘31？

由于哈希码（HashCode）的目的是为了区分对象，所以其分布自然是越均匀越好，使用一些相对大的素质来进行计算比较好。选择31是可以做位运算比较快，31 * i 可以用 (i << 5) - i 来计算

说远了，Lombok允许我们使用 @EqualsAndHashCode 类注解实现重写 equals 以及 hashcode 方法，还可以用 exclude 排除不想要的元素 
```java
@EqualsAndHashCode(exclude = {"item3", "item4"})
public class Item {...}
```
# @Data
@Data 是 @Getter、 @Setter、 @ToString、 @EqualsAndHashCode 和 @RequiredArgsConstructor 的快捷方式，加在类上以实现上面所有功能

# @Buidler
通过建造者模式创建一个复杂的对象，比如以下实例，调用生成的 builder 方法获取 CarBuilder 实例，然后调用任何我们感兴趣的 setter 风格方法。最后，调用 build 创建 Car 的新实例
```java
Car car= Car.builder().make("Ford")
        .model("mustang")
        .bodyType("coupe")
        .build();
```
# @Singular
允许你向集合添加单个项，有助于在创建对象期间处理集合时保持代码简洁

# @Slf4j
Lombok 简化了日志的生成，一般情况下要实例化标准的 SLF4J 日志记录器，通常会有以下内容：
```java
public class SomeService {
    
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(LogExample.class);

    public void doStuff() {
        log.debug("doing stuff....");
    }
}
```
当然我没用过上面内容，我打日志一般用sout（doge

Lombok 提供了一个创建日志记录器的注解，能为几乎所有通用 Java 日志框架生成日志记录器，默认情况下，生成的日志对象为 log
```java
import lombok.extern.slf4j.Slf4j;

@slf4j
public class JustItem {
	...
		log.info("enter hello...");
	...
}
```