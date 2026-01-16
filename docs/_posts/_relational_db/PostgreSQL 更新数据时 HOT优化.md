---
title: PostgreSQL 更新数据时 HOT优化
date: 2023-06-13
sidebar: ture
categories:
  - 关系型数据库
tags:
  - PostgreSQL
---
原文链接：https://my.oschina.net/207miner/blog/2994857

在 PostgreSQL 中，当更新一行数据时，实际上旧行并没有删除，只是插入了一行新数据。如果这个表其他列上有索引，而更新的列上没有索引，因为新行的物理位置发生变化，因此需要更新索引，这将导致性能下降。为了解决这个问题，PostgreSQL 引入了 Heap Only Tuple（HOT）技术，如果更新后的新行和旧行位于同一个数据块内，则旧行会有一个指针指向新行，这样就不用更新索引了，通过索引访问到旧行数据，进而访问到新行数据。

## 一、数据块结构
要了解 HOT 技术，先来看一下 PostgreSQL 的数据块结构。如下图：

- 页头，存储 LSN 号、校验位等元数据信息。
- 行数据指针数组，存储指向实际数据的指针，共 32 位，前 15 位为行数据 Page 内偏移量，中间 2 位为标志位，后面 15 位为行数据长度。

- 实际行数据

- 特殊数据

查看实际数据情况和索引项情况。两条索引 id=1 和 id=2 项分别指向两条数据行指针，两条数据的 ctid 分别为 (0,1),(0,2)。lp（line pointer) 行数据指针，分别指向 2 条数据。每个页面 8192 字节，两行数据存储的开始地址分别为 8160，8128。
```
postgres=## create table a(id int primary key, v text);
CREATE TABLE
postgres=## insert into a values (1, 'a'),(2, 'b');
INSERT 0 2
postgres=## SELECT lp,lp_off, lp_flags, lp_len,t_ctid,t_data FROM heap_page_items(get_raw_page('a', 0));
 lp | lp_off | lp_flags | lp_len | t_ctid |     t_data
----+--------+----------+--------+--------+----------------
  1 |   8160 |        1 |     30 | (0,1)  | \x010000000561
  2 |   8128 |        1 |     30 | (0,2)  | \x020000000562
(2 rows)
postgres=## SELECT * FROM bt_page_items('a_pkey', 1);
 itemoffset | ctid  | itemlen | nulls | vars |          data
------------+-------+---------+-------+------+-------------------------
          1 | (0,1) |      16 | f     | f    | 01 00 00 00 00 00 00 00
          2 | (0,2) |      16 | f     | f    | 02 00 00 00 00 00 00 00
(2 rows)
```
## 二、更新后查看数据
更新第一条数据后，可以发现索引项并没有变化，索引仍然指向 (0,1) 第一行数据行指针，而第一行数据内部 ctid 数据指向了第三条数据。这样通过索引访问时，仍然可以访问到正常的数据。
```
postgres=## update a set v = 'aa' where id = 1;
UPDATE 1
​
postgres=## select * from a;
 id | v
----+----
  2 | b
  1 | aa
(2 rows)
​
postgres=## SELECT lp,lp_off, lp_flags, lp_len,t_ctid,t_xmin,t_xmax,t_data FROM heap_page_items(get_raw_page('a', 0));
 lp | lp_off | lp_flags | lp_len | t_ctid | t_xmin | t_xmax |      t_data
----+--------+----------+--------+--------+--------+--------+------------------
  1 |   8160 |        1 |     30 | (0,3)  |    713 |    714 | \x010000000561
  2 |   8128 |        1 |     30 | (0,2)  |    713 |      0 | \x020000000562
  3 |   8096 |        1 |     31 | (0,3)  |    714 |      0 | \x01000000076161
(3 rows)
​
postgres=## SELECT * FROM bt_page_items('a_pkey', 1);
 itemoffset | ctid  | itemlen | nulls | vars |          data
------------+-------+---------+-------+------+-------------------------
          1 | (0,1) |      16 | f     | f    | 01 00 00 00 00 00 00 00
          2 | (0,2) |      16 | f     | f    | 02 00 00 00 00 00 00 00
(2 rows)
```
## 三、vacuum 后查看数据
来考虑另一个问题，第一行数据是一条死数据 dead tuple，经过 vacuum 之后，其占用的存储空间会被回收，回收后又是如何访问到正常的数据呢？

vacuum 后，原第一行数据存储空间进行了回收。可以发现索引项并没有变化，索引仍然指向 (0,1) 第一行数据行指针，只是第一行数据的行指针指向了第三行数据的行指针。
```
postgres=## vacuum a;
VACUUM
postgres=## SELECT lp,lp_off, lp_flags, lp_len,t_ctid,t_xmin,t_xmax,t_data FROM heap_page_items(get_raw_page('a', 0));
 lp | lp_off | lp_flags | lp_len | t_ctid | t_xmin | t_xmax |      t_data
----+--------+----------+--------+--------+--------+--------+------------------
  1 |      3 |        2 |      0 |        |        |        |
  2 |   8160 |        1 |     30 | (0,2)  |    713 |      0 | \x020000000562
  3 |   8128 |        1 |     31 | (0,3)  |    714 |      0 | \x01000000076161
(3 rows)
​
postgres=## SELECT * FROM bt_page_items('a_pkey', 1);
 itemoffset | ctid  | itemlen | nulls | vars |          data
------------+-------+---------+-------+------+-------------------------
          1 | (0,1) |      16 | f     | f    | 01 00 00 00 00 00 00 00
          2 | (0,2) |      16 | f     | f    | 02 00 00 00 00 00 00 00
(2 rows)
```
## 四、HOT 使用的条件
1、新老数据行必须位于同一个数据块内。如原来的数据块中无法放下新行，则无法使用 HOT。

2、更新的列上如果有索引，此列上的索引不能使用 HOT 技术。

针对条件一，如果一张表经常做 update 操作，我们可以设置数据块的填充因子，使更新操作的新旧行都位于同一个数据块内。
```sql
--数据块填充到达50%后，就不再写入数据，开辟下一个数据块写入。
postgres=## alter table a set (fillfactor = 50);
ALTER TABLE
postgres=#
```