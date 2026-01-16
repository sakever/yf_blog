---
title: Java 中关于字符串处理的常用方法
date: 2022-12-07
sidebar: ture
categories:
  - Java
tags:
  - 字符串
---
# 替换字符串 replaceAll()
replaceAll() 方法使用给定的参数 replacement 替换字符串所有匹配给定的正则表达式的子字符串

第一个参数是正则，第二个参数是需要替换的内容

成功则返回替换的字符串，失败则返回原始字符串

```java
        String Str = new String("www.google.com");
        System.out.print("匹配成功返回值 :" );
        System.out.println(Str.replaceAll("(.*)google(.*)", "runoob" ));
        System.out.print("匹配失败返回值 :" );
        System.out.println(Str.replaceAll("(.*)taobao(.*)", "runoob" ));
```
我们还可以在正则中使用小括号来取字符串中原有的值，然后在替换的内容中使用 $1、$2 等等来取值
```java
        String Str = new String("www.google.com");
        System.out.print("匹配成功返回值 :" );
        System.out.println(Str.replaceAll("(.*)google(.*)", "$1$2"));

        String str = new String("222.googl2.com");
        System.out.print("匹配成功返回值 :" );
        System.out.println(str.replaceAll("(\\d)\\.", "111$1"));
```
在正则表达式中使用 () 定义一个子表达式。子表达式的内容可以当成一个独立元素，即可以将它看成一个字符，可以在 () 中使用元字符

该方法在做字符串替换的时候非常方便，实际应用如下
## 手机号身份证号脱敏
以下是一个 replaceAll 方法使用的例子
```java
String phoneNumber = String.valueOf("18866666666").replace("null", "");
phoneNumber = phoneNumber.replaceAll("(\\d{3})\\d{4}(\\d{4})", "$1****$2");
System.out.println(phoneNumber);
String identityCardNum = String.valueOf("************").replace("null", "");
identityCardNum = identityCardNum.replaceAll("(?<=\\w{5})\\w(?=\\w{2})", "*");
System.out.println(identityCardNum)um);
```
# 拼接字符串 MessageFormat.format() 
该方法用于拼接字符串，在原来的字符串中使用大括号与数字当做占位符，后面的参数可以接上若干的字符串，作为替换占位符的字符串
```java
        System.out.println(MessageFormat.format("hello {0}, {1}", "world", "someone"));
```

每调用一次 MessageFormat.format 方法，都会新创建 MessageFormat 的一个实例，相当于 MessageFormat 只使用了一次。MessageFormat 类的 format 方法如下：
```java
public static String format(String pattern, Object ... arguments){    
    MessageFormat temp = new MessageFormat(pattern);    
    return temp.format(arguments);    
}
```
因此若要多次格式同一个模式的字符串，那么创建一个 MessageFormat 实例在执行格式化操作比较好些：
```java
String message = "oh, {0} is a pig";    
MessageFormat messageFormat = new MessageFormat(message);    
Object[] array = new Object[]{"ZhangSan"};    
String value = messageFormat.format(array);    
    
System.out.println(value);
```
这个方法在做字符串拼接的时候更加方便

# 判断子字符串 contain
String 类型有一个方法：contains，该方法是判断字符串中是否有子字符串。如果有则返回 true，如果没有则返回 false

# 字符串格式化 format

字串格式化输出经常用到，比如将字串固定输出长度可以使用如下方式格式化输出
```java
        String name = "youxiong";
        name = String.format("%-16s", name);
        System.out.println(name+"length"+name.length());
```
注：我们可以直接使用 print 方法格式化
```java
public static void main(String[] args) {
		System.out.printf("%-7s", "a");
	}
```

format 的使用有以下几点：

- %s：例如 printf("%s", "CHINA") 输出 "CHINA" 字符串（不包括双引号）
- %ms：输出的字符串占 m 列，如字符串本身长度大于 m，则突破获 m 的限制,将字符串全部输出。若串长小于 m，则左补空格
- %-ms：如果串长小于 m，则在 m 列范围内，字符串向左靠，右补空格
- %m.ns：输出占 m 列，但只取字符串中左端 n 个字符。这 n 个字符输出在 m 列的右侧，左补空格
- %-m.ns：其中 m、n 含义同上，n 个字符输出在 m 列范围的左侧，右补空格。如果 n>m，则自动取 n 值，即保证 n 个字符正常输出

# 正则匹配字符串
正则匹配字符串有两种方式，一种是 String 内部提供的 match 方法，可以用来判断字符串是否满足正则表达式
```java
// 匹配是否是纯数字
return str.matches("\\d+");
```
另外一种是 Pattern 提供的 compile 方法，这里可以判断，字符串中包含什么，如下：
```java
// 判断字符串中是否包含汉字
Pattern pattern = Pattern.compile("[\\u4e00-\\u9fa5]");
return pattern.matcher(str).find();
```