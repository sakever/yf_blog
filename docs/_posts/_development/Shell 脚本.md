---
title: Shell 脚本
date: 2022-10-13
sidebar: ture
categories:
  - 开发工具
tags:
  - Shell
---
## Shell 脚本
Shell 脚本适用于在 Linux 环境下执行一段连续的命令，比如著名的 docker 就提供了一键安装 docker 的脚本 get-docker.sh

Shell 脚本（shell script），是一种为 shell 编写的脚本程序。业界所说的 shell 通常都是指 shell 脚本，但 shell 和 shell script 是两个不同的概念

你可能听说过很多脚本，比如擅长爬虫的 python 脚本，在浏览器端进行操作的 js 脚本，可以用来做成插件拦截百度的广告、解析视频网站等等。甚至 java 都可以写成脚本，你平时在项目中看见的垃圾代码就是所谓的脚本代码（胶水代码），那学习 Shell 有什么用呢？

脚本（Script），是一种特定的描述性语言，依据一定的格式编写的可执行文件。脚本语言与编译语言不同，用脚本语言写出的脚本文件可以直接作为可执行文件运行，无需像 C 或 C++ 语言那样先编译再运行

脚本执行时，计算机会执行一连串的操作，脚本文件将不同的命令组合起来，并按照确定的顺序自动连续地执行。脚本文件是文本文件，可以使用任一文本编辑器来创建编辑脚本文件

Shell 几乎是 IT 企业必须使用的运维自动化编程语言，特别是在运维工作中的服务监控、业务快速部署、服务启动停止、数据备份及处理、日志分析等环节里，shell 是不可缺的
## 实例
简单来说“Shell 编程就是对一堆 Linux 命令的逻辑化处理”，Shell 的使用非常简单：

1，新建一个文件 touch helloworld.sh，扩展名为 sh（sh 代表 Shell）

2，使脚本具有执行权限：chmod +x helloworld.sh

3，使用 vim 命令修改 helloworld.sh 文件，内容如下：

#!/bin/bash
echo  "helloworld!"

4，运行脚本:./helloworld.sh 

这里有三个要点：

一，一定要写成 ./helloworld.sh ，而不是 helloworld.sh ，运行其它二进制的程序也一样，直接写 helloworld.sh ，linux 系统会去 PATH 里寻找有没有叫 helloworld.sh 的，而只有 /bin, /sbin, /usr/bin，/usr/sbin 等在 PATH 里，你的当前目录通常不在 PATH 里，所以写成 helloworld.sh 是会找不到命令的，要用./helloworld.sh 告诉系统说，就在当前目录找

二，Shell 中 ## 符号表示注释。shell 的第一行比较特殊，#! 用来告诉系统其后路径所指定的程序即是解释此脚本文件的 Shell 程序

在 linux 中，除了 bash shell 以外，还有很多版本的 shell， 例如 zsh、dash 等等，sh 和 bash 都是 Linux 系统 Shell 的一种，其中 bash 命令是 sh 命令的超集，大多数 sh 脚本都可以在 bash 下运行。Linux 系统中预设默认使用的就是 bash

三，如果你在 Shell 中写入 cd 命令，比如：
```
#!/bin/bash
#changedir.sh
cd /home/firefox
pwd
```
你会发现使用 ./ 执行之后 cd 命令像没有执行一样，目录还是在当前目录，可是 pwd 输出了正确的值

这是因为使用 ./ 执行时会生成一个子 Shell，子 Shell 去执行我的脚本，在子 Shell 中已经切换了目录了，但是子 Shell 一旦执行完，马上退出，子 Shell 中的变量和操作全部都收回。回到这个终端根本就看不到这个过程的变化

这时候需要用  source xxx.sh 执行脚本，这时候就是直接在终端的 Shell 执行脚本了，没有生成子 Shell，执行的结果就是输出历史命令，并且切换了目录

source 命令是 bash shell 的内置命令，它是执行 Shell 脚本的另外一种方式，即将 sh 文件作为解释器参数运行，这种运行方式是，直接运行解释器，其参数就是 Shell 脚本的文件名，如：
```
/bin/sh test.sh
/bin/php test.php
```
这种方式运行的脚本，不需要在第一行指定解释器信息，因为我们已经指定了解释器

虽然 ./ 是在子终端运行，但是一些删除命令部署命令还是可以在子终端中实现的，只是在该终端不显示而已

Shell 作为一个脚本语言有他自己的语法，比如变量、数组、函数、判断、循环，只要实现了这些功能，我们就能将它称之为一个脚本语言，如果还可以支持对象，那么这个语言可能还要更高级一点。Shell 只要有一个能编写代码的文本编辑器和一个能解释执行的脚本解释器就可以了
## 语法
接下来简单说一下这种语言的语法：

变量：没有限制符与基础类型，使用 x=x 就可以定义一个变量了，注意等号左右不要加空格，字符串可以选择不加引号、加单引号、加双引号。使用这个变量需要使用 ${x}，其实可以不加 $，但是为了显示方便还是加上吧，像这种脚本语言就比较重视字符串的获取与应用
```
name="yifanxie"
echo "${name}"
```
命令：使用 Linux 下的命令需要使用飘号下面的引号，这样被引用的就是该命令执行后的结果，也可以直接打上命令
```
lll=`ls -al`
echo "${lll}"
ls -al
```
参数：使用 $1 $2 $3 这种形式来获取传入的第一个、第二个、第三个参数，以此类推，函数的参数获取方式也是一样的
```
source test.sh hello

#!/bin/bash
echo "$1"
```
判断：Shell 不支持 ><=，只能通过下面方式判断大小，注意，是判断整数的大小，字符串有其他的判断形式
符号|意思|解释
-|-|-
-eq	|检测两个数是否相等，相等返回 true。|	[ $a -eq $b ] 返回 false。
-ne	|检测两个数是否不相等，不相等返回 true。|	[ $a -ne $b ] 返回 true。
-gt	|检测左边的数是否大于右边的，如果是，则返回 true。|	[ $a -gt $b ] 返回 false。
-lt	|检测左边的数是否小于右边的，如果是，则返回 true。	|[ $a -lt $b ] 返回 true。
-ge|	检测左边的数是否大于等于右边的，如果是，则返回 true。	|[ $a -ge $b ] 返回 false。
-le|	检测左边的数是否小于等于右边的，如果是，则返回 true。	|[ $a -le $b ] 返回 true。


下面是一个例子，注意括号与等号旁边都要有空格
```
#!/bin/bash
name="yifan.xie"
if [ "${name}" = "yifan.xie" ]; then
        echo "hello"
elif [ "${name}" = "root" ]; then
        echo "hi"
else
        echo "1"
fi
```
函数：使用 function 加一个名字，然后大括号中写流程就是一个函数了

循环：for x in x; do ... done 是普通的 Shell 循环
```
for x in `ls`; do
        echo "${x}"
done
```
