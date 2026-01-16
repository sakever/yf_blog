---
title: MyBatis 框架的使用
date: 2021-08-16
categories:
  - Spring 项目
tags:
  - MyBatis
---
众所周知 mybatisplus 用起来爽的一比，但是在维护一些老项目的时候还是需要知道 mybatis 的使用的，本文浅尝辄止，还有很多 mybatis 的应用没有覆盖到
# 获取工厂
utls：mybatis 官网获取 SqlSession

推荐创建 utls 包，里面放置工厂
```java
@Configuration
public class MybatisConfig {

    @Bean
    public SqlSessionFactory sqlSessionFactory() throws IOException {
        String resource = "./mybatisConfig.xml";
        InputStream inputStream = Resources.getResourceAsStream(resource);
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        return sqlSessionFactory;
    }
}
```
如果使用的是 springboot 的话直接注入 dao 层接口就行了，不用进行 sqlsession 工厂的配置
# 接口对应的 mapper 文件
mybatis 有注解方式的实现

各种注意事项已经在下面用注释解释了，一般该文件放在 resource 包下的 mapper 文件夹中，名字与所对应的接口一致
```xml
<!--这些是固定写法-->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!--所对应的接口-->
<mapper namespace="com.yifanxie.mybtaisTest.dao.UserAddressDao">
	<!--findAll方法，查询时要进行入参绑定parameterType，返回值的转化resultType-->
    <select id="findAll" parameterType="" resultType="com.yifanxie.mybtaisTest.entity.UserAddress">
        <!--如果对象以及数据库中的值一一对应，就不需要使用as或者resultMap进行配置-->
        <!--否则应该让数据库中的列名与对象属性一一对应-->
        SELECT * FROM user_address
    </select>

    <insert id="insert" parameterType="Integer">
        <!--如果有入参使用#加大括号当占位符-->
        insert into user_address set user_id = #{userId}
    </insert>
</mapper>
```
## 入参的几种姿势
**普通的一个类**：注意入参的参数类型需要使用 parameterType 绑定，否则 sql 不会解析成需要的样子
```java
    <select id="selectLeaveHoliday" parameterType="Integer" resultMap="LeaveHolidayI">...
```
**自己定义的类**：如果是自己定义的 entity，使用 parameterType 后 #{} 中加属性名就可以进行正常赋值了
```java
<insert id="addAdmin" parameterType="com.znkj.entity.Admin">
		insert into t_admin (a_acount,a_password,a_power,a_name)
		values(#{a_acount},#{a_password},#{a_power},#{a_name})
    </insert>
```
**@Param**：如果传入了多个参数就不能使用 parameterType 进行参数绑定，此时应该使用 @Param(xx) 注解来标记入参
```java
    public void question4(@Param("id") Integer id, @Param("annual") Integer annualNum);
```
@Param 注解也可以标记自定义的 entity，一举多得，推荐使用该方式做入参处理

**map**：如果传入了非常多的参数，不好用 @Param 一一标记，可以传入一个 map 集合，然后通过 #{} 方式以建的方式访问值即可，注意方法中不需要加 @Param
```java
    public LeaveHoliday selectLeaveHoliday(Map<Integer, Object> map);
```
```xml
    <select id="selectLeaveHoliday" resultMap="LeaveHolidayI">
    	insert into mybatis (name, password) values (#{userName}, #{userPassword})...
```
## 返回值的几种姿势
还有一个需要注意的问题是返回值，返回值的参数也需要使用 **parameterType** 绑定，但是如果entity的属性和数据库中的字段名不一样就需要进行结果映射，上面所说的 **resultMap** 结果集映射这样使用：

id 表示映射名，里面的 id 表示主键，type 表示 pojo 名，column 表示数据库属性，property 表示实体类中属性

