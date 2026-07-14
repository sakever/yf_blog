---
title: SpringBoot 请求调用时关于高可用机制选型和落地
date: 2026-04-22
categories:
  - 分布式
tags:
  - 分布式
  - SpringBoot
--- 
# 背景
在一般的系统架构中，系统通过 HTTP、RPC 方式调用下游模型服务。随着业务量增长，我们可能需要处理以下场景：

1. 级联雪崩：下游模型服务出现慢请求或宕机时，当前系统的线程池/连接池被迅速耗尽，导致整个服务不可用。
2. 精细化控制：增加按接口、按租户的限流能力，在高峰期保全核心链路。
3. 黑盒化运维：RPC/HTTP 调用量级、成功率、耗时分布缺乏直观的可视化面板。

本方案旨在基于 Spring Boot 架构，以极低的改造成本，引入一套具备熔断、降级、超时、限流能力，且支持动态开关和可视化监控的高可用防护体系，并为未来向其他 RPC 比如 dubbo 演进、后续新接口接入、大量流式传输或者长连接场景预留扩展性
# 方案选型
## 调用客户端选型
方案	|优点	|缺点
-|-|-
OpenFeign（springcloud那套）|	声明式，对老项目友好|	基于阻塞Servlet模型，对 SSE 流式支持极差；Spring Cloud 2022后已宣布进入维护模式；Java 21兼容性需额外适配。	
Dubbo (HTTP协议)	|扩展性强，未来转 RPC 平滑|	如果之前是 http 形式访问下游，全量修改会比较负责，并且需要下游配合
Spring HTTP Interface |	Spring 6原生支持，极简注解，底层可切换为WebClient（响应式），完美契合流式SSE|	需要代码修改

一些额外说明：

1，Spring HTTP Interface 是采用 HttpServiceProxyFactory 构建的 HTTP Interface 客户端，未来若需切其他 RPC 框架或者 http 客户端，只需替换底层 Factory 实现，上层业务代码零改动。扩展性较好

2，HTTP 客户端自己负责对请求超时的控制，由底层 HttpClient（Netty/OkHttp/RestTemplate等）负责连接超时、读超时

## 高可用组件选型

推荐选用 Alibaba Sentinel。它在低成本接入、动态开关上做到了开箱即用

Sentinel 负责限流（QPS / 并发线程数） + 熔断（慢调用比例、异常比例、异常数等策略） + 降级（fallback，Sentinel 本身关注触发，意味着这里的降级指的是更加通用的失败策略） + 系统保护

关于熔断降级功能，之前学 cloud 的时候一般的选型时 Hystrix，但是它已进入维护模式，官方也不再推荐，而 Sentinel 的熔断降级能力是它的核心能力之一

Sentinel 中所有失败策略规则都可以通过 DataSource 动态更新，支持多种数据源

- 流控规则：FlowRuleManager
- 降级规则（包括异常比例、异常数、慢调用比例）：DegradeRuleManager
支持的动态数据源包括：
- 推模式（实时性更好）：Nacos、Apollo、ZooKeeper、Redis、etcd、OpenSergo 等；
- 拉模式：文件、数据库、Eureka 等。sentinelguard.io

典型做法是把规则 JSON 放到 Nacos/Apollo，应用监听配置变更，Sentinel 内部规则立刻更新（无需重启）

Sentinel 的底层逻辑是围绕资源运作的，其生效范围取决于你在代码中哪里打上了这个标记
## 监控度量选型
额外增加面板 Prometheus + Grafana

虽然 Sentinel 有自带面板，但仅用于实时规则配置和秒级监控。对于历史调用量级分析、P99耗时分布，行业标准依然是 Micrometer + Prometheus + Grafana。Spring Boot 3 默认集成 Micrometer，接入成本几乎为零

也就是说我们有两个面板去查看请求的情况：

1，实时管控面板：Sentinel Dashboard，用于研发实时干预。可以查看实时的 QPS、拒绝数、熔断状态。可以直接在界面上点击“熔断”或“降级”按钮，原理是动态修改规则并推送到 Nacos

2，量级与趋势面板：Prometheus + Grafana，用于技术大盘、日报/周报统计、P99延迟分析。数据流向是 Spring Boot (Micrometer) -> 暴露 /actuator/prometheus -> Prometheus 抓取 -> Grafana 展示
# 特殊情况考量

## 流式传输的熔断特殊设计
痛点：模型流式输出可能持续 30 秒，如果用传统“超时3秒熔断”，会误杀正常请求

关于 SSE、WebSocket、Socket.IO 设计，Sentinel 本身并不提供专门的 WebSocket/Socket.IO adapter；需要在连接阶段、生命周期、异常类型上做适配

1. 连接阶段熔断：如果建立连接或拿到第一个 chunk 超过 connectTimeout（如 5秒），直接触发熔断
2. 传输阶段容错：连接建立后，采用 onErrorResume 捕获底层 IO 异常，计入 Sentinel 异常统计，但不主动切断正常流
3. 慢调用比例熔断：设置一个最大允许流式时长（如 60秒），超过此时长的请求记为慢调用，当慢调用比例超过阈值时，触发熔断（拒绝新的连接请求）
## 对外接口高可用方案
一般使用网关机制，提供服务端负载均衡和高可用机制，在网关层做统一拦截，可以做接口级 QPS/并发限流或者单 IP 并发连接限制

