--- 
title: Dubbo 基础概念
date: 2022-01-05

sidebar: ture
categories:
  - 分布式
tags:
  - Dubbo
--- 
# RPC
## 分布式的必要性
当用户的数量增大，一个服务器不能解决过量的需求时，我们就需要使用多个服务器来满足大流量的数据访问。每个服务器部署不同的业务，如果某一个服务的访问量比较大的话也可以将这个服务同时部署在多台机器上
## RPC 是什么
为了解决分布式系统直接可能会出现的相互调用，为了让多个服务器协调运行，我们也需要一个完整的规范来控制服务器

RPC 就是远程过程调用，它的作用是让不同服务器之间可以相互调用，让分布式或者微服务系统中不同服务之间的调用像本地调用一样简单

注意，RPC 是一种思想，RPC 框架是这个思想的具体实现
## 主要属性
影响 RPC 框架性能的主要属性有下面几个：

**资源定位与服务发现**：我们需要知道自己应该调用哪台主机的哪个方法，在其中可能出现的问题都需要解决，比如我们如何确保要调用的主机没有挂掉呢、我们这么找到需要调用的主机呢

**传输协议**：为了让不同服务器可以传输数据，选择一个合适的传输协议尤其重要，在合适的场景下可以选择 TCP、HTTP 等协议

**序列化协议**：java 中一切即对象，对象的传输需要序列化，可以使用 jdk 自带序列化方法或者 json 等来序列化对象

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/a6d255e19b287e99f5b4fe0d9ceaed23.png)
在服务器方法之下加了两层，一层用来序列化，一层用来传输数据，因此用户可以直接使用服务器方法调用另一个服务器方法

这张图片中：
1、5调用方法
2、7序列化
3、8网络数据传输
4、9解码
6、10返回结果

RPC 框架就是封装了2到9步，让用户可以直接使用1、10

你已经知道了 RPC 的大体步骤，快来手写一个RPC框架吧（
# Dubbo 基础介绍
## Dubbo 的优点
现在阿里为我们提供了一套优秀的 RPC 调用框架

1，提供高性能的基于代理的远程调用能力，服务以接口为粒度，为开发者屏蔽远程调用底层细节

2，智能负载均衡，内置多种负载均衡策略，显著减少调用延迟，提高系统吞吐量（负载均衡指的是，多台服务器提供同一种服务时，负载均衡会让每个服务器平均处理请求的数量）

3，服务自动注册，支持多种注册中心服务，服务实例上下线实时感知

4，可视化的服务治理与运维
## 依赖关系
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/b9310dbecd77810acdc2f5fa2149afba.png)
- registry：注册中心，生产者在这里注册服务，注册中心也会告诉消费者生产者是否宕机，一般使用 zk 做注册中心
- provider：生产者，也就是处理业务的服务器
- consumer：消费者，调用服务的服务器
- monitor：监控中心

在服务启动的时候，生产者需要将集群、接口、版本等数据都注册进注册中心，消费者启动的时候，也需要去注册中心获取生产者的数据，还会读取配置文件信息，此时还会做额外的服务依赖检查，这可能也是 dubbo 启动较慢的原因
## Dubbo 的版本号
每个接口都应定义版本号，为后续不兼容升级提供可能。当一个接口有不同的实现，项目早期使用的一个实现类， 之后创建接口的新的实现类。特别是项目需要把早期接口的实现全部换位新的实现类，也需要使用 version

可以用版本号从早期的接口实现过渡到新的接口实现，版本号不同的服务相互间不引用

可以按照以下的步骤进行版本迁移：

- 在低压力时间段，先升级一半提供者为新版本
- 再将所有消费者升级为新版本
- 然后将剩下的一半提供者升级为新版本

当接口 API 变动，比如接口里面方法的参数发生变化、接口里面增加新的方法、服务增加新的接口等情况发生时，版本号的存在能让 Dubbo 的调用方替换接口的过程过度的十分平滑

除了接口的版本号之外，我们还需要关注接口的分组、注册中心以及接口的名称、全限定名等属性
## Dubbo 的使用
配置的优先级如下：

