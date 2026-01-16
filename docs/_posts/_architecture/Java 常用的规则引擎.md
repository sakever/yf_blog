---
title: Java 常用的规则引擎
date: 2023-06-05
sidebar: ture
categories:
  - 架构设计
tags:
  - 规则引擎
---
若以传统方式实现各业务流程，则很难避免大量硬编码判断逻辑，导致系统可扩展性差，维护成本高。我们希望可以将一个个业务片段封装成组件，在这些组件基础上为不同流量方的不同流程编排不同的处理逻辑。其实这篇文章主要想推荐一下国产规则引擎框架 LiteFlow（LiteFlow 打钱！）
## 规则引擎分类和选型
规则引擎其实分两种类型：

- 一是注重将一组操作抽出成算子，让其可以动态流程编排的框架，代表为 Drools、LiteFlow 等
- 二是注重动态配置表达式，算子比较简单的框架，他们的特点是做了将动态脚本嵌入 java 的操作，代表为 AviatorScript、Groovy 等

举个例子说明两者的不同，Drools 在处理一些简单的数学计算或表达式评估方面可能不如专门的表达式语言（如 AviatorScript 或 JEXL）那么直接和方便。Drools 更擅长处理复杂的业务规则和决策逻辑，而不是简单的数学计算，适合处理复杂的业务规则和决策逻辑
```drl
package com.example.rules

rule "Discount for VIP customers"
    when
        $customer : Customer( vip == true )
    then
        System.out.println("VIP customer " + $customer.getName() + " gets a 10% discount.");
end

rule "Free shipping for orders over $100"
    when
        $order : Order( total > 100 )
    then
        System.out.println("Order " + $order.getId() + " qualifies for free shipping.");
end
```
关于规则的执行：
```java
import org.kie.api.KieServices;
import org.kie.api.runtime.KieContainer;
import org.kie.api.runtime.KieSession;

public class DroolsExample {
    public static void main(String[] args) {
        KieServices kieServices = KieServices.Factory.get();
        KieContainer kieContainer = kieServices.newKieClasspathContainer();
        KieSession kieSession = kieContainer.newKieSession();

        // 创建业务对象
        Customer customer = new Customer("Alice", true);
        Order order = new Order(1, 150.0);

        // 将业务对象插入规则引擎
        kieSession.insert(customer);
        kieSession.insert(order);

        // 执行规则
        kieSession.fireAllRules();

        // 关闭会话
        kieSession.dispose();
    }
}
```

相比 Drools，AviatorScript 的功能较为有限，不适合处理复杂的业务规则。但是非常适合将一些简单的数学计算从硬编码中抽出来
```java
import com.googlecode.aviator.AviatorEvaluator;
import java.util.HashMap;
import java.util.Map;

public class VariablesAndExpressions {
    public static void main(String[] args) {
        String script = "a + b * 2";
        Map<String, Object> env = new HashMap<>();
        env.put("a", 10);
        env.put("b", 5);
        Object result = AviatorEvaluator.execute(script, env);
        System.out.println("Result: " + result); // 输出: Result: 20
    }
}
```

## 关于 LiteFlow
LiteFlow 是一个非常强大的现代化的规则引擎框架，融合了编排特性和规则引擎的所有特性，他的主要功能是解耦逻辑和编排

利用 LiteFlow，你可以将瀑布流式的代码，转变成以组件为核心概念的代码结构，这种结构的好处是可以任意编排，组件与组件之间是解耦的，组件可以用脚本来定义，组件之间的流转全靠规则来驱动。LiteFlow 拥有开源规则引擎最为简单的 DSL 语法。十分钟就可上手

用官网的介绍，快速上手 LiteFlow
```
https://liteflow.cc/pages/df6982/
```
官网中介绍了多种方式来获取 springboot 中我们配置的编排流程，下面介绍几种，第一种是提供 xml 配置
```yml
liteflow.rule-source=config/flow.el.xml
```
flow.el.xml 文件
```xml
<?xml version="1.0" encoding="UTF-8"?>
<flow>
    <!-- 外层主流程：校验 → 请求 → 处理 -->
    <chain name="mainChain">
        THEN(validationChain, requestChain, processChain);
    </chain>
    
    <!-- 校验子链：根据条件动态组合 -->
    <chain name="validationChain">
        IF(condition1, validationChainA, validationChainB);
    </chain>
</flow>
```
第二种是存放在数据库中，我们只要配置好对应的表名，以及名称、流程等字段就可以获取了
```xml
liteflow:
  rule-source-ext-data-map:
    applicationName: test-service
    #以下是chain表的配置，这个一定得有
    chainTableName: test_config
    chainApplicationNameField: application_name
    chainNameField: chain_name
    elDataField: el_data
    chainEnableField: enable
```
我们注意到这里的配置只是类似 THEN(A, B) 这样的 string，因此数据来源可以为代码、nacos、网络等，都可以

LiteFlow 的组件基类 NodeComponent 有一个方法 public boolean isAccess()，如果返回 false，则跳过该组件。这样我们可以重写组件的 isAccess 方法并将组件的执行状态记录在数据库中，每次执行到该组件的时候，根据状态判断是否需要执行。当然，你还可以重写很多方法，以达到自己的业务要求：
```
isAccess()：表示是否进入该节点，可以用于业务参数的预先判断。
isContinueOnError()：表示出错是否继续往下执行下一个组件，默认为false
isEnd()：是否结束整个流程(不往下继续执行)。
如果返回true，则表示在这个组件执行完之后立马终止整个流程。此时由于是用户主动结束的流程，属于正常结束，所以流程结果中(LiteflowResponse)的isSuccess是true。
beforeProcess()和afterProcess()：流程的前置和后置处理器，其中前置处理器，在isAccess 之后执行。
onSuccess()和onError()：流程的成功失败事件回调
rollback()：流程失败后的回滚方法。
```

在流程执行的过程中可能有很多上下文对象，在不同的流程模块中调用，因此在创建流程的时候，我们可以封装一个 Context 对象，里面可以存放很多的上下文数据。但是如果存放太多无用的数据的话，代码可能难以维护。这个 Context 可以看作一个聚合，聚合相同业务的实体
```java
@LiteflowComponent("a")  
public class AComponent extends NodeComponent {  
  
	@Override  
	public void process() throws Exception {  
		ConditionContext context = this.getContextBean(ConditionContext.class);  
		System.out.println("执行A规则");  
	}  
}

```
同时可以看出，LiteFlow 只是在一定程度上支持动态配置功能，对其功能的修改往往需要修改 db 或者改配置，如果有一些需要让用户自己选择使用什么模块的这一功能，这样做还是不太可行的

对于 ai 工程项目，大概率会引入工作流功能，在调用模型时也会有先访问 rag 等功能，因此 ai 工程大概率会引入个流程编排框架，如果大家在考量 agent 工程的架构选型的话，也许 LiteFlow 是个不错的选择