--- 
title: swagger 的使用
date: 2022-03-03
sidebar: ture
categories:
  - 开发工具
tags:
  - swagger
--- 
## swagger是什么
通过这套规范，只需要按照它的规范去定义接口及接口相关的信息。再通过Swagger衍生出来的一系列项目和工具，就可以做到生成各种格式的接口文档，生成多种语言的客户端和服务端的代码，以及在线接口调试页面等等。这样，如果按照新的开发模式，在开发新版本或者迭代版本的时候，只需要更新Swagger描述文件，就可以自动生成接口文档和客户端服务端代码，做到调用端代码、服务端代码以及接口文档的一致性。
## 基本使用
导入依赖
```xml
        <dependency>
            <groupId>io.springfox</groupId>
            <artifactId>springfox-swagger-ui</artifactId>
            <version>2.9.2</version>
        </dependency>
        <dependency>
            <groupId>io.springfox</groupId>
            <artifactId>springfox-swagger2</artifactId>
            <version>2.9.2</version>
        </dependency>
```

写一个配置类
```java
@Configuration
@EnableSwagger2
public class SwaggerConfig {

    @Bean
    public Docket webApiConfig(){
        return new Docket(DocumentationType.SWAGGER_2)
                .groupName("webApi")
                .apiInfo(webApiInfo())
                .select()
                .paths(Predicates.not(PathSelectors.regex("/admin/.*")))
                .paths(Predicates.not(PathSelectors.regex("/error.*")))
                .build();
    }

    private ApiInfo webApiInfo(){
        return new ApiInfoBuilder()
                .title("课程中心API文档")
                .description("本文档描述了课程中心微服务接口定义")
                .version("1.0")
                .build();
    }
}
```
启动项目然后访问http://localhost:8080/swagger-ui.html即可

可以自由测试后端的接口
## 统一返回结果
前后端分离开发时需要用一个同一的结果集来进行沟通，使用json来封装数据进行返回，但是这还不够，我们需要返回一个特定的类
```java
/**
 * 统一返回结果
 * {
 *  "success": 布尔, //响应是否成功
 *  "code": 数字, //响应码
 *  "message": 字符串, //返回消息
 *  "data": HashMap //返回数据，放在键值对中
 * }
 *
 * 并且满足链式编程
 * @author 31209
 */
@Data
public class R {

    private boolean isItSuccess;

    private Integer statusCode;

    private String message;

    private HashMap<String, Object> data = new HashMap<>();

    private R(){}

    public static R success(){
        R r = new R();
        r.setItSuccess(true);
        r.setStatusCode(StatusCode.SUCCESS);
        r.setMessage("成功");
        return r;
    }

    public static R error(){
        R r = new R();
        r.setItSuccess(false);
        r.setStatusCode(StatusCode.ERROR);
        r.setMessage("失败");
        return r;
    }

    public R setData(String key, Object value){
        this.data.put(key, value);
        return this;
    }
}
```
状态码由于数量固定并且经常改动，一般使用一个接口或者枚举类来表示

```java
public interface StatusCode {

    public static Integer SUCCESS = 200;

    public static Integer ERROR = 400;
}
```
## 带分页的多条件查询
以下是大体思路，具体问题要具体分析
```java
public class TeacherQuery implements Serializable {

    @ApiModelProperty(value = "教师名称,模糊查询")
    public String name;
}
```

```java
	//使用RequestBody接受前端json时，必须使用Post接受，否则可能接收不到
    @PostMapping("/a/{current}/{size}")
    public R aTeacher(@PathVariable("current") int current,
                      @PathVariable("size") int size,
                      @RequestBody TeacherQuery teacherQuery){
        Page<Teacher> page = new Page<>(current, size);
        QueryWrapper queryWrapper = new QueryWrapper();
        if (teacherQuery.name != null) {
            queryWrapper.like("name", teacherQuery.name);
        }//....

        teacherService.page(page, queryWrapper);
        return R.success().setData("page", page);
    }
```