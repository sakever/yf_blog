---
title: Redis 数据结构、对象与数据库
date: 2023-06-03
categories:
  - 非关系型数据库
tags:
  - Redis
---
## 数据结构
使用 redis 的数据结构做操作的时候，应该时刻注意操作数据结构的方法的时间复杂度

redis 的命令行使用可以参考菜鸟教程，redis 默认接口是6379

底层数据结构是 redis 实现各种功能的方式，它们大多被封装成各个功能
### 简单动态字符串
key 与 value 的底层数据结构一般都是简单动态字符串（SDS，Simple Dynamic String）实现的，而不是c语言实现的字符串，SDS 类似 java 中的 ArrayList，当值的空间存满了的时候这个字符串会进行自动扩容（**1M 之下会扩容2倍，1M 以上会每次加1M**）
```c
struct __attribute__ ((__packed__)) sdshdr8 {
    uint8_t len; // 表示该数组总共占用多少空间
    uint8_t alloc; // 表示该数组的空闲空间有多少
    unsigned char flags;
    char buf[]; // 存放数据的数组
};
```
SDS 一共有五种结构，分别是 sdshdr5、sdshdr8、sdshdr16、sdshdr32 和 sdshdr64，用 flags 来表示

SDS 有以下特性：

- **动态扩容以杜绝缓冲区溢出**：当 SDSAPI 需要对 SDS 进行修改时，API 会先检查 SDS 的空间是否满足修改所需的要求，如果不满足的话，API 会自动将 SDS 的空间扩展至执行修改所需的大小，空间预分配指每次扩容时程序不仅会为了 SDS 分配修改所必须要的空间，还会为 SDS 分配额外的未使用的空间。**分配策略**为：如果对 SDS 进行修改之后，SDS 的长度小于1MB，那么程序分配和 len 属性同样大小的未使用空间，这时 alloc 的大小为 len 的两倍。如果对 SDS 进行修改之后，SDS 的长度大于等于1MB，那么程序分配1MB未使用空间，这时 alloc 的大小为 len 的两倍。同时，**c 原生的字符串没有这个功能**
- **惰性空间释放**：用于优化 SDS 的字符串缩短操作，当 SDS 的 API 需要缩短 SDS 保存的字符串时，程序并不是立即使用内存重新分配来回收多出来的字节。同时程序提供了自己的 API 减少空间
- **二进制安全**：因为 SDS 使用 len 属性的值而不是空字符串来判断字符串是否结束，数据在写入的时候时什么样的，被读取的时候就说什么样的，不会对其中的数据做任何限制。**而 C 语言自带的字符串读取到 '/0'  的时候就会停止读取**
- 如果储存的值是数字，那么 Redis 内部会把它转成 long 类型来存储，从而减少内存的使用
- SDS 的物理储存就是一块连续的内存空间，最大可存储 512MB 的数据。还记录了 SDS 的长度，c 原生的字符串没有这个功能
### 压缩列表
ziplist 压缩列表是列表键与哈希键的底层实现之一，所有的节点在物理空间中被紧紧压在一起，以减少碎片空间增加空间利用率。在逻辑上对应 java 的 ArrayList，使用压缩列表也是因为 redis 在内存中存放数据，内存的利用对其弥足珍贵

压缩列表主要关注列表的构成、列表节点的构成以及压缩列表可能造成的连锁更新问题。Redis 使用字节数组表示一个压缩列表，字节数组逻辑划分为多个字段，先来看看**列表**的结构
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/043b6452b7de365baff5f73cd0e3ecc0.png)
- zlbytes：记录整个压缩列表占用的字节数
- zltail：记录所有的节点占用的字节数
- zllen：记录所有的节点数量，节点数量小于65535时才能用这个值表示，如果节点数目过多只能遍历所有节点
- entryX：列表节点
- zlend：特殊的结束符。在对底层进行操作的时候就会经常出现这些，头标尾标计数之类的东西