- JVM 启动 -D 参数优先，这样可以使用户在部署和启动时进行参数重写，比如在启动时需改变协议的端口
- XML 次之，如果在 XML 中有配置，则 dubbo.properties 中的相应配置项无效
- Properties 最后，相当于缺省值，只有 XML 没有配置时，dubbo.properties 的相应配置项才会生效，通常用于共享公共配置，比如应用名

下面演示一下使用 xml 来配置一个可用的 dubbo，首先我们可能要将接口从服务提供方的项目中暴露出来，可以使用 xxx-api 的项目，服务方提供接口实现，而接收方使用，双方都要引入这个 xxx-api 项目

服务提供方的 xml 配置，作为服务的提供者，比服务使用方更清楚服务性能参数，如调用的超时时间，合理的重试次数。因此推荐推荐在 Provider 上尽量多配置 Consumer 端属性
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- 添加 DUBBO SCHEMA -->
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans.xsd http://code.alibabatech.com/schema/dubbo
        http://code.alibabatech.com/schema/dubbo/dubbo.xsd">

    <!-- 应用名 -->
    <dubbo:application name="dubbodemo-provider"/>
    <!-- 注册中心相关配置，可以设置连接到哪个本地注册中心 -->
    <dubbo:registry id="dubbodemo" address="zookeeper://localhost:2181"/>
    <!-- 用dubbo协议在20880端口暴露服务，协议信息，提供者提供，消费者被动接受 -->
    <dubbo:protocol name="dubbo" port="28080"/>
    <!-- 声明需要暴露的服务接口 -->
    <dubbo:service registry="dubbodemo" timeout="3000" interface="com.chanshuyi.service.IUserService" ref="userService"/>
</beans>
```
消费者的配置
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- 添加 DUBBO SCHEMA -->
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:dubbo="http://code.alibabatech.com/schema/dubbo"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans.xsd http://code.alibabatech.com/schema/dubbo
        http://code.alibabatech.com/schema/dubbo/dubbo.xsd">

    <!-- 应用名 -->
    <dubbo:application name="dubbodemo-consumer"/>
    <!-- 注册中心相关配置 -->
    <dubbo:registry 
    address="zookeeper://localhost:2181"
    group="tap_zk_group"
    timeout="3000"
    check="false"/>
    <!-- 消费方用什么协议获取服务（用dubbo协议在20880端口暴露服务） -->
    <dubbo:protocol name="dubbo" port="28080"/>
    <!-- 使用哪些接口 -->
    <dubbo:reference id="userService" interface="com.chanshuyi.service.IUserService"/>
</beans>
```

也可以通过配置的方式引用 dubbo 服务
```java
@Configuration
public class UcenterDubboReferenceConfiguration {

    @DubboReference(id = "userInfoService", check = false, version = "2.0.0", timeout = 500, registry = "ucenter")
    private UserInfoService userInfoService;

    @Bean(name = "userInfoService")
    public UserInfoService userInfoService() {
        return userInfoService;
    }
}

```

## 高可用配置
我们在服务端和消费者端还有一些高可用配置，比如调用失败后的各种安全机制：故障转移、快速失败、安全失败等等，比如在消费者端和服务端使用 sentinel 实现熔断
```java
// 配置熔断规则
List<DegradeRule> rules = new ArrayList<>();
DegradeRule rule = new DegradeRule("com.xxx.Service:methodName")
    .setGrade(RuleConstant.DEGRADE_GRADE_EXCEPTION_RATIO)
    .setCount(0.7)  // 异常比例阈值70%
    .setTimeWindow(30);  // 熔断30秒
rules.add(rule);
DegradeRuleManager.loadRules(rules);

// 自动生效，当熔断触发时会抛出DegradeException
```
服务端和消费者端限流
```xml
<dubbo:service interface="com.xxx.Service" executes="100" />
```
Dubbo 原生熔断（Failfast Cluster + 扩展）一般不太好用，我们会结合 Hystrix 进行熔断
```java
// 集成Hystrix实现熔断
public class UserServiceHystrixCommand extends HystrixCommand<User> {
    
    private final UserService userService;
    private final Long userId;
    
    public UserServiceHystrixCommand(Long userId) {
        super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("UserService"))
            .andCommandPropertiesDefaults(HystrixCommandProperties.Setter()
                .withCircuitBreakerEnabled(true)
                .withCircuitBreakerRequestVolumeThreshold(20)      // 20个请求
                .withCircuitBreakerErrorThresholdPercentage(50)    // 50%错误率
                .withCircuitBreakerSleepWindowInMilliseconds(5000) // 5秒半开窗口
                .withExecutionTimeoutInMilliseconds(3000)          // 3秒超时
                .withFallbackEnabled(true)));
        this.userId = userId;
        this.userService = ServiceLocator.getUserService();
    }
    
    @Override
    protected User run() throws Exception {
        return userService.getUser(userId);
    }
    
    @Override
    protected User getFallback() {
        // 熔断后的降级逻辑
        return User.builder()
            .id(userId)
            .name("Fallback User")
            .fromCache(true)
            .build();
    }
}
```
熔断器是有状态机的，OPEN 表示打开，HALF_OPEN 只会接受少量请求
```java
    private enum State {
        CLOSED,     // 关闭：正常请求
        OPEN,       // 打开：熔断状态，拒绝请求
        HALF_OPEN   // 半开：尝试恢复
    }
```
还可以配置漏桶、令牌桶等算法进行限流
```xml
<dubbo:reference interface="com.example.Service" >
    <dubbo:parameter key="tps.limit.interval" value="1000" />
    <dubbo:parameter key="tps.limit.rate" value="10" />
    <dubbo:parameter key="tps.limit.strategy" value="leakyBucket" />
</dubbo:reference>
```

