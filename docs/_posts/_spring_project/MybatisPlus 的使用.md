---
title: MybatisPlus 的使用
date: 2022-02-03

sidebar: ture
categories:
  - Spring 项目
tags:
  - MybatisPlus
---

MP 是非常优秀的持久层辅助框架，如果说 Mybatis 是处理数据在应用与数据库之间转换的各种情况，MP 就是对 Mybatis 的各种常用功能做进一步封装，让我们更加注重业务逻辑

在 SpringBoot 中的使用步骤相当简单，首先引入相关依赖
```xml
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-boot-starter</artifactId>
        </dependency>
```
在 easyCode 中可以使用 mybatis-plus 一键生成，如果使用默认生成策略注意主键要加 @TableId，Dao 层接口加 @Mapper 或者 @Repository

此时可以使用 MP 的基础功能，使用其他功能配置其他东西即可

具体方法的使用移步官方文档：https://www.mybatis-plus.com/
## 实体类
MP **它的底层原理大致为根据 PO 实体类尝试反向生成表结构，并且根据这些信息生成 SQL 语句**，因此实体类相当重要

我们经常遇到实体类与表名或者属性不一致的问题，导致 MP 使用错误
### 别名处理、主键自增 @TableId
由于MP默认通过ID查询，但是很多时候数据库和POJO都不会把主键命名为id，使用 **@TableId** 这个注解可以让这个问题解决

这个注解有两个属性，value 是数据库主键名（默认的主键叫 id，如果数据库中的主键不叫 id 需要使用 value 显示映射），type 是指定主键自增策略
```java
public @interface TableId {
    String value() default "";

    IdType type() default IdType.NONE;
}
```
在 POJO 的属性上使用这个注解
```java
    @TableId(value = "no", type = IdType.AUTO)
    private String no;
```
主键推荐使用 Integer，在数据库中推荐使用 int 类后加长度，因为这样才可以使用自动主键策略

使用MP时，不用写主键，会自动给用户生成ID值，也可以在TableId注解中配置主键生成策略

在 IdType 类中定义了这些策略，Depercated 代表已被弃用
```java
	//自动增长，主键是数字类型才可用，每次成长1
    AUTO(0),
    //无策略，需要用户手动输入
    NONE(1),
    //需要用户手动输入
    INPUT(2),
    //生成19位数字，字符串和数字型都可以使用
    ASSIGN_ID(3),
    //根据一定算法生成随机唯一ID
    ASSIGN_UUID(4),
    //之前MP默认生成算法，使用雪花算法，主键是数字类时使用
    @Deprecated
    ID_WORKER(3),
    //之前MP默认生成算法，使用雪花算法，主键是字符串时使用
    @Deprecated
    ID_WORKER_STR(3),
```


### 表名处理 @TableName
如果表名和 POJO 名不一样会出现错误，不过使用 TableName 注解就可以解决，可以在实体类上加 **@TableName** 来显示指定需要映射到什么表上，这种情况发生在实体类与数据库表名不一样的时候
```java
public @interface TableName {
    String value() default "";

    String resultMap() default "";
}
```
这里有一个深坑，就是 mp 的类型转换器和 autoResultMap 之间需要保存一致，具体问题如下：

使用以下写法，类型转换器才会生效，如果没有指定 autoResultMap，则该字段默认为 false，不会生成带有转换器的 resultMap，但是在数据存入数据库的时候，类型转换器还是会生效。这个是在开发过程中踩过坑的
```java
@TableName(value = "config_entity", autoResultMap = true)
public class ConfigEntity {
    @TableField(typeHandler = JsonArrayStringTypeHandler.class)
    private List<String> testConfig;
}
```
该注解对应了 XML 中写法为
```xml
<result column="test_config" jdbcType="VARCHAR" property="testConfig" typeHandler="JsonArrayStringTypeHandler" />
```
### 自动填充、别名处理、类型转换 @TableField
如果属性与不一致也会出现问题，在实体类的属性名上使用 **@TableFiled** 处理不一致问题

通过 MP 自动填充功能，在未设定属性时根据自定义策略自动填充属性并记录到数据库，以下是一个自动填充更新和创建时间的例子

