---
title: Python 基础语法
date: 2025-02-27
sidebar: ture
categories:
  - Python
tags:
  - Python
---
目前在工作和日常生产中接触 python 较少，每次接触时靠着 ai 和前人留下的代码可以照葫芦画瓢将产品做出来，但是一直没有时间去整理总结 python 的语法，今天集中整理一下过去遇到的语法，方便以后查找使用
## Python 变量类型
python 具有所有动态语言的特性，就是它的类型可以随意转换，值可以瞎几把放
### 标准数据类型
Python3 中常见的数据类型有：

- Number（数字）
- String（字符串）
- bool（布尔类型）
- List（列表）
- Tuple（元组）
- Set（集合）
- Dictionary（字典）
### 数字
数字数据类型用于存储数值，他们是不可改变的数据类型，这意味着改变数字数据类型会分配一个新的对象。当你指定一个值时，Number 对象就会被创建：
```python
var1 = 1
var2 = 10
var2 = 10.1001
```
整数和浮点数在计算机内部存储的方式是不同的，整数运算永远是精确的，而浮点数运算则可能会有四舍五入的误差

Python 允许在数字中间以分隔，因此，写成 10000_000_000 和100000000 是完全一样
### 字符串
字符串或串是由数字、字母、下划线组成的一串字符。一般记为 :
```python
s = "a1a2···an"   ## n>=0
```
它是编程语言中表示文本的数据类型。python 的字串列表有2种取值顺序:

- 从左到右索引默认0开始的，最大范围是字符串长度少1
- 从右到左索引默认-1开始的，最大范围是字符串开头

如果你要实现从字符串中获取一段子字符串的话，可以使用 [头下标:尾下标] 来截取相应的字符串，其中下标是从 0 开始算起，可以是正数或负数，下标可以为空表示取到头或尾。[头下标:尾下标] 获取的子字符串包含头下标的字符，但不包含尾下标的字符

加号（+）是字符串连接运算符，星号（*）是重复操作
```python 
str = 'Hello World!'
 
print str           ## 输出完整字符串
print str[0]        ## 输出字符串中的第一个字符
print str[2:5]      ## 输出字符串中第三个至第六个之间的字符串
print str[2:]       ## 输出从第三个字符开始的字符串
print str[2:5:2]    ## 输出从第二个字符开始、第五个字符结束、步长为二的字符组，即 ['l', 'o']
print str * 2       ## 输出字符串两次
print str + "TEST"  ## 输出连接的字符串
```
其他的类数组的数据结构也可以使用上面的操作，我们一般使用中括号来取值，但是也可以用来赋值
### 列表
List（列表） 是 Python 中使用最频繁的数据类型。列表可以完成大多数集合类的数据结构实现。它支持字符，数字，字符串甚至可以包含列表（即嵌套），列表用 [ ] 标识，是 python 最通用的复合数据类型
```python
list = [ 'runoob', 786 , 2.23, 'john', 70.2 ]
tinylist = [123, 'john']
 
print list               ## 输出完整列表
print list[0]            ## 输出列表的第一个元素
print list[1:3]          ## 输出第二个至第三个元素 
print list[2:]           ## 输出从第三个开始至列表末尾的所有元素
print tinylist * 2       ## 输出列表两次
print list + tinylist    ## 打印组合的列表
```
### 元组
元组（tuple）是一种不可变的序列类型，用于存储多个元素。元组中的元素可以是任意类型，包括数字、字符串、列表、其他元组等。一旦创建，元组的内容就不能被修改
```python
## 使用圆括号创建元组
my_tuple = (1, 2, 3, 'a', 'b', 'c')

## 使用 tuple() 函数创建元组
another_tuple = tuple([1, 2, 3, 'a', 'b', 'c'])
```
元组的使用方式和列表一样
```py
my_tuple = (1, 2, 3, 'a', 'b', 'c')
print(my_tuple[0])  ## 输出 1
print(my_tuple[3])  ## 输出 'a'
```
### 字典
字典是除列表以外 python 之中最灵活的内置数据结构类型，对应 java 中的 map。列表是有序的对象集合，字典是无序的对象集合。两者之间的区别在于：字典当中的元素是通过键来存取的，而不是通过偏移存取