消费者端和服务端降级实现（使用 mock 实现）
```xml
<dubbo:reference interface="com.xxx.Service" mock="true" />
<!-- 或指定Mock实现类 -->
<dubbo:reference interface="com.xxx.Service" mock="com.xxx.ServiceMock" />
```
## SPI
你可能在上面的解释中多次看见了可扩展接口这个词，SPI 的概念类似与 API，只要实现该接口就可以对框架进行扩展

Dubbo 的扩展点加载从 JDK 标准的 SPI (Service Provider Interface) 扩展点发现机制加强而来

Dubbo 采用微内核（Microkernel） + 插件（Plugin） 模式，简单来说就是微内核架构。微内核只负责组装插件，核心系统提供系统所需核心能力，插件模块可以扩展系统的功能

SPI（service provider interface）是一种协调服务调用方与实现方的约定，约定的内容是当服务的调用方想要发现实现接口 X 的服务实现类时，总是从 services 目录下去找文件名为 X 的文件，从这个文件中读出实现类实际的类名，从而将其加载进来并调用。像 dubbo 的监控中心、trace ID 机制就是使用 SPI 中的 Filter 实现的

在代码中，我们可以使用 @SPI 注解将一个方法定义为一个切面。同时 dubbo 的 Filter 机制是链式调用的，类似 spring 中的过滤器
## traca ID
traca ID 用于实现链路追踪，当多个 dubbo 互相调用的时候，某个地方出现错误时，排查问题就会变的十分困难。但是如果我们在每次调用的时候都生成一个唯一的 ID，我们就可以通过这个 ID，将多个日志链接起来，方便定位问题

关于 traca ID 的实现如下：

**dubbo 框架提供了插件机制**，其中一种插件是 Filter，利用它我们可以在调用 dubbo 接口之前和之后做一些事情。dubbo 框架还提供了 RpcContext，专门用于在远程调用的双方之间传递上下文.。上下文是静态的

下面说如何传递 trace ID：

- **在调用方通过 filter 在调用 dubbo 接口之前，将 traceId 设置到 RpcContext 中去**
- 在被调用方，通过 filter 在实际执行之前将 traceId 从 RpcContext 中取出来设置到日志框架中的 traceId 记录器中去