增删改查语句中改为 resultMap 就行了，这个 resultMap 就是结果集映射里的 id 名，如果属性名与数据库字段名相同就可以省略
```xml
    <resultMap id="LeaveHolidayI" type="LeaveHoliday">
        <id column="id" property="id"/>
        <result column="staff_id" property="staffId"/>
        <result column="start_date" property="startDate"/>
        <result column="end_date" property="endDate"/>
        <result column="day_num" property="dayNum"/>
    </resultMap>
    
    <select id="selectOne" resultMap="LeaveHolidayI">...
```
如果返回值只有一条，用对象接受就行，但是如果返回值有多条怎么办？此时一定不能用一个 entity 对象接受。应该用**List集合**接受，返回值填 List 中的类名或者对应的 resultMap 就行。并且，返回单一元素的时候也推荐使用集合，因为集合一定还返回，不管返回的是空集合还是装有元素的集合，但是使用 entity 接受的话可能会返回 null，在 server 层可能会出现空指针异常
```xml
    <select id="selectAll" resultMap="LeaveHolidayI">...
```
如果 sql 查询结果没有对应的 entity 与之对应，可以将他们存放在一个**map**中，将 resultType 修改为 map，map 的键就是属性名，值就是结果，这种情况用的比较多。如果查询的是多条数据使用 map 类型的 list 集合接受就行了
```java
    public Map<String, Object> selectOne(Integer id);
```
```xml
    <select id="selectOne" parameterType="Integer" resultType="map">
        select id, staff_id, name, mobile, area, gender, is_valid from employee where id = #{id}
    </select>
```
但是，如果有多条数据，返回一个 list，这种方式很明显使用起来不方便。我们可以在 dao 方法上面添加一个注解 @MapKey

@MapKey 注解用于 mapper.xml 文件中，一般用于查询多条记录中各个字段的结果，存储在 Map 中。Map 结构的示例如下：

Map<Long, Map<String, String>>，范型类型可以修改。Map 的 key 一般存储每条记录的主键，也可以用其他值表示，主要取决于 Dao 层 @MapKey 注解后面的字段（如@MapKey("id")），该字段必须在返回值中有。Map 的 value 也是一个 Map，表示查询出这条记录的每个字段的字段名称和字段值
```java
    @MapKey("id")
    public Map<String, Map<String, String>> selectOne(Integer id);
```
查询出来的数据长这样
```
{1={area=北京, gender=true, staff_id=1, is_valid=true, name=赵四, mobile=13111111111, id=1}}
```
# mybatis 全局配置文件 mybatis-confg
resources里放置mybatisConfig.xml作为全局配置文件，在使用 MP 后就不用写这个了
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <!--关于 mybats 的全局设置，设置不使用缓存，启动懒加载，其他取默认值就行了-->
    <settings>
    <settings>
        <setting name="cacheEnabled" value="false"/>
        <setting name="lazyLoadingEnabled" value="true"/>
        <setting name="aggressiveLazyLoading" value="false"/>
    </settings>
    </settings>
<!--    设置别名-->
    <typeAliases>
<!--        使用package属性后程序会自己去该路径下找东西，因此在mapper.xml中直接写类名就行了-->
<!--        <package name="com.qunar.yifanxie.mybtaisTest.entity"/>-->
<!--        typeAlias直接将全限定名转化为别名，这里也可以直接写包名，mybatis会自己去包下找文件-->
        <typeAlias type="com.yifanxie.mybtaisTest.entity.UserAddress" alias="UserAddress"/>
        <package name="com.yifanxie.mybatisTest.entity"/>
    </typeAliases>
<!--    类型处理器-->
    <typeHandlers></typeHandlers>
    <!--    拦截器-->
    <!--    <plugins></plugins>-->
    <!--数据库链接配置-->
    <environments default="mysql">
        <!--mysql环境-->
        <environment id="mysql">
            <!--JDBC事务-->
            <transactionManager type="JDBC"></transactionManager>
            <!--POOLED连接池-->
            <dataSource type="POOLED">
                <!--四大参数-->
                <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
                <property name="url" value="jdbc:mysql:///数据库名"/>
                <property name="username" value="root"/>
                <property name="password" value="数据库密码"/>
            </dataSource>
        </environment>
    </environments>
<!--    需要关联的sql语句，也可以直接写包名-->
    <mappers>
        <mapper resource="./mapper/userAddressMapper.xml"/>
        <package name="./mapper/"/>
    </mappers>
</configuration>
```
比较重要的标签都已经在上面了，这里重点说一下类型处理器以及拦截器
# 类型处理器
将一些自定义的数据类型转化为数据库中的正常数据类型，以及数据库中的类型转换为 java 中的类型的工具，可以看到处理器就是对底层 jdbc 的操作了
## 例子
以将 java 中枚举类转化为 mysql 中的 tinyint 类为例，先写一个枚举类
```java
public enum SexEnums {
    FAMALE(2,"女"),

    MALE(1,"男"),

    UNKNOWN(0,"用户未透露");

    private Integer number;
    private String desc;

