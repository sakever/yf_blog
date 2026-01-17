--- 
title: java 基础知识
date: 2022-06-03

sidebar: true
categories:
  - Java
tags:
  - Java
--- 
## private，public，protected
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/3406b8be984dfcb913d5500adac9f769.png)
private 修饰符指定该成员只能在其自己的类中访问

默认的话该成员只能在其自己的包中访问

protected 修饰符指定该成员只能在其自己的包（如 package-private）中访问，此外还可以由另一个包中的该类的子类访问

public 所有的类都可以访问到
## 面向对象三大特征
封装：封装是指把一个对象的状态信息（也就是属性）隐藏在对象内部，不允许外部对象直接访问对象的内部信息。但是可以提供一些可以被外界访问的方法来操作属性

继承：通过使用继承，可以快速地创建新的类，可以提高代码的重用，程序的可维护性，节省大量创建新类的时间，提高我们的开发效率，子类可以调用并重写父类方法（其实现为重写，动态分派）

多态：表示一个对象具有多种的状态。具体表现为**父类的引用可以指向子类的实例**。同时，重写、重载都是多态的体现（静态解析和动态解析，静态多态和动态多态，这个在 JVM 中会讲到），同时，泛型不属于多态的特性

注意重载和重写都不能让一个方法有不同的返回值
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/df5ead66ac3743c8ad90fb86ce18aa8b.png)

## 向上转型、向下转型
一个父类指针指向子类对象叫向上转型（子类上升为父类），此时子类对象可以调用父类的所有方法与自己已经重写的方法，但是不能调用子类自己的方法

一个子类指针指向父类对象叫向下转型（父类下降为子类），此时通过这个指针调用什么方法都会报错
## & 和 | 
|| && 表示逻辑运算,||表示或者的意思，&& 表示并且的意思
| & 表示位运算，针对数值进行的运算，分别是按位与运算和按位或运算
## final
final 修饰的类不能被继承，final 类中的所有成员方法都会被隐式的指定为 final 方法

final 修饰的方法不能被重写

final 修饰的变量是常量，如果是基本数据类型的变量，则其数值一旦在初始化之后便不能更改

如果是引用类型的变量，则在对其初始化之后便不能让其指向另一个对象。比如 String 中的 char 数组
## 不可变类
像 string、Integer、BigInteger 之类的，就是不可变类，不可变类需要满足以下规则：

- 构造方法中对所有的属性赋值
- 所有的属性被修饰为私有的和 final，防止被修改
- 声明类为 final，防止子类继承
- 不提供修改对象状态或者属性的方法
## static
被 static 修饰的成员属于类，不属于单个这个类的某个对象，被类中所有对象共享，可以并且建议通过类名调用。被 static 声明的成员变量属于静态成员变量，静态变量存放在 Java 内存区域的方法区

静态代码块定义在类中方法外，静态代码块在非静态代码块之前执行（静态代码块-》实例初始化-》构造方法）。并且无论创建多少对象，静态代码只会执行一次

static 修饰类的话只能修饰内部类：静态内部类与非静态内部类之间存在一个最大的区别：非静态内部类在编译完成之后会隐含地保存着一个引用，该引用是指向创建它的外围类，但是静态内部类却没有

静态导包，用来导入类中的静态资源，格式为：import static 这两个关键字连用可以指定导入某个类中的指定静态资源，并且不需要使用类名调用类中静态成员，可以直接使用类中静态成员变量和成员方法
## JVM、JDK、JRE
Java 虚拟机（JVM）是运行 Java 字节码的虚拟机。JVM 有针对不同系统的特定实现（Windows，Linux，macOS），目的是使用相同的字节码，它们都会给出相同的结果

JDK 是功能齐全的 Java SDK。它拥有 JRE 所拥有的一切，还有前端编译器（javac）和工具（如 javadoc 和 jdb），它能够创建和编译程序

JRE 是 Java 运行时环境。它是运行已编译 Java 程序所需的所有内容的集合，包括 Java 虚拟机（JVM），Java 类库，java 命令和其他的一些基础构件
## equals 和 ==
对于基本数据类型来说，==比较的是值
对于引用数据类型来说，==比较的是对象的内存地址

类没有覆盖 equals() 方法时，使用的默认是 Object 类 equals() 方法；类覆盖了 equals() 方法，若它们的属性相等，则返回 true(认为这两个对象相等)

以下是 Object 的 equals 方法
```java
    public boolean equals(Object obj) {
        return (this == obj);
    }
```
如果一个基本数据类型和一个包装类比较，会进行自动拆箱的操作。但是如果两个包装类比较，比较的还是地址的位置

注意**包装类的对象池是池化技术的应用，并非是虚拟机层面的东西**，而是 Java 在类封装里实现的，IntegerCache 是 Integer在内部维护的一个静态内部类，用于对象缓存
## hashCode()
这个方法在 Object 对象中，底层由 C++ 实现，它的作用是返回这个对象的 hashCode，**默认的 hashCode 返回的是对象的内存地址经过哈希处理后的数值**

在重写 equals() 方法时必须重写 hashCode() 方法，因为散列表的原因，更确切的说是因为 hashmap 的原因

如果两个对象相等，则 hashcode 一定也是相同的。两个对象相等，对两个对象分别调用 equals 方法都返回 true。但是，两个对象有相同的 hashcode 值，它们也不一定是相等的，重写的目的就是为了防止俩个相同的对象有不同的 hashcode

