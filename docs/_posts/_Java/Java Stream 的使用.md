---
title: Java Stream 的使用
date: 2023-11-14
sidebar: ture
categories:
  - Java
tags:
  - Stream
---
Stream 的创建需要指定一个数据源，比如 java.util.Collection 的子类，任何集合类对象以及数组都可以作为这个数据源

它的作用就是链式的对一组元素进行操作，它的操作分为**中间操作**或者**最终操作**两种，最终操作返回一特定类型的计算结果，而中间操作返回 Stream 本身，以下是常见的操作 
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/1d6f948d92aa7f24b87fd3fc3d635128.png)
**无状态：指元素的处理不受之前元素的影响
有状态：指该操作只有拿到所有元素之后才能继续下去
非短路操作：指必须处理所有元素才能得到最终结果
短路操作：指遇到某些符合条件的元素就可以得到最终结果**

Stream 可以使用串行和并行来完成操作，串行操作是用一个线程依次执行，而**并行**操作使用了多线程，将 stream() 改为 parallelStream() 来使用并行流

**流只能用计数器计数**：流虽然可以实现很多高大上的操作，但是遇到需要使用数组下标的问题还是只能使用老土的计数器方式，因此如果程序中涉及到要取下标的操作还是推荐使用 for 循环
```java
    int index = 0;
    list.stream().filter(s -> 
            //每比对一个元素，数值加1
            s.getId() == 10086 ? true : index++ == -1;
        ).findFirst();
```
流的操作大多需要使用 lambda 重写逻辑，它的常见操作如下：
## 开始
我们对一个集合或者迭代器使用 stream 方法就可以得到一个流了
```java
   		Lists.newArrayList().stream();
   		Lists.newArrayList().parallelStream();
```
可以使用 java.util.Arrays.stream(T[] array) 方法用数组创建流
```java
		int[] array={1,3,5,6,8};
		IntStream stream = Arrays.stream(array);
```
还可以使用 Stream 的 of 方法获取一个或者多个流
```java
		Stream.of(splitter.splitToList(a, b));
```
同时，在 of 之后，使用 flatMap 方法即可将多个集合转换为一个流。使用 of 方法的话，各个数组并不是分别映射一个流，而是映射成多个流
```java
		Stream.of(splitter.splitToList(a, b)).flatMap(Arrays::stream);
```
此时使用 flatMap(Array::stream) 可以将生成的多个流被合并起来，即扁平化为一个流
## 中间操作
### forEach 遍历
该方法是最常见的，该方法用来迭代流中的每个数据，不只是 stream 对象，集合也可以直接使用 forEach 方法
```java
		integers.forEach(System.out::println);
```
### map 映射
该方法用于映射每个元素到对应的结果
```java
		integers.stream().map(i -> i+1).forEach(System.out::println);
```
### flatMap 平铺
map 是对流元素进行转换，flatMap 是对流中的元素（数组）进行平铺后合并，即对流中的每个元素平铺后又转换成为了 Stream 流。flatMap 必须返回一个 stream 流，他会将每次返回的流中数据连起来
```java
System.out.println("=====flatmap list=====");
List<String> mapList = list.stream().flatMap(Arrays::stream).collect(Collectors.toList());
mapList.forEach(System.out::print);
System.out.println("\nflatmap list size: " + mapList.size());
System.out.println();
```
如果是数组的话一般在里面直接填入 Arrays::stream 即可，如果是 list 的话传入 Collection::stream
### filter 过滤
该方法用于通过设置的条件过滤出元素，只有满足条件的（里面的方法返回为 true）才会留下来，其他的都会被过滤掉。该方法不会删除原集合的数据
```java
		integers.stream().filter(a -> a/2 == 0).forEach(System.out::println);
```
### limit 限制
该方法用于获取指定数量的流。 以下代码片段使用 limit 方法打印出前 10 条数据
```java
	integers.limit(10).forEach(System.out::println);
```
### sorted 排序
该方法用于对流用指定的操作进行排序，如果不传入 Comparator 排序器，则默认使用自然排序，自然排序需要流中元素需实现 Comparable 接口
```java
	integers.sort((a1, a2) -> a2 - a1).forEach(System.out::println);
```
### distinct 去重
方法用于去除流中的重复元素，该方法不用传入参数
```java
	integers.distinct().forEach(System.out::println);
```
distinct 使用 hashCode 和 equals 方法来获取不同的元素。因此，我们的类必须实现 hashCode 和 equals 方法
### boxed 包装
java 中有很多未经包装的基本数据类型形成的流，比如 IntStream、LongStream、DoubleStream，而 Collectors.toList() 等收集器只能处理对象流（如 Stream&lt;Integer>），不能直接处理 IntStream。因此，需要使用 boxed() 将 int 转换为 Integer

