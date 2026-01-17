---
title: PostgreSQL 相关用法
date: 2022-10-03
sidebar: ture
categories:
  - 关系型数据库
tags:
  - PostgreSQL
---
## 常见语法
PG 大部分语法与 MySQL 一致，只有略微的区别。其中包含很多非常有用并且有趣的功能
### NUMERIC
NUMERIC 类型的语法：
```sql
NUMERIC(precision, scale)
```
precision 表示整个数据长度，scale 表示小数部分的长度。如： 1234.567 ，precision 为 7 ，scale 为 3

NUMERIC 类型在小数点前面长度可达到 131,072 ，小数点后面长度可达到 16,383。scale 可以为 0 或正数，下面示例表示 scale 为 0：
```sql
NUMERIC(precision)
```
如果 precision 和 scale 都忽略，则可以存储任何上面提及限制内的长度和精度

我们可以使用，更精确的计算结果。浮点数存在精度问题，可能会出现计算误差，而使用 numeric(5,2) 可以保证计算结果的精度

该类型在 java 中直接对应 BigDecimal 类型。在 PostgreSQL中 NUMERIC 和 DECIMAL 是等价的
### SERIAL
postgresql 序列号（SERIAL）类型包括 smallserial（smallint,short）,serial(int) 和 bigserial(bigint,long long int)，不管是 smallserial，serial 还是 bigserial，其范围都是(1,9223372036854775807)，但是序列号类型其实不是真正的类型，当声明一个字段为序列号类型时其实是创建了一个序列，INSERT 时如果没有给该字段赋值会默认获取对应序列的下一个值，因此我们常常用它来作为主键

在创建表时输入这个值，事实上是为主键的默认值设置为 nextval，比如
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/4ff1c349a55e807e492ba6989417acda.png)
我们可以使用查询语句查出这个值，也可以手动修改它的默认值
```sql
SELECT nextval('crm_user_info_v_id_seq'::regclass);
alter sequence if exists crm_user_info_v_id_seq restart with 50 cache 1;
select setval('crm_allocation_model_id_seq', max(id)) from crm_allocation_model;
```
### LIMIT
带有 LIMIT 子句的 SELECT 语句的基本语法如下：
```sql
SELECT column1, column2, columnN
FROM table_name
LIMIT 10
```
下面是 LIMIT 子句与 OFFSET 子句一起使用时的语法，OFFSET 可以允许从一个特定的偏移开始提取记录：
```sql
SELECT column1, column2, columnN 
FROM table_name
LIMIT [no of rows] OFFSET [row num]

-- 从第三位开始提取 10 个记录
SELECT column1, column2, columnN 
FROM table_name
LIMIT 10 OFFSET 2
```

mysql 是在 limit 后跟两个数字，以表示每页多少数据以及偏移量

### WITH
pg 带有 with 语句，可以定义一个子查询，然后再其他的查询中复用这个子查询，比如

```sql
with aaa as (select * from user_coupon)
select user_name from aaa;
```
注意 with 语句不要带分号

### 连接
PostgreSQL JOIN 子句用于把来自两个或多个表的行结合起来，基于这些表之间的共同字段

在 PostgreSQL 中，JOIN 有五种连接类型：

CROSS JOIN ：交叉连接
INNER JOIN：内连接
LEFT OUTER JOIN：左外连接
RIGHT OUTER JOIN：右外连接
FULL OUTER JOIN：全外连接

pg 的连接做的比 MySQL 好，因此可以尽情使用联表了

### UNION 联表
用于将两个表的查询结果连接在一起，这里的连接不是联表的连接，而是纵向的连接，将两个查询结果合起来返回给用户

```sql
SELECT column1 [, column2 ]
FROM table1 [, table2 ]
[WHERE condition]

UNION

SELECT column1 [, column2 ]
FROM table1 [, table2 ]
[WHERE condition]
```
请注意，UNION 内部的每个 SELECT 语句必须拥有相同数量的列。列也必须拥有相似的数据类型。同时，每个 SELECT 语句中的列的顺序必须相同

这个功能还是很好用的，比如可以同时使用多种查询条件选择出数据

UNION ALL 操作符可以连接两个有重复行的 SELECT 语句，默认地，UNION 操作符选取不同的值。如果允许重复的值，请使用 UNION ALL。

