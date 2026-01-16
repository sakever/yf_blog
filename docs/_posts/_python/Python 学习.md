---
title: Python 学习
date: 2023-03-22
sidebar: ture
categories:
  - Python
tags:
  - Python
---
在后台项目中涉及到了 python 模块，再次被迫无奈学习了 python 相关知识
# Conda 环境搭建
如果要接手一个 py 工程，首先要搭建一个 python 环境，因为工程中使用的三方依赖太多了，就不能直接下载 python 或者使用 pip 来管理依赖包，推荐使用 Anaconda。Anaconda 是一个开源的 Python 发行版本，其包含了 conda、Python 等180多个科学包及其依赖项。它可以用于在同一个机器上安装不同版本的软件包及其依赖，并能够在不同的环境之间切换

它允许我们创建一个虚拟环境，在虚拟环境下搭建安装 python 的环境，比直接安装 python 简单

- 环境 = "好比一栋楼，在楼里面分配一间屋给各种‘包’放，每间房里面的‘包’互不影响"
- 激活环境 = “告诉电脑，我现在要用这个屋子里面的‘包’来做东西了所以要进这间屋子”
- 移除环境 = “现在这个屋子里面我原来要用的东西现在不需要了把它赶出去节省电脑空间”

Conda 创建环境相当于创建一个虚拟的空间将这些包都装在这个位置，我不需要了可以直接打包放入垃圾箱，同时也可以针对不同程序的运行环境选择不同的 conda 虚拟环境进行运行。这里的不需要的工具，指的就是 python 包

在执行 py 项目时，我们需要先切换到对应的环境，然后下载依赖，为项目配置对应的 py 解释器，最后才可以运行项目
## conda 基础命令
```linux
-- 查看 conda 版本，也可以用于查看是否安装好了 conda
conda --version

-- 查看所有的环境
conda env list

-- 查看所有的 py 包的信息，查看环境中现有的包。相当于清点一下我买了多少工具
conda list
pip list

-- 创建环境，指定 py 版本
conda create -n proname python=3.8
conda create --name proname python=3.8

-- activate 能将我们引入 anaconda 设定的虚拟环境中
-- 如果你后面什么参数都不加那么会进入 anaconda 自带的 base 环境
conda activate python34 

-- 退出当前base环境
conda deactivate

-- 卸载环境
conda remove --name test --all

-- 下载安装 requests 包
conda install requests

-- 如果报 CondaHTTPError，说明我们的镜像需要更换了，添加新镜像
conda config --add channels http://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/free/win-64/

-- 查看添加的镜像
conda config --show-sources

-- 删除旧镜像
conda config --remove channels 源名称或链接 
```
## 项目结构
本文介绍的 python 项目结构适合于中小型项目，应用非常广泛，初学者应该养成好习惯，一开始就用这种方式来组织自己的代码。

假设新建项目的名称为 myproject，可以在 windows 或 linux终端，创建如下项目结构
```py
└─myproject
    │  .gitignore
    │  LICENSE
    │  readme.md
    │  requirements.txt
    │  setup.py
    │
    ├─myproject
    │      main.py
    │      util.py
    │      __init__.py
    │
    └─test
            test_main.py
```

# pip 环境搭建
使用 pip 管理依赖包，这种方式比较适合写简单的 py 脚本，在 mac 下的控制台直接输入 python3，系统会自动下载，并且也不需要配置 py 环境，非常方便
## python 基础命令
Pip 是 Python 官方的包管理工具，安装和使用都非常简单。Pip 支持从 PyPI（Python Package Index）安装几乎所有的 Python 包，并且结合虚拟环境工具（如 virtualenv 或 venv）可以很好地管理不同项目的依赖关系。接下来我们使用 pip 下载所需要的包
```linux
-- 查看 py 版本
python3 -V

- 创建一个名为 myenv 的新虚拟环境（使用虚拟环境是 Python 开发中的最佳实践之一，主要原因在于它可以有效地管理不同项目之间的依赖关系，避免包版本冲突和污染全局环境）
python3 -m venv myenv

- 激活环境
-- 在 Windows 上
myenv\Scripts\activate
-- 在 macOS 和 Linux 上
source myenv/bin/activate

-- 下载安装 requests 包
pip install requests

-- 通过文件下载包
pip install -r requirements

-- 镜像下载：我们在下载的时候可能会失败，这时候需要修改下载包的镜像
pip install -r requirements -i https://mirrors.aliyun.com/pypi/simple

- 修改默认镜像
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple

-- 整个环境下的安装包版本信息都保存到 requirements.txt 中
pip freeze > requirements.txt

-- 卸载第三方包
pip uninstall requests

-- 有些时候会报找不到对应包的问题，这时候应该升级一下包的版本
pip install --upgrade psycopg2
pip install --upgrade psycopg2==2.7.5

-- 看已经安装的包
pip list
```

国内常用镜像如下：
```linux
-- 清华镜像
https://pypi.tuna.tsinghua.edu.cn/simple
-- 中科大镜像
https://pypi.mirrors.ustc.edu.cn/simple
-- 豆瓣镜像
http://pypi.douban.com/simple/
-- 阿里镜像
https://mirrors.aliyun.com/pypi/simple/
```
内置模块：Python 中，本身就带有的库，就叫做 Python 的内置的库，也被称为 Python 的标准库

第三方库：而非 Python 本身自带的库，就是所谓的第三方的库

模块就是库，模块，module，也常被叫做库，Lib，Library

