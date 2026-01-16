---
title: DDD 架构学习笔记
date: 2023-06-27
categories:
  - 架构设计
tags:
  - DDD
---
因为公司的包结构参考借鉴了 DDD 的思想，被迫无奈学习了一下 DDD 相关知识

每一种架构都是为了解决实际工程中的问题，就像设计模式看起来什么用都没有，但是其实是解决了现实工程中遇到的各种问题，主要是为了降低代码的维护与修改的代价

但是 DDD 有些时候确实不好用，它只是一种代码编程思想，一种高内聚低耦合的可行解法，在一些场景中其指导思想往往会将简单的问题复杂化，需要酌情考虑
## Domain Primitive
### 定义
DP 可以将**实体类的属性进行显示化**，我们一般对有限制的数据类型以及复杂的数据类型使用 DP，但是使用 DP 会增加代码膨胀，除去 PO、DTO 转化为 BO 的成本，在使用到属性的时候还需要进行转换

DP 是一个在特定领域里，拥有精准定义的、可自我验证的、拥有行为的 **Value Object**

那什么是 Value Object 呢？这里贴一些 DDD 的基础的前置性内容：

- 实体（Entity）：表示业务中的核心对象，具有唯一标识符（主键 ID）。映射一个 po，如订单（Order）、用户（User）等
- 值对象（Value Object）：不可变的对象，用于表示业务中的概念。值对象是没有唯一标识符的对象，OrderQuery、OrderCommend 或者 OrderMoney 可以被视为一个值对象，因为它表示一个查询条件、保存请求、订单内的值，而不是一个具体的实体
- 聚合（Aggregate）：**聚合是一组相关对象的集合，这些对象作为一个整体被对待。聚合的主要目的是确保业务规则的一致性和完整性**
- 聚合根（Aggregate Root）：聚合通过聚合根来管理这些对象的生命周期，聚合根是聚合的主体
- DP（领域原语）：对领域中的基础值对象的封装，代表了领域中不可再分的基本概念。领域原语通常用于替换基本类型（如String、Integer），以便在类型层面表达业务约束。可以是金额（Money）、地址（Address）等
### 为什么会出现 DP
以下列举的四个原因，是大家在 MVC 架构中检查出现的几种问题（严格来说不算是问题，虽然写不好容易埋雷，但是这就是 service 层需要干的事）

**数据验证和错误处理**：每个入参都需要方法校验，就算前端已经校验过了，后端为了程序健壮性以及规范，还是要校验一次。虽然现在可以用注解来简化校验过程，但是还有一些需要业务校验的情况在代码中经常出现，在每个方法里这段校验逻辑还是会被重复

在需要新增校验规则与维护原来的校验规则时，会比较麻烦，有没有一种方法，能够一劳永逸的解决所有校验的问题以及降低后续的维护成本和异常处理成本呢？（**推荐 javax.validation**）

**大量的工具类**：问题时从一些入参里抽取一部分数据，然后调用一个外部依赖获取更多的数据，然后通常从新的数据中再抽取部分数据用作其他的作用。这种代码通常被称作“胶水代码”，其本质是由于外部依赖的服务的入参并不符合我们原始的入参导致的。为了解决这个问题，一个常见的办法是将这段代码抽离出来，变成独立的一个或多个方法

**可测试性**：假如一个方法有 N 个参数，每个参数有 M 个校验逻辑，至少要有 N * M 个 TC，要如何降低测试成本呢？

**接口的清晰度**：在Java代码中，对于一个方法来说所有的参数名在编译时丢失，留下的仅仅是一个参数类型的列表，那么入参为三个 str 的函数就会变成这样
```java
service.register("殷浩", "浙江省杭州市余杭区文三西路969号", "0571-12345678");
```
第三个参数需要传入电话，如果格式不对或者传入了姓名什么的，在真实代码中运行时会报错，但这种 bug 是在运行时被发现的，而不是在编译时

普通的 Code Review 也很难发现这种问题，很有可能是代码上线后才会被暴露出来。这里的思考是，有没有办法在编码时就避免这种可能会出现的问题
### DP 的使用
DP 最重要的使用，是**将隐性的概念显性化**