UINON ALL 子句基础语法如下：
```sql
SELECT column1 [, column2 ]
FROM table1 [, table2 ]
[WHERE condition]

UNION ALL

SELECT column1 [, column2 ]
FROM table1 [, table2 ]
[WHERE condition]
```
### :: 强制转换
使用两个冒号来表示强制类型转换，下面的 sql，虽然 user_id 是 int 类型，不过查询出来的是 char 类型数据
```sql
select user_id::char
            from user
```

### 正则匹配
pg 在使用正则表达式的时候需要使用关键字~，表示关键字之前的内容要和之后的内容进行匹配，不匹配则在关键字之前加！可以直接使用飘号进行首字符匹配
```sql
select user_name from user where user_name ~ 'timo'
```

### ON CONFLICT
该语句用于实现当记录不存在时，执行插入；否则，进行更新这种操作

在关系数据库中，术语 upsert 被称为合并(merge)。意思是，当执行 INSERT 操作时，如果数据表中不存在对应的记录，PostgreSQL 执行插入操作；如果数据表中存在对应的记录，则执行更新操作。这就是将其称为 upsert（update or insert）的原因

模板
```sql
INSERT INTO table_name(column_list) VALUES(value_list)
ON CONFLICT target action;
```
target 可以是：

- (column_name)：一个或者一些字段名，左右两边加上小括号
- WHERE predicate：带谓语的 WHERE 子句

action 可以是：

- DO NOTHING：当记录存在时，什么都不做
- DO UPDATE SET column_1 = value_1, … WHERE condition：当记录存在时，更新表中的一些字段

以下例子表示，向表 customers 中插入数据，如果插入的 name 存在，则更改 email 的值
```sql
INSERT INTO customers (name, email)
VALUES
 (
 'Microsoft',
 'hotline@microsoft.com'
 ) 
ON CONFLICT (name) 
DO
 UPDATE
   SET email = EXCLUDED.email;
```
该语法有以下几个要点：

1，支持在括号中使用多个属性，以下查询需要对 col1 和 col2 共同使用唯一索引，这样的索引不能保证 col1 和 col2 分别唯一
```java
INSERT INTO dupes VALUES(3,2,'c')
ON CONFLICT (col1,col2) DO UPDATE SET col3 = 'c', col2 = 2
```
2，excluded 的使用，我们可以看到上面的语句使用起来非常不方便，已经输入了数据还要再输入一遍，同时，如果是执行批量插入的语句的话基本上无法使用 conflict 了。因此提供了 excluded 来获取对应行的对应值

3，向表中更新新值是使用 excluded，但是我们在某种情况下还需要获取原来的数据做操作，此时我们应该这么写
```sql
insert into weather2 as tos (city,temp_lo,date) SELECT p,q,s::date
FROM ROWS FROM
    (
		json_to_recordset('[{"a":40,"b":"sh"},{"a":"100","b":"qd"},{"a":"10","b":"qdd"},{"a":"3","b":"bj"}]')
            AS (b TEXT,a INTEGER),
        generate_series(1, 4),
		generate_series('2022-08-06'::date,'2022-08-09'::date,'1 day')
    ) AS x (p,q,r,s)
-- ORDER BY p
-- on conflict(date, city) do update set temp_lo = excluded.temp_lo; --保留当前要新插入的值
-- on conflict(date, city) do update set temp_lo = tos.temp_lo; --保留原始值
-- on conflict(date, city) do nothing; --保留原始值
on conflict(date, city) do update set temp_lo = tos.temp_lo+excluded.temp_lo; -- 原始值与当前值相加
```
这里额外说明一下 CONFLICT 的性能，ON CONFLICT 需要检查唯一约束或索引来确定冲突，冲突解决过程可能需要获取行锁

### 建立索引
建立索引时并行建立，不会影响数据库查询
```sql
create index concurrently on user_info (user_name)
```
使用 xx 索引
```sql
create index concurrently on user_info using gin (user_name)
create index concurrently on user_info using hash (user_name)
```
启动 gin 模块（gin 一般用于数组）
```sql
create extension if not exists btree_gin;
```
### gin 索引原理
GIN 是 Generalized Inverted Index 的缩写。就是所谓的**倒排索引**，它用于处理类似数组、ltree 等字段。它处理的数据类型的值不是原子的，而是由元素构成。我们称之为复合类型。如(‘hank’, ‘15:3 21:4’)中，表示hank在15:3和21:4这两个位置出现过