    private SexEnums(Integer number, String desc) {
        this.number = number;
        this.desc = desc;
    }

    public Integer getNumber() {
        return number;
    }

    public static SexEnums value2Object(int value){
        for (SexEnums e : SexEnums.values()) {
            if (e.getNumber() == value){
                return e;
            }
        }
        throw new IllegalArgumentException("Illegal EntityEnum value: " + value + ". ");
    }
}
```
写类型处理器，我比较喜欢继承 BaseTypeHandler 实现，也可以实现 TypeHandler 接口实现。BaseTypeHandler 为我们做了基础的封装，可以避免空指针问题，并且实现起来和 TypeHandler 接口一模一样

在类的上面加上主键 @MappedJdbcTypes 表示数据库中对应的数据类型，而 @MappedTypes 则表示哪些类型可以被拦截
```java
@MappedJdbcTypes(JdbcType.DATE)
@MappedTypes(LocalDate.class)
public class EntityEnumTypeHandler extends BaseTypeHandler<SexEnums> {

    @Override
    public void setNonNullParameter(PreparedStatement preparedStatement, int i, SexEnums sexEnums, JdbcType jdbcType) throws SQLException {
        preparedStatement.setInt(i, sexEnums.getNumber());
    }

    @Override
    public SexEnums getNullableResult(ResultSet resultSet, String s) throws SQLException {
        return SexEnums.value2Object(resultSet.getInt(s));
    }

    @Override
    public SexEnums getNullableResult(ResultSet resultSet, int i) throws SQLException {
        return SexEnums.value2Object(resultSet.getInt(i));
    }

    @Override
    public SexEnums getNullableResult(CallableStatement callableStatement, int i) throws SQLException {
        return SexEnums.value2Object(callableStatement.getInt(i));
    }
}
```
## 使用
之后有两种用法，第一种是在全局配置文件中定义就可以了，在 mapper 文件中所有的性别枚举类型都会被自动转化为 tinyint，数据库中的性别也会自动转化为枚举类

在全局配置文件中配置后，Mybatis 会根据两种类型会自动匹配，即 jdbc.type 与 java.type，这就是为什么标签中提供了这两种属性
```java
        <result column="age_range" property="ageRange" jdbcType="VARCHAR" javaType="java.lang.String" typeHandler="IntRangeTypeHandler"/>
```

第二种是指定某个需要转换的特定对象使用，如果需要转换的类型为 String，将其转换为 JDBC.DATE，将所有的字符串转换为时间显然是不合理的，这时候可以在 mapper 文件中使用 result 标签中的 typeHandler 属性直接指定
```xml
    <resultMap id="baseResultMap" type="xxx">
        <result column="servicer_list" property="servicerList" jdbcType="VARCHAR" typeHandler="xxxHandler"/>
    </resultMap>