以下是压缩列表节点的构成：
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/3581cfcadda4a983fad715cbf8b7157c.png)
previous_entry_length：这个属性记录了压缩列表前一个节点的长度，该属性根据前一个节点的大小不同可以是1个字节或者5个字节。**这个特性是连锁更新的罪魁祸首之一，但是该特性也是实现从表尾遍历到表头的原理**

如果前一个节点的长度小于254个字节，那么previous_entry_length的大小为1个字节，即前一个节点的长度可以使用1个字节表示

如果前一个节点的长度大于等于254个字节，那么previous_entry_length的大小为5个字节，第一个字节会被设置为0xFE(十进制的254，这也是特殊标记，redis 读到这个254时就知道该节点是5字节的了），之后的四个字节则用于保存前一个节点的长度。redis 对此的策略是减少 ziplist 的大小，如果太大了使用快速列表配合 ziplist 使用

encoding：通过一些特定的编码方式来表示该节点记录的是字节数组还是整数

content：该属性负责保存节点的值，节点值可以是一个字节数组或者一个整数

**连锁更新**在一般的业务情况下不太影响性能，因为高时间复杂度的连锁更新操作出现的条件极其严格

当数组中都是253字节的节点时，向列表头部添加一个大于254字节的节点，此时下一个节点的previous_entry_length更新为5字节，此时下一个节点也大于254字节了，因此造成了连锁反应

在最坏情况下，会从插入位置一直连锁更新到末尾，即执行了N次空间重分配， 而每次空间重分配的最坏复杂度为 O(N) ， 所以连锁更新的最坏复杂度为 O(N^2)。注意，是最坏

注意，**元素之间不存储前向后向指针，而是通过存储当前元素的长度和前一个元素的长度来隐式地实现遍历**。这是节省内存的关键，也因为没有索引，因此查找特定位置的元素（按索引）需要遍历
### 快速列表
在 redis 的较早版本，列表键中存放的数据一多或者某个数据长度较长，底层储存就会从 ziplist 转换为 linklist，在高级的版本中，为了优化性能，使用了 quicklist 来代替 linklist

quicklist 依赖于 ziplist 和 linkedlist 来实现，它是两个结构的结合。它将 ziplist 来进行分段存储，也就是分成一个个的 quicklistNode 节点来进行存储。每个 quicklistNode 指向一个 ziplist，然后 quicklistNode 之间是通过双向指针来进行连接的
```c
    typedef struct quicklistNode {
        struct quicklistNode *prev;  // 上一个 ziplist 
        struct quicklistNode *next;  // 下一个 ziplist 
        unsigned char *zl;           // 数据指针，指向 ziplist 结构，或者 quicklistLZF 结构
        unsigned int sz;             // ziplist 占用内存长度（未压缩）
        unsigned int count : 16;     // ziplist 记录数量
        unsigned int encoding : 2;   // 编码方式，1 表示 ziplist ，2 表示 quicklistLZF
        unsigned int container : 2;  // 
        unsigned int recompress : 1;         // 临时解压，1 表示该节点临时解压用于访问
        unsigned int attempted_compress : 1; // 测试字段
        unsigned int extra : 10;             // 预留空间
    } quicklistNode;

    typedef struct quicklistLZF {
        unsigned int sz;    // 压缩数据长度
        char compressed[];  // 压缩数据
    } quicklistLZF;

    typedef struct quicklist {
        quicklistNode *head;        // 列表头部
        quicklistNode *tail;        // 列表尾部
        unsigned long count;        // 记录总数
        unsigned long len;          // ziplist 数量
        int fill : 16;              // ziplist 长度限制，每个 ziplist 节点的长度（记录数量/内存占用）不能超过这个值
        unsigned int compress : 16; // 压缩深度，表示 quicklist 两端不压缩的 ziplist 节点的个数，为 0 表示所有 ziplist 节点都不压缩
    } quicklist;
```
quicklist 一般两边结点为 ziplist，中间结点叫 quicklistZF，中间部分节点是 ziplist 进一步压缩形成的

### 链表
单键多值，是一个链表数据结构，链表键的底层实现之一
```c
typedef struct listNode {

    // 前置节点
    struct listNode *prev;
​
    // 后置节点
    struct listNode *next;
​
    // 节点的值
    void *value;
​
} listNode;
```
很简单对不对，但是单个的链表节点是无法形成链表的
```c
typedef struct list {
​
    // 表头节点
    listNode *head;
​
    // 表尾节点
    listNode *tail;
​
    // 链表所包含的节点数量
    unsigned long len;
​
    // 节点值复制函数
    void *(*dup)(void *ptr);
​
    // 节点值释放函数
    void (*free)(void *ptr);
​
    // 节点值对比函数
    int (*match)(void *ptr, void *key);
​
} list;
```
这是一个正常的链表结构，为了方便用户包含了头尾指针以及节点个数，还添加了节点操作函数
### 字典
字典这种数据结构在 redis 中被大量使用，除了用来表示数据库之外，字典还是 hash 键的底层实现之一，当一个 hash 键包含的键值对比较多，又或者键值对中的元素是比较长的字符串时，Redis 就会使用字典作为哈希键的底层实现

字典由哈希表、字典与哈希表节点构成，哈希表结构几乎和 java 中的 hashmap 一模一样，通过一个数组来存放节点，同时为了管理方便，在中间添加了大小、装了多少数据等属性
```c
typedef struct dictht{
    //哈希表数组
    dictEntry **table;
    //哈希表大小
    unsigned long size;
    unsigned long sizemask;
    //该hash表已有节点数量
    unsigned long used;
}
```
在节点中使用拉链法来解决哈希冲突，键值对中的值可以是一个整数，也可以是一个指针，而键则是一个指针
```c
typedef struct dictEntry{
	void *key;
	// 值
	union{
      void *val;
      uint_64_tu64;
      int64_ts64;
	} v;
	// 指向下一个哈希节点
	struct dictEntry *next;
}dictEntry;
```
但是就靠这两种结构是无法组成哈希的，哈希表需要解决扩容问题，因此 redis 又将表封装了一层
```c
typedef struct dict{
   //类型特定函数
   dictType *type;
   //私有数据
   void *privdata;
   //哈希表
   dictht ht[2];
   //rehash索引
   //当rehash不在进行时，值为-1
   int trehashidex
}
```
type 属性和 privdata 是针对不同类型的键值对，为创建多态准备的

ht 与 trehashidex 则是为了实现扩容准备的，ht 表示两个哈希表，rehash 时可以从一个表将数据复制到另外一张表中，同时 redis 中采用**渐进式 rehash**，trehashidex 是一个计数器。拓展和收缩哈希表的工作可以通过执行 rehash 操作来完成，进行 rehash 的步骤如下：

1，为字典的ht[1]哈希表分配空间，这个哈希表空间大小取决于要执行的操作，以及ht[0]当前包含的键值对数量（也即是ht[0].used属性的值）

2，将保持在ht[0]中所有键值对慢慢的 rehash 到ht[1]上面，rehash 指的是重新计算 hash 值和索引值，然后将键值对放置到 ht[1]哈希表指定位置上。这个慢慢的是指 redis 中可能存放过多数据，不可能一次性 rehash，那样时间复杂度太大。因此每次删改查操作是都会将一个位置的数据 rehash 到ht[2]上

3，当ht[0]包含的所有键值对都迁移到ht[1]之后，释放ht[0]，当ht[1]设置为ht[0]，并在ht[1]新创建空白哈希表，为下一次 hash 做准备

渐进式 rehash 有以下特点：

- trehashidex 标志了该次 rehash 的数组下标，完成该次 rehash 后会将计数器值加一
- 增加操作直接在ht[1]上进行，删改查操作会先查找数据，此时先在0表查找，没查到的话去1表查
- 0表会慢慢减少，1表会慢慢增加
- trehashidex 在 rehash 开始时会被置为0，慢慢的增加，完成之后被置为-1
### 跳表
跳表是已经给数据排序并且可以快速查找的链表，它的实现是在原来的链表上加了多级索引，每个索引节点包含两个指针，一个向下，一个向右，最低层包含所有的元素。跳表是有序集合

跳表在插入数据时会根据一个随机函数得到该数据的层数，并且搜索到对应位置进行插入，插入时小于该分值的上一个节点都需要进行修改

跳表其实类似给链表建立索引，它的查找时间复杂度近似平衡二叉树
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/af30bed509cbd937fed3f290dce90e4d.png)
使用跳表查找时会**从头节点的最高层开始查找**，如果当前层数的下一个数据比需要查找的数据大，进入该节点下一层尝试进行查找，循环反复直到找到