原来 username 仅仅是 TestEntityPo 的一个参数，属于隐形概念，如果此时 username 参与了真正的业务逻辑，为了减少维护成本我们需要将 username 的概念显性化
```java
@Data
public class UserName {
	String name;
	public String getName() {
        return name;
    }
    public UserName (String name) {
        if (name == null) {
            throw new ValidationException("number不能为空");
        }
        this.name = name;
    }
	public isEnglish() {
		// 业务校验逻辑
		...
	}
	public isUser() {
		// 业务校验逻辑
		...
	}
}
```
我们将之前的 username 写成一个类，此时：

- 校验逻辑都放在了 UserName 里面，确保只要该类被创建出来后，一定是校验通过的，数据验证和错误处理都在类中处理
- 只对该属性操作的方法变成了 UserName 类里的方法
- 刨除了数据验证代码、胶水代码，在业务层剩下的都是核心业务逻辑
- 对 entity 中会封装多对象行为

这样做完之后，其实是生成了一个 Type（数据类型）和一个 Class（类）：

- Type 指我们在今后的代码里可以通过 username 去显性的标识电话号这个概念
- Class 指我们可以把所有跟电话号相关的逻辑完整的收集到一个文件里

这两个概念加起来，构造成了 Domain Primitive（DP）

DP 同样可以封装多对象行为，但是需要封装的属性有足够的关联性，附上一个 DP 与 DTO 比较的图
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/5cd5fd8b7b90e526eb605aec67b960f4.png)
### 优雅的使用 Domain Primitive
常见的 DP 的使用场景包括：

- 有业务限制的 String 或者 Integer：比如 Name，PhoneNumber，OrderNumber，ZipCode，Address 等。一般来说，在从 DTO 转成 VO 时，在 DP 的构造方法里做校验实现这些限制即可
- 枚举以及可枚举的属性：比如 Status
- Double 或 BigDecimal：一般用到的 Double 或 BigDecimal 都是有业务含义的，比如 Temperature、Money、Amount、ExchangeRate、Rating 等
- 复杂的数据结构：比如 Map，尽量能把 Map 的所有操作包装掉，仅暴露必要行为

注意不要这么写：

- 不要把 DP 的方法写到 DTO 或者 POJO 里。你见过 5000 行的 Order 类吗，我见过。把 DP 当成一个内部类写到 POJO 里我都能接受
## 应用架构
### 贫血模型和充血模型
贫血模型是指领域对象里只有 get 和 set 方法（POJO），所有的业务逻辑都不包含在内而是放在 Service 层，**实体缺乏行为和业务逻辑**。在这种模型中，实体更像是数据载体，而不包含任何业务规则或复杂逻辑。这通常会**导致服务层变得庞大和复杂**，难以维护。比如传统的 MVC 架构就是贫血模型

充血模型是指数据和对应的业务逻辑被封装到同一个类中。因此，这种充血模型满足面向对象的封装特性，是典型的面向对象编程风格。在充血模型中，实体不仅持有数据，还持有对数据进行操作的方法，包括验证、计算和其他业务相关的行为。这种方式可以减少服务层的复杂度，提高代码的可读性和可维护性，因为它遵循了**高内聚，低耦合**（业务逻辑与业务实体强绑定，业务逻辑不与其他逻辑接触）的原则。使用了 DP、聚合就是充血模型了

选择贫血模型还是充血模型，取决于项目的需求、团队的偏好和系统的复杂度。在一些场景下，如简单的 CRUD 操作，贫血模型可能是足够且合适的；而在复杂的业务场景中，采用充血模型，将业务逻辑封装在实体中，往往能更好地反映业务领域，提高代码质量和可维护性
### 为什么要六边形架构
如果忽略应用内部的架构设计，很容易导致代码逻辑混乱，很难维护，容易产生 bug 而且很难发现

