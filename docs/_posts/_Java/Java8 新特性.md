---
title: Java8 新特性
date: 2023-03-03

categories:
  - Java
tags:
  - Java
---
## 函数式编程
在函数式编程中，输入一旦确定了，输出都确定了，函数调用的结果只依赖于传入的输入变量和内部逻辑，不依赖于外部，这样的写出的函数没有副作用。 在函数式编程中，函数也是一等公民，可以被当做参数传递，可以被赋值，被引用，可以把它当做一种数据类型来对待

java 中的函数式编程允许我们定义一个接口，其实现类作为参数传入，由于实现类的内部方法不一样，赋予了该函数极大的可塑性，比如下面这个例子，定义一个过滤器接口
```java
public interface Filter {
    public boolean filter(Pan pan);
}
```
该实现类会根据类型将铅笔过滤掉
```java
public class TypeFilter implements Filter {
    @Override
    public boolean filter(Pan pan) {
        return Objects.equal(pan.getType(), "pancil");
    }
}
```
而该实现类会根据颜色将红色的笔过滤掉 
```java
/**
 * autor:liman
 * createtime:2019/8/3
 * comment:
 */
public class ColorFilter implements Filter { 
    @Override
    public boolean filter(Pan pan) {
        return Objects.equal(pan.getColor(), "red");
    }
}
```
接下来是过滤的实现方法，我们可以通过同一个方法按照 PAN 的不同属性进行过滤，如果按照传统的参数传入基本不可能实现这个效果
```java
    //过滤苹果的方法 
    public static List<Pan> filterApples(List<Pan> pans, Filter filter){
        List<Pan> result = new ArrayList<>();
        for(Pan pan : pans){
            if(filter.filter(pan)){
                result.add(apple);
            }
        }
        return result;
    }
```
我们自然可以自定义一些自己的接口来实现函数式编程，但是 java 以及为我们写好了很多通用的接口，比如 Function

该接口类似一个 map， 但是它不只有 map 的效果。java.util.function.Function<T,R> 接口用来根据一个类型的数据得到另一个类型的数据，前者称为前置条件，后者称为后置条件。Function 接口中最主要的抽象方法为: R apply(T t) ，根据类型 T 的参数获取类型 R 的结果
```java
    public static void main(String[] args) {
        method(s -> Integer.parseInt(s));
    }
    
    private static void method(Function<String, Integer> function) {
        int num = function.apply("10");
        System.out.println(num + 20);
    }
```
方法可以传入两个参数，第一个可以作为参数式函数的入参。参数式函数没有任何的实体，它仅仅是定义了模型，你可以在方法中使用这个模型
```java
    @Test
    public void test3() {
        System.out.println(testFunction(2, i -> i * 2 + 1));
    }

    public static int testFunction(int i, Function<Integer, Integer> function) {
        return function.apply(i);
    }
```

Function 接口中有一个默认的 andThen 方法，用来进行组合操作，意思是先调用传入的函数的 apply 获取结果，再返回以该结果为 key 的 function1，示例如下
```java
    @Test
    public void test3() {
        System.out.println(testFunction(2,i -> i * 2 + 1,j -> j * j));
    }

    public static int testFunction(int i, Function<Integer, Integer> function1, Function<Integer, Integer> function2) {
        return function1.compose(function2).apply(i);
    }
```
但是注意，这么写
## 方法引用
在学会函数式接口以及 lambda 表达式之后，java 为我们提供了更加便捷的写法，那就是方法和构造函数引用，它简便的原因是将方法的入参忽略了。一般有以下几种：
用法     | 表达意思 |  对应的 lambda
-------- | ------------- | -----
类名::方法名  |接口方法传入的第一个参数为该类对象，其他所有参数作为该类该方法的入参| (类名 对象, 参数) -> 对象.方法名(参数)
类名::静态方法| 接口方法传入的所有参数作为该类该方法的入参| () -> 类名.静态方法()
类名::new  | 接口方法传入的所有参数作为该类该构造方法的入参 | (参数1, 参数2...) -> 类名(参数1, 参数2...)
this::方法名| 调用该类对象的该方法，调用者作为该方法的入参 | (a) -> this.方法名(a)
对象::方法名 | 上面的 this 其实是这个的特例，调用者作为入参调用该对象的该方法 | (a) -> 对象.方法(a)