我们发现普通的跳表是用不同的数字做储存，最第层的数据是从小到大排序的。而 redis 的跳表却储存了字符串和分值两种元素，因此 redis 的遍历也需要做出改变，redis 的分值可以相同，我们用分值当索引，而字符串不允许相同，因此在同一分值中会按照从小到大排序。这样的架构也导致如果 redis 只传入字符串是无法快速访问到数据的

redis 只在实现有序集合键以及集群的节点时使用跳表

redis 用两个结构来实现跳表，一个是 zskiplist。指向的头节点必定为32层，并且不包含数据， 最大节点数则方便确定头节点应该在哪一层开始查找
```c
typedef struct zskiplist {
    // 头节点，尾节点
    struct zskiplistNode *header, *tail;
    // 节点数量
    unsigned long length;
    // 目前表内节点的最大层数
    int level;
} zskiplist;
```
zskiplistNode 就是实现跳表的节点。每个节点都有一个分值来确定该节点的大小，如果大小一样的分值则使用成员对象的值来确定大小
```java
typedef struct zskiplistNode {
    // member 对象
    robj *obj;
    // 分值
    double score;
    // 后退指针
    struct zskiplistNode *backward;
    // 层
    struct zskiplistLevel {
        // 前进指针
        struct zskiplistNode *forward;
        // 这个层跨越的节点数量
        unsigned int span;
    } level[];
} zskiplistNode;
```
### 整数集合
整数集合是集合键的实现之一，当一个集合只有整数元素，并且元素数量不多是就会使用整数集合，其实现相当简单，只有一个结构体
```c
typedef struct intset {

    // 编码方式
    uint32_t encoding;

    // 集合包含的元素数量
    uint32_t length;

    // 保存元素的数组
    int8_t contents[];

} intset;
```
**整数集合的每个元素都是 contents 数组的一个数组项（item），各个项在数组中按值的大小从小到大有序地排列，并且数组中不包含任何重复项**