GIN 的主要应用领域是加速全文搜索，所以，这里我们使用全文搜索的例子介绍一下GIN索引。如下，建一张表：
```
postgres=## create table ts(doc text, doc_tsv tsvector);

postgres=## insert into ts(doc) values
  ('Can a sheet slitter slit sheets?'), 
  ('How many sheets could a sheet slitter slit?'),
  ('I slit a sheet, a sheet I slit.'),
  ('Upon a slitted sheet I sit.'), 
  ('Whoever slit the sheets is a good sheet slitter.'), 
  ('I am a sheet slitter.'),
  ('I slit sheets.'),
  ('I am the sleekest sheet slitter that ever slit sheets.'),
  ('She slits the sheet she sits on.');

postgres=## create index on ts using gin(doc_tsv);
```

该 GIN 索引结构如下，黑色方块是 TID 编号，比如0-2代表该单词在第0行的第2个元素中出现过，白色为单词
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/2a82350a9a28c09fdb259fa340158558.png)

由上可见，sheet、slit、slitter 出现在多行之中，会有多个 TID，这样就会生成一个 TID 列表，并为之生成一棵单独的B-tree，以此增加搜索速度

总结来说，gin 就是将数组字段中的每一个元素都取出来，对每个元素都建立一个 b+ 索引。而索引最终存放的值也是一个 b+ 树，这个 b+ 树存放的是该元素出现的行以及编号
### pg_stat_activity 查询正在执行的语句和杀掉卡住的语句
有些更新语句非常耗时间卡住了其他的 sql 执行，我们可以通过以下语句查询正在执行的语句并且查询是否有 lock 的语句
```sql
select pg_blocking_pids(pid), pid, now() - xact_start, wait_event, wait_event_type, substr(query, 1, 100)
from pg_stat_activity
where state <> 'idle'
order by 3 desc;
```
order by 3 代表按第三列排序。我们查出 pid 后可以杀掉 pid
```sql
select pg_terminate_backend(21829);
```

### 设置东8区
```sql
set time zone 'PRC'
```

## 常见函数
### to_char 日期转字符串
```sql
to_char(cjsj, 'yyyy-mm-dd hh24:MI:SS')
```
### to_timestamp 字符串转日期
```sql
to_timestamp(cjsj, 'yyyy-mm-dd hh24:MI:SS')
```
### date_part 
date_part('day', TIMESTAMP '2018-03-01 08：00：00') 结果是 1，如果用 hour 就可以求出小时数为 8
```sql
select date_part('day', biztime), sum(qty) from datatable where date_part('day',biztime) >= 1
```
### extract (epoch | year... from timestamp)
extract 用来提取时间类型的某个数据，比如年月日时分秒，以及从 linux 数据戳开始到现在的 long 类型时间
```sql
select extract(epoch from '2023-03-03'::timestamp);
select extract(month from '2023-03-03'::timestamp);
```
### string_agg
该函数用于将多个数据链接在一起成为一个字符串
```sql
select string_agg(id, '|') from wechat_kf_info group by open_kfid;
```
我们还可以让里面的数据按顺序排序
```sql
select string_agg(id, '|' order by id) from wechat_kf_info group by open_kfid;
```

## JSON 与 JSONB
pg 有很多自己的数据结构，比如 json。json 数据类型可以用来存储 JSON（JavaScript Object Notation）数据， 这样的数据也可以存储为 text，但是 json 数据类型更有利于检查每个存储的数值是可用的 JSON 值

一个 JSON 数值可以是一个简单值（数字、字符串、true/null/false），数组，对象

JSON 和 **JSONB** 类型在使用上几乎完全一致，两者的区别主要在存储上，json数据类型直接存储输入文本的完全的拷贝，JSONB 数据类型以二进制格式进行存储。同时 JSONB 相较于 JSON 更高效，处理速度提升非常大，且支持索引
### 查询操作符
我们可以对 JSON 类型做一些很有趣的操作，比如可以用箭头来取 json 中的值，比如 user 有很 home，我们可以直接查询他在北京的房子：
```sql
select user_home -> 'beijing' as aaa
from user
```
#### 通过 json 的键获取 json 的值
**如果将 -> 指向一个数字的话，就是对 json 数组的操作了**，表示取第几个元素，比如以下代码，就是取第1个 json 元素
```sql
select user_home -> 1 as aaa
from user
```
除此之外，箭头还有可以有变种，**->> 表示取对应值文本的形式**，可以理解为用->>取出来的值，都是字符串。最直观的感受就是，在 idea 中分别用->与->>取数据，取出来的分别是彩色与白色