**一个应用最大的成本一般都不是来自于开发阶段，而是应用整个生命周期的总维护成本**，所以代码的可维护性代表了最终成本，强依赖其他三方组件与基层数据库的脚本式代码通常可维护性能差，它可能出现以下几个问题

- 数据结构的不稳定性：数据库的表结构和设计是应用的外部依赖，都有可能会改变，如果改了 POJO 要改流程也要改
- 第三方服务依赖的不确定性：第三方服务，比如 Yahoo 的汇率服务未来很有可能会有变化：轻则 API 签名变化，重则服务不可用需要寻找其他可替代的服务。在这些情况下改造和迁移成本都是巨大的。同时，外部依赖的兜底、限流、熔断等方案都需要随之改变
- 中间件或者数据库更换：今天我们用 Kafka 发消息，明天如果要上阿里云用 RocketMQ 该怎么办？后天如果消息的序列化方式从 String 改为 Binary 该怎么办？

事务脚本式代码的第二大缺陷是：虽然写单个用例的代码非常高效简单，但是当用例多起来时，其扩展性会变得越来越差。可扩展性减少做新需求或改逻辑时，需要新增/修改多少代码

- 数据来源被固定、数据格式不兼容：原有的 AccountDO 是从本地获取的，而跨行转账的数据可能需要从一个第三方服务获取，而服务之间数据格式不太可能是兼容的，导致从数据校验、数据读写、到异常处理、金额计算等逻辑都要重写
- 业务逻辑无法复用：数据格式不兼容的问题会导致核心业务逻辑无法复用。每个用例都是特殊逻辑的后果是最终会造成大量的 if-else 语句，而这种分支多的逻辑会让分析代码非常困难，容易错过边界情况，造成 bug
- 逻辑和数据存储的相互依赖：当业务逻辑增加变得越来越复杂时，新加入的逻辑很有可能需要对数据库 schema 或消息格式做变更。而变更了数据格式后会导致原有的其他逻辑需要一起跟着动。在最极端的场景下，一个新功能的增加会导致所有原有功能的重构，成本巨大

设计模式六大原则给了我们不错的解决思路，依赖与抽象而不依赖与具体。**调用每一个三方时都使用接口或者加防腐层，调用每一个底层组件时都使用抽象**，同时按逻辑分离代码操作，使代码复用性增加
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/e3cb4caafb994fcc8947ab90a6f34ec8.png)
### 六边形架构与 DDD
六边形架构（Hexagonal Architecture）和**领域驱动设计**（Domain-Driven Design，简称 DDD）虽然都是软件架构和设计模式中的一部分，但它们关注的层面有所不同，并不是完全相同的概念

DDD 是一种**软件开发方法论**，侧重于解决复杂业务领域的软件设计问题。它的核心在于强调提炼出业务概念，并将其转化为软件中的模型，确保软件能够准确地反映现实世界的业务逻辑，而领域模型通常包含实体、值对象、聚合根等概念

六边形架构则是一种**具体的架构模式**，主要关注如何将应用的核心业务逻辑与外部基础设施和框架隔离开来，以便提高代码的可测试性和可移植性。它通过定义输入端口和输出端口，以及相应的适配器，来实现这一目标，他的重点也是这两个，**核心领域**（包含业务逻辑，不依赖于任何外部系统）和**接口以及适配器**（通过端口与外界通信，通过适配器与具体的技术栈或基础设施交互）

虽然六边形架构和 DDD 可以独立存在，但它们也可以很好地结合在一起，就行了说一下他们的好处是什么

原来的 MVC 架构非常容易理解，从 Controller 层接受前端数据，Service 层做处理，而数据层则对应数据库。一般来说 Controller 依赖 Service 层，而 Service 层依赖的东西过多，有可能是第三方组件与接口，比如消息队列、Dubbo 调用等；又有可能是数据层的东西，我们的惯性思维就是在 Service 层从数据库中取出数据的，此时数据库可能是 MySQL、PG、redis 等等