唯一需要着重说的是整数集合的**升级**优化。encoding 编码方式决定了数组存放了什么数据，每当我们要将一个新元素添加到整数集合里面，需要比较新元素的类型是否比整数集合现有所有元素的类型都要长，如果是，则整数集合需要先进行升级（upgrade），然后才能将新元素添加到整数集合里面。升级就是将原来数组中的所有占用低字节的数据转换为多字节的数据。比如将32位转为64位

整数集合越升级就能存放范围越大的数据，同时，因为新插入数据的范围大，因此插入的不是数组的最左边就是数组的最右边。在插入时不会新建一个数组来存放数据，而是会在该数组后面新增一块储存空间并且使用尾插法转换

整数集合不支持降级操作
## 对象
redis 用底层数据结构来组成可供我们操作的数据库对象，我们通过命令可以直接调用 string、list、hash 等对象
### redisObject
Redis 针对不同的数据结构定义统一的数据结构 redisObject 来进行管理。换句话说，redisObject 是所有数据结构的最外层的一层结构定义

```c
typedef struct redisObject 
{ 
	unsigned type:4; 
	unsigned encoding:4; 
	unsigned lru:REDIS_LRU_BITS;  
	/* lru time (relative to server.lruclock) */  
	int refcount; 
	void *ptr;
} robj;
```
其中 type 表示该数据结构的类型，因为 redis 只保存键值对，**因此键都是由 SDS 实现的，而值的选择有可能不同，可以是字符串对象、列表对象等**。我们把值存放字符串的对象叫做字符串键

