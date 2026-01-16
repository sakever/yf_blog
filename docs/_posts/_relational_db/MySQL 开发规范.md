---
title: MySQL 开发规范
date: 2022-12-12
sidebar: ture
categories:
  - 关系型数据库
tags:
  - MySQL
---

基于阿里编程规范，遵从开发规范可以避免错误
# 基础模板
```sql
CREATE TABLE user
(
    id          bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键id',
    user_id     bigint(20)          NOT NULL COMMENT '用户id',
    user_name   varchar(128)        NOT NULL DEFAULT '' COMMENT '用户名',
    del_status  tinyint(4)          NOT NULL DEFAULT 0 COMMENT '0-存在 1-删除',
    create_time bigint(20) UNSIGNED NOT NULL COMMENT '创建日期',
    update_time bigint(20) UNSIGNED NOT NULL ON UPDATE UNIX_TIMESTAMP(NOW()) COMMENT '更新日期',
    PRIMARY KEY (id)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci COMMENT = '用户表';

alter table user
    add unique index uniq_user_id (user_id),
    add index idx_user_name (user_name);
```
当 AUTO_INCREMENT 达到最大值时，后续的 INSERT 会失败，报主键重复错误，你的应用会崩溃
# 命名规范
- 库名、表名、字段名必须使用小写字母,并采用下划线分割
- 库名、表名、字段名禁止使用MySQL保留字
- 临时库、表名必须以tmp为前缀,并以日期为后缀。例如 tmp_test01_20130704
- 备份库、表必须以bak为前缀,并以日期为后缀。例如 bak_test01_20130704
- 非唯一索引按照“idx_字段名称_字段名称”进用行命名。例如 idx_age_name，一般命名为表名加列名加 uindex，比如 user_user_id_uindex
- 唯一索引按照“uniq_字段名称_字段名称”进用行命名。例如 uniq_age_name，一般命名为表名加列名，比如 user_user_name
- 主键索引一般为自动生成，使用 primary key 即可生成类似 user_id_pkey 的索引
# 设计规范
- 表必须显示定义使用 innodb 存储引擎、utf8mb4 字符集，并且添加注释
- 表必须有主键，推荐使用 unsigned 自增列的 int 类型非业务数据作为主键（其他类型不能设置为自增）
- 除主键外的其他字段都需要增加注释
- 所有字段均定义为 NOT NULL
- 使用 datetime，禁止使用 timestamp
- 禁止在数据库中存储图片、文件等大数据
- 与其他表联查的字段必须加索引
- 表必须要有修改时间与创建时间
- text 可以使用 varchar(10240) 代替。原因：varchar 类型也更容易进行数据验证和清理，因为它有一个明确的最大长度；text 类型无法使用索引、需要额外的处理和存储空间

# 字段设计
- 所有 int 类型在 java 中用 integer 表示，这样不会出现 null 与0混淆的情况
- 使用 tinyint 来代替 enum 类型以及 boolean 类型
- 尽可能不使用 TEXT、BLOB 类型
- 用 DECIMAL 代替 FLOAT 和 DOUBLE 存储浮点数。例如与货币、金融相关的数据
- id 类型 serial （主键）最多自增到21亿，且不可回退，如果 insert 数据量较大推荐使用 bigserial（long）
- update_time、create_time 等时间字段推荐使用 bigint 类型存放，因为查询速度最快，同时使用 now 函数做查询时是可以用索引的（但是直接使用字符串不行），如果不使用 bigint 推荐使用 timestamptz default now() not null（带时区默认为 now 并且不为空）。同时，因为使用 now 函数很可能并发的使用其他函数，比如如下代码块，导致很有可能命中不了索引，因此我们建议在 java 中获取当前时间戳然后传入 mysql
```java
#当前时间戳（秒级）：2020-08-08 12:09:42
select current_timestamp();

#当前时间戳（毫秒级）：2020-08-08 12:09:42.192
select current_timestamp(3);

# 秒级时间戳：1606371113 （自19700101 00:00:00以来按秒算）
UNIX_TIMESTAMP(NOW())

# 毫秒级时间戳：1606371209.293
select unix_timestamp(current_timestamp(3))

# 毫秒级时间戳：1606371209293
REPLACE(unix_timestamp(current_timestamp(3)),'.','')
```
# SQL 规范
- 尽量使用覆盖索引以避免回表操作
- 避免使用*
- 联合索引遵从最左前缀原则
- 使用 or、null、不等于、字符串不加单引号都会使索引失效，因此，使用 in 来代替or，禁止使用负向查询
- like 以通配符开头无法使用索引
- 索引列上有计算或者在 where 上使用函数会无法命中索引
- 禁止使用存储过程、触发器、视图、自定义函数等
- limit 语句注意配合 where 优化
- 避免在字段上使用函数，会使索引失效
- 避免内查询
# 数据库字段类型和 Java 的对应关系
左边是数据库的类型，右边是java中的类型

- 普通字符串
CHAR、VARCHAR 、LONGVARCHAR ---> String

- 整数
SMALLINT ---> Short
INTEGER ---> Int

- 不要用 DOUBLE 和 FLOAT 存放小数
DECIMAL 、 NUMERIC ---> BigDecimal


- java中日期类别用Date了
DATE ---> LocalDate
TIME（存放时分秒） ---> LocalTime
TIMESTAMP、DATETIME ---> LocalDateTime

- 枚举类
TINYINT ---> 自己定义的枚举类

# 外键
物理外键：数据库帮你管关系（自动），依赖数据库约束，但性能差、不灵活
逻辑外键：程序自己管关系（手动），但性能好、灵活

如果使用物理外键
```sql
-- 物理外键（数据库约束）
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    user_id INT,
    -- 这里！数据库会强制检查
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE   -- 用户删除，订单也删除
        ON UPDATE CASCADE   -- 用户ID更新，订单跟着更新
);
```

物理外键的缺陷是：

1，性能灾难（高并发下）：每次 INSERT/UPDATE 都要检查外键约束，涉及外键的表会加锁，容易死锁
2，分库分表无法使用
3，业务扩张困难

因此一般都使用逻辑外键

# 范式
我们很早之前在大学中学过 BC 范式、第一范式、第二范式啥的

1，1NF：遵循原子性。即表中字段的数据，不可以再拆分，下面是一个 bad case
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/2721eb968b554c7c93b4e929444cf293.png)
正确 case 是
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/17fa1b8237d64ac58b9f7f8ec09267a0.png)
2，2NF：在满足第一范式的情况下，遵循唯一性，消除部分依赖。即表中任意一个主键或任意一组联合主键，可以确定除该主键外没有其他主键

3，3NF：在满足第二范式的情况下，消除传递依赖。即在任一主键都可以确定所有非主键字段值的情况下，不能存在某非主键字段 A 可以获取某非主键字段 B