注意，->拿的只是 json 对象的域，因此有很多操作符不能用，如果像 map 一样只取对象的值的话，还是尽量使用 ->>
```sql
select user_home ->> 'beijing' as aaa
from user
```
#### #> 获取指定路径上的对象
一个 json 数据可能会包含多个嵌套属性，**使用 #> 获得在指定路径上的 JSON 对象**，同样，该操作符有变种 #>>
```sql
select user_home #>> '{beijing, 汤臣一品}' as aaa
from user
```
#### ？判断 json 中是否存在某个键
用户在使用 JSON 类型时，常见的一些 JSON 搜索比如，JSON 中是否存在某个 KEY，某些 KEY，某些 KEY 的任意一个，这些操作 pg 都为我们提供了

存在某个 KEY
```sql
select * from my_table where colmn ? 'key'
```
用 ?& 表示必须存在所有 KEY，才会返回 true
```sql
'{"a":1, "b":2, "c":3}'::jsonb ?& array['b', 'c']  
```
存在任意 KEY 元素
```sql
'["a", "b"]'::jsonb ?| array['a', 'b'] 
```
#### @> 判断 json 中是否存在某个键值对
JSON 中是否存在指定的 key:value 对（支持嵌套 JSON）
```sql
'{"a":1, "b":2}'::jsonb @> '{"b":2}'::jsonb  
```
JSON 中某个路径下的 VALUE（数组）中，是否包含指定的所有元素
```sql
select jsonb '{"a":1, "b": {"c":[1,2,3], "d":["k","y","z"]}, "d":"kbc"}' @> '{"b":{"c":[2,3]}}';  
```

### 修改操作符
向某个 json 类型的列塞入数据，需要使用单引号配合大括号
```sql
update users set data = '{"uptate_data": "7"}'::jsonb where id = 3;
```

对一个 json 类型的数据增加某个字段或者修改某个字段，需要使用 || 
```sql
update users set data = data::jsonb || '{"uptate_minute": "10"}'::jsonb where id = 3;
```

### 函数
pg 还提供了很多函数用来对对应的数据类型做操作，函数的传入应该是查询后的结果，但是函数会允许下面格式的查询语句
```sql
SELECT jsonb_array_elements('[1, 2, [3, 4]]');

select jsonb_array_elements(user_house)
from user;
```
#### jsonb_array_elements 操作 json 数组
比如你其实可以传入一个 json 类型的数组作为一个列，但是此时你就不能使用箭头来对数组中的每个元素进行同样的操作了。注意是一个，不是一群，需要严格限制个数，不然会报错。同时，该函数还允许传入 null

此时你可以使用 jsonb_array_elements 函数，将顶层 JSON 数组扩展为一个 JSONB 值的集合，然后使用箭头来查询它们里面包含的值，即解析 JSON 数组转成多行
```sql
select jsonb_array_elements(user_house) -> 'home'
from user
```
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/1246b10d3bc7f131657b9084c54e90a3.png)

更多的函数：
https://www.sjkjc.com/postgresql-ref/jsonb_array_elements/

## hstore
pg 可以使用 hstore 来储存一个类似 map 的结构，在数据库中，对应关系会使用 =>  来表示，对该类型数据的增删改查有不同的方式

hstore 模块实现了将键/值对存储到单个值的 hstore 数据类型。注意，hstore 中的 键 和 值 都只能是字符串

我们可以使用 :: 强制类型转换一些数据为 hstore 类型
```sql
	'a=>x, b=>y'::hstore -> 'a'
```
并且在 hstore 中有一个特别奇怪的关键字 ARRAY，可以将零散的数据封装成数组来进行批量操作（一般来说像这种的都是函数）
```sql
	'a=>x, b=>y, c=>z'::hstore -> ARRAY['c','a']
```
如果键没有对应的值，hstore 的特性还可以让它拿到 null，而不是丢出异常
### 操作符
hstore 的操作符可以使用不同方式查询该数据，比如使用键来寻找值（箭头）、判断对应的键是否在 hstore 中（问号）、左操作符是否包含右操作符（@>）
```sql
// 获得键的值(如果不存在为NULL)	
'a=>x, b=>y'::hstore -> 'a'

// hstore 包含键吗?	
'a=>1'::hstore ? 'a'
// hstore 包含所有指定的键?	
'a=>1,b=>2'::hstore ?& ARRAY['a','b']
// hstore 包含任何指定的键?	
'a=>1,b=>2'::hstore ?| ARRAY['b','c']

// 左操作符包含右操作符?	
'a=>b, b=>1, c=>NULL'::hstore @> 'b=>1'
// 左操作符包含于右操作符?	
'a=>c'::hstore <@ 'a=>b, b=>1, c=>NULL'
```