encoding 表示编码方式，即该对象的值底层是如何实现的。每一个对象至少有两种实现方式，redis 可以根据目前的情况选择最适合的编码方式。ptr 指针就是指向对象底层实现数据结构的，各个主要对象的编码方式如下
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/411a106c1bc372d9c796204a8d2f6317.png)
可以看到同一个对象也有可能采用不同的编码方式，那同一个命令对该对象的底层实现也有可能不一样，它会调用不同的 API 去执行。同时有些命令只能对某些对象使用，另外一些命令可以对所有的对象使用，比如 DEL 等

因此，redis 在执行命令时会先经过两次判断，**类型检查**与**多态命令**，**类型检查是判断该命令能不能作用与这个对象上，多态命令是判断选择什么 API 去执行这个命令**

lru 这个字段用来记录对象最后一次访问时间，是实现过期删除功能的主要字段。对象的**空转时长**就是通过当前的时间减去值对象的 lru 时间得到的，在内存回收时，高空转时长的对象优先会被回收掉

refcount 是**引用计数**，每当这个对象被使用一次后，该计数器就会加一，被生成的时候默认为1，如果该计数器为0了，说明该对象会被回收掉。同时这也说明了同一个对象是会被多个键引用的，这种被多个引用的特性就叫**共享对象**

程序在启动的时候，会自动生成0到9999这一万个字符串键，服务器会使用这些共享对象，而不是新建对象。同时，redis 也只能共享 int 类型的字符串键，其他的 SDS 类的字符串键、哈希键、列表键等都不能共享。因为得益与原生的 int 类型比较比较快速
### 字符串键
set 命令如下：
```
SET key value [EX seconds] [PX milliseconds] [NX|XX]
```
将字符串值 value 关联到 key。如果 key 已经持有其他值，SET 就覆写旧值，无视类型。对于某个原本带有生存时间的键来说，当 SET 命令成功在这个键上执行时，这个键原有的 TTL 将被清除

set 的可选参数比较多。从 Redis 2.6.12 版本开始， SET 命令的行为可以通过一系列参数来修改：

- EX second：设置键的过期时间为 second 秒。SET key value EX second 效果等同于 SETEX key second value
- PX millisecond：设置键的过期时间为 millisecond 毫秒。 SET key value PX millisecond 效果等同于 PSETEX key millisecond value
- NX：只在键不存在时，才对键进行设置操作。 SET key value NX 效果等同于 SETNX key value
- XX：只在键已经存在时，才对键进行设置操作

因为 SET 命令可以通过参数来实现和 SETNX 、 SETEX 和 PSETEX 三个命令的效果，所以将来的 Redis 版本可能会废弃并最终移除 SETNX 、 SETEX 和 PSETEX 这三个命令

字符串对象可以存储整数、浮点数、字符串，具体策略是：

- 当存储整数时，用到的编码是 int，底层的数据结构可以用来存储 long 类型的整数
- 当存储字符串时，如果字符串的长度小于等于32字节，那么将用编码为 embstr 的格式来存储；如果字符串的长度大于32字节，将用编码为 raw 的 SDS 格式来存储
- 当存储浮点数时会先将浮点数转换为字符串，如果转换后的字符串长度小于32字节就用编码为 embstr 的格式来存储，否则用编码为 raw 的 SDS 格式来存储

embstr 和 sdsstr 结构一模一样，唯一的不同点是生成时，sdsstr 需要两次分配空间函数来方便分配 redisObject 与 sdsstr 的内存，而 embstr 只需要分配一次内存空间，空间中依次包含 redisObject 与 sdsstr

编码方式是可以相互转换的，同时不同的编码方式对字符串命令的实现也有影响，因为这个的多样性它可以用来存储任何类型的数据比如字符串、整数、浮点数甚至图片