在 POJO 中属性上加入注解 TableField
```java
	//增加时填充
    @TableField(fill = FieldFill.INSERT)
    //修改时填充
    @TableField(fill = FieldFill.UPDATE)
```

创建实现类自定义策略，createTime、updateTime 是指 POJO 中的属性
```java
@Component
class MyHandler implements MetaObjectHandler {
    @Override
    public void insertFill(MetaObject metaObject) {
        this.setFieldValByName("createTime", new Date(), metaObject);
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        this.setFieldValByName("updateTime", new Date(), metaObject);
    }
}
```
### 逻辑删除 @TableLogic
同时，还有一个非常重要的业务功能——**逻辑删除**，在被其他业务重度依赖的情况下删除某个数据是非常危险的，需要级联删除其他大量的数据，因此一般使用逻辑删除。该功能使用 **@TableLogic** 实现，在某个属性实现该注解后，所有的删除功能都会被封装为修改功能，所有的查询功能会自动加入是否被逻辑删除的校验
```java
    @TableLogic(value = "status", delval = "1")
    private Integer status;
```
删除时直接调用 mybatis-plus 的删除方法即可
## 通用枚举 @EnumValue
在枚举中添加注解 @EnumValue，使用 MP 进行数据库输入输出时会自动将枚举转换为被标记的值，以及自动将被标记的值转换为枚举
```java
public enum GradeEnum {
	//
    PRIMARY(1, "小学"),  SECONDORY(2, "中学"),  HIGH(3, "高中");

    @EnumValue//标记数据库存的值是code
    private final int code;
    //......
}
```
同时还有防止一些注解失效的情况，如果在 SpringBoot 中使用 MP 会配置默认的路径，但是多少可能出现没有扫描到使得注解失效的情况，因此需要在配置文件中手动配置修改 MybatisPlusAutoConfiguration 中的默认值，虽然从 3.5.2 版本开始无需配置，但是大多还是使用以前版本的
```yml
mybatis-plus:
    typeEnumsPackage: com.baomidou.springboot.entity.enums
```
## 插件
### 分页插件
在配置类中添加分页插件，该插件也比较容易理解。MybatisPlusInterceptor 是 MP 的插件主体，你可以使用 addInnerInterceptor 方法插进去一些功能。而 PaginationInnerInterceptor 就是 MP 已经实现的分页处理，传入的值就是什么数据库。依据传入的值不同，分页的底层实现也不同
```java
@Configuration
public class MyBatisPlusConfig {
    /**  分页插件 */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}
```
不配这个 page 方法用不了（就算使用了，也不会生成 limit 语句），配置了直接使用带有 page 的方法进行查询就可以自动分页，查询的结果会封装到 page 对象中
```java
        Page<Teacher> page = new Page<>(1, 3);
        teacherDao.selectPage(page, null);
        System.out.println(page.getCurrent());//输出当前页
        System.out.println(page.getRecords());//输出查询数据
        System.out.println(page.getPages());//输出总页数
```
关于 page 对象，current 就是当前页面数，size 就是每一页多少数据，里面还有个 list 集合 records，里面存放了所有的查询出来的数据

MP 底层使用 limit，并且 page 的设置条件不同与 limit

page 的第一个参数传入需要查询的页数，第二个参数传入查询数量。而 limit 的第一个参数表示从这个数字开始（起始是0），第二个参数传入查询数量
### 乐观锁（Version）
在配置类中增加插件
```java
    /**  乐观锁插件  */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
        return interceptor;
    }
```

POJO 中的属性添加 Version 注解，这个属性和数据库中对应的字段会成为乐观锁的版本标准。每次进行更新操作，会将该字段加一。大部分使用到这个的场景都可以用分布式锁解决
```java
@Version
private Integer version;
```
## 条件构造器
MP 的扩展与插件实现了 mybatis 的拦截器与插件功能，而条件构造器配合提供的各种方法可以实现动态 sql 功能，使用 wrapper 以实现复杂查询
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/ba99a54316ac72c944edff83a60edf49.png)
首先，QueryWrapper 构造了查询条件，里面的方法包含了几乎所有的 sql 语句，比如 eq、le 等，非常好理解，注意传入条件之前一定要把实体类传进去
```java
        new QueryWrapper<User>().eq("user_id", 1);
```
多个条件默认用 and 连接，显示使用 or 方法可以用 or 连接