例子：
```java
public interface A {

    public Integer a (String i);
    
}

public class Test {

    public static void main(String[] args) {
        A a = Integer::parseInt;
        System.out.println(a.a("123123"));
    }
    
}
```
## Optional
java8 中的 Optional 灵感八成来自 guava 中的 Optional，它是一个用于防止空指针异常的工具

你可以把它视为一个容器，里面可以存放 null 以及你想放进去的东西

为什么要用它？在某些情况下，你定义的一个 String 可能会因为之前的逻辑失误导致它返回一个 null，此时你再调用这个 String 里的方法，就会出现异常，你可以使用这个 Optional 来防止这种情况
```java
//of()：为非null的值创建一个Optional，如果为 null 则抛异常
Optional<String> optional = Optional.of("...");
//isPresent()： 如果值存在返回true，否则返回false
optional.isPresent();         
//get()：如果Optional有值则将其返回，否则抛出NoSuchElementException
optional.get();           
//orElse()：如果有值则将其返回，否则返回指定的其它值
optional.orElse("fallback");   
//ifPresent()：如果Optional实例有值则为其调用consumer，否则不做处理
optional.ifPresent((s) -> System.out.println(s.charAt(0)));  
//orElseThrow(() -> )：获取不到值就抛异常
optional.orElseThrow(() -> new IllegalArgumentException("不存在")));
```
什么时候应该使用 Optional？这个问题类似与什么时候会出现空指针异常一样，这也是在代码中减少空指针异常的第一步，在写代码的时候应该注意以下几点，不该用 Optional 的情况：

- 返回值为集合，此时不应该返回 null 或者 Optional，应该返回一个空的集合，这样上游在拿到这个集合遍历的时候就不会出问题
- Optional 不要作为入参，除了让人疑惑以外没有任何效果

以下情况应该使用 Optional：

- Optional 有两个含义: 存在 or 缺省，因此返回值可能为空时，应该使用 Optional
- 非空校验，使用 Optional 提供的方法可能会使程序优雅一点，需要使用链式编程，当然也可以用 lombak、jsr303 的注解处理

下面是一个例子，我想拿到一个 map 里的数据，如果有值的话，将他加到一个 list 中去
```java
                for (Long id : detail.getId()) {
                    Optional.of(idNameMap.get(id)).ifPresent(ret::add);
                }
```
## java.time
主要提供了 LocalDateTime、LocalDate、LocalTime，分别代表具体时间、日期、时间，使用起来相当方便。而且使用的频率还非常高

先来说一下为什么不使用 Date 这个比较老的表示时间的类以及负责转换它的 SimpleDateFormat 。Java 的 java.util.Date 和 java.util.Calendar 类易用性差，不支持时区，而且都不是线程安全的，并且大部分方法都被弃用了

Date 如果不格式化，打印出的日期可读性差，可以使用 SimpleDateFormat 对时间进行格式化，但 SimpleDateFormat 是线程不安全的
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/7561a034100f86320a54d10553b7e507.png)
原因是因为 SimpleDateFormat 中的 calendar 是共享变量，并且这个共享变量没有做线程安全控制。当多个线程同时使用相同的 SimpleDateFormat 对象调用 format 方法时，多个线程会同时调用 calendar.setTime 方法，可能一个线程刚设置好 time 值另外的一个线程马上把设置的 time 值给修改了，导致返回的格式化时间可能是错误的

Java 8 提供了新的时间 API 的使用方式，主要包括创建、格式化、解析、计算、修改。我们可以看到重点在于这些表示时间的类与其他类相互转换以及对它们表示时间的修改
### 时间类与字符串的转换
相互转换的功能由 DateTimeFormatter 这个格式化工具提供，而创建与修改的功能则由它自己提供

**format 方法用来将时间转换为字符串**，可以指定转换形式
```java
        LocalDateTime dateTime = LocalDateTime.now();
        
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        System.out.println(dateTime.format(dateTimeFormatter));
```
一句代码将时间转换为字符串
```java
        LocalDateTime date = LocalDateTime.now();
        date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
```

而且**字符串转日期**也非常简单，使用 of 或者 parse 即可。注意 parse 方法是静态方法，推荐用 LocalDate 访问
```java
LocalTime time = LocalTime.of(2015, 1, 11);
LocalDate.parse("2015-01-11");
```

### 时间类与 long 时间戳的转换
由于 time 包下都带有时区的概念，因此时间类与时间戳的转换非常麻烦，都需要设置时区

**将 LocalDate 等类转换为 long 类型时间戳**
```java
time = LocalDate.parse("2018-11-11");
time.atStartOfDay(ZoneOffset.ofHours(8)).toInstant().toEpochMilli();
```
ZoneOffset.ofHours(8) 是转换8小时的意思，因为我们是东8区，需要转换时区