无论如何，这些三方与数据库都是有可能变动的，其他公司的烂代码可能会腐蚀我们自己写的代码，而数据库的表也可能会增减字段，此时牵一发而动全身。说了这么多，DDD 和六边形架构到底是如何解决这些问题的呢？
### 领域事件
在 DDD 中，领域事件的发布流程通常是这样的：

1. 外部动作触发 ：应用服务层接收到外部请求（如 API 调用、UI 操作）
2. 调用领域方法 ：应用服务调用领域模型中的方法
3. 修改聚合状态 ：领域方法修改聚合根的状态
4. 持久化变更 ：将修改后的聚合根保存到数据库
5. 发布领域事件 ：在事务完成后发布领域事件

领域事件的目的主要是为了跨上下文通信 ，通知其他限界上下文发生了某些业务事件。但是也可以做事件溯源 ，记录所有状态变更的历史，提供业务操作的完整记录，也就是说，领域事件是可以持久化的

```java
@Transactional
public void assignLeadToSales(LeadId leadId, SalesRepId salesRepId) {
    // 1. 获取聚合根
    Lead lead = repository.findById(leadId);
    
    // 2. 调用领域方法
    lead.assignToSales(salesRepId);
    
    // 3. 保存聚合根
    repository.save(lead);
    
    // 4. 在同一事务内发布事件
    eventPublisher.publish(new LeadAssignedEvent(leadId, salesRepId));
}
```
### 领域
领域指某一专业或事物方面范围的涵盖，领域是有范围的，我们能够根据领域范围的不同来定义界限，定义边界

在研究和解决具体业务问题时，DDD 会按照⼀定的规则将业务领域进行细分，当领域细分到⼀定的程度后，DDD 会将问题范围限定在特定的边界内，在这个边界内建⽴领域模型，进而用代码实现该领域模型，解决相应的
业务问题。简言之，DDD 的领域就是这个边界内要解决的业务问题域

既然领域是用来限定业务边界和范围的，那么就会有大小之分，领域越大，业务范围就越大，反之则相反。一个领域可能有多个子域，子域就是领域拆开后的域，一般一个子域对应一个界限上下文

有以下概念：

1，核心域，指的是这个业务的核心功能，核心模块。比如，轿车主打的是动力充沛的话，那么发动机一定是核心域，比如说主打的是操控的话，那么变速箱、离合器一定是核心域

所以同一产品，在不同的商业角度中，核心重点，核心玩法是不一样的，比如对于电商来说，阿里和京东都是头部企业，那么阿里主要做的是联营模式，这种场景下，返利、租户等系统一定是核心，京东做的是自营模式，那么仓储、wms、供应链一定是核心域

2，通用域，对于汽车来说我们可以把内饰理解为通用域，因为比如说坐垫，比如说化妆镜，这些东西不一定是只能给某一辆单独型号的车来使用的，所以具有一些通用的属性。没有太多客制化的开发工作

对于系统来说的话，通用域则是你需要用到的通用系统，比如认证、权限等等，这类应用很容易买到，没有企业特点限制，不需要做太多的定制化。

3，支撑域，以汽车为例，我们可以把车轮和气囊作为支撑域来看待，因为对于车轮和气囊来说，它们的大小尺寸是严格和车辆保持一致的，也就是说不具备通用性，是极具有车厂风采的个性化产品

对于DDD来说，支撑域则具有企业特性，但不具有通用性，例如数据代码类的数据字典等系统
## DDD 模块设计
DDD 最直观的体现就是模块名跟 MVC 不一样，领域驱动设计的四层结构为：

- 表现层（Presentation）
- 应用层（Application）
- 领域层（Domain）
- 基础设施层（Infrastructure）

设计人员可以根据实际问题填充不同的模块到这四层中，填充的原则如下：
### Presentation（Web、Interfaces）模块
Web 模块包含 Controller 等相关代码，同时在该模块中可以为其他的项目提供统一的出入口，比如提供给外部的 dubbo、http、rpc、mq 的 api，就在这一层

我们单独会抽取出来 Interface 接口层，作为**所有对外的门户**，将网络协议和业务逻辑解耦，该层可以做以下这些事情：

