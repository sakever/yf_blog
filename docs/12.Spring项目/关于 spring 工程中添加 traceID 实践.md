---
title: 关于 spring 工程中添加 traceID 实践
date: 2026-04-02
categories:
  - Spring项目
tags:
  - traceID
---

我们在做分布式架构时一定会关心系统的可观测性，可观测性中的追踪的实现，就需要靠跨多个系统的 traceID 实现，那有没有合适的框架可以支持在 spring 或者 springboot 工程中添加 traceID 呢

## 选型
1，现代化标准链路追踪（Micrometer Tracing + Zipkin/Jaeger）

OpenTelemetry 是一个大一统的trace上报标准，而 Micrometer Tracing 是专为 Java/Spring Boot 应用设计的门面工具，且其底层实现依赖 OpenTelemetry

适用场景：Spring Boot 3.x（或 2.x），需要标准的 Trace/Span 语义，需要跨服务调用链可视化、耗时分析

实现原理：基于 W3C traceparent 标准透传上下文，自动拦截 RestTemplate/WebClient/Feign/MQ 等组件，并自动将 TraceID 写入 MDC

2，无侵入式 APM（Apache SkyWalking）

适用场景：中大型企业级微服务架构，不需要改代码（甚至不用加依赖），需要强大的拓扑图、慢 SQL 分析、告警等功能

实现原理：通过 Java Agent 字节码增强技术，在类加载时动态植入追踪逻辑

本文会重点介绍 Micrometer Tracing + Zipkin/Jaeger 的落地实践，如果后续有时间，会将 SkyWalking 补上

## 落地

Micrometer Tracing 一般的标准选用 w3c，除此之外还有 B3 等等协议

W3C 协议文档：https://www.w3.org/TR/trace-context/#traceparent-header

接下来我们一步步接入
### 基础
1，引入依赖
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>

<!-- Micrometer Tracing (链路追踪核心) -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-brave</artifactId>
</dependency>
<!-- 将链路数据上报给 Zipkin -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-reporter-zipkin</artifactId>
</dependency>
```
2，配置 application.yml
```yml
management:
  tracing:
    sampling:
      probability: 1.0 # 采样率，生产环境建议 0.1 (10%)
    propagation:
      type: w3c # 使用 W3C 标准透传 Header (traceparent)
  zipkin:
    tracing:
    -- 查看腾讯云文档和阿里云文档获取
      endpoint: http://your-zipkin-server:9411/api/v2/spans
```
3，修改 log4j.xml
```xml
<PatternLayout charset="UTF-8" pattern="%d{yyyy-MM-dd HH:mm:ss,SSS} [%t] %-5level (%F\:%L) - [traceId:%X{traceId}] %msg%n"/>
```
### 异步链路追踪
关于异步流程，自定义线程池时，主线程的 MDC（log4j 框架存放线程数据的地方）和上下文状态是无法传递给子线程的（因为底层依赖 ThreadLocal）。解决方式：
```java
    /**
     * 外部业务线程调用此方法提交任务
     */
    public void submitTask(Runnable task) {
        // 【关键1】：在当前业务线程中，捕获当前的 TraceID/MDC 上下文
        ContextSnapshot snapshot = ContextSnapshotFactory.builder().build().captureAll();
        
        // 【关键2】：将原始 task 和 snapshot 绑定在一起，丢进队列
        taskQueue.offer(() -> {
            // 这里什么都不做，只是一个包装壳
        });
        
        // 更优雅的做法是定义一个 TaskWrapper
        taskQueue.offer(new TaskWrapper(task, snapshot));
    }
    
    // 简单的内部类，用于携带上下文
    private static class TaskWrapper implements Runnable {
        private final Runnable delegate;
        private final ContextSnapshot snapshot;

        public TaskWrapper(Runnable delegate, ContextSnapshot snapshot) {
            this.delegate = delegate;
            this.snapshot = snapshot;
        }

        @Override
        public void run() {
            // 省略业务逻辑.....
        }
    }
```
在 ExecutorThread 执行时恢复上下文，修改 ExecutorThread 内部逻辑。当它从队列里拿出任务准备执行时，用 Micrometer 把上下文穿上：
```java
public class ExecutorThread implements Runnable {
    @Override
    public void run() {
        try {
                // 【关键】：在 ExecutorThread (子线程) 中，使用 snapshot.wrap 恢复上下文并执行
                // 这一步会自动把打包进来的 TraceID 设置到当前子线程的 ThreadLocal(MDC) 里
                snapshot.wrap(taskWrapper).run();
                
                /*
                 * 注意：不需要手动 MDC.put()！
                 * snapshot.wrap() 内部在执行前会自动设置 MDC，执行后会自动清理 MDC。
                 */
            }
        } catch (Exception e) {
            // 异常处理
        }
    }
}
```

如果是线程池，需要使用封装器，将调用线程的上下文传入
```java
    private static final ExecutorService RAW_HTTP_CLIENT_EXECUTOR  =
            ContextExecutorService.wrap(原本的线程池, ContextSnapshotFactory.builder().build()::captureAll);
```
如果是虚拟线程，micrometer-tracing 也为其做了很完善的封装
```java
Thread.startVirtualThread(ContextSnapshotFactory.builder().build().captureAll().wrap(virtualThread));
```
这里额外提一嘴虚拟线程的底层运作机制：载体线程的窃取与共享

在传统线程里，主线程创建子线程，会自动复制一份 ThreadLocal 过去。但在虚拟线程里，虚拟线程是极度轻量级的，它可能在虚拟线程 A（载体）上跑了一半，遇到 I/O 阻塞，被卸载。等 I/O 结束，它可能被装载到虚拟线程 B（载体）上继续跑

虚拟线程没有固定的父线程，所以 InheritableThreadLocal 在虚拟线程里完全是个摆设，你无法靠它传递上下文。同时也会造成载体线程上下文污染问题

JDK 官方也意识到了 ThreadLocal 在虚拟线程时代的毒点，所以推出了 ScopedValue（作用域值）。它绑定在虚拟线程的生命周期上，挂起时自动释放，不占用载体线程资源。在官方的 wrap 源码里，有一个至关重要的 finally 代码块。当 ioVirtualThread 执行完毕（或者抛出异常），那个 finally 会百分之百把当前载体线程上的 ThreadLocal 清理干净。这就保证了虚拟线程无论怎么在载体线程之间蹦跶，都不会留下垃圾

我们建议将这些线程池封装到 common 包中，为业务侧屏蔽这些逻辑
### 跨服务链路追踪
使用 new HttpPost(url)、new CloseableHttpClient() 发请求，Spring 和 Micrometer 无感知，它没有任何机会去加 Header。因此需要使用 RestTemplate 发送 http 请求，此时框架会自动完成 TraceID 的生成、透传
```java
@Bean
public RestTemplate aiInterfaceRestTemplate(RestTemplateBuilder restTemplateBuilder) {
    HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
    // 建立连接超时
    factory.setConnectTimeout(CONNECT_TIMEOUT);
    // 等待响应超时
    factory.setReadTimeout(SOCKET_TIMEOUT);
    factory.setConnectionRequestTimeout(CONNECTION_REQUEST_TIMEOUT);

    return restTemplateBuilder
            .requestFactory(() -> factory)
            .build();
}
```