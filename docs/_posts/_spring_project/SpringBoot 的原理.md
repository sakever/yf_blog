---
title: SpringBoot 的原理
date: 2021-10-05

categories:
  - Spring 项目
tags:
  - SpringBoot
---

SpringBoot 的主要作用有两个：依赖管理和自动配置，需要了解它们的原理和如何修改默认配置
# 依赖管理
依赖存放在父工程中，就是 spring-boot-starter-parent

而其父工程的父工程 spring-boot-dependencies 中保存了所有依赖以及版本号，大大减少了版本问题

如果想要修改依赖的版本，在 pom 文件中 properties 下增加对应依赖版本即可

有了 springboot 的版本仲裁，以后写项目的时候应该将依赖的版本写在父 pom 文件中，子文件只用来导入依赖
# 配置类 @Configuration 与 proxyBeanMethods 
使用 @Configuration 注解来将一个类定义为配置类，它的功能类似与配置文件

该注解的底层长这样
```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component
public @interface Configuration {
    @AliasFor(
        annotation = Component.class
    )
    String value() default "";

    boolean proxyBeanMethods() default true;
}
```
所以配置类也是 spring 的一个组件，在该类的方法上加入 @Bean 注解，还将方法的返回值注册为 bean，这里面有一个比较重要的属性 proxyBeanMethods ，默认为 true ，该属性的意思是表示这个组件是不是代理 bean 的组件，如果是 true 的话，那么这个配置类就会被 CGLIB 代理了，如果是 false 的话，那么就不会被代理

那代理之后的类增加了什么功能呢？当我们使用代理对象的时候，调用它的方法，他会检测容器中是不是有了这样的组件，如果有，则不再新建组件，直接将已经有的组件返回。如果说没有的话，才会新建组件。这样保证了容器中的组件始终就保持单一性。不过这也有一个不好的地方，那就是每次都要检测，会降低速度。当不是代理对象的时候，则不会检测，直接创建新的组件了

因此直观的说，proxyBeanMethods 为 true 时，表示 full （全）模式，保证组件单例；proxyBeanMethods 为 false 时，表示 lite （轻）模式，系统启动快
# 创建时文件以及目录作用
.idea 目录用来存放 idea 配置
.mvn 目录用来存放 maven 配置（可删除，没影响）
.gitignore 用 git 做版本控制时，用这个文件控制哪些文件或文件夹不被提交（不用 git 的话可删除，没影响）
HELP.md md是一种文档格式 这个就是你项目的帮助文档（可删除，没影响）
mvnw linux上处理mevan版本兼容问题的脚本（可删除，没影响）
mvnw.cmd windows 上处理mevan版本兼容问题的脚本（可删除，没影响）
springboot.iml 有的文件每个导入IDEA的项目都会生成一个项目同名的 .iml文件，用于保存你对这个项目的配置（删了程序重新导入后还会生成，但由于配置丢失可能会造成程序异常）
# 自动配置原理
## 主类与 @SpringBootApplication
主类是 SpringBoot 的一部分，删掉的话无法正常执行程序，主类包括 @SpringBootApplication 注解以及 run 方法
```java
SpringApplication.run(HelloworldApplication.class, args)
```
run 方法返回一个 IOC 容器，容器中存放的 bean 其实是组件，即我们在开发过程中需要的类，而且这些组件一般指我们的实体配置类以及基础类

@SpringBootApplication 是程序的一部分，这个注解会自动加在主类上，它是一个联合注解，点入@SpringBootApplication：
```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan(
    excludeFilters = {@Filter(
    type = FilterType.CUSTOM,
    classes = {TypeExcludeFilter.class}
), @Filter(
    type = FilterType.CUSTOM,
    classes = {AutoConfigurationExcludeFilter.class}
)}
)
public @interface SpringBootApplication {...}
```
它主要由三个注解形成：

1，@EnableAutoConfiguration：自动装配（enable：使能够）

2，@ComponentScan(XXX)：扫描主类注解所在的同级目录下的其他包中用户定义的 bean，在里面配置其他的东西可以让其扫描其他包下的注解

3，@SpringBootConfiguration：允许用户定义 bean 或者配置类（这个注解被 @Configuration 注解，指这个类是配置类，而 @Configuration 是一个 Component）
## 自动装配的注解 @EnableConfigurationProperties 与 @ConfigurationProperties
点入 @EnableAutoConfiguration中，发现
```java
//这个自动注册包
@AutoConfigurationPackage
//这个导入配置选择类
@Import({AutoConfigurationImportSelector.class})
```
AutoConfigurationImportSelector 类有多种功能，主要是读取所有注册在 MATE-INF/spring.factories 文件中的全限定名并且读取这些全限定名所代表的文件，比如：
```factories
org.springframework.boot.diagnostics.FailureAnalyzer=\
org.springframework.boot.autoconfigure.data.redis.RedisUrlSyntaxFailureAnalyzer,\
org.springframework.boot.autoconfigure.diagnostics.analyzer.NoSuchBeanDefinitionFailureAnalyzer,\
org.springframework.boot.autoconfigure.flyway.FlywayMigrationScriptMissingFailureAnalyzer,\
org.springframework.boot.autoconfigure.jdbc.DataSourceBeanCreationFailureAnalyzer,\
```
XXXAutoConfiguration一定包含 @Configration 注解，这让它是一个配置类，配置类被 Component 注释，表示它也是一个组件被加载到 IOC 容器中