字典用 "{ }" 标识。字典由索引 (key) 和它对应的值 value 组成
```python
dict = {}
dict['one'] = "This is one"
dict[2] = "This is two"
 
tinydict = {'name': 'runoob','code':6734, 'dept': 'sales'}
 
print tinydict['one']      ## 输出键为'one' 的值
print tinydict[2]          ## 输出键为 2 的值
print tinydict             ## 输出完整的字典
print tinydict.get('&_', 1)## 输出键为&_的值，如果没有则返回1
print tinydict.keys()      ## 输出所有键
print tinydict.values()    ## 输出所有值
```

判断数据是否在字典中，以下是错误写法
```python
if supplier_level_configuration[c2b_supplier] is not None:
    do something
```
正确写法如下：
```python
if c2b_supplier in supplier_level_configuration:
	do something

## 在新版被移除了
if supplier_level_configuration.has_key(c2b_supplier):
	do something
```
### 集合
集合（set）是一个无序的不重复元素序列。集合中的元素不会重复，并且可以进行交集、并集、差集等常见的集合操作

可以使用大括号 { } 创建集合，元素之间用逗号 , 分隔， 或者也可以使用 set() 函数创建集合
```py
set1 = {1, 2, 3, 4}            ## 直接使用大括号创建集合
set2 = set([4, 5, 6, 7])      ## 使用 set() 函数从列表创建集合
```
### null 与 None
Python 中其实没有 null 这个词，取而代之的是 None 对象，即特殊类型 NoneType，代表空、没有

None 不能理解为0，因为0是有意义的，而 None 是一个特殊的空值

```linux
>>> NoneType
NameError: name 'NoneType' is not defined
>>> type(None)
NoneType
```
### namedtuple
这个数据结构用于表达类似 POJO 的意思，它允许你创建具有命名字段的元组

我们使用字典来存放数据时，他太过抽象，可以存放各种各样的东西进去，而使用元组存放数据，又必须使用下标来获取数据，在表达数据结构的列表这种需求的时候会特别不爽

这时候可以使用 namedtuple 来表达类的意思
```python
from collections import namedtuple as np
SupplierLevelInfo = np('level_info', 'id, shop_name, level')
```

namedtuple 的取值方法如下：
```python
k = arg.supplier_id

## 不能像字典一样取，下面这么写是错误的
k = arg[supplier_id]
k = arg['111']
```
## 魔法方法
在 Python 中，魔法方法（也称为特殊方法或双下划线方法）是一类具有特殊名称的方法，它们在特定情况下会被自动调用。这些方法通常以双下划线 __ 开头和结尾，例如 __init__、__str__、__add__ 等。通过定义这些方法，你可以自定义类的行为，使其更加灵活和强大

比如 __init__(self, ...)：初始化对象时调用。用于设置对象的初始状态
```py
  class Person:
      def __init__(self, name, age):
          self.name = name
          self.age = age
```
或者 __setattr__(self, name, value)：设置属性时调用
```py
  class DynamicClass:
      def __getattr__(self, name):
          if name == 'dynamic_attribute':
              return 'This is a dynamic attribute'
          else:
              raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")
```
我们在上文中说的，字典、列表等数据结构的取值、赋值等操作，就是调用了魔法方法实现的，虽然你在使用 {} 语法创建字典时看起来像是一个简单的数据类型，但实际上字典是一个复杂的对象，具备许多类的特性，包括一系列的魔法方法
### __getattr__、__setattr__、__getitem__ 、__setitem__ 

- __getattr__ 内置使用点号获取实例属性属性如 s.name
 - __setattr__ 设置类实例属性 如s.name='tom'
 - __getitem__ 使用[]获取实例属性 如s['name']
 - __setitem__ 使用[]设置实例属性如 s['name'] = 'tom' 

给对象进行容器化可以对类实现这个函数，容器化就是在 dict 后加小括号，通过容器化，使得获取对象的属性有点像访问 dict 或是 list 这样的容器
 
凡是在类中定义了这个__getitem__ 方法，那么它的实例对象（假定为 p），可以像这样用 p[key] 取值，当实例对象做 p[key] 运算时，会调用类中的方法__getitem__

一般如果想使用索引访问元素时，就可以在类中定义这个方法__getitem__(self, key) 
### 判断字符串是否包含特定子串
in 和 not in 在 Python 中是很常用的关键字，我们将它们归类为成员运算符。

