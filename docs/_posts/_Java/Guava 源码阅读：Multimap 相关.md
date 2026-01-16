--- 
title: Guava 源码阅读：Multimap 相关
date: 2023-01-03

categories:
  - Java
tags:
  - Guava
--- 
## 使用场景
开始之前我先发一个题目：

有一份日志记录，每条记录的内容是一个url，每个url都是AAA/BBB/CCC形式，我现在想得到每个url按照AAA分组，并且在按照分组形势输出每个分组中的所有数据

以下是我第一次遇到这个问题的解法：
```java
        HashMap<String, HashSet<String>> ansFor4 = new HashMap<>(16);
        while((lineInformation = bufferedReader.readLine()) != null){
        int o = key[1].indexOf("/", 1);
        if(o == -1) {
            continue;
        }
        ansFor4Str1 = key[1].substring(1, o);
        ansFor4Str2 = key[1].substring(o + 1);
        if(!ansFor4.containsKey(ansFor4Str1)){
            ansFor4.put(ansFor4Str1, new HashSet<>());
        }
        ansFor4.get(ansFor4Str1).add(ansFor4Str2);
```
思路很简单，创建一个Map<String, Set<>>的集合就可以解决该问题，不过对该数据结构进行操作的时候难免比较麻烦，这时候就可以使用Multimap组件下的数据结构，它的方法包含以上所有操作。

## 源码
### 构造方法
选择我比较熟悉的hash，从HashMultimap开始，进入代码：
```java
	// 以下三个是构造方法，都调用了对应的私有构造器
    public static <K, V> HashMultimap<K, V> create() {
        return new HashMultimap();
    }

	//该方法传入期望key的长度与期望value的长度
    public static <K, V> HashMultimap<K, V> create(int expectedKeys, int expectedValuesPerKey) {
        return new HashMultimap(expectedKeys, expectedValuesPerKey);
    }

	//传入一个multimap
    public static <K, V> HashMultimap<K, V> create(Multimap<? extends K, ? extends V> multimap) {
        return new HashMultimap(multimap);
    }

	// 私有构造器
    private HashMultimap() {
        super(new HashMap());
    }

    private HashMultimap(int expectedKeys, int expectedValuesPerKey) {
        super(Maps.newHashMapWithExpectedSize(expectedKeys));
        Preconditions.checkArgument(expectedValuesPerKey >= 0);
        this.expectedValuesPerKey = expectedValuesPerKey;
    }

    private HashMultimap(Multimap<? extends K, ? extends V> multimap) {
        super(Maps.newHashMapWithExpectedSize(multimap.keySet().size()));
        this.putAll(multimap);
    }
```

选择最简单的一个，点进super看看？
会依次进入HashMultimapGwtSerializationDependencies、AbstractSetMultimap、AbstractMapBasedMultimap，最后的实现就在AbstractMapBasedMultimap中
```java
	// map的定义，如果你思考了上面那道题，一定不会对这个数据结构感到奇怪
	private transient Map<K, Collection<V>> map;
	// 构建
    protected AbstractMapBasedMultimap(Map<K, Collection<V>> map) {
        Preconditions.checkArgument(map.isEmpty());
        this.map = map;
    }

	// Preconditions.checkArgument(boo)方法，异常处理，传进来一个new的map一定是空，如果非空，抛异常
    public static void checkArgument(boolean expression) {
        if (!expression) {
            throw new IllegalArgumentException();
        }
    }
```
#### 私有化构造方法
我们一般在单例模式下看到私有化构造方法，目的是为了从头至尾只有一个对象的实例，外部的类的所有对象只能是对该内部对象的引用。外部一万个对象也都只能是对内部对象的引用。

但是在该类中并没有一个单例，它的目的只是使得该类不被实例化，和不能被继承。
### 看看其他方法
```java
	//返回set集合
    Set<V> createCollection() {
        return Sets.newHashSetWithExpectedSize(this.expectedValuesPerKey);
    }
    
    // IO，输入输出
    @GwtIncompatible
    private void writeObject(ObjectOutputStream stream) throws IOException {
        stream.defaultWriteObject();
        Serialization.writeMultimap(this, stream);
    }

    @GwtIncompatible
    private void readObject(ObjectInputStream stream) throws IOException, ClassNotFoundException {
        stream.defaultReadObject();
        this.expectedValuesPerKey = 2;
        int distinctKeys = Serialization.readCount(stream);
        Map<K, Collection<V>> map = Maps.newHashMap();
        this.setMap(map);
        Serialization.populateMultimap(this, stream, distinctKeys);
    }
```
看到这里我很好奇，最重要的增删改查呢？接着在父类中寻找发现，增删改查是在AbstractMapBasedMultimap中实现了

