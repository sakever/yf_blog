---
title: Spring 框架基础使用
date: 2021-08-05

sidebar: ture
categories:
  - Spring 项目
tags:
  - Spring
---

# IOC
1，使用Maven构造项目，在pom.xml中导入依赖
```xml
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-webmvc</artifactId>
            <version>5.3.3</version>
        </dependency>
```

2，创建beans.xml，此文件应该在resources配置包下，复制如下代码加入文件中
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd
       http://www.springframework.org/schema/context
       http://www.springframework.org/schema/context/spring-context.xsd">

</beans>
```

3，写出需要构建的类，类中应该有每个变量的set方法，并在beans.xml
文件中进行添加
```xml
    <bean id="address" class="com.myself.POJO.Address" name="address2"/>

    <bean id = "stu" class="类全限定名">
        <property name="name" value="xie13"/>
        <property name="add" ref="address2"/>
        <property name="book">
            <array>
                <value>dsfasdf</value>
                <value>adsfasd</value>
                <value>dsafasd</value>
            </array>
        </property>
        <property name="m">
            <map>
                <entry key="what" value="ever"></entry>
            </map>
        </property>
     </bean>
```

POJO
```java
public class Address {
    Address (){
        System.out.println("Address 已被构建");
    }
}

```
```java
public class Student {
    String name;
    Address add;
    String[] book;
    Map<String, String> m;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Address getAdd() {
        return add;
    }

    public void setAdd(Address add) {
        this.add = add;
    }

    public String[] getBook() {
        return book;
    }

    public void setBook(String[] book) {
        this.book = book;
    }

    public Map<String, String> getM() {
        return m;
    }

    public void setM(Map<String, String> m) {
        this.m = m;
    }

    @Override
    public String toString() {
        return "Student{" +
                "name='" + name + '\'' +
                ", add=" + add +
                ", book=" + Arrays.toString(book) +
                ", m=" + m +
                '}';
    }
}

```

4,进行测试
```java
    @Test
    public void springTest(){
        ApplicationContext context = new ClassPathXmlApplicationContext("beans.xml");
        Student s = (Student) context.getBean("stu");
        System.out.println(s);
    }
```
# AOP
首先，所有的类都需要交给IOC容器，才可以使用SpringAOP，推荐直接用aspectJ

使用注解定义哪个类为增强类，增强类当作切面
```java
@Aspect
public class DoX {}
```

增强类大致有这几种增强：
1，前置通知before
2，环绕通知around
3，后置通知after return（有异常不会执行）
4，最终通知after（有无异常都会执行）
5，异常通知（异常返回后会执行）

以下是它们的执行顺序
![执行顺序](https://i-blog.csdnimg.cn/blog_migrate/3a505be14b13e0d9779d883fbb8bffac.png)
所有增强的后面，都需要加入切入点表达式来让它们知道自己增强了什么，value后面可以加入多个值

切入点表达式：execution(类型+返回类型+方法的全限定名)

order用来表示增强的优先级

Pointcut来设置增强全限定名，这样遇到相同的方法可以直接调用

```java
    @Pointcut(value = "execution(* com.myself.helloworld.service.DoSome.say(..))")
    public void dome(){}
    
    @Before(value = "dome1(), dome2()")
    @Order(1)
    public void upper(){
        System.out.println("upper!!!");
    }
```

# 事务
声明式事务管理（编程式事务是自己编写代码实现事务）

@Transactional作用于类上时，该类的所有 public 方法将都具有该类型的事务属性

@Transactional作用于方法上时，覆盖类级别的定义

如果类或者方法加了这个注解，如果这个类里面的方法抛出异常，就会回滚，数据库里面的数据也会回滚

此注解后面可以加参数，用来声明事务传播行为、事务隔离级别等

# WebFlux
异步非阻塞，使用netty容器，可以处理更多请求，响应式编程，使用了观察者模式

主要使用两个类来实现，Mono（返回一个或者零个数据的数据流），Flux（返回多个数据）

类中的常见方法：
fromArray（数组）
fromIterable（集合）
fromStrean（流）
just（对象）

操作符：map（对每个数据进行一定操作）、flatmap（对数据操作后生成多个数据）
```java
    public Mono<Employee> one(int name) {
        return Mono.justOrEmpty(employeeDao.getOne(name));
    }

    public Flux<Employee> all(){
        return Flux.fromIterable(employeeDao.getEmployee());
    }
```