- 网络协议的转化：通常这个已经由各种框架给封装掉了，我们需要构建的类要么是被注解的 bean，要么是继承了某个接口的 bean
- 统一鉴权：比如在一些需要 AppKey+Secret 的场景，需要针对某个租户做鉴权的，包括一些加密串的校验
- 限流配置：对接口做限流避免大流量打到下游服务
- 异常处理：通常在接口层要避免将异常直接暴露给调用端，所以需要在接口层做统一的异常捕获，转化为调用端可以理解的数据格式
### Application 模块
主要包含 Application Service，该模块依赖 Domain 模块与基础设施层。Application 层主要职责为组装 domain 层各个组件，完成具体的业务服务。Application 层可以理解为粘合各个组件的胶水，使得零散的组件组合在一起提供完整的业务服务

**Application Service 是业务流程的封装，不处理业务逻辑**。并且，**ApplicationService 应该永远返回 DTO 而不是 Entity**。该层的出参应该是标准的 DTO，并且不应该做任何逻辑处理，而入参则是 CQE 对象，一般入参的校验应该在这一层，这样就保证了非业务代码不会混杂在业务代码之间

注意此处的校验与上层 web 层的校验不一样，web 层主要用来校验不需要访问 dao 层即可校验的数据，比如权限，入参是否为 null 等，而 app 层的校验则是需要访问数据库来获取数据的情况。但是还有一个问题，就是在 app 层校验时，校验结果如何返回给用户，此处推荐增加一个 OperateResult 来返回操作结果，举个例子：

OperateResult：
```java
/**
 * description 操作结果，主要用于单纯操作，记录操作日志
 */
@Data
public class OperateResult implements Serializable {

    private boolean ret;

    private String msg;

    public static OperateResult success() {
        OperateResult operateResult = new OperateResult();
        operateResult.setRet(true);
        return operateResult;
    }

    public static OperateResult error(String msg) {
        OperateResult operateResult = new OperateResult();
        operateResult.setRet(false);
        operateResult.setMsg(msg);
        return operateResult;
    }
}
```

web 层代码：
```java
    @PostMapping("/transfer.json")
    public JsonResult<String> transfer(String clueId) {
        OperateResult opt = salesClueService.transfer(clueId);
        if (opt.isRet()) {
            return JsonResult.success("成功");
        }

        return JsonResult.error(opt.getMsg());
    }
```
app 层/service 层：
```java
    @Override
    public OperateResult transfer(String clueId) {
        SalesClue salesClue = salesClueRouteService.selectById(clueId);
        if (salesClue == null) {
            return OperateResult.error("未查询到线索");
        }
        return OperateResult.success();
    }
```

#### Application 层的几个核心类
- ApplicationService 应用服务：最核心的类，负责业务流程的编排，但本身不负责任何业务逻辑
- DTO Assembler：负责将内部领域模型转化为可对外的 DTO
- Command、Query、Event 对象：作为 ApplicationService 的入参
- 返回的 DTO：作为 ApplicationService 的出参

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/bb9d9960c2709696c95d937841e8d475.png)
判断是否业务流程的几个点：

- 不要有任何计算，基于对象的计算逻辑应该封装到实体里
- for 循环一般为业务判断
- 允许有 if 判断中断条件，一般如果条件不满足抛异常或者返回

以下是一些例子：

- Command（命令）：前端发送了一个创建用户的命令，后端将根据这些数据创建一个新的用户记录
- Query（查询）：前端发送了一个获取用户信息的查询，后端将根据用户ID返回相应的用户数据
- Event（事件）：后端在创建用户后生成了一个用户创建的事件，该事件可以被其他系统或组件订阅和处理。类似 mq 的 message

Application 层处理业务流程但是不处理业务逻辑，业务逻辑被封装在 domain 层，也就是我们系统最核心的模块，领域。Application 层的职责就是将各个领域拼接在一起实现业务功能
### Domain 模块
业务核心模块，包含有状态的 Entity、领域服务 Domain Service、Types、以及各种外部依赖的接口类，注意，只是接口类