### peek 
是一个中间操作，它接受一个 Consumer 函数式接口，对流中的每个元素执行指定的操作，同时返回一个包含相同元素的新流

一般用于打印调试信息
```java
List<String> result = list.stream()
    .filter(s -> s.length() > 3)
    .peek(s -> System.out.println("After filter: " + s))
    .map(String::toUpperCase)
    .peek(s -> System.out.println("After map: " + s))
    .collect(Collectors.toList());
```

下面是危险操作，因为某些优化会忽略 peek，因此像是修改对象内容的逻辑使用 peek 的话可能不会执行
```java
class Person {
    private String name;
    
    public void setName(String name) { this.name = name; }
    public String getName() { return name; }
}

List<Person> people = Arrays.asList(new Person(), new Person());

List<Person> updated = people.stream()
    .peek(p -> p.setName("Unknown"))  // 修改对象状态
    .collect(Collectors.toList());
```
## 结束操作
以上方法属于中间操作，返回 Stream 本身，结束操作不会指的是不返回 Stream 的方法
###  collect 收集
该方法可以返回列表或者字符串，该方法可以接收一个集合实例，将流中元素收集成该集合实例
 
但是 collect 的功能不止于此，它可以说是内容最繁多、功能最丰富的部分了。从字面上去理解，就是把一个流收集起来，最终可以是收集成一个值也可以收集成一个新的集合

#### toList、toSet 和 toMap
collect 主要依赖 java.util.stream.Collectors 类内置的静态方法，下面用一个案例演示 toList、toSet 和 toMap，以及把一个集合配合一些分隔符链接为一个字符串
```java
List<String> list = strings.stream().collect(Collectors.toList());

List<String> set = strings.stream().collect(Collectors.toList());

Map<String, String> map = strings.stream().collect(Collectors.toMap(k -> k, v -> v));

String mergedString = strings.stream().collect(Collectors.joining(", "));
```
我们在 Collectors.toMap 中对重复的 key 去重
```java
Map<Integer, String> map = list.stream().collect(Collectors.toMap(Person::getId, Person::getName, (oldValue, newValue) -> newValue));
```
Function.identity() 这个函数代表输入什么值就输出什么值，相当与 v -> v

后面的参数则代表遇到重复的 key 时在老值与新值之中取哪个值，举个例子：
```java
list.stream().collect(Collectors.toMap(Person::getId, Function.identity(), (oldV, newV) -> oldV)).values().stream();
```
你还可以根据这个特性将重复的 key，放入 List，（当然我们也可以通过 groupBy 完成这件事）
```java
Map<String, List<Working>> map =
                workings.stream().collect(Collectors.toMap(Working::getInvoicePage,
                        e -> {
                            ArrayList<Working> list = new ArrayList<>();
                            list.add(e);
                            return list;
                        },
                        (oldList, newList) -> {
                            oldList.addAll(newList);
                            return oldList;
                        }));
```
#### Collectors.groupingBy
举个例子，我们可以优雅的对某个集合做分组统计，比如在学生这个 pojo 中，对属性班级做分组或者做分组统计
```java
Map<Integer, List<Student>> studentGroup = studentList.stream().collect(Collectors.groupingBy(Student::getClassNumber));

Map<Integer, Long> map = studentList.stream().collect(Collectors.groupingBy(Student::getClassNumber, Collectors.counting()));
```
上面例子中的第二个，我们修改了返回 Map 值的类型。**第二个重载 groupingBy 方法带另一个参数指定后续收集器，应用于第一个集合结果**。当我们仅指定一个分类器函数，没有后续收集器，则返回 toList() 集合。如何后续收集器使用 toSet()，则会获得 Set 集合，而不是 List。我们甚至可以对已经分组的集合再进行分组
```java
Map<BlogPostType, Set<BlogPost>> postsPerType = posts.stream()
  .collect(groupingBy(BlogPost::getType, Collectors.toSet()));

Map<String, Map<BlogPostType, List>> map = posts.stream()
  .collect(groupingBy(BlogPost::getAuthor, Collectors.groupingBy(BlogPost::getType)));
```
来个常用的功能：收集 pojo 中一对多关系 map
```java
        Map<Long, Set<Long>> parentAuthorMap = list.stream().collect(Collectors.groupingBy(AccountRelation::getParentId,
                Collectors.mapping(AccountRelation::getAuthorId, Collectors.toSet())));
```

**三个参数的 groupingBy 方法，通过提供 Map supplier 函数，其允许我们改变 Map 的类型**
```java
EnumMap<BlogPostType, List<BlogPost>> postsPerType = posts.stream()
  .collect(groupingBy(BlogPost::getType, 
  () -> new EnumMap<>(BlogPostType.class), Collectors.toList()));
```
#### Collectors.mapping
groupingBy 方法的第二个入参，可以是 mapping 方法，这个方法是用来干啥的呢？

