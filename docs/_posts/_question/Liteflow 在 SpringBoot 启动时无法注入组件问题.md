---
title: Liteflow 在 SpringBoot 启动时无法注入组件问题 couldn‘t find chain with the id[THEN(NodeComponent)]
date: 2025-03-27
sidebar: true
categories:
  - 问题记录
tags:
  - 问题记录
  - Liteflow
  - SpringBoot
---

Liteflow 的配置源读取有很多方式，但是这些方式可能不能满足我们的业务需要
![请添加图片描述](https://i-blog.csdnimg.cn/direct/a341ef180536449e9e3ccb5cbfc2a699.png)
有时候我们会将配置放在公司提供的动态配置中，每次读取配置时，会调用 LiteFlowChainELBuilder 方法动态构建规则，如下：
```java
    public static final Conf<Map<String, Map<Integer, String>>> LITEFLOW_ENGINE_CONFIG =
            Confs.ofMapMap("ad.adIndustryNvwa.liteflowConfig", emptyMap(), String.class, Integer.class, String.class)
                    .change(current -> current.forEach((executionKey, executionMap) -> executionMap.forEach((key, value)
                            -> LiteFlowChainELBuilder.createChain().setChainId(executionKey + key).setEL(value).build())))
                    .build();
```
这么处理可能会有问题，就是用户在第一次调用 execute2Future 时，配置有可能没有加载进来，因此需要在 spring 启动的时候，调用 LiteFlowChainELBuilder 构建一次 Chain

```java
    @PostConstruct
    public void tryInit() {
        LITEFLOW_ENGINE_CONFIG.get().forEach((executionKey, executionMap) -> executionMap.forEach((key, value)
                -> LiteFlowChainELBuilder.createChain().setChainId(executionKey + key).setEL(value).build()));
    }
```
此时可能会出现 couldn't find chain with the id[THEN(NodeComponent)] 问题

问题处理思路：了解到 NodeComponent 已经设置了 LiteflowComponent 注解，可能是初始化代码执行时，NodeComponent 还不在 spring 容器中，考虑采用 Order 的方式进行排序

![请添加图片描述](https://i-blog.csdnimg.cn/direct/874cfa091cfa41719da644c4c404e16e.png)
加上后还是失败了，此时确认 node 已经在 spring 容器中，考虑到在容器中但是不在 Liteflow 的组件中的情况，翻阅文档，发现可以设置启动时不检查规则
![请添加图片描述](https://i-blog.csdnimg.cn/direct/fe2bd3f9c3984a38b0c36b7241613dca.png)

最后修改如下：
```java
    @Resource
    private LiteflowConfig liteflowConfig;

    @PostConstruct
    public void tryInit() {
        liteflowConfig.setParseMode(PARSE_ONE_ON_FIRST_EXEC);
        LITEFLOW_ENGINE_CONFIG.get().forEach((executionKey, executionMap) -> executionMap.forEach((key, value)
                -> LiteFlowChainELBuilder.createChain().setChainId(executionKey + key).setEL(value).build()));
    }
```