# 架构细节
## 架构图
当然上面的只是关于使用的大体结构，根据官方文档 dubbo 的架构长这样
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/7634bfea04d9aa125f5ea8212d3a5a6c.png)
service 服务层：用户自定义接口 API
config 配置层：对外配置接口，用以读取配置信息，以 ServiceConfig, ReferenceConfig 为中心，可以直接初始化配置类，也可以通过 spring 解析配置生成配置类
proxy 服务代理层：服务接口透明代理，简单来说是封装了下层复杂关系的代理类，让调用远程方法像调用本地的方法一样简单
registry 注册中心层：封装服务地址的注册与发现，以服务 URL 为中心，扩展接口为 RegistryFactory, Registry, RegistryService
cluster 路由层：封装多个提供者的路由及负载均衡（负载均衡在消费者端做的），并桥接注册中心，以 Invoker 为中心，扩展接口为 Cluster，Directory，Router，LoadBalance
monitor 监控层：RPC 调用次数和调用时间监控，以 Statistics 为中心，扩展接口为 MonitorFactory, Monitor, MonitorService
protocol 远程调用层：封装 RPC 调用，以 Invocation, Result 为中心，扩展接口为 Protocol, Invoker, Exporter
exchange 信息交换层：封装请求响应模式，同步转异步，以 Request, Response 为中心，扩展接口为 Exchanger, ExchangeChannel, ExchangeClient, ExchangeServer
transport 网络传输层：抽象 mina 和 netty 为统一接口，以 Message 为中心，扩展接口为 Channel, Transporter, Client, Server, Codec
serialize 数据序列化层：可复用的一些工具，扩展接口为 Serialization, ObjectInput, ObjectOutput, ThreadPool
## 机器挂掉之后 dubbo 如何维持高可用
高可用的意思是，提高一个系统中的功能可以对外提供服务的时间，减少系统不能提供服务的时间

dubbo 有自己的一些机制来保证高可用

注册中心挂掉的情况：可以使用集群来配置注册中心，提高高可用；如果所有的注册中心都挂了，消费者还有本地缓存，缓存提供服务的提供者，还可以使用 dubbo 直连的方式连接服务

服务器挂掉的情况：注册中心会发送信息给消费者，让其知道服务不可用；注册中心也可以直接发送代替的 IP 给消费者。同时，消费者的负载均衡机制可以敏锐的观察到服务器挂了

监控中心挂掉的情况：不影响服务

消费者挂掉的情况：挂就挂了
## 协议格式
上面说过 RPC 调用需要重视传输协议的使用，那所谓协议到底是个什么东西

二进制字节流就是一串01数字，协议是为了区分每段消息长度大小以及所包含信息的。在 RPC 中可以使用已经有的协议，比如 http、tcp，如果你喜欢用 udp 也可以，只要能传输数据就可以。dubbo 中用了如下结构处理数据的传输

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/9b415f1f815f0594fa3734db77fd088e.png)
它与 HTTP 协议明显的不同就是它规定了第几个 bit 到第几个 bit 表示什么属性，回顾一下 http 的报文，是不是有 Host：XXX、keepaliveing：XXX 这种形式的信息，在 XXX 前的部分都可以被称为多余的字段，现在只要约定哪个区域有哪些字段就不用将这些信息传输过来了

注意 RPC 不是一种协议类型，只是 dubbo 实现了自己的协议。dubbo 底层也用了 tcp，它为了解决连接建立断开的损耗，默认与每个发现的 provider 一直保持一个长连接，同时底层使用连接池提高连接复用

简单介绍一些协议格式 header body data。协议头是16字节的定长数据，参见上图dubbo,16*8=128,地址范围0~127

- 2字节 magic 字符串 0xdabb，0-7高位，8-15低位。就像 CAFFER_BABY 一样，标识这是个协议头
- 1字节的消息标志位
- 16-20，序列 id
- 23位是请求或响应标识，1字节状态。当消息类型为响应时，设置响应状态
- 24-31位，8字节，消息 ID，long类型
- 请求头中还带有4字节的消息长度

这是一张更全的图
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/5a21f22e3b134c2b8770c27692675078.png)
## 消费者传给注册中心什么内容
服务接口名，消费者引用的 Dubbo 服务接口全限定名，比如 com.example.UserService

消费者应用名，消费者应用的唯一标识（dubbo.application.name），用于确认需要调用哪个集群，比如 user-service-consumer

消费者 IP 和端口，消费者主机的 IP 和可选端口（用于反向调用或调试）	192.168.1.100

协议类型，消费者支持的协议（如 dubbo、http），比如 dubbo

版本号（Version），服务版本号（dubbo:reference 中配置），比如1.0.0

分组（Group），服务分组（dubbo:reference 中配置），比如 production。分组一般使用多环境隔离，比如开发、测试、生产环境共用同一个注册中心时，需隔离环境流量
```xml
<!-- 生产环境提供者 -->
<dubbo:service interface="com.example.UserService" group="prod" />

<!-- 测试环境消费者 -->
<dubbo:reference interface="com.example.UserService" group="test" />
```
时间戳，注册时间戳（用于注册中心清理过期节点）	1620000000000
路由规则标识	关联的路由规则（可选）	tag=gray