有状态的 Entity 指对应原来 MVC 中的 DO，只不过加入了对 DO 中属性的一些操作（行为方法），被称为聚合根，里面封装了多个  PO 中的属性，里面的属性被称为 Object Value；Types 包的作用就是前文说的作用；Domain Service 则是核心的复合操作。以下是一个分组聚合根例子：

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Group extends AggregateRoot {
    private String name;//名称
    private String appId;//所在的app
    private List<String> managers;//管理员
    private List<String> members;//普通成员
    private boolean archived;//是否归档
    private String customId;//自定义编号
    private boolean active;//是否启用
    private String departmentId;//由哪个部门同步而来
    
     /**
     * Group的行为方法:开除一个员工
     */
    public void dismiss(String memberName) {
        // 去判断这个group是否已启用
        if (!active) {
            throw new GroupException("未启用");
        }
        if (Strings.isNull(memberName)) {
            throw new GroupException("输入有误");
        }
        members.remove(memberName);
        managers.remove(memberName);
    }
}
```
外部依赖的接口类可以是查询接口，你可以在 domain 层中定义查询接口，在基础架构层实现

注意聚合内部的逻辑一定只涉及这个聚合，DDD 通过这种方式实现了高内聚

项目中有可能有多个聚合，聚合之间的相互交互就比较重要了。有些情况下，两个聚合的交互没有形成一个业务流程，但是在项目中又特别重要，这些逻辑我们可以放在 Domain Service 中

领域服务除去基础架构层的接口不依赖任何其他功能

额外提一点：在我见过的一些代码里，接口的返回值比较多样化，有些直接返回 DTO 甚至 DO，另一些返回 Result。接口层的核心价值是对外，所以如果只是返回 DTO 或 DO 会不可避免的面临异常和错误栈泄漏到使用方的情况，包括错误栈被序列化反序列化的消耗。所以，这里提出一个规范：

**规范1：Interface 层的 HTTP 和 RPC 接口，返回值为 Result，捕捉所有异常
规范2：Application 层的所有接口返回值为 DTO，不负责处理异常**

这两者都是最佳实践
### Infrastructure 模块
基础设施层，该层主要为 Domain 提供数据，包含数据库 DAO 的实现，包含外部依赖的接口类包括 Http 调用、dubbo 调用、中间件 redis、mq 等，我们把这些打包成**防腐接口**（一定要防腐接口），提供给 domain 层的业务使用。此外基础的配置，也需要放在这里

对于三方或者数据库的具体实现可以使用转换器模式。这里的 Repository 并非数据访问层，而是封装了数据访问层的仓储层，仓储处于数据访问层和业务逻辑层之间，你可以使用仓储层构建一些聚合或者实现保存聚合的方法
```java
// 代码在Infrastructure层
@Repository // Spring的注解
public class OrderRepositoryImpl implements OrderRepository {
    private final OrderDAO dao; // 具体的DAO接口
    private final OrderDataConverter converter; // 转化器

