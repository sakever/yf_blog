---
title: MyBatis 重要知识点总结
date: 2021-08-05

sidebar: true
categories:
  - Spring 项目
tags:
  - MyBatis
---

记录一下 MyBatis 的底层原理以及相关重要知识点
## 大体架构
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/7f07420786696a6381428685cfb7a4e5.png)
在接口层中 MyBatis 提供和数据库交互的两种方式：使用传统的 MyBatis 提供的 API 实现简单的增删改查，以及使用 Mapper 接口实现自己写的 sql 语句

数据处理层是 MyBatis 的核心，主要完成三个功能：通过传入参数构建动态 SQL 语句、SQL 语句的执行、封装查询结果集成 List< E >

在参数映射阶段完成了对于 java 数据类型和 jdbc 数据类型之间的转换，随后 MyBatis 通过传入的参数值，使用 Ognl 来动态的构造 SQL 语句

在 Executor 中执行 sql 并且返回结果，并且将返回的结果转化为我们熟悉的 java 类型

数据处理层的大致过程如下图所示：
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/f69b3f3be57078b32fe4411a9189c378.png)
重点关注一下这四大对象：

（1）SqlSession 对象，该对象中包含了执行 SQL 语句的所有方法。类似于 JDBC 里面的 Connection，在执行时，可以在 MAP 中通过全限定名加接口名称来唯一确定一条 SQL
（2）Executor 接口，它将根据 SqlSession 传递的参数动态地生成需要执行的 SQL 语句，同时负责查询缓存的维护。类似于 JDBC 里面的 Statement/PrepareStatement
（3）MappedStatement 对象，该对象是对映射 SQL 的封装，用于存储要映射的 SQL 语句的 id、参数等信息
（4）ResultHandler 对象，用于对返回的结果进行处理，最终得到自己想要的数据格式或类型。可以自定义返回类型
## Mapper 创建过程
### SqlSessionFactoryBuilder
一旦创建了工厂就没用了，推荐成为局部变量

一般先使用两个 build 方法，不同点只是处理的是字节流还是字符流

最后都会调用 build 的重载方法，返回一个 DefaultSqlSessionFactory（实现工厂接口的类）
```java
public class SqlSessionFactoryBuilder {
 
  public SqlSessionFactory build(Reader reader, String environment, Properties properties) {
    try {
      XMLConfigBuilder parser = new XMLConfigBuilder(reader, environment, properties);
      return build(parser.parse());
    } catch (Exception e) {
      throw ExceptionFactory.wrapException("Error building SqlSession.", e);
    } finally {
      ErrorContext.instance().reset();
      try {
        reader.close();
      } catch (IOException e) {
        // Intentionally ignore. Prefer previous error.
      }
    }
  }
 
  public SqlSessionFactory build(InputStream inputStream, String environment, Properties properties) {
    try {
      XMLConfigBuilder parser = new XMLConfigBuilder(inputStream, environment, properties);
      return build(parser.parse());
    } catch (Exception e) {
      throw ExceptionFactory.wrapException("Error building SqlSession.", e);
    } finally {
      ErrorContext.instance().reset();
      try {
        inputStream.close();
      } catch (IOException e) {
        // Intentionally ignore. Prefer previous error.
      }
    }
  }
    
  public SqlSessionFactory build(Configuration config) {
    return new DefaultSqlSessionFactory(config);
  }
 
}
```

### SqlSessionFactory
因为包含配置文件中的所有信息，可以视作数据库但不是数据库，必须一直存在(因为要创建 sqlsession)，建议设为全局变量

Configuration：将 mybatis 配置文件中的信息保存到该类中，之后的大部分操作都会从这个类中拿数据，可以说主体就是这个类，Factory 只是个包装

在这个类之中有一个非常重要的类，MappedStatement，这个类封装了一个增删改查标签，这个类可以由全限定名加方法名唯一确定