# 代码落地
## Maven 依赖
```xml
<properties>
    <java.version>21</java.version>
    <spring-boot.version>3.2.4</spring-boot.version>
    <sentinel.version>1.8.7</sentinel.version>
</properties>

<dependencies>
    <!-- WebFlux (支持流式SSE) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
    </dependency>
    
    <!-- Micrometer 监控埋点 -->
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-registry-prometheus</artifactId>
    </dependency>

    <!-- Sentinel 核心与 Reactor 适配 -->
    <dependency>
        <groupId>com.alibaba.csp</groupId>
        <artifactId>sentinel-core</artifactId>
        <version>${sentinel.version}</version>
    </dependency>
    <dependency>
        <groupId>com.alibaba.csp</groupId>
        <artifactId>sentinel-reactor-adapter</artifactId>
        <version>${sentinel.version}</version>
    </dependency>
    
    <!-- Sentinel 动态数据源 (Nacos) -->
    <dependency>
        <groupId>com.alibaba.csp</groupId>
        <artifactId>sentinel-datasource-nacos</artifactId>
        <version>${sentinel.version}</version>
    </dependency>
</dependencies>
```
## 声明式 HTTP 客户端接口
```java

/**
 * 定义下游模型 HTTP 接口
 */
@HttpExchange("/api/v1/model")
public interface LlmModelClient {

    /**
     * 流式调用接口
     */
    @GetMapping("/stream")
    Flux<String> streamChat(@RequestParam("prompt") String prompt);
}
```
## 客户端配置与 WebClient 注入
```java
@Configuration
public class HttpClientConfig {

    // 客户端配置
    @Bean
    public TestClient testClient() {
        RestClient restClient = RestClient.builder()
                .baseUrl(testUrl)
                // 设置超时时间、连接超时等参数，不是本文的重点
                .requestFactory(createRequestFactory(5, 3))
                // 重点，sentinel 拦截器
                .requestInterceptor(new AvailabilityRestClientInterceptor())
                .build();
        RestClientAdapter adapter = RestClientAdapter.create(restClient);
        HttpServiceProxyFactory factory = HttpServiceProxyFactory.builderFor(adapter).build();
        return factory.createClient(TestClient.class);
    }
}
```
定义一个 client 接口，像 feign 一样的就行，注意这里的注解是有区别的，如果使用 RestClient 做客户端需要使用 @HttpExchange，如果使用 RestTemplate 需要使用 @HttpMapping

```java
@HttpExchange
public interface TestClient {

    @PostExchange("/test")
    TestResponse getToken(@RequestBody Test body);
}
```

## Sentinel 流式熔断与降级处理
```java
public class AvailabilityRestClientInterceptor implements ClientHttpRequestInterceptor {
    private static final String RESOURCE_PREFIX = "sync_client:";
    private static final String METRIC_PREFIX = "http.client.requests";

	// 一些普罗米修斯打点器
    private static final Counter totalRequests = Metrics.counter(METRIC_PREFIX + ".total");
    private static final Counter failedRequests = Metrics.counter(METRIC_PREFIX + ".failed");
    private static final Counter blockedRequests = Metrics.counter(METRIC_PREFIX + ".blocked");
    private static final Counter degradedRequests = Metrics.counter(METRIC_PREFIX + ".degraded");
    private static final Timer requestTimer = Metrics.timer(METRIC_PREFIX + ".duration");

    @NotNull
    @Override
    public ClientHttpResponse intercept(HttpRequest request, @NotNull byte[] body, ClientHttpRequestExecution execution) throws IOException {
        totalRequests.increment();
        long startTime = System.currentTimeMillis();

        URI uri = request.getURI();
        String resourceName = RESOURCE_PREFIX + uri.getPath();

        Entry entry = null;
        try {
        	// Sentinel 限流和熔断
            entry = SphU.entry(resourceName);
            ClientHttpResponse response = execution.execute(request, body);
            requestTimer.record(System.currentTimeMillis() - startTime, TimeUnit.MILLISECONDS);
            return response;
        } catch (BlockException e) {
            if (e instanceof FlowException) {
                blockedRequests.increment();
            } else if (e instanceof DegradeException) {
                degradedRequests.increment();
            } else {
                blockedRequests.increment();
            }
            PlatformLog.LOG.warn("资源 {} 被限流或熔断, 类型: {}, URI: {}", resourceName, e.getClass().getSimpleName(), uri);
            // 降级：被限流或熔断了不抛异常，而是直接构造一个假的 HTTP 响应返回给上层
            return handleBlockResponse(resourceName, e);
        } catch (Exception e) {
            failedRequests.increment();
            if (entry != null) {
                Tracer.traceEntry(e, entry);
            }
            throw e;
        } finally {
            if (entry != null) {
                entry.exit();
            }
        }
    }
}
```
注意，内存泄漏的重灾区就是 exit() 没有被执行。如果 SphU.entry() 成功了，代表拿到了一个通行证，必须在 finally 块或 afterCompletion 里调用 exit() 归还通行证
## 动态开关实现（基于 Nacos 配置）
在 application.yml 中配置 Nacos 数据源，实现不重启服务动态修改限流阈值或直接关闭限流（阈值设为极大值即为关闭）：
```yml
sentinel:
  datasource:
    flow:
      nacos:
        server-addr: ${spring.cloud.nacos.config.server-addr}
        namespace: dev
        group-id: SENTINEL_GROUP
        data-id: ${spring.application.name}-flow-rules.json
        rule-type: flow
    degrade:
      nacos:
        server-addr: ${spring.cloud.nacos.config.server-addr}
        namespace: dev
        group-id: SENTINEL_GROUP
        data-id: ${spring.application.name}-degrade-rules.json
        rule-type: degrade

# 暴露 Prometheus 监控端点
management:
  endpoints:
    web:
      exposure:
        include: health, info, prometheus
  metrics:
    tags:
      application: ${spring.application.name}
```



