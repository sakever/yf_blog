---
title: String、StringBuffer、StringBuilder 学习笔记
date: 2021-05-14

sidebar: ture
categories:
  - Java
tags:
  - 字符串
---
## String
### 特点
java9 之后 String 中存储字符的数组已经变成了 byte 数组，不再是 char，这么做的原因是为了节省空间

因为 char 是2字节，byte 是1字节（8位，如果 byte 使用 ASCII/Latin-1 字符是单字节，UTF-16 编码是双字节）。同时实际应用中的字符串分布（根据大量应用统计）：
- 约 70-80% 的字符串只包含 Latin-1 字符
- 约 20-30% 的字符串包含非 Latin-1 字符

此时使用 byte 更加节省空间

String 中储存的字符串不能改变，每次对 String 的操作都会生成新的 String 对象，因为内部的 char 数组用 final 修饰
### 创建了几个对象
字符串有一个常量池，这个池叫字符串池，不是常量池也不是运行时常量池，而是字符串常量池。这个常量池在堆中，**存放的是字符串常量的引用**，它的所在位置和存放的东西都与运行时常量池不一样

所有的字符串都是 String 对象，由于字符串文字的大量使用，java 中为了节省时间，在编译阶段，会把字符串文字放在字符串池中，字符串池的一个好处就是可以把相同的字符串合并，占用一个空间

在面试中经常会问到以下问题
```java
String a0 = "abc";
String a1 = "abc";
String a2 = new String("abc");
String a3 = "ab" + "c";
String a4 = a1 + "c";
```
问以上的语句各生成了几个对象，或者问 a1 和 a2 是否指向同一个地址，下面是答案
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/411ee89e1fe94188a5f42c794a18d160.png)

这是生成的 class 文件：
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/57df9a40d0cda3a67f7e53d25c30bcd9.png)
下面来解释一下为什么

```java
String a0 = "abc";
String a1 = "abc";
```
例子中的 a0 和 a1 都会指向在字符串常量池中的地址，这里是语法糖，这种字面量方式创建对象的话编译器会将 abc 放入 class 文件的常量池中，而如果使用 new String 方式创建的话则会强制在堆中创建 String 对象
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/9541f6a063ef48cf85a3c9d4c5588c1b.png)

```java
String a3 = "ab" + "c";
```
而 ab 和 c 也都是字符串常量，**前端编译器在编译时就去掉其中的加号**，直接将其编译成一个相连的结果存入了常量池，当一个字符串由多个字符串常量连接而成时，它自己也是字符串常量，a3 也同样指向一个字符串常量
```java
String a2 = new String("abc");
```
实际上是 **abc 本身就是字符串常量池中的一个对象**，在运行 new String()时，把文字池即 pool 中的字符串 abc 复制到堆中，并把这个对象的应用交给 s，所以创建了两个 String 对象

注意，**abc 对应字符串常量池中的字面量对象，new String 只不过把这个字面量对象拉出来，复制了一下参数，然后成了个新对象**

a2 会在堆中创建的新对象，并在常量池中创建常量，因此会创建两个对象，它的引用指向堆中的对象
```java
String a1 = "ab";
String a4 = a1 + "c";
```
4，在拼接操作中，只要出现变量，编译器就不能直接获得变量的值，因此无法直接拼接，只有在运行时才会调用 StringBuilder 的 append 方法来进行拼接，所以也会 new 一个 StringBuilder 的对象。因此，这两条语句生成了三个字符串对象，一个 StringBuilder 对象
#### 问题分析
1，String 对象的有两种创建方式

一种是 new 一个对象出来，这种方式一定会在堆内存中生成一个新字符串对象，如果这个字符串对象在字符串常量池中没有，也会在常量池中创建一个指向该对象的引用

**当使用双引号创建字符串常量时，该字符串会被直接放进字符串常量池**

2，前端编译器自动拼接字符串

前端编译器在编译时遇到两个字符串常量时，会去掉其中的加号，直接将其编译成一个相连的结果，但是如果遇到对象或者对象指针就不会这样优化了