Dubbo 在 ZooKeeper 中的目录结构如下
```zk
/dubbo
   /com.example.UserService
      /consumers
         /consumer://192.168.1.100/com.example.UserService?application=user-service-consumer&version=1.0.0&group=production&timestamp=1620000000000
```
## 超时机制
dubbo 中的超时配置可以陪在接口级别和方法级别，同时消费者和生产者都可以配置

消费者中有 DefaultFuture 尝试接收响应结果，如果阻塞达到超时时间响应结果还是为空，那么消费者会抛出超时异常
```java
public class DefaultFuture implements ResponseFuture {
    @Override
    public Object get(int timeout) throws RemotingException {
        if (timeout <= 0) {
            timeout = Constants.DEFAULT_TIMEOUT;
        }
        // 如果response对象为空
        if (!isDone()) {
            long start = System.currentTimeMillis();
            lock.lock();
            try {
                while (!isDone()) {
                    // 放弃锁并使当前线程等待，直到发出信号或中断它，或者达到超时时间
                    done.await(timeout, TimeUnit.MILLISECONDS);
                    if (isDone()) {
                        break;
                    }
                    if(System.currentTimeMillis() - start > timeout) {
                        break;
                    }
                }
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            } finally {
                lock.unlock();
            }
            // 如果response对象仍然为空则抛出超时异常
            if (!isDone()) {
                throw new TimeoutException(sent > 0, channel, getTimeoutMessage(false));
            }
        }
        return returnFromResponse();
    }
 
    @Override
    public boolean isDone() {
        return response != null;
    }
 
    private void doReceived(Response res) {
        lock.lock();
        try {
            // 接收到服务器响应赋值response
            response = res;
            if (done != null) {
                // 唤醒get方法中处于等待的代码块
                done.signal();
            }
        } finally {
            lock.unlock();
        }
        if (callback != null) {
            invokeCallback(callback);
        }
    }
}
```
生产者超时机制体现在 TimeoutFilter 过滤器，需要注意生产者超时了只记录一条日志，不会抛出异常或者中断，如果接收到消费者的中断请求，会通过线程中断（Thread.interrupt()）尝试终止正在执行的业务逻辑
```java
@Activate(group = Constants.PROVIDER)
public class TimeoutFilter implements Filter {
    private static final Logger logger = LoggerFactory.getLogger(TimeoutFilter.class);
 
    @Override
    public Result invoke(Invoker<?> invoker, Invocation invocation) throws RpcException {
        long start = System.currentTimeMillis();
        Result result = invoker.invoke(invocation);
        long elapsed = System.currentTimeMillis() - start;
        // 只读取生产者配置
        int timeout = invoker.getUrl().getMethodParameter(invocation.getMethodName(), "timeout", Integer.MAX_VALUE);
        // 如果超时只记录一条日志流程继续进行
        if (invoker.getUrl() != null && elapsed > timeout ) {
            if (logger.isWarnEnabled()) {
                logger.warn("invoke time out method: " + invocation.getMethodName() + " arguments: " + Arrays.toString(invocation.getArguments()) + " , url is " + invoker.getUrl() + ", invoke elapsed " + elapsed + " ms.");
            }
        }
        return result;
    }
}
```
超时机制可以在多个地方配置，**优先级是方法级配置大于接口级配置大于全局配置，而且消费者配置要大于提供者配置**
## 失败策略
请求超时、熔断、限流都算是失败的一种，失败后做什么，dubbo 也有详细的配置策略，消费者在失败后会有**快速失败（Fail-Fast）与安全失败（Fail-Safe）**等等策略

1，Fail-Fast 机制指的是在系统检测到可能的错误或异常时，尽早失败并立即通知相关方，而不是继续运行可能已损坏的逻辑或数据。它的核心原则是：问题越早被发现，越容易定位和修复。在 dubbo 中的体现是调用失败时（如超时、异常），​​立即抛出异常​​，不进行任何重试或降级