put方法
```java
	// put的过程和我之前数据结构的增加操作基本相似
	// 首先查看要加入的key在集合中是否存在，如果不存在，创建一个
	// 如果存在，直接加入容器
    public boolean put(@Nullable K key, @Nullable V value) {
        Collection<V> collection = (Collection)this.map.get(key);
        if (collection == null) {
        	// 以下就是创建并且把value加入的过程
            collection = this.createCollection(key);
            if (collection.add(value)) {
                ++this.totalSize;
                this.map.put(key, collection);
                return true;
            } else {
            	// 异常处理
                throw new AssertionError("New Collection violated the Collection spec");
            }
        } else if (collection.add(value)) {
            ++this.totalSize;
            return true;
        } else {
            return false;
        }
    }

	//创建集合时调用这个方法，子类都有重写，根据不同需求实现不同集合
    abstract Collection<V> createCollection();

    Collection<V> createCollection(@Nullable K key) {
        return this.createCollection();
    }
```
get方法

get方法无论如何都会返回一个集合，如果没找到数据会返回一个空集合，Multiset也是一样
```java
    public Collection<V> get(@Nullable K key) {
        Collection<V> collection = (Collection)this.map.get(key);
        // 如果没有找到对应集合，创建一个
        if (collection == null) {
            collection = this.createCollection(key);
        }

        return this.wrapCollection(key, collection);
    }
```
其中它的返回值有些诡异，返回一个弯曲的集合？
```java
    Collection<V> wrapCollection(@Nullable K key, Collection<V> collection) {
        if (collection instanceof NavigableSet) {
            return new WrappedNavigableSet(key, (NavigableSet)collection, (WrappedCollection)null);
        } else if (collection instanceof SortedSet) {
            return new WrappedSortedSet(key, (SortedSet)collection, (WrappedCollection)null);
        } else if (collection instanceof Set) {
            return new WrappedSet(key, (Set)collection);
        } else {
            return (Collection)(collection instanceof List ? this.wrapList(key, (List)collection, (WrappedCollection)null) : new WrappedCollection(key, collection, (WrappedCollection)null));
        }
    }
```
instanceof是Java中的二元运算符，左边是对象，右边是类；当对象是右边类或子类所创建对象时，返回true，否则返回false

而NavigableSet，其实以前用过。TreeSet继承了抽象类AbstractSet和NavigableSet接口，而NavigableSet接口又继承了SortedSet接口。

那这个方法的意思就是如果它是NavigableSet的子类，返回对应粒度较细的集合，否则按粒度升高，如果它不属于set，multimap还定义了对应的list集合

看看WrappedSet方法？WrappedNavigableSet、WrappedSortedSet都是其子类，并且最后会跳到这个类中WrappedCollection
```java
		private class WrappedCollection extends AbstractCollection<V>
		
        final K key;
        Collection<V> delegate;
        final AbstractMapBasedMultimap<K, V>.WrappedCollection ancestor;
        final Collection<V> ancestorDelegate;
		
        WrappedCollection(@Nullable K key, Collection<V> delegate, @Nullable AbstractMapBasedMultimap<K, V>.WrappedCollection ancestor) {
            this.key = key;
            this.delegate = delegate;
            this.ancestor = ancestor;
            this.ancestorDelegate = ancestor == null ? null : ancestor.getDelegate();
        }
```
可以看到，该类将key和集合联系起来了，综述，我们根据该工具返回的集合不是普通的放进去的集合，是guava给我们定义的集合，这么做有什么好处？举个栗子
```java
        public void add(int index, V element) {
            this.refreshIfEmpty();
            boolean wasEmpty = this.getDelegate().isEmpty();
            this.getListDelegate().add(index, element);
            AbstractMapBasedMultimap.this.totalSize++;
            if (wasEmpty) {
                this.addToMap();
            }

        }
```
可以看见该集合在执行加入操作的时候总数目也增加了，也就是说，我们对获取集合进行对应操作的时候，它会自动的对整体有一定影响，让我们使用的更加方便
### 实现区别
在AbstractMapBasedMultimap中只是最基础的实现，你会看到这里面的方法虽然实现了但是还有很多重写。主要分为list与set两派。

以put举例，有AbstractListMultimap以及AbstractSetMultimap两种重写
```java
	//AbstractListMultimap中的put方法
    @CanIgnoreReturnValue
    public boolean put(@Nullable K key, @Nullable V value) {
        return super.put(key, value);
    }
    
	//AbstractSetMultimap中的put方法
    @CanIgnoreReturnValue
    public boolean put(@Nullable K key, @Nullable V value) {
        return super.put(key, value);
    }
```
这两不一样的吗？
对，不过他们的value实现不一样，一个是List<V>，另一个则是Map<V>。其中，AbstractSetMultimap的实现之一就是一开始的HashMultimap，而AbstractListMultimap的继承者是ArrayListMultimap等