3，前端编译器自动拼接字符串时遇到对象怎么办

在编译时遇到对象编译器会 new 出一个 StringBuilder 对象，然后进行 append 操作，最后通过 toString 方法返回 String 对象，这个对象就和 new 出来的字符串对象一样

4，intern 方法，如果字符串常量池中已经存在相同内容的字符串，则返回池中的字符串引用；如果池中不存在该字符串，则将其放入池中并返回引用
### 部分源码
```java
\\最主要的是重写比较方法
\\优先判断地址，然后判断是ASCII还是ctf-8编码，并分别进入两个方法进行比较
\\重写了equals，一般是基于对象的内容实现的，而保留hashCode的实现不变，那么很可能某两个对象明明是“相等”，而hashCode却不一样
public final class String 
implements java.io.Serializable, Comparable<String>, CharSequence {

	public int hashCode() {
        int h = hash;
        if (h == 0 && value.length > 0) {
            hash = h = isLatin1() ? StringLatin1.hashCode(value)
                                  : StringUTF16.hashCode(value);
        }
        return h;
    }
    
    public boolean equals(Object anObject) {
        if (this == anObject) {
            return true;
        }
        if (anObject instanceof String) {
            String aString = (String)anObject;
            if (coder() == aString.coder()) {
                return isLatin1() ? StringLatin1.equals(value, aString.value)
                                  : StringUTF16.equals(value, aString.value);
            }
        }
        return false;
    }
}


final class StringLatin1 {
    public static boolean equals(byte[] value, byte[] other) {
        if (value.length == other.length) {
            for (int i = 0; i < value.length; i++) {
                if (value[i] != other[i]) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    
    public static int hashCode(byte[] value) {
        int h = 0;
        int length = value.length >> 1;
        for (int i = 0; i < length; i++) {
            h = 31 * h + getChar(value, i);
        }
        return h;
    }
}

	
final class StringUTF16 {
    public static int hashCode(byte[] value) {
        int h = 0;
        int length = value.length >> 1;
        for (int i = 0; i < length; i++) {
            h = 31 * h + getChar(value, i);
        }
        return h;
    }
    
    @HotSpotIntrinsicCandidate
    public static boolean equals(byte[] value, byte[] other) {
        if (value.length == other.length) {
            int len = value.length >> 1;
            for (int i = 0; i < len; i++) {
                if (getChar(value, i) != getChar(other, i)) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
}

```

## StringBuffer
### 特点
线程安全

可变类，和线程安全的字符串操作类，任何对它指向的字符串的操作都不会产生新的对象

每个 StringBuffer 对象都有一定的缓冲区容量（内部是 char[] 实现的，调用 append 方法时不会像 string 一样创建新数组，而是在老数组上做更改），当字符串大小没有超过容量时，不会分配新的容量，当字符串大小超过容量时，会自动增加容量 
### 部分源码
实现父类 AbstractStringBuilder，除了多了一个 synchronized 来修饰大部分方法，基本和 StringBuider 类一模一样
```java

\\append 是用 synchronized 修饰的,所以是线程安全的
public synchronized StringBuffer append(String str) {  
        //执行父类的append(str)  
        super.append(str);  
        return this;  
} 

```
## StringBuilder
### 特点
线程不安全
### 部分源码
AbstractStringBuilder 的源码，StringBuilder 大多重写了方法，几乎所有的重写都是：

方法名（）{return super.方法名（）}
```java
    @Override
    public int compareTo(StringBuilder another) {
        return super.compareTo(another);
    }

    @Override
    public StringBuilder append(Object obj) {
        return append(String.valueOf(obj));
    }

    @Override
    @HotSpotIntrinsicCandidate
    public StringBuilder append(String str) {
        super.append(str);
        return this;
    }

    public StringBuilder append(StringBuffer sb) {
        super.append(sb);
        return this;
    }

    @Override
    public StringBuilder append(CharSequence s) {
        super.append(s);
        return this;
    }


    public StringBuilder append(CharSequence s, int start, int end) {
        super.append(s, start, end);
        return this;
    }

    @Override
    public StringBuilder append(char[] str) {
        super.append(str);
        return this;
    }


    @Override
    public StringBuilder append(char[] str, int offset, int len) {
        super.append(str, offset, len);
        return this;
    }

    @Override
    public StringBuilder append(boolean b) {
        super.append(b);
        return this;
    }

    @Override
    @HotSpotIntrinsicCandidate
    public StringBuilder append(char c) {
        super.append(c);
        return this;
    }
```

