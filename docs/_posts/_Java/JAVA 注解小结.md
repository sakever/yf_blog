---
title: JAVA 注解小结
date: 2022-08-11
sidebar: ture
categories:
  - Java
tags:
  - 注解
---
一个注解到底是怎么实现的呢？
## 注解是什么
「java.lang.annotation.Annotation」接口中有这么一句话，用来描述『注解』：所有的注解类型都继承自这个普通的接口，因此，**注解的本质就是一个继承了 Annotation 接口的接口**

而解析一个类或者方法的注解往往有两种形式，一种是编译期直接的扫描，一种是运行期反射。反射的事情我们待会说，而编译器的扫描指的是编译器在对 java 代码编译字节码的过程中会检测到某个类或者方法被一些注解修饰，这时它就会对于这些注解进行某些处理

典型的就是注解 @Override，一旦编译器检测到某个方法被修饰了 @Override 注解，编译器就会检查当前方法的方法签名是否真正重写了父类的某个方法，也就是比较父类中是否具有一个同样的方法签名

注解就像一个标签，是贴在程序代码上供另一个程序读取的
## 内置的注解
Java 定义了一套注解，共有 7 个，3 个在 java.lang 中，剩下 4 个在 java.lang.annotation 中

作用在代码的注解是：

- @Override - 检查该方法是否是重写方法。如果发现其父类，或者是引用的接口中并没有该方法时，会报编译错误。
- @Deprecated - 标记过时方法。如果使用该方法，会报编译警告。
- @SuppressWarnings - 指示编译器去忽略注解中声明的警告。

这些注解都不会对程序造成实质性影响，他们只是给程序员提升已经说明而已

作用在其他注解的注解（或者说元注解）是:

- @Retention - 标识这个注解怎么保存，是只在代码中，还是编入 class 文件中，或者是在运行时可以通过反射访问。
- @Documented - 标记这些注解是否包含在用户文档中。
- @Target - 标记这个注解应该是哪种 Java 成员。
- @Inherited - 标记这个注解是继承于哪个注解类(默认注解并没有继承于任何子类)
### 元注解
元注解是可以注解到注解上的注解，或者说元注解是一种基本注解，但是它能够应用到其它的注解上面。或者可以理解为：元注解也是一张标签，但是它是一张特殊的标签，它的作用和目的就是给其他普通的标签进行解释说明的
#### @Retention
@Retention 定义了该注解的生命周期。当 @Retention 应用到一个注解上的时候，作用就是说明这个注解的存活时间

@Retention 的可能取值：
```java
public enum RetentionPolicy {
    SOURCE,            /* Annotation信息仅存在于编译器处理期间，编译器处理完之后就没有该Annotation信息了，比如@Override  */

    CLASS,             /* 编译器将Annotation存储于类对应的.class文件中。默认行为  */

    RUNTIME            /* 编译器将Annotation存储于class文件中，并且可由JVM读入，比如 @Service */
}
```
比如你定义一个注解，但是在通过反射使用的时候编译器提示：注解xxx不保留用于反射访问。这就说明需要更改 Retention 取值了

如果是 class 文件或者运行时注解，解析后会在 class 文件中的属性表中添加对应的属性，我们可能会使用**反射**来使用这些属性
```java
// 编译后的.class文件结构
UserService.class
├── 常量池
├── 访问标志
├── 字段表
├── 方法表
│   └── getUserById 方法
│       ├── 访问标志
│       ├── 属性表
│       │   └── RuntimeVisibleAnnotations 属性  ← 注解在这里！
│       │       ├── @Cacheable
│       │       │   ├── type_index → Cacheable
│       │       │   └── value → ttl=1800
│       │       └── @RateLimit
│       │           ├── type_index → RateLimit
│       │           └── value → 10
├── 属性表
```
#### @Target
@Target 表示该注解用于什么地方，可以理解为：当一个注解被 @Target 注解时，这个注解就被限定了运用的场景

当本来应该放在类上的注解放在方法上时，编译器会标红

@Target 的可能取值：
```java
public enum ElementType {
    TYPE,               /* 类、接口（包括注释类型）或枚举声明  */

    FIELD,              /* 字段声明（包括枚举常量）  */

    METHOD,             /* 方法声明  */

    PARAMETER,          /* 参数声明  */

    CONSTRUCTOR,        /* 构造方法声明  */

    LOCAL_VARIABLE,     /* 局部变量声明  */

    ANNOTATION_TYPE,    /* 注释类型声明  */

    PACKAGE             /* 包声明  */
}
```
#### @Documented
@Documented 是一个简单的标记注解，可以修饰其他注解，表示是否将注解（被 @Documented 修饰的注解）信息添加在 Java 文档
#### @Inherited
Inherited 是指继承，@Inherited 定义了一个注释与子类的关系。如果一个超类带有 @Inherited 注解，那么对于该超类，它的子类如果没有被任何注解应用的话，那么这个子类就继承了超类的注解
## 自定义注解
我们可以自己写一个注解
```java
@Target(METHOD)
@Retention(RUNTIME)
public @interface MyAnnotation {
    String value() default "hello";
}
```
发现什么奇怪的问题没有，不说是接口了，就算是类也不能给方法赋值啊。而且这么操作有什么用吗

我们定义了注解的作用域、作用目标之后，在注解内写的方法可以看作注解蕴含的信息，因此只要用到注解，必然有三角关系：定义注解、使用注解、读取注解

如果注解本质上是继承了 Annotation 接口的接口，那是不是可以通过反射获得这个注解所包含的信息了，获得信息就可以对其标记的东西进行操作了

来个实例吧，这是个被我自定义注解标记的类
```java
public class JustTest {

    @MyAnnotation
    public void sayHello(){
        System.out.println("say hello");
    }
}
```
测试的类，这里面的操作就是读取注解的程序，这部分一般被框架隐藏起来
```java
    @Test
    public void test() throws IllegalAccessException, InstantiationException, InvocationTargetException {
        // 1.先找到测试类的字节码
        Class clazz = JustTest.class;
        Object obj = clazz.newInstance();

        // 2.获取类中的公共方法
        Method[] methods = clazz.getMethods();

        // 3.测试一下是否包含自定义注解，拿到并输出自定义注解中的值，执行该方法
        // isAnnotationPresent 方法表示检查该类的第一个方法是否含有注解 MyAnnotation
        System.out.println(methods[0].isAnnotationPresent(MyAnnotation.class));
        // getAnnotation 获取该注解，后面的 value() 事实上是调用注解的 value 方法
        System.out.println(methods[0].getAnnotation(MyAnnotation.class).value());
        methods[0].invoke(obj);
    }
```
## AOP
除了代理类以外，注解和 AOP 一起使用的场景也很多，在 AOP 的方法中传入注解本身，即可拿到里面的值了，这比反射拿要快很多
```java
    @Around("log()&&@annotation(methodMonitor)")
    public Object aroundMethodMonitor(ProceedingJoinPoint point, MethodMonitor methodMonitor) throws Throwable {
    	// 拿 value 值
        String monitorPrefix = methodMonitor.value();
    }
```