使用这两个成员运算符，可以很让我们很直观清晰的判断一个对象是否在另一个对象中，示例如下：
```python
>>> "llo" in "hello, python"
True
>>> "lol" in "hello, python"
False
```
我们使用 in 和 not in 判断一个子串是否存在于另一个字符中，实际上当你使用 in 和 not in 时，Python 解释器会先去检查该对象是否有__contains__魔法方法

若有就执行它，若没有，Python 就自动会迭代整个序列，只要找到了需要的一项就返回 True 
```python
>>> "hello, python".__contains__("llo")
True
>>>
>>> "hello, python".__contains__("lol")
False
>>>
```

使用字符串对象的 find 方法，如果有找到子串，就可以返回指定子串在字符串中的出现位置，如果没有找到，就返回-1
```python
>>> "hello, python".find("llo") != -1
True
>>> "hello, python".find("lol") != -1
False
>>
```
字符串对象有一个 index 方法，可以返回指定子串在该字符串中第一次出现的索引，如果没有找到会抛出异常，因此使用时需要注意捕获
```python
"hello, python".index("lio")
```
我们可以使用 count 的方法来判断。只要判断结果大于 0 就说明子串存在于字符串中
```python
"hello, python".count("lio")
```
我们还可以使用正则来判断
```python
import re

def is_in(full_str, sub_str):
    if re.findall(sub_str, full_str):
        return True
    else:
        return False

print(is_in("hello, python", "llo"))  ## True
print(is_in("hello, python", "lol"))  ## False
```

## 其他基础语法
### 判断
py 使用 if_elif_else 格式来表示判断，eg：

```py
#!/usr/bin/python3
 
age = int(input("请输入你家狗狗的年龄: "))
print("")
if age <= 0:
    print("你是在逗我吧!")
elif age == 1:
    print("相当于 14 岁的人。")
elif age == 2:
    print("相当于 22 岁的人。")
else: ### age > 2
    human = 22 + (age - 2) * 5
    print("对应人类年龄: ", human)
#### 退出提示
input("点击 enter 键退出")
```
### 循环
循环一般有两种方式，普通循环：

```py
#!/usr/bin/env python3

n = 100
 
sum = 0
counter = 1
while counter <= n:
    sum = sum + counter
    counter += 1
else:
	print("结束了！")
print("1 到 %d 之和为: %d" % (n,sum))
```
集合、字典等结构的循环：
```py
#!/usr/bin/python3
 
sites = ["Baidu", "Google","Runoob","Taobao"]
for site in sites:
    print(site)
```
### 函数
你可以定义一个由自己想要功能的函数，以下是简单的规则：

- 函数代码块以 def 关键词开头，后接函数标识符名称和圆括号 ()
- 任何传入参数和自变量必须放在圆括号中间，圆括号之间可以用于定义参数
- 函数的第一行语句可以选择性地使用文档字符串—用于存放函数说明
- 函数内容以冒号 : 起始，并且缩进
- return [表达式] 结束函数，选择性地返回一个值给调用方，不带表达式的 return 相当于返回 None

```py
#!/usr/bin/python3
 
def max(a, b):
    if a > b:
        return a
    else:
        return b
 
a = 4
b = 5
print(max(a, b))
```

在 python 中，类型属于对象，对象有不同类型的区分，变量是没有类型的

[1,2,3] 是 List 类型，"Runoob" 是 String 类型，而变量 a 是没有类型，它仅仅是一个对象的引用（一个指针），可以是指向 List 类型对象，也可以是指向 String 类型对象

在 python 中，strings，tuples, 和 numbers 是不可更改的对象，而 list，dict 等则是可以修改的对象，他们的区别如下：

- 不可变类型：变量赋值 a=5 后再赋值 a=10，这里实际是新生成一个 int 值对象 10，再让 a 指向它，而 5 被丢弃，不是改变 a 的值，相当于新生成了 a
- 可变类型：变量赋值 la=[1,2,3,4] 后再赋值 la[2]=5 则是将 list la 的第三个元素值更改，本身 la 没有动，只是其内部的一部分值被修改了

他们作为参数传入函数后，根据自己的类型，会有不同的效果：

- 不可变类型：类似 C++ 的值传递，如整数、字符串、元组。如 fun(a)，传递的只是 a 的值，没有影响 a 对象本身。如果在 fun(a) 内部修改 a 的值，则是新生成一个 a 的对象
- 可变类型：类似 C++ 的引用传递，如 列表，字典。如 fun(la)，则是将 la 真正的传过去，修改后 fun 外部的 la 也会受影响