```
## 四个方法的意义
这里说一下四个方法的意义
```java
public interface TypeHandler<T> {
	/**
	 * 此方法是在插入是进行设置参数
	 * 用于把 java 对象设置到 PreparedStatement 的参数中，重点关注 ps 的 set 方法与 parameter 的转换
	 *      PreparedStatement ps 
	 * 		int	i				为Jdbc预编译时设置参数的索引值。ps.get(i)可以找到我们需要的数据库中的列对应的数据
	 * 		T parameter			要插入的数据
	 * 		JdbcType jdbcType	要插入JDBC的类型
	 */
  void setParameter(PreparedStatement ps, int i, T parameter, JdbcType jdbcType) throws SQLException;
	/**
	 * 执行查询后
	 * 用于从 ResultSet 中根据列名取出数据转换为 java 对象，columnName 是列名的意思，调用 rs 的 get 方法获取对应的 jdbc 数据，该方法返回值就是转换的对象
	 * 参数：	ResultSet rs		查询当前列数据
	 *			String cloumnName	查询当前列名称
	 */
  T getResult(ResultSet rs, String columnName) throws SQLException;
  // 用于从 ResultSet 中根据索引位置取出数据转换为 java 对象
  T getResult(ResultSet rs, int columnIndex) throws SQLException;
  // 用于从 CallableStatement 中根据存储过程取出数据转换为 java 对象
  T getResult(CallableStatement cs, int columnIndex) throws SQLException;
}
```
一些情况下，可以使用 mp 中的通用枚举来取代类型处理器，都是我们不能完全抛弃这个功能，该功能的泛用性还是很广的
## 无需转换的类型
总结一下 mybtais 中不需要写转换器或者自带默认转换器的 java 类型与数据库类型的关系
```xml
<resultMap type="java.util.Map" id="resultData">
  <result property="FLD_NUMBER" column="FLD_NUMBER"  javaType="double" jdbcType="NUMERIC"/>
  <result property="FLD_VARCHAR" column="FLD_VARCHAR" javaType="string" jdbcType="VARCHAR"/>
  <result property="FLD_DATE" column="FLD_DATE" javaType="java.sql.Date" jdbcType="DATE"/>
  <result property="FLD_INTEGER" column="FLD_INTEGER"  javaType="int" jdbcType="INTEGER"/>
  <result property="FLD_DOUBLE" column="FLD_DOUBLE"  javaType="double" jdbcType="DOUBLE"/>
  <result property="FLD_LONG" column="FLD_LONG"  javaType="long" jdbcType="INTEGER"/>
  <result property="FLD_CHAR" column="FLD_CHAR"  javaType="string" jdbcType="CHAR"/>
  <result property="FLD_BLOB" column="FLD_BLOB"  javaType="Blob" jdbcType="BLOB" />
  <result property="FLD_CLOB" column="FLD_CLOB"  javaType="string" jdbcType="CLOB"/>
  <result property="FLD_FLOAT" column="FLD_FLOAT"  javaType="float" jdbcType="FLOAT"/>
  <result property="FLD_TIMESTAMP" column="FLD_TIMESTAMP"  javaType="java.sql.Timestamp" jdbcType="TIMESTAMP"/>
 </resultMap>
```
这里是一张默认转换器的表格，可以直观的看出哪些数据不需要写转换器
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/7b18d02c633246383b3020bab8ccb865.png)

数据库列字段都是有类型的，不同的数据库有不同的类型。为了表示这些数据类型，Java 源码是采用枚举来定义的

MyBatis包含的 JdbcType 类型，主要有下面这些枚举：

BIT、FLOAT、CHAR 、TIMESTAMP 、 OTHER 、UNDEFINEDTINYINT 、REAL 、VARCHAR 、BINARY 、BLOB NVARCHAR、SMALLINT 、DOUBLE 、LONGVARCHAR 、VARBINARY 、CLOB、NCHAR、INTEGER、 NUMERIC、DATE 、LONGVARBINARY 、BOOLEAN 、NCLOB、BIGINT 、DECIMAL 、TIME 、NULL、CURSOR
# 拦截器（插件）
插件的原理是四大执行对象源码中调用了获取所有拦截器并且调用的语句，拦截器的实现有三个步骤

1，继承Interceptor接口实现里面的三个方法

2，在拦截器上使用 Intercepts 注解来指定拦截器拦截的目标，type 属性为要拦截的类，method 属性为要拦截的方法，args 为方法中的入参
```java
import org.apache.ibatis.executor.resultset.ResultSetHandler;
import org.apache.ibatis.plugin.*;

import java.util.Properties;

@Intercepts({@Signature(type = ResultSetHandler.class, method = "handleResultSets", args = java.sql.Statement.class)})
public class HolidayPlugin implements Interceptor {
    /**
     * 拦截对象方法的执行，调用invocation.proceed()执行本来的方法，在前后都可以进行一些操作
     * @param invocation
     * @return
     * @throws Throwable
     */
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        Object proceed = invocation.proceed();
        System.out.println("年假为10");
        return proceed;
    }

    /**
     * 为目标对象创建代理
     * @param target
     * @return 被包装后的对象
     */
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }

    /**
     * 设置参数，可以不写
     * @param properties
     */
    @Override
    public void setProperties(Properties properties) {

    }
}
```
3，在全局配置文件中设置要使用的拦截器

过程看起来简单事实上写一个拦截器需要对mybatis底层有很高的了解才知道如何去获取需要的结果

# 注解开发
在接口上加一个Mapper注解即可使用注解开发，mybatis 提供的 **@Mapper** 注解就是将一个接口在编译之后会生成相应的接口实现类

如果想要每个接口都要变成实现类，那么需要在每个接口类上加上@Mapper注解，比较麻烦，解决这个问题用 @MapperScan

**@MapperScan**的作用是指定要变成实现类的接口所在的包，然后包下面的所有接口在编译之后都会生成相应的实现类。注意，是所有的，并且实现的类与接口同名，如果使用 SSM 并且用该注解扫描了所有的包，在 Service 层也会将接口生成

如果传入的值是对象 mybatis 会自动寻找对象中的对应属性，以下是基本的增删改查示例
```java
@Mapper
public interface StudentDao {