## 配置规则
 Nacos 里的限流规则（JSON）按动态资源名来配
 ```json
[
  {
    "resource": "mvc:dispatch:chat_model_a",
    "grade": 1,
    "count": 50,
    "limitApp": "default"
  },
    {
      "resource": "mvc:dispatch:chat_model_a", // 1. 资源名（核心！）
      "grade": 1,                              // 2. 阈值类型，0：代表线程数（并发线程数达到阈值时限流，一般用于耗资源的任务）。1：代表 QPS（每秒请求数，最常用的限流手段）
      "count": 50,                             // 3. 阈值，该接口每秒最多只允许通过 50 个请求
      "limitApp": "default"                    // 4. 流控来源，不区分调用来源。如果写成具体的微服务名（比如 order-service），就表示仅限制这个服务
    }
]
```
熔断规则：
 ```json
[
  {
    "resource": "sync_client:/rag_interfaces/insert/online_dialog",
    "grade": 0,                 // 0 代表 慢调用比例
    "count": 2000,              // 慢调用标准：超过 2000 毫秒就算慢调用
    "slowRatioThreshold": 0.5,  // 慢调用比例阈值：50%
    "minRequestAmount": 5,      // 最小请求数：必须要凑够 5 个请求才开始算比例，防止刚启动就熔断
    "statIntervalMs": 10000,    // 统计时间窗口：10000 毫秒（10秒）
    "timeWindow": 10            // 熔断时长：一旦触发熔断，10 秒内不再发起真实请求（直接走降级逻辑）
  },
// 当单位时间内，抛出异常的请求比例超过阈值，触发熔断
  {
    "resource": "sync_client:/rag_interfaces/insert/online_dialog",
    "grade": 1,                 // 1 代表 异常比例
    "count": 0.5,               // 异常比例阈值：50%
    "minRequestAmount": 5,      // 最小请求数
    "statIntervalMs": 10000,    // 统计时间窗口：10秒
    "timeWindow": 15            // 熔断时长：触发后 15 秒内拒绝请求
  },
// 当单位时间内，异常的具体数量超过阈值，直接熔断（不看比例，看绝对数量）。
  {
    "resource": "sync_client:/rag_interfaces/insert/online_dialog",
    "grade": 2,                 // 2 代表 异常数
    "count": 10,                // 异常数阈值：10 次
    "minRequestAmount": 5,      // 最小请求数
    "statIntervalMs": 10000,    // 统计时间窗口：10秒
    "timeWindow": 10            // 熔断时长：10 秒
  }
]
```
Sentinel 的限流精度是秒级，它底层的滑动窗口统计最小粒度是 500ms，聚合出来的是 QPS（每秒查询率），限流算法可以修改，滑动窗口算法、令牌桶算法和漏桶算法

Sentinel 的熔断有三个状态：关闭 -> 打开 -> 半开，半开状态下 Sentinel 会放行 1 个请求去试探下游服务。只要触发了熔断并且下游服务没有真正恢复，熔断器就会一直被试探失败反复重置

## Grafana 配置
强烈建议在完成以上工作后，Grafana 的配置让 AI 写，直接生成一份 JSON 即可，然后再 Grafana 中一键导入。随后根据 Grafana 中的指标，动态进行熔断、限流等等配置

注意在普罗米修斯中，类似 executor.wait.duration 这种打点名称，会自动转换为下划线形式 executor_wait_duration。同时，关于次数的打点，后面会自动加 total 后缀，比如 rpc_server_failed 会自动转换成 rpc_server_failed_total、关于时间的打点，会自动加 seconds_sum 后缀，比如 rpc_server_duration 会自动转换成 rpc_server_duration_seconds_sum，在配置的时候需要注意

如果不使用三方的 grafana，想自己搭一套，可以参考这篇文章：https://cloud.tencent.com/developer/article/1807679