### 增删改
操作符配合 ARRAY 函数即可实现大多数的 hstore 属性查询功能了，但是我们还是不知道如何将数据插入 hstore 中，以及如何创建一个 hstore 属性等问题

首先我们启用 hstore 模块，使用 HSTORE 数据类型之前，需要先启用 hstore 模块：
```sql
CREATE EXTENSION hstore;
```
创建包含 HSTORE 数据类型的表
```sql
CREATE TABLE books (
 id serial primary key,
 title VARCHAR (255),
 attr hstore
);
```
hstore 的增加操作
```sql
INSERT INTO books (title, attr)
VALUES
 (
 'PostgreSQL 轻松学',
 '"paperback" => "685",
    "publisher" => "sjk66.com",
    "language"  => "简体中文",
    "ISBN-13"   => "1234567890123",
 "weight"    => "412 克"'
 );
```

给已存在的数据添加键值对，也就是向 hstore 中增加数据。注意，|| 是语法规则，不是或的意思，你不能改成 &&

同时，想要在键值对之外加单引号，单引号里面想要箭头以及双引号，后面的转化符也是必须的
```sql
UPDATE books
SET attr = attr || '"freeshipping"=>"yes"' :: hstore;
```
在 mybatis 中，可以这么写
```xml
        update order_info
        set extra_info = extra_info || concat(#{key}, ' => ', #{value})::hstore
        where order_no = #{orderNo}
```
删除键值对
```sql
UPDATE books 
SET attr = delete(attr, 'freeshipping');
```
也可以这样删除数据（减号）
```sql
// 从左操作符中删除键	
'a=>1, b=>2, c=>3'::hstore - 'b'::text
```
## 数组
pg 支持数组类型数据结构，可以在一些数据类型后面加上中括号来表示数组这个结构，比如 integer[]

对于数组的增删改查与上面的 hstore 与 json 差不多
### 操作符
默认情况下，数组的下标是从 1 开始的，我们也可以指定下标的开始值，如下：
```sql
SELECT id[2], id[3], id[4] FROM test02;
```
但是我们一般都不会这么用，pg 给我们提供了很多操作数组的访问符

操作符 | 描述 | 示例 | 结果
-|-|-|-
=|相等| SELECT ARRAY[1.1,2.1,3.1]::int[] = ARRAY[1,2,3];| t
<> |不等于| select ARRAY[1,2,3] <> ARRAY[1,2,4];| t
< |小于| select ARRAY[1,2,3] < ARRAY[1,2,4]（pg 的大于小于等比较是按数组的顺序一一比较）;| t
&gt; |大于| select ARRAY[1,4,3] > ARRAY[1,2,4];| t
<=|小于或等于| select ARRAY[1,2,3] <= ARRAY[1,2,3];| t
&gt;=|大于或等于| select ARRAY[1,4,3] >= ARRAY[1,4,3];| t
@>|包含| select ARRAY[1,4,3] @> ARRAY[3,1];| t
<@|包含于| select ARRAY[2,7] <@ ARRAY[1,7,4,2,6];| t
&&|重叠（是否有相同元素）| select ARRAY[1,4,3] && ARRAY[2,1];| t

### 函数
可以使用 sql 的 ARRAY 函数来将一系列数据变成函数，后面的 ::integer[] 强制转换为数组其实没有必要，但是还是推荐加上，这是为了规定类型
```sql
update my_table set department_id = ARRAY[1]::integer[] where id = 42
```
向数组中添加新元素则需要这么处理
```sql
-- 向一个数组的末端追加一个元素
select array_append(ARRAY[1,2], 3);
-- 连接两个数组
select array_cat(ARRAY[1,2,3], ARRAY[4,5])
-- 向一个数组的首部追加一个元素
select array_prepend(1, ARRAY[2,3])
```
**array_to_string** 可以把数组变成字符串。比如在需要将数组中的某个值与某个字符串做模糊匹配的时候，这个函数就可以派上用场
```sql
-- 数组转换字符串，用逗号分隔，null直接省略
select array_to_string(ARRAY[1, 2, 3, NULL, 5], ',')
-- null用*代替
select array_to_string(ARRAY[1, 2, 3, NULL, 5], ',', '*')
```
**string_to_array** 也可以把字符串变成数组
```sql
-- 用,分隔
select string_to_array('a,b,c', ',')
select string_to_array('xx~^~yy~^~zz', '~^~', 'yy')
```
**unnest** 可以将一个数组扩展成一组行，这个函数非常重要，可以将一个数组拆成多条数据
```sql
select unnest(ARRAY[1,2])
```
判断一个数据是否为空数组，**array_length**() 需要两个参数，第二个是数组的维度，下面的查询将不包括空数组和 NULL
```sql
array_length(id_clients, 1) > 0
```
array_agg 用于将多行数据合并成一个 数组
```sql
select array_agg(id) from wechat_kf_info group by open_kfid;
```
使用 **any** 函数做某个数据是否与任意一个数组中的数字相同的判断，但是一般尽量不要使用函数作为查询条件，因为用不了索引，使用强转配合关键字查询更加快速
```sql
select 'a' = any('{a, b, c}')
```
## ltree
### 查询操作符
ltree 提供两种数据类型

