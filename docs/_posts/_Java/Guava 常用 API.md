--- 
title: Guava 常用 API
date: 2023-01-03

categories:
  - Java
tags:
  - Guava
--- 
## Strings
关于String的工具类，主要提供静态的工具方法。该类提供空与null对象处理，返回共同前后缀，字符串加入或者重复等操作
```java
static boolean isNullOrEmpty(@Nullable String string)：判断该字符串是否为空

static String nullToEmpty(@Nullable String string)：将null字符串转换为空，如果字符串中包含东西，返回原来的字符串
static String EmptyToNull(@Nullable String string)：将空字符串转换为null

static String commonPrefix(CharSequence a, CharSequence b)：比较两个公共的字符串，返回两个字符串共同的前缀
static String commonSuffix(...)：返回两个字符串共同的后缀

static String padStart(String string, int minLength, char padChar)：在string之前加入minLength数量的padChar
static String padEnd(...)：在string之后加

static String repeat(String string, int count)：返回重复count次的string
```
##  原语工具
Guava提供大量包装工具类来处理原始类型的对象
我们以Ints为例，这个类补充java中关于Integer相关操作
```java
static int compare(int a, int b)：比大小，返回1，0或者-1
static List<Integer> asList(int... backingArray)：返回List集合，可以直接用sout输出

static int max(int... array)：可以比较多个元素了！
static int min(...)：同上
static int maxAndMin(...)

static boolean contains(int[] array, int target)：返回array数组中是否有target这个元素
```

除了这些还有Floats、Longs等一个8个辅助类，方法基本一致
## Objects
```java
static boolean equals(Object a, Object b)：比较两个对象，比起jdk中的优点在于它不会出现空指针异常
static int hash(Object... values)：计算一群对象的hash码
MoreObjects.firstNonNull（T，T）：返回第一个不为null的数据
```
## Joiner 与 Splitter
Joiner 用来将集合中各个元素用一定方式连接起来，其中大部分返回值为 Joiner 方法都返回一个新的 Joiner 对象

Splitter 则用于拆分字符串，底层使用 subString 方法

这两个的实例都是不可变的
```java
static Joiner on(String separator)：输入分隔符
final String join(Object[] parts || Iterator<?> parts || Iterable<?> parts)：可以传入连续的一组数据、迭代器、集合、对象数组等，返回一个按之前方式连接的字符串（Iterable指的是一串字符，Iterator是迭代器）
Joiner skipNulls()：跳过空格
Joiner useForNull(final String nullText)：将空格替换为nullText，注意，不能将上面两种方法混合使用或者一个方法用多次
withKeyValueSeparator(char keyValueSeparator)：当集合为Map时，键值对中插入keyValueSeparator
StringBuilder appendTo(...)：join方法是该方法以及其重载的封装

static Splitter on(CharMatcher separatorMatcher || String separator || char separator)：返回使用给定的字符做成的分离器
Iterable<String> split(CharSequence sequence) || List<String> splitToList(CharSequence sequence)：把要分离的字符串丢进去，返回分离后的一串字符或者集合
Splitter trimResults(CharMatcher trimmer)：从返回的结果中删除了trimmer，如果什么也没有，删除空格
Splitter omitEmptyStrings()：去除空的元素
Splitter.MapSplitter withKeyValueSeparator(char separator)：当集合为Map时，按separator分离
```
Splitter 使用示例，下面的 iterable 就是包含了所有被分隔的字符串，同时，onPattern 方法是指传入正则表达式，与正则相匹配的都会被分隔
```java
        String s = "<Token><![CDATA[ENCApHxnGDNAVNY4AaSJKj4Tb5mwsEMzxhFmHVGcra996NR]]></Token>";
        Iterable<String> iterable = Splitter.onPattern("[\\[\\]]").omitEmptyStrings().split(s);
```
Joiner 使用示例
```java
Joiner.on("||").skipNulls().join(iterable)
```
## CharMatcher
该类有一些静态变量，用于表示一些字符，比如CharMatcher.ANY匹配所有字符；CharMatcher.WHITESPACE匹配空白字符等

该类可以用于匹配字符
```java
static CharMatcher anyOf(CharSequence sequence)：返回值可以表示sequence中任意一个字符
or：CharMatch可以表示前一个或者后一个
is：CharMatch表示is方法内的字符
isNot、and等
String trimFrom(CharSequence sequence)：从sequence中保留调用该方法的CharMatch的字段
```

## Function 以及 Predicate
这两个都可以使用函数式编程，Function 一般用来将输入转化为输出，第一个值为输入类型，第二个为输出：
```java
        Function<Integer, String> l = new Function<Integer, String>() {
            @Nullable
            @Override
            public String apply(@Nullable Integer integer) {
                return String.valueOf(integer);
            }
        };
```
而 Predicate 用来过滤对象，筛选满足条件的对象，返回值为 boolean 类型：
```java
        Predicate<Integer> f = new Predicate<Integer>() {
            @Override
            public boolean apply(@Nullable Integer integer) {
                return integer == null ? false : integer > 5;
            }
        };
        System.out.println(f.apply(1));
```
static <F, T> List<T> transform(List<F> fromList, Function<? super F, ? extends T> function)：Lists中的transform方法用于集合中每个元素的转换，其中传入的第二个参数就是Function方法

