---
title: 关于 boolean 类型的坑
date: 2022-12-25
sidebar: true
categories:
  - Java
tags:
  - Java
---

在工作中定义了以下属性，被 leader 提示了两个问题
```java
    private boolean isOpen;
```
一是 bool 类型的属性不能使用 is 开头，二是在 POJO 中，不要使用基本数据类型

其实在阿里编程规范中就严格定义了对于这两个问题的解释
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/b40afe4d072706d4782daab8e0856ec6.png)
其实 javaBeans 规范中对这些均有相应的规定，基本数据类型的属性，其 getter 和 setter 方法是 getXXX 和 setXXX，但是对于基本数据中布尔类型的数据，又有一套规定，其 getter 和 setter 方法是 isXXX 和 setXXX。但是包装类型都是以 get 开头

这种方式在某些时候是可以正常运行的，但是在一些 rpc 框架里面，当反向解析读取到 isSuccess 方法的时候，rpc 框架会“以为”其对应的属性值是 success，而实际上其对应的属性值是 isSuccess，导致属性值获取不到，从而抛出异常

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/9684fa0a4b219f6b490692e5ca815400.png)
二是所有的属性应该定义为包装类，因为基本数据类型有默认值，在数据库中，bool 类型可能有三个值，null、true、false。但是如果在 java 中定义对应的 bool 类型，只有两个值

这也提示我们使用 Boolean 类型做判断的时候应该与 true 值做判断，因为该值是可以为 null 的，而为 null 就会抛出异常
```java
        Boolean a = null;
        if (a) {
            System.out.println("hello world");
        }
        if (a == true) {
            System.out.println("hello world");
        }
```
向上面这么写就会抛出异常，直接用 a 是不行的，将 null 与 true 做判断也是不行的，这提示我们做判断的时候尽量使用 Objects，这样不会出现 null 在 if 中的低级错误
```java
		
        if (Objects.equals(a, true)) {
            System.out.println(1);
        }
```
但是如果直接判断是否为 null 比较是不会出现问题的
```java
        Boolean a = null;
        if (a == null) {
            System.out.println(1);
        }
```
