---
title: JAVA 枚举的基础和原理
date: 2023-05-03
categories:
  - Java
tags:
  - 枚举
---
## 基础
在 JDK 1.5 之前没有枚举类型，那时候一般用接口常量来替代。我们现在常常使用枚举类来代替一系列类似属性的常量，这么做有什么好处呢？将这个问题扩张一下，枚举类到底有什么用呢？

以这种方式定义的常量使代码更具可读性，预先记录可接受值的列表，并避免由于传入无效值而引起的意外行为；

同时，在程序中经常使用到的重复的值，都应该将这些重复内容与程序进行解耦；

枚举类是单例的，保证线程安全也让程序省下了不少内存

以下声明了一个普通的枚举类
```java
public enum SexEnums {
    FAMALE,
    MALE;
}
```
之后便可以通过枚举类型名直接引用常量，如 SexEnums.MALE。枚举类的每个成员都是枚举类型，因此可以使用枚举还可以使 switch 语句的可读性更强

Java 中的每一个枚举都继承自 java.lang.Enum 类。当定义一个枚举类型时，每一个枚举类型成员都可以看作是 Enum 类的实例，这些枚举成员默认都被 final、public, static 修饰，当使用枚举类型成员时，直接使用枚举名称调用成员即可

你可以将枚举类当成一个普通的 java 类，为其添加方法。由于枚举类在程序中是单例的，我们应该私有化构造方法让它保持单例，如果类中包含了一些内容，我们应该让用户能访问到，因此一个普通的枚举类应该长以下这样
```java
public enum SexEnums {
    FAMALE(0),
    MALE(1);

    private final Integer integer;

    private SexEnums(Integer i) {
        this.integer = i;
    }

    public Integer getInteger() {
        return integer;
    }
}
```

在业务需求中，我们可以将枚举写进 POJO 里，下面是一个例子
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SecondKillBatch implements Serializable {

    private static final long serialVersionUID = 170291185376290057L;

    /**
     * 秒杀活动ID
     */
    private Long id;
    /**
     * 活动名称
     */
    private String batchName;

    private Integer status;

    /**
     * 创建时间
     */
    private Date createTime;
    /**
     * 更新时间
     */
    private Date updateTime;

    public enum STATE {
        WAIT_CHECK(1, "未开始"),
        CHECK_SUCCESS(2, "进行中"),
        CHECK_FAILED(3, "已结束"),
        SCRAP(4, "已停止");

        private int type;
        private String desc;

        STATE(int type, String desc) {
            this.type = type;
            this.desc = desc;
        }

        public int value() {
            return type;
        }
    }

}
```
## EnumMap 与 EnumSet
EnumMap 是专门为枚举类型量身定做的 Map 实现。虽然使用其他的 Map（如 HashMap）实现也能完成枚举类型实例到值的映射，但是使用 EnumMap 会更加高效

HashMap 只能接收同一枚举类型的实例作为键值，并且由于枚举类型实例的数量相对固定并且有限，所以 EnumMap 使用数组来存放与枚举类型对应的值，使得 EnumMap 的效率非常高
```java
public enum DataBaseType {
    MYSQUORACLE,DB2,SQLSERVER
}
// 某类中定义的获取数据库URL的方法以及EnumMap的声明
private EnumMap<DataBaseType,String>urls = new EnumMap<DataBaseType,String>(DataBaseType.class);
public DataBaseInfo() {
    urls.put(DataBaseType.DB2,"jdbc:db2://localhost:5000/sample");
    urls.put(DataBaseType.MYSQL,"jdbc:mysql://localhost/mydb");
    urls.put(DataBaseType.ORACLE,"jdbc:oracle:thin:@localhost:1521:sample");
    urls.put(DataBaseType.SQLSERVER,"jdbc:microsoft:sqlserver://sql:1433;Database=mydb");
}
//根据不同的数据库类型，返回对应的URL
// @param type DataBaseType 枚举类新实例
// @return
public String getURL(DataBaseType type) {
    return this.urls.get(type);
}
```
虽然直接在枚举类中赋值也能实现相同操作，但在实际使用中，EnumMap 对象 urls 往往是由外部负责整个应用初始化的代码来填充的

EnumSet 是抽象类，其有两个实现：RegularEnumSet 、JumboEnumSet，选择哪一个取决于实例化时枚举中常量的数量

在很多场景中的枚举常量集合操作（如：取子集、增加、删除、containsAll 和 removeAll 批操作）使用 EnumSet 非常合适；如果需要迭代所有可能的常量则使用 Enum.values()

## 原理
下面来说说枚举的原理

像 Java 在1.5中引入的很多特性，为了向后兼容，编译器会帮我们写的源代码做很多事情，比如泛型为什么会擦除类型，为什么会生成桥接方法，foreach迭代，自动装箱/拆箱等，这有个术语叫“语法糖”，而编译器的特殊处理叫“解语法糖”，这么做主要是为了为我们省去许多重复操作。那么像枚举也是在JDK1.5中才引入的，又是怎么实现的呢？

来看看一个普通的枚举与其反编译的基本信息
```java
public enum Operator {
 
    ADD,
    SUBTRACT,
    MULTIPLY,
    DIVIDE
 
}
```
```java
localhost:mikan mikan$ javap Operator.class
Compiled from "Operator.java"
public abstract class com.mikan.Operator extends java.lang.Enum<com.mikan.Operator> {
  public static final com.mikan.Operator ADD;
  public static final com.mikan.Operator SUBTRACT;
  public static final com.mikan.Operator MULTIPLY;
  public static final com.mikan.Operator DIVIDE;
  public static com.mikan.Operator[] values();
  public static com.mikan.Operator valueOf(java.lang.String);
  public java.lang.String getOperator();
  com.mikan.Operator(java.lang.String, int, java.lang.String, com.mikan.Operator$1);
  static {};
}
```
我们虽然没有让该类继承 Enum，但是在编译后编译器自动让该类继承了 Enum，因此 java.lang.Enum 抽象类是所有枚举类型基类

可以看到所有的字段已经加上了 public static final，同时生成了四个内部类 Operator ，因此枚举中定义的每一个属性都是一个内部类，这样就解释了为什么每一个属性都是枚举类型

方法 values 就是用来返回所有定义的枚举常量，valueOf(String) 是一个公共的静态方法，所以我们可以直接调用该方法，返回参数字符串表示的枚举常量

java 为每个枚举都定义了两个属性，name 和 ordinal，name 表示我们定义的枚举常量的名称，如 ADD、SUBTRACT 等，而 ordinal 是一个顺序号，根据定义的顺序分别赋予一个整形值，从0开始，因此该枚举对象可以调用 name 与 ordinal 方法


## 枚举生成
一般省时的枚举生成有两种方式，一个是复制之前的枚举，然后改吧改吧，我们还可以让 gpt 生成枚举，以下是我个人经常使用的生成枚举的话术，在需要生成大量枚举的时候非常省时间

```
用给定的信息生成java枚举，要求有code和desc，并且生成对应的getCode和getDesc方法，还需要有入参为code、返回值为对应的枚举的of方法。给定以下信息：
0-未知 1-老师 2-学生 3-管理员
```