## Object 类提供哪些方法
```java
public native int hashCode()
public boolean equals(Object obj)
public String toString()
public final native void notify()
public final native void notifyAll()
public final native void wait(long timeout) throws InterruptedException
```
## BigDecimal 的使用以及精度丢失问题
float 和 double 类型设计的主要目标是为了科学计算和工程计算，但是由于它们诡异的存储方式，在进行计算需要高精度的时候会经常出错

因此我们使用 BigDecimal 来定义浮点数的值，再进行浮点数的运算操作，因为包装类或者基本数据类型会出现精度丢失的情况。一般计算金额的时候可以（必须）使用这个类。BigDecimal所创建的是对象，我们不能使用传统的+、-、*、/等算术运算符直接对其对象进行数学运算，而必须调用其相对应的方法。方法中的参数也必须是 BigDecimal 的对象

在定义 BigDecimal 时，使用字符串或者浮点数创建都可以，区别是字符串有末尾0位，浮点数没有。但是一般推荐通过字符串以及整数来定义它，因为使用浮点数的会，会将浮点数本身的不确定属性带到高精度中

BigDecimal 常用的方法无非是任何将数字储存进该类中，以及如何对它进行加减乘除运算，如何将数字从该类取出，以下是它的常用方法

- add(BigDecimal) BigDecimal对象中的值相加，然后返回这个对象
- subtract(BigDecimal) BigDecimal对象中的值相减，然后返回这个对象
- multiply(BigDecimal) BigDecimal对象中的值相乘，然后返回这个对象
- divide(BigDecimal) BigDecimal对象中的值相除，然后返回这个对象

将 BigDecimal 转换为其他数据

- toString 将BigDecimal对象的数值转换成字符串，还有 toPlainString 方法也返回字符串，它们的区别是，toPlainString 强制指定不使用科学计数法返回字符串，而 toString 允许使用
- doubleValue 将BigDecimal对象中的值以双精度数返回
- floatValue 将BigDecimal对象中的值以单精度数返回
- longValue 将BigDecimal对象中的值以长整数返回
- intValue 将BigDecimal对象中的值以整数返回

BigDecimal 中的 divide 主要就是用来做除法的运算，它可以用来做精准的除法操作，并且指定返回几位计数
```java
    public BigDecimal divide(BigDecimal divisor,int scale, int roundingMode)
```
该方法第一个参数是除数，第二个参数代表保留几位小数，第三个代表的是使用的模式
```java
BigDecimal.ROUND_DOWN:直接省略多余的小数，比如1.28如果保留1位小数，得到的就是1.2

BigDecimal.ROUND_UP:直接进位，比如1.21如果保留1位小数，得到的就是1.3

BigDecimal.ROUND_HALF_UP:四舍五入，2.35保留1位，变成2.4

BigDecimal.ROUND_HALF_DOWN:四舍五入，2.35保留1位，变成2.3
```
BigDecimal.setScale() 方法用于格式化小数点
```java
setScale(1)表示保留一位小数，默认用四舍五入方式 
setScale(1,BigDecimal.ROUND_DOWN)直接删除多余的小数位，如2.35会变成2.3 
setScale(1,BigDecimal.ROUND_UP)进位处理，2.35变成2.4 
setScale(1,BigDecimal.ROUND_HALF_UP)四舍五入，2.35变成2.4
setScaler(1,BigDecimal.ROUND_HALF_DOWN)四舍五入，2.35变成2.3，如果是5则向下舍
```
## new HashMap<String, String>(){{}}
```java
        new HashMap<String, String>() {{
            put("applyId", "ddd");
        }};
```
该语句表示生成一个新的 HashMap 并且 put 进去一个键为 applyId，值为 ddd 的数据

原理是第一层括弧实际是定义了一个匿名内部类 (Anonymous Inner Class)，第二层括弧实际上是一个实例初始化块 (instance initializer block)，这个块在内部匿名类构造时被执行。这个块之所以被叫做“实例初始化块”是因为它们被定义在了一个类的实例范围内

上面的代码其实可以翻译为：
```java
 class Test$1 extends HashMap // 创建了一个 HashMap 的子类
	 {
	 Test$1()
	 { // 第二个 {} 中的代码放到了构造方法中去了 
	 	put("applyId", "ddd");
	 }
 }
```

## 判断两个集合是否存在交集
Collections 类的 disjoint 方法用于判断两个集合是否不相交，如果两个集合没有公共的元素则返回 true，否则返回 false。注意该方法的意思是没有相交元素，不是有相交元素

改方法有缺陷的一点就是，如果两个集合中的任何一个集合为 null，则会抛出空指针异常
```java
public class Main {
    public static void main(String[] args) {

        HashSet<String> p1=new HashSet<>();
        p1.add("ddd");
        p1.add("pppp");

        HashSet<String> p2=new HashSet<>();
        p2.add("ddd");
        p2.add("rrr");

        boolean disjoint = Collections.disjoint(p1, p2);
        // 输出 false
        System.out.println(disjoint);
    }
}
```

## 判断两个区间是否存在交集
这个一般是由我们实现的，根据业务的需求来决定判断规则，以下的 sql 是思路。只要两个区间不分离，就认为两个区间是相交的
```sql
select *
from year13_second_kill where
not start_time > '2023-04-30' 
and not end_time < '2023-03-07'
```
## java 为什么不支持多继承
因为会出现菱形继承的问题，如果 BC 继承 A，D 又继承 BC，BC 都重写了 A 的方法，那么 D 在调用的时候如果自己没实现这个方法就不知道到底要调用哪个方法了

同时，接口因为默认没有定义任何行为，所以一个类可以实现多个接口。接口在 java8 后额外增加了默认方法功能，如果多个接口有同一个默认方法，java 官方会强制子类实现这个方法