SqlSessionFactory 会为每个 SqlSession 会配一个 Executor 执行器，然后返回一个 DefaultSqlSession(SqlSession 的实现类)对象
```java
public class DefaultSqlSessionFactory implements SqlSessionFactory {
 
  private final Configuration configuration;
 
  private SqlSession openSessionFromDataSource(ExecutorType execType, TransactionIsolationLevel level, boolean autoCommit) {
    Transaction tx = null;
    try {
      final Environment environment = configuration.getEnvironment();
      final TransactionFactory transactionFactory = getTransactionFactoryFromEnvironment(environment);
      tx = transactionFactory.newTransaction(environment.getDataSource(), level, autoCommit);
	  final Executor executor = configuration.newExecutor(tx, execType);
      return new DefaultSqlSession(configuration, executor, autoCommit);
    } catch (Exception e) {
      closeTransaction(tx); 
      throw ExceptionFactory.wrapException("Error opening session.  Cause: " + e, e);
    } finally {
      ErrorContext.instance().reset();
    }
  }
}
```
### SqlSession
连接请求，负责和数据库交互，不是线程安全的，使用完关闭，推荐将 close 方法放在 finally 中，和 ReentrantLock 一样

所有的增删改查操作，都会由 SqlSession 实现类中以下三个方法执行，选择和修改，并且最后都会调用执行器执行sql语句

这样也变向说明了，为什么 executor 执行器通常都会执行选择和修改
```java
  @Override
  public <E> List<E> selectList(String statement, Object parameter, RowBounds rowBounds) {
    try {
      MappedStatement ms = configuration.getMappedStatement(statement);
      return executor.query(ms, wrapCollection(parameter), rowBounds, Executor.NO_RESULT_HANDLER);
    } catch (Exception e) {
      throw ExceptionFactory.wrapException("Error querying database.  Cause: " + e, e);
    } finally {
      ErrorContext.instance().reset();
    }
  }
  
  @Override
  public void select(String statement, Object parameter, RowBounds rowBounds, ResultHandler handler) {
    try {
      MappedStatement ms = configuration.getMappedStatement(statement);
      executor.query(ms, wrapCollection(parameter), rowBounds, handler);
    } catch (Exception e) {
      throw ExceptionFactory.wrapException("Error querying database.  Cause: " + e, e);
    } finally {
      ErrorContext.instance().reset();
    }
  }
  
  @Override
  public int update(String statement, Object parameter) {
    try {
      dirty = true;
      MappedStatement ms = configuration.getMappedStatement(statement);
      return executor.update(ms, wrapCollection(parameter));
    } catch (Exception e) {
      throw ExceptionFactory.wrapException("Error updating database.  Cause: " + e, e);
    } finally {
      ErrorContext.instance().reset();
    }
  }
```
其他方法都是调用以上方法的
```java
    public int delete(String statement) {
        return this.update(statement, (Object)null);
    }
    
    public int insert(String statement, Object parameter) {
        return this.update(statement, parameter);
    }
```


### Mapper
会话中的一个具体的业务，包含多个sql请求，调用getMapper方法获得
```java
    public <T> T getMapper(Class<T> type) {
        return this.configuration.getMapper(type, this);
    }
```
之后调用MapperRegistry中的方法
```java
    public <T> T getMapper(Class<T> type, SqlSession sqlSession) {
        MapperProxyFactory<T> mapperProxyFactory = (MapperProxyFactory)this.knownMappers.get(type);
        if (mapperProxyFactory == null) {
            throw new BindingException("Type " + type + " is not known to the MapperRegistry.");
        } else {
            try {
                return mapperProxyFactory.newInstance(sqlSession);
            } catch (Exception var5) {
                throw new BindingException("Error getting mapper instance. Cause: " + var5, var5);
            }
        }
    }
```
所以它最后返回了对应接口的一个代理对象，我们只用这个代理对象实现增删改查方法

## 一个查询语句的执行过程
由于是代理对象，所以直接执行 invoke 方法，即无论用 mapper 中什么方法都会执行 invoke 方法

如果是查询语句，先运行到 SqlSession 中的 select 方法，然后执行 executor 中的 query 方法，executor 只是个接口，根据用户选择的不同会执行不同的 executor，比如：

如果开启二级缓存执行 CachingExecutor，先判断缓存
```java
    public <E> List<E> query(MappedStatement ms, Object parameterObject, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
        Cache cache = ms.getCache();
        if (cache != null) {
       		//。。。。。。。。
        }
        return this.delegate.query(ms, parameterObject, rowBounds, resultHandler, key, boundSql);
    }
```
一般情况下执行SimpleExecutor中的doQuery，执行一级缓存
```java
    public <E> List<E> doQuery(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
        Statement stmt = null;
        List var9;
        try {
            Configuration configuration = ms.getConfiguration();
            StatementHandler handler = configuration.newStatementHandler(this.wrapper, ms, parameter, rowBounds, resultHandler, boundSql);
            stmt = this.prepareStatement(handler, ms.getStatementLog());
            var9 = handler.query(stmt, resultHandler);
        } finally {
            this.closeStatement(stmt);
        }
        return var9;
    }
```