设置键的代码如下，大致意思是，OBJ_SET_NX 就是用户带了 NX 参数，OBJ_SET_XX 就是用户带了 XX 参数。比如如果带了 PX 并且 lookupKeyWrite（查数据的方法）如果找到了键并且是那么直接返回了，如果所有校验都过了就直接插入：
```c
/* Forward declaration */
static int getExpireMillisecondsOrReply(client *c, robj *expire, int flags, int unit, long long *milliseconds);

void setGenericCommand(client *c, int flags, robj *key, robj *val, robj *expire, int unit, robj *ok_reply, robj *abort_reply) {
    long long milliseconds = 0; /* initialized to avoid any harmness warning */
    int found = 0;
    int setkey_flags = 0;

    if (expire && getExpireMillisecondsOrReply(c, expire, flags, unit, &milliseconds) != C_OK) {
        return;
    }

    if (flags & OBJ_SET_GET) {
        if (getGenericCommand(c) == C_ERR) return;
    }

    found = (lookupKeyWrite(c->db,key) != NULL);

    if ((flags & OBJ_SET_NX && found) ||
        (flags & OBJ_SET_XX && !found))
    {
        if (!(flags & OBJ_SET_GET)) {
            addReply(c, abort_reply ? abort_reply : shared.null[c->resp]);
        }
        return;
    }

    /* When expire is not NULL, we avoid deleting the TTL so it can be updated later instead of being deleted and then created again. */
    setkey_flags |= ((flags & OBJ_KEEPTTL) || expire) ? SETKEY_KEEPTTL : 0;
    setkey_flags |= found ? SETKEY_ALREADY_EXIST : SETKEY_DOESNT_EXIST;

    setKey(c,c->db,key,val,setkey_flags);
    server.dirty++;
    notifyKeyspaceEvent(NOTIFY_STRING,"set",key,c->db->id);

    if (expire) {
        setExpire(c,c->db,key,milliseconds);
        /* Propagate as SET Key Value PXAT millisecond-timestamp if there is
         * EX/PX/EXAT flag. */
        if (!(flags & OBJ_PXAT)) {
            robj *milliseconds_obj = createStringObjectFromLongLong(milliseconds);
            rewriteClientCommandVector(c, 5, shared.set, key, val, shared.pxat, milliseconds_obj);
            decrRefCount(milliseconds_obj);
        }
        notifyKeyspaceEvent(NOTIFY_GENERIC,"expire",key,c->db->id);
    }

    if (!(flags & OBJ_SET_GET)) {
        addReply(c, ok_reply ? ok_reply : shared.ok);
    }

    /* Propagate without the GET argument (Isn't needed if we had expire since in that case we completely re-written the command argv) */
    if ((flags & OBJ_SET_GET) && !expire) {
        int argc = 0;
        int j;
        robj **argv = zmalloc((c->argc-1)*sizeof(robj*));
        for (j=0; j < c->argc; j++) {
            char *a = c->argv[j]->ptr;
            /* Skip GET which may be repeated multiple times. */
            if (j >= 3 &&
                (a[0] == 'g' || a[0] == 'G') &&
                (a[1] == 'e' || a[1] == 'E') &&
                (a[2] == 't' || a[2] == 'T') && a[3] == '\0')
                continue;
            argv[argc++] = c->argv[j];
            incrRefCount(c->argv[j]);
        }
        replaceClientCommandVector(c, argc, argv);
    }
}
```
### 列表键
底层数据结构是双向链表，类似 java 中的，如果在数据量比较少的情况下，会分配一个连续的内存空间 ziplist（减少内存碎片）。ziplist 被设计为各个数据项挨在一起组成连续的内存空间，这种结构并不擅长做修改操作

数据量较多或者某个数据过大时，会将多个 ziplist 连接成一个 quicklist。但是在 redis 的老版本是使用 linkedlist 的

一般来说，当字符串长度大于64字节（字节为64时正好时记录长度变成2时）或者列表对象保存的数量大于512个时，会发生编码转换，但是**这些上限值是可以被修改的**
### 哈希键
普通的 hash，hash 特别适合用于存储对象

和列表键类似，哈希键会在数据量较少（键值对小于512个）并且数据的长度都小于64字节的时候使用 ziplist，数据量较多的时候使用字典 dict，这两个上限值也是可以修改的

**哈希键在列表中的存放方式是先在压缩列表尾部存放值对象，然后继续存放键对象，因此这两个都是贴在一块的需要寻找键值对时遍历一遍就行了**，在数据量较少的时候遍历和使用 hash 函数的速度并无差距

