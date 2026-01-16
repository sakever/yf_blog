---
title: Java 语法糖
date: 2024-02-04
categories:
  - Java
tags:
  - 集合
  - 数据结构
---
语法糖指在计算机语言中添加的某种语法，这种语法对语言的功能并没有影响，但是更方便程序员使用

带有语法糖的代码一般不能直接翻译为汇编语言，JDK 需要将语法糖先翻译成直接支持的编程语言，然后执行正常的转换为汇编语言的操作。在 java 中，翻译语法糖的任务被交给了前端编译器
# switch 支持 String 与枚举
Java 中的 switch 自身原本仅支持基本类型中的其中四种，即 char、byte、short、int。对于 int 类型，直接进行数值的比较。对于 char 类型则是比较其 ascii 码。所以，对于编译器来说，任何类型的比较都要转换成基本数据类型

switch 对 String 的支持，事实上是通过 equals 和 hashCode 方法来实现的
```java
public class switchDemoString
{
    public switchDemoString()
    {
    }
    public static void main(String args[])
    {
        String str = "world";
        String s;
        switch((s = str).hashCode())
        {
        default:
            break;
        case 99162322:
            if(s.equals("hello"))
                System.out.println("hello");
            break;
        case 113318802:
            if(s.equals("world"))
                System.out.println("world");
            break;
        }
    }
}
```
# 自动装箱与拆箱
自动装箱与拆箱对应8种基本的数据类型

- 装箱：将基本类型用它们对应的引用类型包装起来，其实是调用了包装类的 valueOf 方法
- 拆箱：将包装类型转换为基本数据类型，其实是调用了包装类的 xxxValue 方法

自动装箱与拆箱的过程发生在前端编译器编译时期，也是语法糖。鉴于包装类的 == 在不遇到算术运算的时候不会自动拆箱，周老师还是建议我们不使用该语法糖
```java
        Integer a = 128;
        Integer b = 128;
        System.out.println(b == a);
```
类似这种代码只会比较 a 与 b 的地址是否相同，不会比较它们的大小，什么？你问如果 a 与 b 的值为1的话，它们就相等了？那是因为在运行时常量池中保存了包装类的实例，比的还是地址

# 泛型

不同的编译器对于泛型的处理方式是不同的，通常情况下，一个编译器处理泛型有两种方式：Code specialization和Code sharing

C++ 和 C# 是使用 Code specialization 的处理机制，对每一个泛型类型都生成不同的目标代码

而 Java 使用的是 Code sharing 的机制。Code sharing 方式为每个泛型类型创建唯一的字节码表示，并且将该泛型类型的实例都映射到这个唯一的字节码表示上

将多种泛型类形实例映射到唯一的字节码表示是通过类型擦除（type erasue）实现的。也就是说，对于 Java 虚拟机来说，他根本不认识 Map<String, String> map 这样的语法，他只能看见 Map map。需要在编译阶段通过类型擦除的方式进行解语法糖

# 可变参数 ...
对于数组和同类型多入参都会解析为数组进行处理，那么如果不同类型多入参呢?定义这种类型的入参必须放到最后一个才可以，也就是说其他类型的入参需要放到可变入参的前面（从 jvm 的角度来说，这是因为静态指派时无法找到参数类型）

 那么可不可以使用多个可变参数作为入参呢？答案是不可以的，原因跟上一个错误差不多，这种可变参数需要放到最后一个入参，多个可变参数，不可能都作为最后一个入参
```java
    @Test
    public void test4() {
        List<String> list = new LinkedList<>();
        list.add("1");
        list.add("2");
        list.add("3");
        delete(list.toArray(new String[list.size()]));
    }

    public String delete(String... userIds) {
        for (int i = 0; i < userIds.length; i++) {
            System.out.println(userIds[i]);
        }
        return "hello";
    }
```

反编译后，会得到如下代码

```java
    public String delete(String[] strs) {
        for (int i = 0; i < strs.length; i++) {
            System.out.println(strs[i]);
        }
        return "hello";
    }
```

# 枚举

关键字 enum 可以将一组具名的值的有限集合创建为一种新的类型，而这些具名的值可以作为常规的程序组件使用

```java
public enum t {
    SPRING,SUMMER;
}
```

编译后代码如下：
```java
public final class T extends Enum
{
    private T(String s, int i)
    {
        super(s, i);
    }
    public static T[] values()
    {
        T at[];
        int i;
        T at1[];
        System.arraycopy(at = ENUM$VALUES, 0, at1 = new T[i = at.length], 0, i);
        return at1;
    }

    public static T valueOf(String s)
    {
        return (T)Enum.valueOf(demo/T, s);
    }

    public static final T SPRING;
    public static final T SUMMER;
    private static final T ENUM$VALUES[];
    static
    {
        SPRING = new T("SPRING", 0);
        SUMMER = new T("SUMMER", 1);
        ENUM$VALUES = (new T[] {
            SPRING, SUMMER
        });
    }
}
```

使用关键字 emun 会自动让类继承 Enum 类，在静态代码中定义 SPRING、SUMMER 以及他们默认的序列号，同时还有默认的方法

# 内部类
内部类又称为嵌套类，可以把内部类理解为外部类的一个普通成员

内部类之所以也是语法糖，是因为它仅仅是一个编译时的概念，outer.java里面定义了一个内部类inner，一旦编译成功，就会生成两个完全不同的.class文件了，分别是outer.class和outer$inner.class。所以内部类的名字完全可以和它的外部类名字相同

所以知道怎么在 xml 配置中找对应的内部类了吗
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/6ee2ea2ffc9ef15055b6ed190d2648f7.png)

# 断言
断言不是什么厉害的技术，其中也用到了语法糖，如果满足条件则抛出异常

```java
public class AssertTest {
    public static void main(String args[]) {
        int a = 1;
        int b = 1;
        assert a == b;
        System.out.println("公众号：Hollis");
        assert a != b : "Hollis";
        System.out.println("博客：www.hollischuang.com");
    }
}
```

编译后：
```java
public class AssertTest {
   public AssertTest()
    {
    }
    public static void main(String args[])
{
    int a = 1;
    int b = 1;
    if(!$assertionsDisabled && a != b)
        throw new AssertionError();
    System.out.println("\u516C\u4F17\u53F7\uFF1AHollis");
    if(!$assertionsDisabled && a == b)
    {
        throw new AssertionError("Hollis");
    } else
    {
        System.out.println("\u535A\u5BA2\uFF1Awww.hollischuang.com");
        return;
    }
}

static final boolean $assertionsDisabled = !com/hollis/suguar/AssertTest.desiredAssertionStatus();

}
```
# for-each
增强 for 循环也是语法糖，他的实现方式就是将  for (String s : strs)  变成 for(int j = 0; j < i; j++) 形式