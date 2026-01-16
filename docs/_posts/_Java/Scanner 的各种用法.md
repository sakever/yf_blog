--- 
title: Scanner 的各种用法
date: 2022-07-03
categories:
  - Java
tags:
  - Scanner
--- 
## Scanner 类简介

Scanner 类是一个用于扫描输入文本的新的实用程序。它是以前的 StringTokenizer 和 Matcher 类之间的某种结合。由于任何数据都必须通过同一模式的捕获组检索或通过使用一个索引来检索文本的各个部分。于是可以结合使用正则表达式和从输入流中检索特定类型数据项的方法。这样，除了能使用正则表达式之外，Scanner类还可以任意地对字符串和基本类型(如int和double)的数据进行分析。借助于Scanner，可以针对任何要处理的文本内容编写自定义的语法分析器。

## Scanner的各种使用
### next()和nextLine()
next()：读取输入直到空格。它不能读两个由空格或符号隔开的单词。此外，next()在读取输入后将光标放在同一行中

nextLine()：读取输入，包括单词之间的空格和除回车以外的所有符号。读取输入后，nextLine()将光标定位在下一行

### 各种数据类型
使用nextByte()，nextDouble()，nextFloat()，nextInt()，nextLong()，nextShot()　

上述方法包括next和nextLine执行时都会造成堵塞，等待用户在命令行输入数据回车确认

使用这些方法可以读取对应的数据类型直到空格，并且只读对应的数据类型，输入其他类型的值会报InputMismatchException异常

### hasNext()和hasNextLine()
hasNext() ：判断扫描器中当前扫描位置后是否还存在下一段

hasNextLine() ：如果在此扫描器的输入中存在另一行，则返回true

其他的方法包括hasNextInt()，hasNextDoble()等

以上方法都只返回true或者false，并且使用这些方法不会使光标移动

### 指定新的分隔符
Scanner默认使用空格作为分割符来分隔文本，但useDelimiter()方法允许你指定新的分隔符

```java
        Scanner sc = new Scanner(System.in);
        System.out.println("asdfasdf".split("a"));
        sc.useDelimiter(" |,|:");
```

useDelimiter方法传入字符串即可，使用 | 做为断开的符号，上面的代码代表sc使用逗号或者冒号或者空格作为sc的分隔符

这个分隔符设定之后，对上面的所有方法都适用，即hasNext()、next()、nextInt()、hasNextInt()等都适用
### 笔试中的输入模板
```java
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        //sign为对应的分隔符,'|'为分隔符的分隔符
        String[] ss = s.split("sign1|sign2");
        //得到数据，进行算法处理
```