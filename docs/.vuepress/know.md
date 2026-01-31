# 操作系统
内核，孤儿僵尸守护线程，进程调度算法+cfs，页面置换算法，4种进程通信算法，进程状态，线程状态，进程切换过程，虚拟内存+tlb，io（同步异步阻塞非阻塞，5种io方式），零拷贝（dma，mmap、sendfile），linux常见命令（ps aux，top，netstat，stat，iostat，mpstat），linux指标含义，非阻塞io命令（select、poll、epoll）
# 网络
tcp（三次握手四次挥手，粘包+处理，半连接队列+flood攻击，RST，拥塞控制，超时+快速重传），udp，五层架构，http（长短链接，长短轮询，状态码+区别，请求头体行）+https（tls），dns寻址过程

# java多线程
jmm，java线程安全三特性，wait/Sleep/Noticy+线程生命周期（java和操作系统），Synchronized，volatile（mesi和内存屏障），cas，线程池（执行流程，生命周期，复用，利比特法则），DLC，ConcurrentHashMap（1.71.8结构初始化插入扩容协助扩容），ThreadLocal（弱引用原理，内存泄漏），死锁和处理，AQS（CLH+state+cas，公平非公平，独占共享，Condition），acid到base

# java基础
list、map，反射（性能问题），强软弱虚终结器，三大特性（重写动态分配），泛型（类型擦除，多态冲突），string（前端编译器优化，字符串常量池），异常（throwable和error和exception，异常表，耗时原因），nio，注解
# jvm
jvm内存区域（栈帧组成，内存布局，对象生命周期和布局，解析+分派），可达性分析，垃圾回收机制（根节点枚举，stw，垃圾回收算法+垃圾回收器，cms+g1+zgc），前端编译器流程（解析，语法糖，注解），编译解释区别（后端编译器，jit优化），class文件内容，类装载子系统（装载过程，双亲委派机制），jvm调优
# mysql
ACID，锁（表行读写意向隐式自增），隔离级别与实现（读未执行读已执行可重复读串行化），三个隔离问题，mvcc，分库分表

隐式转换，避免索引失效，SQL 执行计划解读（type，selecttype，extra（sortfile，单路双路），key，keylen，rows），内部索引优化（覆盖索引，索引下推，索引合并），limit offset优化

三大日志（结构，作用，刷盘时机，二阶段提交），innodb四大特性（二次写+预读+buffer pool+hash），bufferpool（脏页刷入时机），b和b+树，SQL 语句执行过程，主从同步过程，主从延迟怎么办
# redis
事务（lua，watch，pipeline），内存淘汰（过期策略+删除策略，内存碎片，bigkey），持久化（rdb+aof，写时复制，触发时机，aof重写+缓冲区），单线程（文件+时间），额外功能（异步删除，发布订阅）

数据结构（sds，ziplist，quicklist，map，整形集合，跳表），对象（字符串，字典，列表，集合，有序集合），集群（心跳检测，新旧同步，哨兵和去中心集群，主从复制时2个问题、raft、gossip），ask和moved

缓存穿透雪崩击穿，分布式锁问题（超时、写法、a锁b删、超时），缓存模式（旁路缓存读写穿透异步回写），红锁
# mq
集群架构，arisrosr高水位，消息传输可靠性，崩溃恢复，队列积压怎么办，如何保证有序消费，删数据，高吞吐（消息压缩，批量发送，io复用零拷贝，内存缓存），稀疏索引，活锁，事务
# zk
znode+watcher，zab（崩溃恢复，消息广播）
# es
倒排索引，段（乐观锁），分片+副本+lucene，1w查询，复杂查询合并
# 集群
主从同步流程、崩溃恢复、持久化
# 分布式
一致性算法（zab，paxos，raft，递增+最大+不同场景不同条件+半数），刚性事务（2pc3pc），gossip，分布式事务理论（cap，base），柔性事务（重试or回滚，tcc、可靠消息队列、saga、空悬挂防回滚），分布式id，seate支持的模式，rpc调用中高可用实现（dubbo和feign和网关）
       
# spring
MVC工作过程，过滤器和拦截器，ioc和aop（三种实现）是什么，三级缓存（objectFactory），事务传播行为，事务失效情况，bean工厂，Autowired 与 Resource，starter原理，boot配置优先级
# dubbo
高可用，限流熔断降级超时，spi，序列化+传输协议+服务发现，失败策略，负载均衡
# 设计模式
工厂、策略、单例、原型、状态、过滤器、责任链、模板、代理
# 架构技能
定时任务，原子性如何保证，高qps如何优化，缓存读写策略，分布式锁相关问题，隔离性如何做的，一致性，可用性，ddd
# 长连接
长短轮询，sse，websocket，socketio
# AI
聚类和分类，分词嵌入，神经网络，损失函数，transfomer（解码器编码器，qkv）与cnn，关于 agent 构建（llm，rag扩张重写自查询，重排序多路召回压缩提示，tool，mcp，拦截、监控、ab）