## AbstractStringBuilder
### 特点
实现了 StringBuilder 与 StringBuffer

AbstractStringBuilder 类具体实现了可变字符序列的一系列操作，比如：append()、insert()、delete()、replace()、charAt() 方法
### 部分源码
```java
abstract class AbstractStringBuilder implements Appendable, CharSequence {
 
    char[] value;
 
    int count;
 
    AbstractStringBuilder() {
    }
 
    AbstractStringBuilder(int capacity) {
        value = new char[capacity];
    }
 
    @Override
    public int length() {
        return count;
    }
 
    public int capacity() {
        return value.length;
    }
 
 
    public void trimToSize() {
        if (count < value.length) {
            value = Arrays.copyOf(value, count);
        }
    }
    
    public AbstractStringBuilder append(String str) {
	    if (str == null)
	        return appendNull();
	    int len = str.length();
	    //扩容
	    ensureCapacityInternal(count + len);
	    str.getChars(0, len, value, count);
	    count += len;
	    return this;
	}    
 
    public void setLength(int newLength) {
        if (newLength < 0)
            throw new StringIndexOutOfBoundsException(newLength);
        ensureCapacityInternal(newLength);
 
        if (count < newLength) {
            Arrays.fill(value, count, newLength, '\0');
        }
 
        count = newLength;
    }
}
```
扩容：

AbstractStringBuilder 的扩容机制会增加到原来的2倍加2，其他的和 ArrayList 扩容相同
```java
    public void ensureCapacity(int minimumCapacity) {
        if (minimumCapacity > 0)
            ensureCapacityInternal(minimumCapacity);
    }
 
    private void ensureCapacityInternal(int minimumCapacity) {
        // overflow-conscious code
        if (minimumCapacity - value.length > 0) {
            value = Arrays.copyOf(value,
                    newCapacity(minimumCapacity));
        }
    }
 
    private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;
 
    private int newCapacity(int minCapacity) {
        // overflow-conscious code
        int newCapacity = (value.length << 1) + 2;
        if (newCapacity - minCapacity < 0) {
            newCapacity = minCapacity;
        }
        return (newCapacity <= 0 || MAX_ARRAY_SIZE - newCapacity < 0)
            ? hugeCapacity(minCapacity)
            : newCapacity;
    }
 
    private int hugeCapacity(int minCapacity) {
        if (Integer.MAX_VALUE - minCapacity < 0) { // overflow
            throw new OutOfMemoryError();
        }
        return (minCapacity > MAX_ARRAY_SIZE)
            ? minCapacity : MAX_ARRAY_SIZE;
    }
```

删除：

delete 方法首先检查参数的合法性。当 end 大于 value 数组中已存储的字符数 count 时，end 取 count 值

最后，当需要删除的字符数大于1的时候，调用 System 类的 arraycopy 静态方法进行数组拷贝完成删除字符的操作，并更新 count 的值
```java
@Override
public synchronized StringBuffer delete(int start, int end) {
    toStringCache = null;
    super.delete(start, end);
    return this;
}

// AbstractStringBuilder.java
public AbstractStringBuilder delete(int start, int end) {
    if (start < 0)
        throw new StringIndexOutOfBoundsException(start);
    if (end > count)
        end = count;
    if (start > end)
        throw new StringIndexOutOfBoundsException();
    int len = end - start;
    if (len > 0) {
        System.arraycopy(value, start+len, value, start, count-end);
        count -= len;
    }
    return this;
}    

```