底层在 executor 中使用 StatementHandler 来执行，这个类可以创建出 Statement 对象，这个类用来执行预编译，设置参数，接受数据等操作，也就是说这个类执行 JDBC 操作（statement 说明）

这个类有两个重要对象
```java
	//接受的数据封装在这个类中
    protected final ResultSetHandler resultSetHandler;
    //为预编译的sql语句设置参数
    protected final ParameterHandler parameterHandler;
```

综上，SqlSession方法中的getMapper传入的是接口的class对象，它的作用是作为类的全限定名配合之后调用的方法名唯一确定一个sql语句（MappedStatement）；而它的返回值类型虽然可以调用它里面的方法，但是方法的实现已经被 jdk 完全代理了
### Dao 接口里的方法，参数不同时，方法能重载吗
**最佳实践中，通常一个 xml 映射文件，都只会有一个 Dao 接口与之对应**

因为接口的全限名，就是映射文件中的 namespace 的值，接口的方法名，就是映射文件中 MappedStatement 的 id 值，接口方法内的参数，就是传递给 sql 的参数。 Mapper 接口是没有实现类的，当调用接口方法时，接口全限名+方法名拼接字符串作为 key 值，可唯一定位一个 MappedStatement

在 MyBatis 中，每一个 select、insert 等标签，都会被解析为一个 MappedStatement 对象

综上，Dao 接口里的方法可以重载，但是 Mybatis 的 xml 里面的 ID 不允许重复。举个例子：
```java
Person queryById();

Person queryById(@Param("id") Long id);

Person queryById(@Param("id") Long id, @Param("name") String name);
```

```xml
<select id="queryById" resultMap="PersonMap">
    select
      id, name, age, address
    from person
    <where>
        <if test="id != null">
            id = #{id}
        </if>
        <if test="name != null and name != ''">
            name = #{name}
        </if>
    </where>
    limit 1
</select>
```
- queryById() 方法执行时，if 标签获取的所有条件值都为 null，所有条件不成立，动态 sql 可以正常执行
- queryById(1L) 方法执行时，包含了 id 和 param1 两个 key 值。当获取 if 标签中 name 的属性值时，进入 ((Map)parameterObject).get(name) 方法中，map 中 key 不包含 name，所以抛出异常
- queryById(1L,"1")方法执行时，parameterObject 中包含 id，param1，name，param2 四个 key 值，id 和 name 属性都可以获取到，动态 sql 正常执行

mybatis 虽然允许重载，但是功能非常鸡肋，估计在设计的时候也没有考虑到重载的情况，不推荐使用

### 总结
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/eebe0e36b23db75377698bf21837c21e.png)
上面中流程就是 MyBatis 内部核心流程，每一步流程的详细说明如下文所述：

（1）读取MyBatis的配置文件。mybatis-config.xml为MyBatis的全局配置文件，用于配置数据库连接信息。

（2）加载映射文件。映射文件即SQL映射文件，该文件中配置了操作数据库的SQL语句，需要在MyBatis配置文件mybatis-config.xml中加载。mybatis-config.xml 文件可以加载多个映射文件，每个文件对应数据库中的一张表。

（3）构造会话工厂。通过MyBatis的环境配置信息构建会话工厂SqlSessionFactory。

（4）创建会话对象。由会话工厂创建SqlSession对象，该对象中包含了执行SQL语句的所有方法。

（5）Executor执行器。MyBatis底层定义了一个Executor接口来操作数据库，它将根据SqlSession传递的参数动态地生成需要执行的SQL语句，同时负责查询缓存的维护。

（6）MappedStatement对象。在Executor接口的执行方法中有一个MappedStatement类型的参数，该参数是对映射信息的封装，用于存储要映射的SQL语句的id、参数等信息。

（7）输入参数映射。输入参数类型可以是Map、List等集合类型，也可以是基本数据类型和POJO类型。输入参数映射过程类似于JDBC对preparedStatement对象设置参数的过程。

