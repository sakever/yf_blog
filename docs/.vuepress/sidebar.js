// 左侧总目录内容（所有路径共用这个）
const sidebarContent = [
  {
    title: 'AI',
    collapsable: false,
    children: [
      '/_posts/_ai/Agent 工程架构.md',
      '/_posts/_ai/LLM 相关内容.md',
      '/_posts/_ai/NLP 相关知识.md',
      '/_posts/_ai/windows 下 ollama 迁移到 D 盘.md',
      '/_posts/_ai/如何编写 Prompt.md'
    ]
  },
  {
    title: '架构设计',
    collapsable: false,
    children: [
      '/_posts/_architecture/DDD 架构学习笔记.md',
      '/_posts/_architecture/Java 常用的规则引擎.md',
      '/_posts/_architecture/MVC 架构学习笔记.md',
      '/_posts/_architecture/三高问题下的系统优化.md',
      '/_posts/_architecture/为什么要打日志？怎么打日志？打什么日志？.md',
      '/_posts/_architecture/从 ACID 到 BASE 事务处理的实现.md',
      '/_posts/_architecture/代码整洁之道.md',
      '/_posts/_architecture/抽象方法与设计模式.md',
      '/_posts/_architecture/分布式架构的观测.md',
      '/_posts/_architecture/关于分布式系统 RPC 中高可用功能的实现.md',
      '/_posts/_architecture/如何用少量内存处理巨量数据.md',
      '/_posts/_architecture/数据库分库分表.md',
      '/_posts/_architecture/设计模式——过滤器模式在 Spring 中的实践.md',
      '/_posts/_architecture/设计模式——状态模式.md',
      '/_posts/_architecture/设计模式——策略模式.md',
      '/_posts/_architecture/运维监控常见指标含义.md',
      '/_posts/_architecture/聊聊集群间数据同步、崩溃恢复和持久化.md',
      '/_posts/_architecture/权限系统设计.md',
      '/_posts/_architecture/统一结果返回.md',
      '/_posts/_architecture/参数校验与异常处理.md',
      '/_posts/_architecture/资深研发进阶.md'
    ]
  },
  {
    title: '计算机基础',
    collapsable: false,
    children: [
      '/_posts/_computer/Hex 和 Base64.md',
      '/_posts/_computer/XML 的使用.md',
      '/_posts/_computer/ffmpeg 的安装以及实现音频切分功能.md',
      '/_posts/_computer/操作系统 IO 相关知识.md',
      '/_posts/_computer/操作系统学习笔记.md',
      '/_posts/_computer/正则表达式相关概念.md',
      '/_posts/_computer/程序的机器级表示.md',
      '/_posts/_computer/音频文件基础.md'
    ]
  },
  {
    title: '数据结构与算法',
    collapsable: false,
    children: [
      '/_posts/_data_structures_and_algorithms/动态规划算法学习笔记.md',
      '/_posts/_data_structures_and_algorithms/基于比较的排序算法的最坏情况下的最优下界为什么是O(nlogn).md',
      '/_posts/_data_structures_and_algorithms/算法导论第一部分学习笔记.md',
      '/_posts/_data_structures_and_algorithms/算法导论第二部分排序学习笔记.md',
      '/_posts/_data_structures_and_algorithms/集合与数据结构学习笔记.md',
      '/_posts/_data_structures_and_algorithms/面试常见算法总结.md'
    ]
  },
  {
    title: '开发工具',
    collapsable: false,
    children: [
      '/_posts/_development/IDEA 常用快捷键以及调试.md',
      '/_posts/_development/IDEA 插件推荐.md',
      '/_posts/_development/Shell 脚本.md',
      '/_posts/_development/excel 关于 =vlookup 的用法.md',
      '/_posts/_development/git 的学习以及使用.md',
      '/_posts/_development/如何画时序图、流程图、状态流转图.md',
      '/_posts/_development/swagger 的使用.md'
    ]
  },
  {
    title: '分布式',
    collapsable: false,
    children: [
      '/_posts/_distributed/Dubbo 基础概念.md',
      '/_posts/_distributed/Gossip 协议.md',
      '/_posts/_distributed/Protobuf 通信协议.md',
      '/_posts/_distributed/Zookeeper 基础学习.md',
      '/_posts/_distributed/nginx 学习笔记.md',
      '/_posts/_distributed/分布式 id.md',
      '/_posts/_distributed/分布式一致性算法.md',
      '/_posts/_distributed/分布式缓存相关问题.md',
      '/_posts/_distributed/分布式集群理论和分布式事务协议.md',
      '/_posts/_distributed/初步了解 docker.md',
      '/_posts/_distributed/访问远程服务.md',
      '/_posts/_distributed/详解 Spring Cloud.md',
      '/_posts/_distributed/负载均衡 Load Balancing.md'
    ]
  },
  {
    title: '前端',
    collapsable: false,
    children: [
      '/_posts/_front/GitHub Pages 部署教程.md',
      '/_posts/_front/Vercel 部署教程.md',
      '/_posts/_front/VuePress 博客搭建指南.md',
      '/_posts/_front/vue-admin-template 简单使用.md',
      '/_posts/_front/简单了解前端页面开发.md'
    ]
  },
  {
    title: '金融',
    collapsable: false,
    children: [
      '/_posts/_finance/基础的金融知识.md',
      '/_posts/_finance/基金与股票.md',
      '/_posts/_finance/聊聊价值投资.md',
      '/_posts/_finance/股票技术面.md',
      '/_posts/_finance/股票技术面——盘口.md',
      '/_posts/_finance/股票技术面——量价关系.md',
      '/_posts/_finance/韭菜的自我总结.md'
    ]
  },
  {
    title: 'Java',
    collapsable: false,
    children: [
      '/_posts/_Java/CompletableFuture 相关用法.md',
      '/_posts/_Java/CompletableFuture 源码浅要阅读.md',
      '/_posts/_Java/FutureTask 源码阅读.md',
      '/_posts/_Java/Guava 常用 API.md',
      '/_posts/_Java/Guava 源码阅读：Multimap 相关.md',
      '/_posts/_Java/Jackson 的各种使用.md',
      '/_posts/_Java/Java Http 访问框架.md',
      '/_posts/_Java/Java Stream 的使用.md',
      '/_posts/_Java/Java 中关于字符串处理的常用方法.md',
      '/_posts/_Java/Java 中强、软、弱、虚引用.md',
      '/_posts/_Java/Java 图片文件上传下载处理.md',
      '/_posts/_Java/Java 序列化.md',
      '/_posts/_Java/Java 异常.md',
      '/_posts/_Java/Java 的 Excel 相关操作.md',
      '/_posts/_Java/Java 语法糖.md',
      '/_posts/_Java/Java8 新特性.md',
      '/_posts/_Java/JAVA 枚举的基础和原理.md',
      '/_posts/_Java/JAVA 注解小结.md',
      '/_posts/_Java/Scanner 的各种用法.md',
      '/_posts/_Java/Servlet 学习笔记.md',
      '/_posts/_Java/String、StringBuffer、StringBuilder.md',
      '/_posts/_Java/反射学习笔记.md',
      '/_posts/_Java/如何使用 lambda 实现集合排序以及为什么 lambda 不能改变外部变量的值.md',
      '/_posts/_Java/对象之间的映射与转换.md',
      '/_posts/_Java/泛型相关概念.md',
      '/_posts/_Java/java 基础知识.md',
      '/_posts/_Java/java 的常见性能问题分析以及出现场景.md',
      '/_posts/_Java/netty 学习笔记.md',
      '/_posts/_Java/关于 boolean 类型的坑.md'
    ]
  },
  {
    title: 'JVM',
    collapsable: false,
    children: [
      '/_posts/_jvm/JVM 自动内存管理.md',
      '/_posts/_jvm/Linux 中 JVM 常用工具以及常见问题解决思路.md',
      '/_posts/_jvm/虚拟机执行子系统.md'
    ]
  },
  {
    title: 'Linux',
    collapsable: false,
    children: [
      '/_posts/_linux/Linux 常见命令.md',
      '/_posts/_linux/Linux 文件系统.md',
      '/_posts/_linux/crontab 表达式.md'
    ]
  },
  {
    title: '中间件',
    collapsable: false,
    children: [
      '/_posts/_middleware/ES 搜索引擎.md',
      '/_posts/_middleware/Grape-RAG.md',
      '/_posts/_middleware/Hadoop 基础原理.md',
      '/_posts/_middleware/flink 提交流程.md',
      '/_posts/_middleware/关于定时任务原理.md',
      '/_posts/_middleware/详解 kafka.md'
    ]
  },
  {
    title: '多线程',
    collapsable: false,
    children: [
      '/_posts/_multithreading/AQS 组件.md',
      '/_posts/_multithreading/ThreadLocal 原理以及使用.md',
      '/_posts/_multithreading/多线程基础学习笔记.md',
      '/_posts/_multithreading/如何手写单例.md',
      '/_posts/_multithreading/深入理解 java 多线程安全.md',
      '/_posts/_multithreading/生产者消费者问题.md',
      '/_posts/_multithreading/简单了解并发集合.md',
      '/_posts/_multithreading/线程池作用、用法以及原理.md'
    ]
  },
  {
    title: '网络',
    collapsable: false,
    children: [
      '/_posts/_network/CORS 跨域资源共享.md',
      '/_posts/_network/DNS、HTTP 与 HTTPS.md',
      '/_posts/_network/Server-Sent Events (SSE).md',
      '/_posts/_network/WebSocket 长连接.md',
      '/_posts/_network/网络安全相关.md',
      '/_posts/_network/计算机网络学习笔记.md'
    ]
  },
  {
    title: '非关系型数据库',
    collapsable: false,
    children: [
      '/_posts/_non_relational_db/Redis 学习笔记.md',
      '/_posts/_non_relational_db/Redis 数据结构、对象与数据库.md',
      '/_posts/_non_relational_db/Redis 集群.md'
    ]
  },
  {
    title: '其他',
    collapsable: false,
    children: [
      '/_posts/_other/程序员职场工作需要注意什么.md',
      '/_posts/_other/梅花易数学习笔记.md',
      '/_posts/_other/观罗翔讲刑法随笔.md'
    ]
  },
  {
    title: 'Python',
    collapsable: false,
    children: [
      '/_posts/_python/Python 基础语法.md',
      '/_posts/_python/Python 学习.md'
    ]
  },
  {
    title: '问题记录',
    collapsable: false,
    children: [
      '/_posts/_question/提供可传递的易受攻击的依赖项.md',
      '/_posts/_question/定时任务单线程消费 redis 中数据导致消费能力不足.md',
      '/_posts/_question/Liteflow 在 SpringBoot 启动时无法注入组件问题.md'
    ]
  },
  {
    title: '关系型数据库',
    collapsable: false,
    children: [
      '/_posts/_relational_db/B 树和 B+ 树的插入、删除和数据页分裂机制.md',
      '/_posts/_relational_db/MySQL 事务与锁与 MVCC.md',
      '/_posts/_relational_db/MySQL 的 binglog、redolog、undolog.md',
      '/_posts/_relational_db/MySQL 基础语句学习笔记.md',
      '/_posts/_relational_db/MySQL 开发规范.md',
      '/_posts/_relational_db/MySQL 数据类型、字符集相关内容.md',
      '/_posts/_relational_db/MySQL 索引与索引优化.md',
      '/_posts/_relational_db/MySQL 的记录存储结构、存储引擎与 Buffer Pool.md',
      '/_posts/_relational_db/PostgreSQL 更新数据时 HOT优化.md',
      '/_posts/_relational_db/PostgreSQL 相关用法.md'
    ]
  },
  {
    title: 'Spring 项目',
    collapsable: false,
    children: [
      '/_posts/_spring_project/Lombok 的常用注解.md',
      '/_posts/_spring_project/MyBatis 框架的使用.md',
      '/_posts/_spring_project/MyBatis 重要知识点总结.md',
      '/_posts/_spring_project/MybatisPlus 的使用.md',
      '/_posts/_spring_project/Spring IOC 的原理及源码.md',
      '/_posts/_spring_project/Spring 事务相关.md',
      '/_posts/_spring_project/Spring 框架基础使用.md',
      '/_posts/_spring_project/SpringAOP（面向切面编程）的使用和原理.md',
      '/_posts/_spring_project/SpringBoot 基础使用.md',
      '/_posts/_spring_project/SpringBoot 的原理.md',
      '/_posts/_spring_project/SpringWeb 重要知识点.md',
      '/_posts/_spring_project/maven 小结.md'
    ]
  }
]

// 为所有可能的路径配置相同的 sidebar
const sidebar = {
  '/_posts/': sidebarContent,
  '/_posts/_ai/': sidebarContent,
  '/_posts/_architecture/': sidebarContent,
  '/_posts/_computer/': sidebarContent,
  '/_posts/_data_structures_and_algorithms/': sidebarContent,
  '/_posts/_development/': sidebarContent,
  '/_posts/_distributed/': sidebarContent,
  '/_posts/_front/': sidebarContent,
  '/_posts/_finance/': sidebarContent,
  '/_posts/_Java/': sidebarContent,
  '/_posts/_jvm/': sidebarContent,
  '/_posts/_linux/': sidebarContent,
  '/_posts/_middleware/': sidebarContent,
  '/_posts/_multithreading/': sidebarContent,
  '/_posts/_network/': sidebarContent,
  '/_posts/_non_relational_db/': sidebarContent,
  '/_posts/_other/': sidebarContent,
  '/_posts/_python/': sidebarContent,
  '/_posts/_question/': sidebarContent,
  '/_posts/_relational_db/': sidebarContent,
  '/_posts/_spring_project/': sidebarContent
}

module.exports = sidebar