    @Select("select * from student")
    List<Student> selectAll();

    @Select("select * from student where sno = #{sno}")
    Student selectStu(String sno);

    @Insert("insert into student set sno = #{sno}, sname = #{sname}, sage = #{sage}, ssex = #{ssex}")
    int addStu(Student student);

    @Update("UPDATE student SET Sage = #{sage} WHERE Sno = #{sno}")
    int updataStu(Student student);

    @Delete("DELETE FROM student WHERE sno = #{sno}")
    int deleteStu(String sno);
}

```
除了这四大注解还有可以配置属性的@Optional注解，使用SqlBuider构造sql后配合@SelectPuvider注解使用等

# 动态 SQL
## if
**if** 标签用来进行判断，只有当 text 中条件满足的时候标签中的内容才会拼接到 sql 中。注意这里为什么要写 1=1 这个恒成立的条件，因为这样拼接 and 就不会报错了，并且如果if不成立也不会报错
```xml
    <select id="selectOne" parameterType="Integer" resultType="map">
        select id, staff_id, name, mobile, area, gender, is_valid from employee where 1 = 1
        <if test="integer != '' and integer != null">and id = #{id}</if>
    </select>
```
if 标签页可以用于判断集合对象的数目，支持 size 获取集合数目，但是这不代表动态 SQL 标签实现了 java 中的所有方法，如果你写一个 list.get(1) 语句在 test 中，标签是会报错的
```xml
    <update id="beachUpdateId" keyProperty="id" useGeneratedKeys="true">
        UPDATE movie.user set sex = 0 where id in
        <if test="list != null and list.size > 0">
            <foreach collection="list" item="item" index="index" open="(" close=")" separator=",">
                #{item}
            </foreach>
        </if>
    </update>
```
还有一种常见的语法是判断字符串不为空
```xml
<if test="entity.serviceUserId != null and entity.serviceUserId != ''">
```
同时，使用该标签需要注意，if 标签判断值与单字符相等是会出错的
```xml
        <if test="takeWay == '1' and workday != null ">            
            #{workday, jdbcType=VARCHAR},     
        </if>
```
原因是 mybatis 是用 OGNL 表达式来解析的，在 OGNL 的表达式中，’1’会被解析成字符，java 是强类型的，char 和 一个 string 会导致不等，所以 if 标签中的 sql 不会被解析

单个的字符要写到双引号里面或者使用 .toString() 才行，写成下面这样就可以了
```xml
<if test='takeWay == "1" and workday != null '>

<if test="takeWay == '1'.toString() and workday != null ">
```
## where
可以使用**where**标签来代替 where，这样就不用写 1=1 了，标签会自动去除if标签语句前的连接符（and 或者 or），但是不能去掉后面的
```xml
    <select id="selectOne" parameterType="Integer" resultType="map">
        select id, staff_id, name, mobile, area, gender, is_valid from employee 
        <where>
        <if test="integer != '' and integer != null">and id = #{id}</if>
        </where>
    </select>
```
## trim
这时候推荐使用 **trim** 标签配合 if 标签执行语句，trim 可以在语句前后添加想要的内容，也可以在语句前后去除想干掉的内容

一般用于去除 sql 语句中多余的 and 关键字，逗号，或者给 sql 语句前拼接 where、set 以及 values ( 等前缀，或者添加 ) 等后缀，可用于选择性插入、更新、删除或者条件查询等操作
```xml
    <select id="selectOne" parameterType="Integer" resultType="map">
        select id, staff_id, name, mobile, area, gender, is_valid from employee 
        <trim prefix="where" prefixOverrides="and | or">
        	<if test="integer != '' and integer != null">and id = #{id}</if>
        </trim>
    </select>
```
## choose、when、otherwise
**choose、when、otherwise**是一套标签，他们的作用相当于 if、else if、else，choose 标签中只有一个条件的语句可以拼接到真正的 sql 上，choose 中至多有一个 ohterwise，至少有一个 when
```xml
    <select id="selectOne" parameterType="Integer" resultType="map">
        select id, staff_id, name, mobile, area, gender, is_valid from employee where
        <choose>
            <when test="integer != '' and integer != null"></when>
            <otherwise>id = 1</otherwise>
        </choose>
    </select>