基本语法：
```java
Collector<T, ?, R> mapping(Function<? super T, ? extends U> mapper, Collector<? super U, A, R> downstream)
```
- mapper：一个函数，用于将流中的每个元素转换为另一个对象
- downstream：一个收集器，用于处理和收集转换后的元素

eg：假设我们有一个 List<String>，我们想将每个字符串转换为大写，并收集到一个新的列表中
```java
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

        List<String> upperCaseNames = names.stream()
            .collect(Collectors.mapping(String::toUpperCase, Collectors.toList()));

        System.out.println(upperCaseNames); // 输出: [ALICE, BOB, CHARLIE]
    }
}
```
在这个例子中：

String::toUpperCase 是一个函数，它将每个字符串转换为大写
Collectors.toList() 是一个下游收集器，它将转换后的元素收集到一个列表中
#### Collectors.collectingAndThen
Collectors.collectingAndThen() 函数应该最像 map and reduce 了，它可接受两个参数，第一个参数用于 reduce 操作，而第二参数用于 map 操作

先把流中的所有元素传递给第一个参数，然后把生成的集合传递给第二个参数来处理

例如下面的代码

- 把 [1,2,3,4] 这个集合传递给 v -> v * 2 lambda表达式，计算得出结果为[2,4,6,8]
- 然后再把 [2,4,6,8]传递给 Collectors.averagingLong 表达式，计算得出 5.0
- 然后传递给 s -> s * s lambda表达式，计算得到结果为 25.0
```java
@Test
public void collectingAndThenExample() {
    List<Integer> list = Arrays.asList(1, 2, 3, 4);
    Double result = list.stream().collect(Collectors.collectingAndThen(Collectors.averagingLong(v -> {
                System.out.println("v--" + v + "--> " + v * 2);
                return v * 2;
            }),
            s -> {
                System.out.println("s--" + s + "--> " + s * s);
                return s * s;
            }));
    System.out.println(result);
}
```
再比如，我想用对象中的某个属性 list 去重，就可以这么写
```java
                Stream.of(wechatUserInfosFromBackend, wechatUserInfosFromC2b)
                        .flatMap(Collection::stream)
                        .collect(Collectors.collectingAndThen(Collectors.toCollection(() -> new TreeSet<WechatUserInfo>(Comparator.comparing(WechatUserInfo::getExternalUserid))), ArrayList::new))
```
### metch 匹配
metch 函数只返回 true 与 false，该方法会对传入的数据进行逐个判断，有以下几种类型

- allMatch：接收一个 Predicate 函数，当流中每个元素都符合该断言时才返回 true，否则返回 false
- noneMatch：接收一个 Predicate 函数，当流中每个元素都不符合该断言时才返回 true，否则返回 false
- anyMatch：接收一个 Predicate 函数，只要流中有一个元素满足该断言则返回 true，否则返回 false

### find 查询
有以下两个分支

- findFirst 返回流中满足条件的第一个元素
- findAny：返回流中找到的第一个元素

这两个方法在串行流中的概念以及效果是一模一样的，不同之处在于并行流
#### findFirst 与 findAny 的使用
在并行流中的 findAny() 操作，返回的元素是不确定的，对于同一个列表多次调用 findAny() 有可能会返回不同的值。使用 findAny() 是为了更高效的性能。如果是数据较少，串行地情况下，一般会返回第一个结果，如果是并行的情况，那就不能确保是第一个

举个栗子：
```java
        List<Integer> list = new ArrayList<>();
        list.add(1);
        list.add(2);
        list.add(3);
        System.out.println(list.parallelStream().filter(a -> a.equals(2) || a.equals(1) || a.equals(3)).findAny().get());
        System.out.println(list.parallelStream().filter(a -> a.equals(2) || a.equals(1) || a.equals(3)).findFirst().get());
```
这里两个并行流的结果是不一样的，findAny 方法会侧重第一个查到返回值的线程，而 findFirst 则会侧重数组中第一个满足条件的值

#### Optional 的获取
Optional 是对 stream 使用 findFirst 或者 findAny 方法会得到的类，它是为了防止空指针问题而被创造出来的，本来这块内容不应该是流结束操作涉及到的，但是 findAny 或者 findAny 也算是和 stream 结束有关系