2，Fail-Safe 机制是一种以尽可能保证系统正常运行为目标的设计方式，即使在遇到错误或异常情况下，系统仍能继续工作，避免崩溃或数据损坏。它的核心原则是：宁可以退为进，也要保证系统的健壮性和稳定性，在 dubbo 中是调用失败时（如异常、超时），​​忽略异常并返回空结果​​（或默认值，或者调用降级方法），不中断调用链，属于降级

3，Fail-Over，故障转移机制，主要组件出现异常时，将其功能转移到具有同样功能的备份组件上。要点在于有主有备，且主发生故障时，可将备切换为主。比如 HDFS 的双 NameNode，当 Active NameNode 出现故障时，可以启用 Standby NameNode 来继续提供服务。在 dubbo 中体现是，**一个服务调用失败后，我们自动调用另外一个节点**

4，Fail-Back，就是在故障转移（Fail-Over）之后，发生故障的服务能够自动恢复。在后台记录失败请求，定时重发；又如在多台服务器互联的网络中，如果要维修某台服务器，需要把服务（或网络资源）暂时重定向到备用系统

5，Forking：并行调用多个服务，只要一个成功即返回成功的结果

6、Broadcast：广播调用所有服务，逐个调用，任意一个服务出错，则此次调用失败

## 线程模型
Dubbo 的线程模型基于 Netty 的 Reactor 模式，**采用 IO 线程与业务线程分离 的设计哲学**，这是其高性能的核心。其实无论什么框架，但凡涉及到高性能问题，都会使用 Reactor nio 去处理，比如 kafka、socketIo 等等

组成核心有三个：

- IO 线程（Netty EventLoop Group），负责网络数据的读写，协议的编码解码（Codec）等等，不负责任何业务操作
- Dispatcher（派发器）：这是 Dubbo 线程模型的灵魂组件，决定请求如何从 IO 线程派发到业务线程
- 业务线程池

Dubbo 就算这么设计了，也会连接数过多，这是 Dubbo 生产环境中的典型性能问题，下面详细分析原因和解决方案

为什么会出现连接数过多？服务拓扑问题，假设有5个消费者服务，每个10个实例，每个实例都调用同一个提供者服务，那么一个提供者最多需要链接50个消费者，或者长连接未复用 Dubbo 默认使用 TCP 长连接

连接数过多，会导致 CPU 开销，连接维护（心跳、状态检查）消耗 CPU，同时每个连接占用约30KB内存，1000连接 ≈ 30MB

dubbo 中可以配置使用共享连接（重要优化）
```java
<!-- 消费者端配置，多个接口共享同一个连接 -->
<dubbo:reference id="userService"
                 interface="com.example.UserService"
                 share-connections="true"  <!-- 关键配置 -->
                 />

<dubbo:reference id="orderService"
                 interface="com.example.OrderService"
                 share-connections="true"
                 />
<!-- 这样userService和orderService会复用同一个到提供者的连接 -->
```
此外还可以启用连接复用（连接池），限制每个消费者的连接数等方案

# 设计一个 RPC 框架需要考虑什么
1，动态代理：dubbo 的目的是让访问远程服务像调用本地方法一样简单。因此我们需要用动态代理代理我们的接口，为上层屏蔽底层逻辑
2，序列化协议：RPC 最看重的两个协议之一，我们这块功能需要实现的抽象一些，因为底层可能是 xml、json、加密后的数据，因此我们需要保证各个协议都可以支持，用户还可以切换
3，传输协议：RPC 最看重的两个协议之一，我们应该可以支持 Http、tcp、udp 等等协议传输数据
4，超时设计：在服务端起个轮询，如果接口到时间了没有返回则直接中断
5，熔断限流降级等高可用设计，注册中心等容灾机制。注册中心用 zk 的 zab 保持强一致性，提供者会收集一些数据做对应的处理
6，负载均衡：项目一定是集群部署的，需要考虑可扩展性。dubbo 中负载均衡做在**消费者端**，消费者访问注册中心后，会得到一些 ip 地址，通过机器内部的负载均衡器，选出最后的机器
7，高性能：使用零拷贝、IO 多路复用技术、批量发送、请求压缩等技术构建高性能服务。**dubbo 的高性能是因为默认使用了 netty 做核心架构**，dubbo 和 kafka 类似，都会使用到接受线程和工作线程来处理业务，接受线程用于接受连接，工作线程负责读写操作