部分自动配置类可以提供 @EnableConfigurationProperties 注解找到它们配置的配置类，这个注解表示把里面装的类丢到容器中去并且可以在 yaml 文件中配置相应的属性，因为有些三方包不会有 @ConfigurationProperties 注解，这让用户可以使用 yaml 配置文件自定义配置类来覆盖部分的默认配置
```java
//这个注解表示把里面的那个类注册为一个组件
@EnableConfigurationProperties({CacheProperties.class})
```
这个组件上面有 @ConfigurationProperties 注解，这个注解表示把自己丢到容器中去并且可以在 yaml 文件中配置相应的属性，让用户可以自定义配置里面的属性
```java
@ConfigurationProperties(prefix = "spring.cache")
```
在 spring-boot-autoconfigure 的 jar 包下的非 MATE-INF 包中可以找到它们，你可以直接找到它们
## 所有的配置类在启动时都会生效吗 @ConditionalXXX
所有的自动配置类（写在MATE-INF/spring.factories中的类）在SpringBoot启动时都会被遍历到，它们会被扫描并加载

但是它们都会有 @ConditionalOnXXX 条件装配注解，这个注解表示，只有在对应条件满足的时候配置才会生效，比如只有导入对应启动器时才能生效、只有对应实体配置类存在才生效
```java
//这是CacheManager配置类的注解
@ConditionalOnClass({CacheManager.class})
@ConditionalOnBean({CacheAspectSupport.class})
@ConditionalOnMissingBean(
    value = {CacheManager.class},
    name = {"cacheResolver"}
)
```
这么做会避免读取过多的 bean
## 使用配置文件对实体配置类进行配置
所有的配置文件必须叫 application，后缀可变，配置文件可以设置在4个位置

可以使用原来的.properties（财产、所有物）文件进行配置，在对应类的上面使用注解 @PropertySource(value = "文件全限地址")来配置文件

也可以使用 yaml 文件配置，在类上使用 @ConfigurationProperties(prefix = "对象名称")
```yaml
#对象
student:
#  对象属性
  name: xie
  age: 20
#  数组
  book:
    - b1
    - b2
    - b3
```
prefix意思是前缀

你也可以使用 @Value 使用来读取比较简单的配置信息：
```java
@Value("${integerValue}")
Integer integer;
```
对应的配置文件
```yaml
integerValue: 12
```

## starter 原理
starter 可以理解成 pom 配置了一堆 jar 组合的空 maven 项目，用来简化 maven 依赖配置，starter 可以继承也可以依赖于别的 starter。starter 是提供默认的配置

说完了上面的流程，其实我们也说完了 starter 的原理，只不过两者看这个流程的角度是不一样的：

1，**一个 starter 需要有一个 spring.factories，让 starter 包中的 @Configuration 被 spring 容器扫描到**
2，扫描到了后，一个 starter 需要有一个 @Configuration 注解修饰的类，我们以 mybatis-spring-boot-starter 举例。这个类很可能还带有 ConditionOn 注解用于标识载入条件
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/784e569fe6f5418a82a9d4c284cd6627.png)
3，这个类中有很多 bean 注解，配置 starter 相关的业务类
4，这个类有 @EnableConfigurationProperties 注解，将和参数相关的类注册进 bean 容器
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/3935424afd28433d8d79a8a0ff17f363.png)
## 总结
我们遇到的比较重要的注解如下：

- @EnableConfigurationProperties({CacheProperties.class})：将 CacheProperties 注册为 bean，准确的说是使 @ConfigurationProperties 注解标识的类成为一个 bean
- @ConfigurationProperties(prefix = "")：用于将 yaml 等配置文件中的数据塞入 bean 中，被该注解注释的类是一个和参数相关的类
- @ConditionalOnXXX：满足一定条件后，这个类才会被加载
- @Configuration：标识一个配置类
- @Bean：标识一个类
- @Import：扫描其他包中的需要导入的自动配置的组件（META-INF/spring.factories 文件中读取的 bean 的全类名）
# Spring Boot 配置文件加载优先级
总体按照几个原则来：

1，带 -{profile} 后缀的配置文件优先级高于普通配置文件
2，.yml 和 .properties 文件具有相同的优先级。如果相同位置同时存在两种格式，.properties 优先级高于 .yml
3，外部配置 > 内部配置。放在 JAR 文件所在目录或其子目录中优先级大于打包在 JAR 文件内 (resources 目录下)
4，命令行参数最优先

```cmd
java -jar your-app.jar --server.port=8081
```