（8）输出结果映射。输出结果类型可以是Map、List等集合类型，也可以是基本数据类型和POJO类型。输出结果映射过程类似于JDBC对结果集的解析过程。
## #{} 与 ${} 的不同
它们都是占位符（占领一个空间，等待传入其他参数）

#{} 会被自动替换为 ? 号，然后这个sql语句作为值存放在 MappedStatement 里，然后使用 PreparedStatement 的内部参数设置方法对 ？进行填充，整个过程使用反射获取对象属性。这种方法会对语句进行预编译处理，所以防止sql注入（因为sql注入发生在sql编译过程中），推荐使用

${} 是静态字符串替换，在 properties 文件或者 sql 内部使用，直接把传入的字符进行替换，比如 ${driver} 会被静态替换为 com.mysql.jdbc. Driver ，这样的话不防止 sql 注入，不推荐使用

举个例子，比如查询 id 为1的订单详情信息，使用 #{} 传入的话 mysql 是会执行以下语句：
```sql
select * from order_detail where id = ?;
```
随后 mybatis 才会将1这个数据传输给 mysql。如果使用 ${} 的话会在 java 程序中进行字符串拼接，因此会执行以下语句
```sql
select * from order_detail where id = 1;
```
## 物理分页与逻辑分页
MyBatis 使用 RowBounds 对象进行分页，它是针对 ResultSet 结果集执行的内存分页，属于逻辑分页，这种分页方式一次读取大量数据，在数据库数据修改之后不能第一时间获取值，并且对数据内部的处理也需要时间，一般不使用 mybatis 自带的分页方式

物理分页是依赖数据库的 limit 进行分页的，我们可以在 sql 内直接书写带有物理分页的参数来完成物理分页功能，也可以使用分页插件来完成物理分页，因为可以配合 where 使用索引，效率较高
## 缓存
mybatis 的缓存分为两级

一级缓存是自动开启的 sqlsession 会话缓存，通过同一个 sqlsession 查找的数据会被缓存，所有的查询结果都存储在一个以对应语句为值的 Map 中，在 sqlsession 关闭时所有的缓存都被清空或者转到二级缓存中，推荐关了，毕竟在现在分布式的应用中单机缓存也没啥用

二级缓存推荐一直关闭（默认也是开启的），二级缓存是全局缓存，即 sqlsessionfactory 级别的，此后在执行相同的查询语句，会去缓存中找。每个缓存存放在对应的每个namespace中，是用CachingExecutor实现的

## 执行器
调用StatementHander对象发送sql语句

执行器有不同的类型：

SimpleExecutor：执行一条语句就关闭Statement对象
ReuseExecutor：执行一条语句，以sql作为key查找Statement对象，存在就使用，不存在就创建，用完后，不关闭Statement对象，而是放置于Map<String, Statement>内，供下一次使用
BatchExecutor：批处理语句，不执行select，批量插入后，能返回数据库主键列表

执行器的活动范围在SqlSession生命周期中（因为它定义在SqlSession中）

## 插件
plugins，在 mybatis 中可以理解成拦截器

主要拦截以下四大对象：

Executor：执行器，它在sqlSession创建时被创建以及绑定
StatementHander：sql语句执行
ParameterHandler：规范，sql语句预编译时设置参数用的
ResultSetHandler：存放结果集

其实就是拦截executor这个丢sql的以及handler这个做翻译的，所有的插件工作原理都是对原来的对象生成代理，代码层面实现是执行所有拦截器链

表层：实现Interceptor （拦截器）接口并复写 intercept()拦截方法，覆写此接口可以自定义插件

里层：执行这 4 种接口对象的方法时，就会进入拦截方法，InvocationHandler 的 invoke() 方法

## 延迟加载
在MyBatis配置文件中，可以配置是否启用延迟加载 lazyLoadingEnabled

延迟加载就是懒加载，在表的关联查询时（比如一对多使用分布查询时），推迟对附表的查询时机，减少数据库访问的压力。又比如在获取某种数据的时候，只有在使用该数据的时候才从数据库中读取数据，这么做的好处是提高用户的访问速度

底层原理是通过拦截器实现，使用invoke方法对原来的sql进行修改

不光是 MyBatis，几乎所有的包括 Hibernate，支持延迟加载的原理都是一样的