有些方法可以使用 lambda 表达式构造条件，这些在 lambda 里的条件会**优先**构造
```java
        new QueryWrapper<User>().eq("user_id", 1).and(i -> i.like("sex", 1));
```
**if 标签**：有些方法只有在条件满足的时候才会传入条件进去，类似动态sql 的 if 标签
```java
        new QueryWrapper<User>().eq(user.getId() != null, "user_id", 1);
```
**查询一个参数**：默认会查询所有的数据，可以使用 select 方法指定要查询什么列
```java
        new QueryWrapper<User>().select("name", "id");
```
**updateWrapper 的 set 方法**：使用 set 方法，在代码中就不用生成实体类了
```java
        wrapper.set("user_id", 4).eq("user_id", 3);
        userDao.update(null, wrapper);
```
**lambda 化的条件构造器**：将传入的参数变成了 lambda，进一步简化了代码
```java
        new LambdaQueryWrapper<User>().eq(User::getUserId, "id");
```
MP 本身是不支持多表联查的，一般项目中也不要使用多表联查，根据经验来说，多表联查的性能远低于查单表
## 代码生成器
这个是最不实用的一个功能也是最难用的一个功能，完全可以使用 EasyCode 代替，使用代码生成器首先需要导入 maven 依赖
```xml
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-generator</artifactId>
            <version>3.4.1</version>
        </dependency>
        <dependency>
            <groupId>org.apache.velocity</groupId>
            <artifactId>velocity-engine-core</artifactId>
            <version>2.3</version>
        </dependency>
```

然后在 test 中写生成器代码
```java
    @Test
    void contextLoads() {
        // 1、创建代码生成器
        AutoGenerator mpg = new AutoGenerator();

        // 2、全局配置
        GlobalConfig gc = new GlobalConfig();
        String projectPath = System.getProperty("user.dir");//目录名字
        gc.setOutputDir("D:\\IDEAworkspace\\course_work" + "/src/main/java");
        gc.setAuthor("xie13");
        gc.setOpen(false); //生成后是否打开资源管理器
        gc.setFileOverride(false); //重新生成时文件是否覆盖
        gc.setServiceName("%sService"); //去掉Service接口的首字母I
        gc.setIdType(IdType.ASSIGN_ID); //主键策略
        gc.setDateType(DateType.ONLY_DATE);//定义生成的实体类中日期类型
        gc.setSwagger2(true);//开启Swagger2模式
        mpg.setGlobalConfig(gc);

        // 3、数据源配置
        DataSourceConfig dsc = new DataSourceConfig();
        dsc.setUrl("jdbc:mysql://localhost:3306/student");
        dsc.setDriverName("com.mysql.cj.jdbc.Driver");
        dsc.setUsername("root");
        dsc.setPassword("123456");
        dsc.setDbType(DbType.MYSQL);
        mpg.setDataSource(dsc);

        // 4、包配置
        PackageConfig pc = new PackageConfig();
        pc.setModuleName("teacherService");//模块名
        pc.setParent("com.myself.course_work");//包名
        pc.setController("controller");
        pc.setEntity("pojo");
        pc.setService("service");
        pc.setMapper("mapper");
        mpg.setPackageInfo(pc);

        // 5、策略配置
        StrategyConfig strategy = new StrategyConfig();
        strategy.setInclude("teacher", "sc", "student", "course");//数据库中的表
        strategy.setNaming(NamingStrategy.underline_to_camel);//数据库表映射到实体的命名策略
        strategy.setTablePrefix(pc.getModuleName() + "_"); //生成实体时去掉表前缀
        strategy.setColumnNaming(NamingStrategy.underline_to_camel);//数据库表字段映射到实体的命名策略
        strategy.setEntityLombokModel(true); // lombok 模型 @Accessors(chain = true)setter链式操作
        strategy.setRestControllerStyle(true); //restful api风格控制器
        strategy.setControllerMappingHyphenStyle(true); //url中驼峰转连字符
        mpg.setStrategy(strategy);

        // 6、执行
        mpg.execute();
    }
```