```
## sql
**sql** 标签用于保存常用的 sql 片段，在需要使用的时候使用 include 标签引入即可
```xml
    <sql id="id">employee(id, staff_id, name, mobile, area, gender, is_valid)</sql>
    <insert id="question9">
        insert into <include refid="id"></include> values
        (#{item.id}, #{item.staffId}, #{item.name}, #{item.mobile}, #{item.area}, #{item.gender}, #{item.isValid})
    </insert>
```
## foreach
最后这位更是重量级，**foreach**可以用来执行循环操作。标签里面的属性collection是需要循环的集合，集合应当使用Param 标签注释以免 mybatis 找不到，item 代表被遍历的元素，separator 是 foreach 与下一个 foreach 之间的分隔符
```java
    public void question9(@Param("list")List<Employee> list);
```
```xml
    <insert id="question9">
        insert into employee(id, staff_id, name, mobile, area, gender, is_valid) values
        <foreach collection="list" item="item" separator=",">
            (#{item.id}, #{item.staffId}, #{item.name}, #{item.mobile}, #{item.area}, #{item.gender},#{item.isValid})
        </foreach>
    </insert>
```
除了这三个属性比较常用，还有 open 与 close 属性，分别代表循环以什么符号开始与循环以什么符号结束

# 易踩的坑
1，# 和 $ 问题，为了防止 SQL 注入请尽量使用 #。$ 是字符串直接替换，#{}实现的是向 prepareStatement 中的预处理语句中设置参数值，因此会将传入的数据都当成一个字符串，会对自动传入的数据加一个双引号

2，定义 entity 的属性要使用包装类型，防止查询、更新异常，因为数据库中可以存在 null 与 0，但是 java 中的 int 没有 null，它的默认值就为0，因此 java 中的 POJO 最好使用包装类

3，使用 where id in ()对传入的集合进行查询的时候，集合没有内容会报错，需要判空同时 size 大于0

4，对于集合类型的返回值，如果没有查找到相关的内容，并不会返回 null，而
是返回空的集合，但是对于自定义的对象而不是集合，没有查找到信息时直接
返回一个 null，统一使用集合来避免空指针异常

5，如果 if 标签判断的不是 String 类型，不要加 !=‘’ 的条件，否则判断为 false。比如如果 id 为 Integer，直接写 <if text "id != null"> 即可

6，mapper 中的特殊符号请使用 &xxx; 代替，否则会解析成标签从而导致异常，比如小于号可能会被解析为标签的 <

- &(逻辑与) &amp;
- <(小于) &lt;
- &gt;(大于) &gt;
- "(双引号) &quot;
- '(单引号) &apos;

7，当只传递一个 List 实例或者数组作为参数对象传给 MyBatis。当你这么做的时候，MyBatis 会自动将它包装在一个 Map 中，用名称作为键。List 实例将会以 “list" 作为键，而数组实例将会以 “array” 作为键，因为传的参数只有一个，而且传入的是一个 List 集合，所以 mybatis 会自动封装成 Map<“list”, xxx>。在解析的时候会通过 “list” 作为 Map 的 key 值去寻找。如果此时在在 xml 中声明成非 list 的其他值，比如 concatList，此时会报错找不到
```xml
    <delete id="deleteMember">
        delete from wechat_department_member_info where wechat_user_account in
        <foreach collection="removeList" item="listItem" open="(" close=")" separator="," >
            #{listItem}
        </foreach>
    </delete>
```
8，insert 标签的 keyProperty 属性的问题

使用 mybatis 中的 insert 标签，如果需要新增之后返回新增行的主键 ID，由于主键是自增的，所以实现方法可以用到 useGeneratedKeys 以及 keyProperty 这两个属性

例如这样:useGeneratedKeys="true" keyProperty="id"

注意：

- keyProperty 中对应的值是实体类的属性，而不是数据库的字段。也就是说，在插入时如果给了一个 Param 标识，那么在 keyProperty 属性中也需要使用这个标识
```xml
-- Integer insert(@Param("entity") TelephoneConnect telephoneConnect);
<insert id="insert" keyProperty="entity.id" useGeneratedKeys="true">
```
- 添加该属性之后并非改变 insert 方法的返回值，也就是说，该方法还是返回新增的结果。而如果需要获取新增行的主键 ID，直接使用传入的实体对象的主键对应属性的值