- ltree：存储标签路径
- lquery：表示用于匹配 ltree 值的类似正则表达式的模式。 一个简单的单词与路径中的标签匹配。 星号（*）匹配零个或多个标签。 例如：

foo 匹配确切的标签路径 foo
*.foo.* 匹配包含标签 foo 的任何标签路径
*.foo 匹配最后一个标签为 foo 的任何标签路径

比如：
```sql
-- 匹配 sms.aaa
SELECT v FROM configuration WHERE k ~ lquery 'sms.*';
-- 匹配 sms
SELECT v FROM configuration WHERE k ~ lquery 'sms';
-- 匹配 aaa.sms.aaa
SELECT v FROM configuration WHERE k ~ lquery '*.sms.*';
```
## 性能分析
### generate_series 生成数据
该函数一般用于我们向 pg 插入大量的数据，该函数的作用是在给定间隔内生成一系列数字，一般用于测试性能。 序列值之间的间隔和步骤由用户定义，下面的 start 指定开始大小，stop 指定结束大小，默认按一增加，但是可以用 step 指定增加大小
```sql
GENERATE_SERIES ( start, stop [, step ] )
```
比如下面的语句，会生成1到10
```sql
SELECT value
FROM GENERATE_SERIES(1, 10);
-- value
-- -----------
-- 1
-- 2
-- 3
-- 4
-- 5
-- 6
-- 7
-- 8
-- 9
-- 10
```
配合插入语句使用，可以快速生成多条数据
```sql
insert into second_kill_batch (id, start_time, end_time, batch_name, activity_flag)
select generate_series(50, 1050), now(), now(), '测试千条性能', generate_series(150, 1150)::varchar;
```

### explain analyze
使用 pg 提供的 explain analyze sql 语句进行性能分析，返回的数据意义如下：
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/3a1de82512f94da1ca81c9c49f2542e1.png)

cost=0.00…234.00

- 第一个数字 0.00 表示启动的成本，返回第一行需要多少 cost 值
- 第二个数字 234.00 表示返回所有数据的成本

cost 使用将操作量化的方式返回给我们执行该语句大致需要多少代价，cost 基于如下的一些规则计算出的数字（默认）：

顺序扫描一个块，cost 的值为 1；随机扫描一个块，cost 的值为 4；处理一个数据行的 CPU 代价，cost 的值为 0.01；处理一个索引行的 CPU 代价，cost 的值为 0.005；每个操作的 CPU 代价为 0.0025

rows=10000，表示会返回10000行

width=74，表示每行平均宽度为74字节

来个复杂的例子：
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/b484fddefbb0264a904a21d74fea9937.png)

actual time=0.320..0.320，实际花费的时间

loops=1，循环的次数
buffers：缓冲命中数
planning time: 0.124 ms，生成执行计划时间
execution time：0.353 ms，执行执行计划时间，运行这个最快的查询计划的时间

关于生成执行计划与执行执行计划的具体区别如下：

1，你用 SQL 编写一个查询，这是某种脚本，你试图告诉服务器你想从他那里得到什么
2，大多数情况下，服务器可以通过编写查询来收集您请求的数据。有一种称为查询规划器的机制发挥作用。它尝试找到执行查询的最快方式（计划）。它通过估计几种可能的方式（计划）的执行时间来做到这一点（查询优化）
3，服务器使用被认为是最快的计划运行查询
4，服务器返回输出

EXPLAIN 命令打印该过程的说明。现在：

- execution time 输出上的执行时间是服务器在步骤 3-4 上花费的时间
- planning time 规划输出时间是服务器仅在步骤 2 上花费的时间。我相信您将其视为时间规划器认为查询需要，但这可以称为计划执行时间或估计执行时间