找好了依赖我们就需要使用了，当我们从一个 package 里面调用东西的时候，该__init__.py文件内的代码会被首先执行

py 找不到身边的包的时候，可以将上层包定义为模块或者资源，让相对路径去找

# if __name__ == '__main__':
一个python文件通常有两种使用方法，第一是作为脚本直接执行，第二是 import 到其他的 python 脚本中被调用（模块重用）执行。因此 if __name__ == 'main': 的作用就是控制这两种情况执行代码的过程，在 if __name__ == 'main': 下的代码只有在第一种情况下（即文件作为脚本直接执行）才会被执行，而 import 到其他脚本中是不会被执行的

每个python模块（python文件，也就是此处的 test.py 和 import_test.py）都包含内置的变量 __name__，当该模块被直接执行的时候，__name__ 等于文件名（包含后缀 .py ）；如果该模块 import 到其他模块中，则该模块的 __name__ 等于模块名称（不包含后缀.py）。

而 “__main__” 始终指当前执行模块的名称（包含后缀.py）。进而当模块被直接执行时，__name__ == 'main' 结果为真

# argparse 模块
argparse 是一个 Python 模块：命令行选项、参数和子命令解析器。

argparse 模块可以让人轻松编写用户友好的命令行接口。程序定义它需要的参数，然后 argparse 将弄清如何从 sys.argv 解析出那些参数。 argparse 模块还会自动生成帮助和使用手册，并在用户给程序传入无效参数时报出错误信息
## 创建解析器
```python
parser = argparse.ArgumentParser(description='Process some integers.')
```
使用 argparse 的第一步是创建一个 ArgumentParser 对象。

ArgumentParser 对象包含将命令行解析成 Python 数据类型所需的全部信息。你可以在创建的时候向里面输入一些信息

- usage - 描述程序用途的字符串（默认值：从添加到解析器的参数生成）
- description - 在参数帮助文档之前显示的文本（默认值：无）
- add_help - 为解析器添加一个 -h/--help 选项（默认值： True）

## 添加参数
```python
parser.add_argument('-integers', type=int, default=1)
```
给一个 ArgumentParser 添加程序参数信息是通过调用 add_argument() 方法完成的

## 获取数据
```python
args = parser.parse_args()
print(args.integers)
```
ArgumentParser 通过 parse_args() 方法解析参数。它将检查命令行，把每个参数转换为适当的类型然后调用相应的操作.在脚本中，通常 parse_args() 会被不带参数调用，而 ArgumentParser 将自动从 sys.argv 中确定命令行参数

## 子命令
ArgumentParser 可以通过 add_subparsers 的方式去创建子命令，用该方法获取的子构造器可以获取更多的子 parser，子 parser 的使用方式和 ArgumentParser 类似
```python 
subparsers = parser.add_subparsers(help='sub-command help')
# 添加子命令 add
parser_a = subparsers.add_parser('add', help='add help')
parser_a.add_argument('-x', type=int, help='x value')
parser_a.add_argument('-y', type=int, help='y value')

# 获取 x 并且使用
args = parser.parse_args()
print(args.x)
```

在向其输入值的时候，需要在前面加上添加的子 parser 名称
```linux
-a 1111 -b 123 c2b -x 250
```
我们可以在创建 subparsers 的时候设定标题，并且以此可以获取用户输入了哪个子 parser
```python
    subparsers = parser.add_subparsers(title="commands", dest="command")
    order_parser = subparsers.add_parser('order')
    args = parser.parse_args()
    if args_info.command == 'order':
    	print("order")
```
# Cannot recover from stack overflow
python 的栈溢出问题，如果是由于递归调用导致栈溢出，可通过尾递归优化（python 不支持）

尾递归是指，在函数返回的时候，调用自身本身，并且，return 语句不能包含表达式。这样，编译器或者解释器就可以把尾递归做优化，使递归本身无论调用多少次，都只占用一个栈帧，不会出现栈溢出的情况

为什么递归调用会导致溢出呢？

递归调用是函数调用自己，在计算机中，函数调用是通过栈（stack）这种数据结构实现的，每当进入一个函数调用，栈就会加一层栈帧，每当函数返回，栈就会减一层栈帧。由于栈的大小不是无限的，所以，递归调用的次数过多，会导致栈溢出。

为什么尾递归不会导致栈溢出？

事实上尾递归和循环的效果是一样的，所以，把循环看成是一种特殊的尾递归函数也是可以的。尾递归调用时，如果做了优化，栈不会增长，因此，无论多少次调用也不会导致栈溢出

遗憾的是，大多数编程语言没有针对尾递归做优化，Python 解释器也没有做优化，所以，即使把上面的fact(n)函数改成尾递归方式，也会导致栈溢出

我们可以通过 sys.setrecursionlimit() 函数可以更改嵌套层数上限
```python
import sys
sys.setrecursionlimit(10000)
```
不过还是有可能报错，因为该值修改的上限是 int 的上限，还是个带符号数，因此可能会报 return 一个负数

# 读取与写入
推荐用 readline（）方法读数据，该方法每次读出一行内容，所以，读取时占用内存小，比较适合大文件，该方法返回一个字符串对象。
```python
f = open("sxl.txt", encoding='utf-8')
line = f.readline()
while line:
    print (line)
    print(type(line))
    line = f.readline()
f.close()

输出结果：
i like the movie
<class 'str'>
i ate an egg
<class 'str'>
```
使用 open 来写入数据
```python
out_fa = open(work_dir + 'log/product_detail.txt', 'w', encoding='utf-8')
out_fa.writelines(out)
```