我们在获取 Optional 后直接 get 会提示没有进行赋值检查，因此不推荐直接 get，准确的写法如下：
```java
     Optional.of("has value").orElse(getDefault());
     Optional.of("has value").orElseGet(() -> getDefault());
     Optional.of("has value").ifPresent(A::setB);
```
说一下 orElse 与 orElseGet 的区别，orElse 是传值的，所以里面的表达式会立即执行（在传入一个方法的时候），如果 optional 有值也会执行就没必要了；而 orElseGet 接受的是一个 function，只有 optional 为空的时候才会被执行，因此不会让 cpu 资源被浪费

尽量在 orElse 中传入属性，在 orElseGet 中传入方法，如果在 orElse 中传入了方法，而且方法中含有更新修改类的操作，这样就不光是 CPU 或者耗时的问题了
### count 计数
返回流中元素的总个数
```java
	strings.stream().count();
```
### reduce 规约
规约操作（reduction operation）又被称作折叠操作（fold），是通过某个连接动作将所有元素汇总成一个汇总结果的过程。元素求和、求最大值或最小值、求出元素总个数、合并、将所有元素转换成一个元素，都属于规约操作

reduce 擅长的是生成一个值，而 collect 擅长从 Stream 中生成一个集合或者 Map 等复杂的对象

reduce 的方法定义有三种重写形式，我们需要按顺序定义以下三种模式：

- Identity : 定义一个元素代表是归并操作的初始值，如果Stream 是空的，也是 Stream 的默认结果
- Accumulator: 定义一个带两个参数的函数，第一个参数是上个归并函数的返回值，第二个是Strem 中下一个元素
- Combiner: 调用一个函数来组合归并操作的结果，当归并是并行执行或者当累加器的函数和累加器的实现类型不匹配时才会调用此函数。因为 reduce 操作默认是返回一个与流中数据同类型的值，比如如果流中是字符串只能合并成一个字符串，如果我们想返回整形，那就需要用到 Combiner 了

举几个例子，我们可以用它找出数组中最有特色的值，比如最大值最小值：
```java
    Optional<String> res = Stream.of("zhangsan", "lisi", "wanger", "mazi")
            .reduce((s1, s2) -> s1.length() >= s2.length() ? s1 : s2);
    System.out.println(res.get()); 

    Optional<String> res2 = Stream.of("zhangsan", "lisi", "wanger", "mazi")
            .max((s1, s2) -> s1.length() - s2.length());
    System.out.println(res2.get()); 
```
可以用它来求和
```java
        Integer res1 = Arrays.stream(new Integer[]{2, 4, 6, 8})
                .reduce(0, Integer::sum);
```
很明显我们只能将列表变成列表中的一个元素，那假如需要将整数列表变成一个字符串，我们该如何操作呢？我们当然可以先使用 map 做转换，但是也可以使用 reduce 提供的第三个参数
```java
int result = users.stream()
  .reduce("", (a, b) -> a + String.valueOf(b), String::concat);
```

## 原理
简单聊一下 stream 的原理，stream 是一个基于源、零个或多个中间操作、一个终止操作构建的、支持惰性求值和短路优化的函数式数据处理管道

整个 Stream 操作分为两步，构建流水线（filter、map、sorted 等方法，此时会将这些操作记录（链接）起来，形成一个执行计划，而不会立即进行任何数据处理）和触发执行（调用终止操作时会启动，此时数据开始从头到尾依次通过每个操作节点）

JDK 对于 stream 的实现非常巧妙，它使用了双向链表，核心的概念是 stage 和 sink

1，Stage（阶段）：流水线上的每一个操作（包括源和终止操作）在内部都被抽象为一个 Stage。这些 Stage 用双向链表连接起来，每个 Stage 都知道它的上一个（源）和下一个（下游）阶段
2，Sink（槽）：每个 Stage 内部都包含一个 Sink 对象的链。Sink 是一个核心接口，**定义了数据处理的方法**：

- begin(long size)： 开始前调用，可选
- end()： 结束后调用，可选
- accept(T t)： 最重要的方法！ 处理一个元素
- cancellationRequested()： 是否可以提前结束（用于短路操作）

当调用终止操作时，会先从流水线的最后（终止操作） 开始，向前遍历每个 Stage，将每个 Stage 的操作逻辑包装成对应的 Sink。然后将这些槽按顺序连接起来，形成一条 Sink 链。最后一个 Sink 通常负责产生结果。从源头（第一个 Stage）开始，逐个取出数据元素

对于每个数据，调用第一个 Sink 的 accept() 方法。在这个 accept() 方法里，会执行当前 Stage 的操作（如过滤），然后判断是否需要将处理后的结果传递给下游 Sink 的 accept() 方法。如此一环扣一环，数据就会被推过整个 Sink 链

stream 做了一些优化，比如会使用并行流工作窃取的方式（Work Stealing）来平衡线程负载。同时在无状态的操作放在有状态