哈希键的使用场景：储存用户信息，存储对象
### 集合键
无序不可重复集合

关于底层数据结构的实现，当数据量较少（小于512个），并且存放的都是整数的时候，它会使用整数集合(intset）来储存，整数集合中使用数组来存放数据，数据没有重复

当不同时满足这两个条件的时候，Redis 就使用 dict（字典）来存储集合中的数据，具体实现也和 java 中 HashSet 实现一样，字典的每个键都是一个字符串对象，同时每个值都被设成了 null

编码转换发生在当存放的元素有非整数或者存放元素过多，超过了512个的时候，其中这个512是可以修改的
### 有序集合键
可以排序的 set 集合（zset），又称有序集合，保证了内部 value 的唯一性，另方面它可以给每个 value 赋予一个score，代表这个 value 的排序权重

当有序集合保存的元素个数小于128个，且所有元素成员长度都小于64字节时，使用 ziplist

有序集合会使用压缩列表作为底层实现，每个集合元素使用两个紧挨着一起的两个压缩列表节点表示，第一个节点保存元素的成员(member)，第二个节点保存元素的分值(score)

否则，使用跳表配合字典 dict 的方式实现（字典的键为元素，值为 score），其中字典用来根据数据查找对应的分数，而跳表用来根据分数查询数据（由于多个数据会有相同的分数，因此可能是范围查找）

应用场景：直播间礼物排行榜，或者按点赞排序

redis 现在不止提供了这些基础的5种对象，现在还加入的 BitMaps、HyperLogLog等
## 数据库
redis 的主要功能是数据库，让我们来看看上面的所有组件是如何组成数据库的
### redisService
所有的数据库都保存在 redisService 结构体中，不用了解所有的 redisServer 属性，因为这里面定义了 360 行的属性，我们只挑最重要的看，部分属性如下
```c
struct redisServer{
    long long dirty;// 距上一次执行持久化以来数据库的修改次数
    time_t lastsave;// 上一次持久化的时间，时间戳，单位s
    time_t unixtime;// 保存了秒级精度的系统当前 uxin 时间戳
    struct saveparam *saveparam;// 自动保存的条件
    ......
    redisDb *db;// 数据库数组
    int dbnum;// 数据库数量
    ......
}
```
里面的属性大多是用来管理服务器的，redis 会每100毫秒调用一次 serverCron 函数，更新 redisSerice 里的属性，维持服务器的良好运转

比如该函数会从系统中获取当前时间戳，更新系统缓存。因为 redis 有很多需要调用时间的功能，而每次使用时间时都需要系统调用，因此应用缓存还是需要的，因为每100毫秒一次因此缓存的精准度并不高。AOF 缓冲区中的内容也会在此时写入 AOF 文件
### redisClient
客户端状态由 redistClient 结构体保存，在一个客户端链接服务器的时候，redis 会为每一个客户端创建一个 redisClient 来保存每个用户的状态，客户端包含的主要属性如下
```c
struct redisClient{
	// 标记该用户正在使用的数据库
	redisDb *db;
	// fd 表示该客户端使用的套接字，伪客户端使用的都是-1，普通客户端用的
    int fd;
    // 名字
    rodj *name;
    // 标记，记录客户端的状态以及角色
    int flags;
    // 这两个字段记录了 redis 的命令以及参数
    robj **argv;
    int argc;
	......
}
```
在多次操作切换数据库的时候，执行一些命令前应该先显示的执行 select 语句切换数据库，切换到指定数据库执行命令

其中，flags 里可以存放多个标记用来表示客户端的多个状态，比如可以用REDIS_SLAVE 表示这个是从服务器，同时加入 | REDIS_LUA_CLIENT 表示客户端是专门处理 lua 脚本的

fd 为正数的是普通客户端，在链接服务器成功的时候会将对应的客户端状态加入到服务器 clients 列表的末尾，在客户端因为某种原因断连的时候会从这个列表中去掉。同时，还存在只执行 lua 脚本的伪客户端，该客户端会一直存在。也会存在执行 AOF 文件读入的客户端，在读完文件之后会关闭该客户端
### 命令执行过程
命令执行过程跟客户端与服务器都有关系，大致过程就是用户输入命令，redis 通过套接字读取命令，分析并且执行，随后将结果返回给用户

在服务器监视套接字处于可读状态时，redis 读取命令并且将命令字符串保存在输入缓冲区中，querybuf 因为是动态字符串。之后分析命令，将命令保存在 redisClient 中的 argv 属性中，将数组的长度保存在 argc 参数中

命令执行器的操作就是首先通过命令表查找命令具体实现，命令表是一个字典，通过 argv 属性的值去查找对应的 redisCommand 结构，每个 redisCommand 记录了一个命令的具体实现。找到之后，客户端的 cmd 属性会指向这个结构。如果没有找到，说明命令不存在，返回 null 给用户

```c
typedef struct redisClient {
    // ...
    // 输入缓冲区
    sds querybuf;
    // 记录命令的数组，argv[0] 记录命令本身，后面的记录参数
    robj **argv;
    // argc属性则负责记录argv数组的长度
    int argc;
    // cmd 指针指向命令的具体实现
    struct redisCommand *cmd;
} redisClient;
```
知道命令的具体实现之后，正常来说直接执行就可以。但是 redis 的诸多其他功能的实现需要在命令的执行前后记录一些数据或者做一些校验工作，因此，在执行前需要：

- 如果命令名称为 quit，则直接返回，并且设置客户端标志位。
- 根据 argv[0] 查找对应的 redisCommand，所有的命令都存储在命令字典 redisCommandTable 中，根据命令名称可以获取对应的命令。
- 进行用户权限校验。
- 如果是集群模式，处理集群重定向。当命令发送者是 master 或者 命令没有任何 key 的参数时可以不重定向。
- 预防 maxmemory 情况，先尝试回收一下，如果不行，则返回异常。
- ......

调用对应的命令执行函数即可执行命令并且返回结果，结果更输入一样存放在客户端的输出缓冲区中，在执行收尾工作之后 redis 会将缓冲区内容返回给用户并且清空缓冲区，以方便下一次命令的执行

收尾工作包括：

- 调用 redisCommand 的proc 方法，执行对应具体的命令逻辑
- 如果开启了 CMD_CALL_SLOWLOG，则需要记录慢查询日志
- 如果开启了 CMD_CALL_STATS，则需要记录一些统计信息
- 如果开启了 CMD_CALL_PROPAGATE，则当 dirty 大于0时，需要调用 propagate 方法来进行命令传播
- .......

### redisDb
redis 是使用c语言编写的，数据库被表示为一个结构体。里面包含了**键空间**
```cpp
typedef struct redisDb { 

	int id; //id是数据库序号，为0-15(默认Redis有16个数据库) 
	
	long avg_ttl; //存储的数据库对象的平均ttl(time to live)，用于统计 
	
	dict *dict; //存储数据库所有的key-value 
	
	dict *expires; //存储key的过期时间 
	
	dict *blocking_keys;//blpop 存储阻塞key和客户端对象 
	
	dict *ready_keys;//阻塞后push 响应阻塞客户端 存储阻塞后push的key和客户端对象 dict *watched_keys;//存储watch监控的的key和客户端对象 

    list *clients;// 一个链表，保存了所有客户端状态
} redisDb;
```
Redis 默认会创建 16 个数据库，每个数据库互不影响

dict 用来维护一个 Redis 数据库中包含的所有 Key-Value 键值对，它就是传说中的键空间。它的键是字符串对象，它的每个值可以是字符串对象、列表对象、哈希表对象、集合对象和有序集合对象中的任意一种 Redis 对象，而且它们统一使用 redisObject 来管理，即键值都是 redisObject 

而过期字典中的键也是一个指针，指向键空间中的键 redisObject。而值指向一个 longlong 类型的整数

它的结构大致如下：
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/3fc32a86c81fd7fa4b599be013b5d731.png)
