---
title: IDEA 常用快捷键以及调试
date: 2022-02-03
categories:
  - 开发工具
tags:
  - IDEA
---

用了这么久的IDEA还没有正经总结过自己使用过的快捷键，以及正经调试过一次代码，今天不读源码，来总结一下这个检测工具的使用
## Alt + Ctrl
Alt + Ctrl + T ：对选中的代码弹出环绕选项弹出层
Alt + Ctrl + V：自动生成新对象，等于new Object().var
Alt + Ctrl + U：生成类的继承图
Alt + Ctrl + O：自动清除导入的类
Alt + Ctrl + L：整理代码
## Alt 快捷键
Alt + Enter：导入包，自动修正
Alt + insert：自动生成类中的get和set方法，右键点击Generate也可以
Alt+/ ：实现注解（需要自己修改）

## Ctrl 快捷键
Ctrl + F 在当前文件进行文本查找 
Ctrl + Z 撤销 
Ctrl + Y 删除光标所在行 或 删除选中的行 
Ctrl + X 剪切光标所在行 或 剪切选择内容
Ctrl + C 复制光标所在行 或 复制选择内容
Ctrl + E 显示最近打开的文件记录列表
Ctrl + 左键单击：进入方法或者类
Ctrl + / 释光标所在行代码，会根据当前不同文件类型使用不同的注释符号

## 其他内容
Alt + Ctrl + Shift + N：查找类
Shift + Enter：开始新一行，光标所在行下空出一行，光标定位到新行位置
Ctrl + Shift + /：代码块注释 
Ctrl +shift+ Y：呼出翻译结果
## 后缀补全
psvm：main函数
sout：system.out.println()

**生成循环**：
fori：生成for (int i = 0; i < ; i++) {}
for：for (Integer integer : integers) {}
forr：for (int i = integers.size() - 1; i >= 0; i--) {}

new String().var：自动生成新对象

**判断空与非空**
student.null：判断为空
student.nn
student.notnull：判断为非空

**if判断**
list.length > 0.if
isSuccess.if

## 调试
首先说第一组按钮，共8个按钮，从左到右依次如下：
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/7c49b5c4f6523824f921065395f09f9d.png)

- Show Execution Point：如果光标在其它页面，点这个按钮回到当前代码运行的地方

- Step Over：步过，一行一行地往下走，如果这一行上有方法不会进入方法

- Step Into：步入，如果当前行有方法，可以进入方法内部，一般用于进入自定义方法内，不会进入官方类库的方法
- Force Step Into：强制步入，能进入任何方法，查看底层源码的时候可以用这个进入官方类库的方法
- Step Out：步出，从步入的方法内退出到方法调用处，此时方法已执行完毕，只是还没有完成赋值

- Drop Frame：回退到上一个断点

- Run to Cursor：运行到光标处，你可以将光标定位到你需要查看的那一行，然后使用这个功能，代码会运行至光标行，而不需要打断点

- Evaluate Expression：计算表达式，这个表达式不仅可以是一般变量或参数，也可以是方法，当你的一行代码中调用了几个方法时，就可以通过这种方式查看查看某个方法的返回值；也可以改变变量的值，这样就能灵活赋值

第二组按钮，共7个按钮，从上到下依次如下：

![](https://i-blog.csdnimg.cn/blog_migrate/a087089ba9285931acc279b7ac0c5b46.png)

- Rerun 'xxx'：重新运行程序，会关闭服务后重新启动程序

- Resume Program：恢复程序，比如，你在第20行和25行有两个断点，当前运行至第20行，按 F9，则运行到下一个断点(即第25行)，再按 F9，则运行完整个流程，因为后面已经没有断点了

异步的查看：查看异步任务，点击 Step Over 是不可以抵达异步代码块的，必须要点 Resume Program，在主线程执行完之后或者在限制条件之前进入异步代码块

- Pause Program：暂停程序，启用 Debug

- Stop 'xxx'：连续按两下，关闭程序。有时候你会发现关闭服务再启动时，报端口被占用，这是因为没完全关闭服务的原因，你就需要查杀所有JVM进程了

- View Breakpoints：查看所有断点，可以对这些断点进行一些操作，比如取消、设置条件、命中后移除等

- Mute Breakpoints：哑的断点，选择这个后，所有断点变为灰色，断点失效。再次点击，断点变为红色并且有效

变量查看：在 Debug 过程中，跟踪查看变量的变化是非常必要的，这里就简单说下 IDEA 中可以查看变量的几个地方，相信大部分人都了解

- 在IDEA中，参数所在行后面会显示当前变量的值
- 标悬停到参数上，显示当前变量信息。点击打开详情如图3.3。我一般会使用这种方式，快捷方便
- 在Variables里查看，这里显示当前方法里的所有变量
- 在Watches里，点击New Watch，输入需要查看的变量。或者可以从Variables里拖到Watche里查看

## Mac 中的键位
以上介绍的是 eclipse 中的键位，在 mac 中键位有所不同，以下是常用键位

快捷键 |快捷键符号	|英文名称|	功能说明
-|-|-|-
Double Shift|	Double ⇧|	Search everywhere	|查询文件名称
Command + F	|⌘F	|Find	|文件内查找，选中一个字符或者词，按下此组合键，在本文件中会高亮显示所有被选中的字符或者词
Shift + Command +F	|⇧⌘F	|Find in path	|在指定的范围中（工程、模块、目录、全局）查找内容中含有指定关键词的文件
Option + Command + 左键\右键|	⌘⌥|	|回到上一次操作位置
Command + Option + L | ⌘⌥ L | | 格式化代码