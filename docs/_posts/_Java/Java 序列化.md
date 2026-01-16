---
title: Java 序列化
date: 2024-01-24
sidebar: ture
categories:
  - 计算机基础
tags:
  - 序列化
---
序列化机制可以让对象地保存到硬盘上，减轻内存压力的同时，也起了持久化的作用；也可以让 Java 对象在网络传输。一般我们可以使用 java 自带的序列化机制和 json 来就行序列化。以下讲解一下序列化相关概念

值得一提的是，java 默认的序列化方式一般比较慢，我们一般使用 portoBuf、json 等方式序列化数据
# 标记接口
标记接口有时也叫标签接口（Tag interface），即接口不包含任何方法。在 Java 里很容易找到标记接口的例子，比如 JDK 里的 Serializable 接口就是一个标记接口。当然这个标记不是给人类看的，是给 java 虚拟机看的

标记接口是计算机科学中的一种设计思路。编程语言本身不支持为类维护元数据。而标记接口则弥补了这个功能上的缺失——一个类实现某个没有任何方法的标记接口，实际上标记接口从某种意义上说就成为了这个类的元数据之一。运行时，通过编程语言的反射机制，我们就可以在代码里拿到这种元数据

以 Serializable 接口为例。一个类实现了这个接口，说明它可以被序列化。因此，我们实际上通过 Serializable 这个接口，给该类标记了可被序列化的元数据，打上了可被序列化的标签。这也是标记/标签接口名字的由来，而其实现是在**使用的时候校验是否实现了这个接口**
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/c9912c93d2d5ddc6e767bcc6e1276899.png)

注意如果子类实现了序列化，父类没有实现序列化，父类中的字段会丢失问题

标记接口多用坐实现某种功能的时候的校验，比如 Cloneable 会在对象进行复制的时候校验该类是否实现，Serializable 则是序列化的时候会做校验

# transient（转瞬即逝的）
被该关键字修饰的变量（该关键字不能修饰方法或者类）不可以被序列化，只能存在于本地的内存中，最简单的例子就是不可以被 IO 输出到磁盘中，同样不能被远程传输。所修饰的变量如果是用户自定义类变量，则该类需要实现 Serializable 接口

顺便说一下，一个静态变量不管是否被 transient 修饰，均不能被序列化

还有一个例外，该类如果实现了 Externalizable（部化的）接口，可以调用 writeExternal 来指定序列化的对象，就算该对象被 transient 修饰也可以强制序列化

# Java 序列化常用 API

```java
java.io.ObjectOutputStream
java.io.ObjectInputStream
java.io.Serializable
java.io.Externalizable
```

ObjectOutputStream 表示对象输出流，它的 writeObject(Object obj) 方法可以对指定 obj 对象参数进行序列化，再把得到的字节序列写到一个目标输出流中。ObjectInputStream 则与之相反

Externalizable 继承了 Serializable 接口，还定义了两个抽象方法：writeExternal 和 readExternal，如果开发人员使用 Externalizable 来实现序列化和反序列化，需要重写 writeExternal 和 readExternal 方法。Externalizable 提供的方法让我们可以控制 Java 的序列化机制, 不依赖于 Java 的默认序列化

# serialVersionUID
serialVersionUID 表面意思就是序列化版本号 ID，其实每一个实现 Serializable 接口的类，都有一个表示序列化版本标识符的静态变量，或者默认等于1L，或者等于对象的哈希码

JAVA 序列化的机制是通过判断类的 serialVersionUID 来验证版本是否一致的。在进行反序列化时，JVM 会把传来的字节流中的 serialVersionUID 和本地相应实体类的 serialVersionUID 进行比较，如果相同，反序列化成功，如果不相同，就抛出 InvalidClassException 异常

# writeReplace
如果一个序列化类中含有 Object writeReplace() 方法，那么实际序列化的对象将是作为 writeReplace 方法返回值的对象，而且序列化过程的依据是实际被序列化对象的序列化实现

People 定义了 writeReplace 方法，并且自定义了 writeObject/readObject 方法
```java
package com.soecode.lyf.demo.test.io;
 
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;
 
public class People implements Serializable
{
    /**
     *
     */
    private static final long serialVersionUID = 2659082826995480601L;
    private int age;
    private String name;
 
    People(int age,String name)
    {
        this.age = age;
        this.name = name;
    }
 
    private void writeObject(ObjectOutputStream out)
    {
        System.out.println("是否调用了我？");
    }
    private void readObject(ObjectInputStream in)
    {
        System.out.println("是否调用了我？");
    }
 
    //在执行out.write()方法时会出发这个方法，先调用writeReplace
    // 如果没有writeReplace那么将会调用writeObject方法
    private Object writeReplace()
    {
        System.out.println("调用了 writeReplace()方法");
        return new Kong("路人");
    }
 
}
```

如果报了这个错误，很有可能是对象实现了 writeReplace 方法，可以尝试切换一个对象，比如使用 Lists.newArrayList(orderNos) 来生成一个新对象
```
Unable to make private java.lang.Object java.util.Collections$UnmodifiableRandomAccessList.writeReplace() accessible: module java.base does not "opens java.util" to unnamed module @26ccba8f
```