以下方法，将l集合中每个元素转换为String并且后面跟一个'a'
```java
        List<Integer> l = Lists.newArrayList(12,3,213,123,213,123,213,1);
        List<String> ll = Lists.transform(l, new Function<Integer, String>() {
            @Nullable
            @Override
            public String apply(@Nullable Integer integer) {
                return Integer.toString(integer) + "a";
            }
        });
```
static <T> Optional<T> tryFind(Iterable<T> iterable, Predicate<? super T> predicate)：Iterables类中的tryFind方法，用于找出集合中满足条件的元素，其中传入的第二个参数就是Predicate方法
## Optional
该类名为可选择的，意图就是该类可以选择为null或者指定对象，一般有两个用法：
1，知道返回值是否存在
```java
        Optional<String> o = Optional.of("str");
        if(o.isPresent()) {
            String s = o.get();
        }
``
其中of用于构建包含传入参数的Optional对象，isPresent方法判断该对象中有无实例，get用于获取该对象包含的值

2，设置为默认值
```java
Optional.fromNullable(null).or(0)：fromNullable方法里写的是可能为null的对象，or后面跟的就是默认值
```

## Ordering
```java
static <C extends Comparable> Ordering<C> natural()：返回使用值的自然顺序排序序列化，可以用于排序，eg：

Collections.sort(list, Ordering.natural());

Ordering<S> reverse()，返回相反顺序

Collections.sort(list, Ordering.natural().reverse());
```
## 新容器
### ImmutableXXX
不可变类容器，这些容器不可以使用add、set方法更改容器内容，会直接抛出异常；该容器线程安全，不会被调用者修改，对原容器的修改也不会影响到它

Collections.unmodifiableXXX方法是视图映射，用该方法生成的集合虽然不能更改，但是用集合更改之后这些集合也会对应的更改

### Multimap
https://blog.csdn.net/sekever/article/details/125788899

除此之外还有Multiset，也是1对n关系的集合

### BiMap
该集合的KV可以相互转换，不过不止key需要保证唯一，value也需要保证唯一
```java
BiMap<V,K> inverse()：将map的KV颠倒
V put(K key, V value)：放入
V get(K key)：查询
```

### RangeSet 与 RangeMap
看名字就知道这是提供区间功能方面的容器

RangeSet 提供诸如区间合并、区间分裂等功能

RangeMap 则提供区间到 value 的映射关系，但是不能进行区间合并操作

## 缓存
guava 通过接口 LoadingCache 提供了基于内存的缓存
```java
		//用builder创建一个缓存
        LoadingCache<String, String> loadingCache = CacheBuilder.newBuilder()
        		//缓存的最大容量
                .maximumSize(300)
                //存放元素的过期时间
                .expireAfterAccess(30, TimeUnit.MINUTES)
                //缓存刷新间隔
                .refreshAfterWrite(10, TimeUnit.MINUTES)
                //如果在缓存中找不到东西的情况下，就会调用下面的load方法
                //load 方法的返回值就是该键的值
                .build(new CacheLoader<String, String>() {
                    @Override
                    public String load(String s) {
                        System.out.println("no cache");
                        return s;
                    }
                });
```
同时，guava 的缓存还提供了 removalListener 方法，该方法可以监听缓存数据被删除这个事件

该缓存是线程安全的，容量不够是使用 LRU 来删除元素，并且存放在本地内存中。允许多种缓存清除策略同时使用

1，基于存活时间的清除策略

- expireAfterWrite 写缓存后多久过期
- expireAfterAccess 读写缓存后多久过期
- 存活时间策略可以单独设置或组合配置

2，基于容量的清除策略：通过 CacheBuilder.maximumSize(long) 方法可以设置 Cache 的最大容量数，当缓存数量达到或接近该最大值时，Cache 将清除掉那些最近最少使用的缓存

3，基于权重的清除策略：使用 CacheBuilder.weigher(Weigher) 指定一个权重函数，并且用 CacheBuilder.maximumWeight(long) 指定最大总重

我们可以使用 Caffeine（咖啡因），**Caffeine 是 Guava 缓存的最佳升级选择**，它保留了相似的 API 设计，同时提供了显著提升的性能和更现代的缓存算法。在需要磁盘溢出或企业级功能的情况下，我们还可以使用 Ehcache

内存缓存的实现其实并不难理解，guava 使用 ConcurrentHashMap 作为缓存的主要存储结构，提供线程安全的键值存储。同时还维护队列作为淘汰策略

比如当缓存达到最大大小时，使用 LRU 最近最少使用算法淘汰；使用时间队列 WriteQueue/AccessQueue 按时间排序，记录写入时间，定期清理过期条目；还可以使用 WeakReference 存储键或值，做基于引用的淘汰