atStartOfDay 是 LocalDate 类特有的方法，用来将时间设置为一天的开头。正常的转换直接在 toInstant 中传入时区即可
```java
date.toInstant(ZoneOffset.ofHours(8)).toEpochMilli();
```

**将 long 类型时间戳转换为 LocalDate**
```java
        Instant instant = Instant.ofEpochMilli(timestamp);
        LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
```
LocalDateTime 提供的 ofInstant 方法可以实现这个需求。该方法用于使用 Instant （瞬间）和 ZoneId 创建 LocalDateTime 的实例。Instant 就代表了时间戳，而 ZoneId 就表示时区了

将这两个参数传递给方法，并且在这两个参数的基础上方法返回 LocalDateTime，LocalDateTime 的计算遵循以下步骤

1，区域 Id 和 Instant 用于从 UTC /格林威治获取偏移量，因为每个实例只能有一个有效偏移量
2，使用该瞬间和所获得的偏移量来计算本地日期时间

我们还可以用 ofEpochSecond 方法来用时间戳生成时间类，但是该方法需要传入时间戳以及纳米级的偏移量，所以一般不使用这个
```java
public static LocalDateTime ofEpochSecond(long epochSecond, int nanoOfSecond, ZoneOffset offset)
```
我们还推荐使用 Instant 提供的转换逻辑，因为需要设定时区，所以不可以直接转换，因此需要 atZone 方法生成 ZonedDateTime，然后调用相应的转换方法进行转换
```java
long timestamp = System.currentTimeMillis();
LocalDate localDate = Instant.ofEpochMilli(timestamp).atZone(ZoneOffset.ofHours(8)).toLocalDate();
```

**关于时区**，我们使用 ZoneId 或者 ZoneOffset 这两个类中的一个就可以了。它们是类似于中间态的概念，使用 ZoneId 的话获取默认值即可，使用 ZoneOffset 的话调用方法加8小时
```java
ZoneId zone = ZoneId.systemDefault();
ZoneOffset zoneOffset = ZoneOffset.ofHours(8);
```
### 时间类与时间戳的转换
Timestamp 一般指的是 java.sql 包下提供的，因为数据库经常性的时间相关的转换而用的比较多

**以下是 LocalDateTime 与 Timestamp 的相互转换**，sql 很友善的提供了对 time 包下类型的支持，可以直接使用 from 方法或者 valueOf 方法来进行转换
```java
LocalDateTime localDateTime = timestamp.toLocalDateTime();

Timestamp timestamp = Timestamp.valueOf(LocalDateTime.now());
```
### 日期相关的获取、修改以及比较
**它还提供了 minus 或者 plus 等等方法修改日期**，分别代表将当前代表的日期减少几周或者将当前日期增加几周
```java
plusYears(i) 增加几年，正负数都可。正数，增加几年。负数，后退几年  
minusYears(i)则相反

plusWeeks(i) 增加几周，正负数都可。正数，增加几周。负数，后退几周   
minusWeeks(i)则相反

plusMonths(i) 增加几个月，正负数都可。正数，增加几个月。负数，后退几个月   
minusMonths(i)则相反

plusDays(i) 增加几天，正负数都可。正数，增加几天。负数，后退几天    
minusDays(i)则相反
```

**获取当前时间使用 now 方法**，如果想直接获取当前 long 类型时间戳，使用 System 中的方法即可
```java
LocalTime time = LocalTime.now();
System.currentTimeMillis();
```

**ChronoUnit（计时单位）用于计算两个时间类的差值**，获取的差值有正负号之分
```java
        LocalDateTime fromDate = LocalDateTime.now();
        LocalDateTime toDate = LocalDateTime.now().plusMinutes(100);

        long minutes = ChronoUnit.MINUTES.between(fromDate, toDate);
        long hours = ChronoUnit.HOURS.between(fromDate, toDate);

        System.out.println(minutes);
        System.out.println(hours);
```
还有 Duration 类可以获取差值，这个类的方法一看就知道如何使用，就不多说了
```java
        LocalDateTime fromDate = LocalDateTime.now();
        LocalDateTime toDate = LocalDateTime.now().plusMinutes(100);
        
        Duration dur= Duration.between(fromDate, toDate);
        
        dur.toMinutes();
        dur.toDays();
        dur.toHours();
        dur.toMillis();
```