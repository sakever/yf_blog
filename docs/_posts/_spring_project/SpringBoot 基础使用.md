--- 
title: SpringBoot 基础使用
date: 2021-12-03
categories:
  - Spring 项目
tags:
  - SpringBoot
--- 
# 常用注解
@SpringBootApplication：该注解标注一个 springboot 应用。以下的 exclude 就是排除了默认的数据源，使用自定义的数据源
```java
package demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * 1.创建HelloWorldMainApplication类,并声明这是一个主程序类也是个SpringBoot应用
 */
@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class HelloWorldMainApplication {
    /**
     * 2.编写main方法
     */
    public static void main(String[] args) {
        //3.开始启动主程序类
        SpringApplication.run(HelloWorldMainApplication.class,args);
    }
}
```

DataSourceAutoConfiguration 功能概况
- 初始化 DataSourceProperties 配置文件
- 初始化数据源
- 执行 sql 文件
- 为数据源注册一个 DataSourcePoolMetadataProvider 实例

@ComponentScan 主要就是定义扫描的路径从中找出标识了需要装配的类自动装配到 spring 的 bean 容器中

@ImportResource 注解用于导入 Spring 的配置文件，让配置文件里面的内容生效。这个注解是放在主入口函数的类上，而不是测试类上。不使用 
@ImportResource 注解，程序根本不能对我们 spring 的配置文件进行加载

@EnableDubbo，该注解并不是 springboot 提供的注解，而是 dubbo 提供的，@EnableDubbo整合了三个注解 @EnableDubboConfig、@DubboComponentScan、@EnableDubboLifecycle。@EnableDubbo 的功能都是由这三个注解完成的

- @EnableDubboConfig 引入类 DubboConfigConfigurationRegistrar，将用于解析配置相关的类注册到 spring 容器；
- @DubboComponentScan 引入类 DubboComponentScanRegistrar，用于指定 @Service 扫描路径；
- @EnableDubboLifecycle 引入类 DubboLifecycleComponentRegistrar，注册了两个监听器到 spring 容器

说人话就是扫描 scanBasePackages 下所有的 dubbo 配置
```java
@EnableDubbo(scanBasePackages = "com.aaa.yfx.a")
```
@WebFilter，该注解不是加在 Application 上的，Filter 也称之为过滤器，它是 Servlet 技术中最实用的技术，WEB开发人员通过Filter技术，对 web 服务器管理的所有 web 资源：例如 JSP，Servlet，静态图片文件或静态 HTML 文件进行拦截，从而实现一些特殊功能。例如实现 URL 级别的权限控制、过滤敏感词汇、压缩响应信息等一些高级功能
```java
@Slf4j
@WebFilter(urlPatterns = "/admin/*")
public class AdminFilter implements Filter {...}
```

# Web开发
## 静态资源
静态资源就是浏览器能够直接打开的，比如 html 文件、css 文件、js 文件、jpg 文件等；动态资源就是需要走控制器的资源，Spring 默认先寻找动态资源，再寻找静态资源

静态资源放在 recources 文件下的 static、public 等包下，它们的优先级依次降低，因为自动配置类中是这么配置的

在文件中配置新属性来修改默认配置，这些已经在 WebMvcProperties 中定义
```yaml
spring:
#访问时加个前缀
  mvc:
    static-path-pattern:
#改变寻找路径
  resources:
    static-locations:
```

recourses 包下的 templates 包为动态资源，在包下写 error 包，404等网站会自动显示在这里，并且直接访问里面的资源是访问不到的


# 接管 MVC 配置
使用继承方式来扩张 MVC 的功能
```java
@Configuration
public class MyMvcConfig implements WebMvcConfigurer {}
```
如果想要全面接管自动配置，使用 EnableMVC 注解
```java
@EnableWebMvc
```
这个注解引入了 DelegatingWebMvcConfiguration，将其注册为一个 bean，自动装配只有在没有这个bean时才生效，这个类可以做一些配置，继承它来重写配置规则

SpringBoot 的配置规则如下：引入启动器 -》 启动器中有对应的自动配置类 -》 实体配置类可使用配置文件配置

如果想要修改默认情况，像 MVC 一样接管它就行了，这是 SpringBoot 的使用方法以及精髓