    public OrderRepositoryImpl(OrderDAO dao) {
        this.dao = dao;
        this.converter = OrderDataConverter.INSTANCE;
    }
}
```
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/1d31c9772e8e55cd6dd4536bf0f53d05.png)
可以看到，该模块主要负责提供数据的来源以及储存数据，但是一些配置信息也需要放在这里

综上所述，考虑到最终的依赖关系，我们在写代码的时候可能先写 Domain 层的业务逻辑，然后再写 Application 层的组件编排，最后才写每个外部依赖的具体实现。这种架构思路和代码组织结构就叫做 Domain-Driven Design（**领域驱动设计**，或 DDD）
### 架构示例
综上，DDD 的包架构应该是下面这样
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/075771684dc42f6de4588ac04d69de49.png)
但是在 DDD 开发的过程中会有很多障碍，比如 mybtais 几乎不能满足 DDD 架构的需求，如果强制在 domain 层定义接口，代码会变的十分臃肿。同时市面上大多数 ORM 框架也有这个缺点

其次，type 的想法虽好，但是就算有了 mapper 的帮助也无法很好的转换代码，过程往往变的更加复杂

但是其思想是值得我们借鉴学习的，领域驱动设计的理论甚至可以用在非模块开发上
## 模型以及模型之间的转换
这里额外强调一下，对于一些简单的业务，使用 DDD 反而不好，因为内部又大量的数据转化逻辑，但是简单业务中，实体往往不需要怎么转化，有可能从 PO 到 VO 都是使用一模一样的字段的，使用 DDD 反而不好了。比如有一个特别简单的业务，他基本上未来十年内，使用的 DB 都是 PG，此时 DDD 在基础架构层提供的 CRUD 防腐接口转换就没有意义了，如果是之前 MVC 架构，写个 mapper 只需要：

- CrudMapper

而使用了 DDD，在基础架构层的 mapper 则是：

- CrudRouteService
- CrudRouteServiceImpl
- CrudMapper

此时多出来的两层就完全没有必要了
### VO、DTO、BO、PO
模型对象代码规范其实只有3种模型，Entity、Data Object (DO) 和 Data Transfer Object (DTO)，不过思路都是类似的，先来看看包括了大众理解的模型
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/8ac46e468f7c1e1a5397e751df521aa8.png)

- VO（View Object）：视图对象，用于展示层，只要是这个东西是让人看到的就叫VO
- DTO（Data Transfer Object）：数据传输对象，泛指用于展示层与服务层之间的数据传输对象，即**前后端之间的传输对象**；在微服务盛行的现在，服务和服务之间调用的传输对象也可以叫 DTO
- BO（Business Object）：业务对象，就是从现实世界中抽象出来的有形或无形的业务实体。BO 就是 PO 的组合，比如 PO1 是交易记录，PO2 是登录记录，PO3 是商品浏览记录，PO4 是添加购物车记录，PO5 是搜索记录，BO 是个人网站行为对象。BO 是一个业务对象，一类业务就会对应一个 BO，数量上没有限制，而且 BO 会有很多业务操作，也就是说除了 get，set 方法以外，BO 会有很多针对自身数据进行计算的方法
- PO（Persistent Object）：持久化对象，它跟持久层（通常是关系型数据库）的数据结构形成一一对应的映射关系，如果持久层是关系型数据库，那么，数据表中的每个字段（或若干个）就对应 PO 的一个（或若干个）属性
### DDD 中的3种模型
- Data Object （DO、数据对象）：在DDD的规范里，DO 应该仅仅作为数据库物理表格的映射，不能参与到业务逻辑中。DO 的生命周期应该被限制在基础组件层，不能向 domain 层暴露
- Entity（实体对象）：实体对象是我们正常业务应该用的业务模型，它的字段和方法应该和业务语言保持一致，和持久化方式无关。也就是说，Entity 和 DO 很可能有着完全不一样的字段命名和字段类型，甚至嵌套关系。Entity 的生命周期应该仅存在于内存中，不需要可序列化和可持久化。等同于上图中的 BO
- DTO（传输对象）：主要作为 Application 层的入参和出参，在表现层，可以被看做 param 入参以及 VO 出参，应该避免让业务对象变成一个万能大对象

在实际开发中 DO、Entity 和 DTO 不一定是1:1:1的关系，一个 Entity 应该可以对应多个 DO，应该 DTO 又可以对应多个 Entity 
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/cc4f0e0b68d525c5df3fe0522a80a9e6.png)
## 参考
[阿里技术专家详解DDD系列 第一讲- Domain Primitive](https://juejin.cn/post/6844904177207001101)
[阿里技术专家详解DDD系列 第二讲 - 应用架构](https://juejin.cn/post/6844904201575743495)
[阿里技术专家详解DDD系列 第三讲 - Repository模式](https://juejin.cn/post/6845166890554228744)
[阿里技术专家详解DDD系列 第四讲：领域层设计规范](https://juejin.cn/post/6912228908075057166)
[阿里技术专家详解DDD系列 第五讲:聊聊如何避免写流水账代码](https://juejin.cn/post/6953141151931039758)
