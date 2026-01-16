---
title: maven 小结
date: 2021-06-16

sidebar: ture
categories:
  - Spring 项目
tags:
  - maven
---
Maven 是基于项目对象模型，可以通过一小段描述信息（配置）来管理项目的构建，报告和文档的软件项目管理工具。Maven 这个单词的本意是专家，行家，也可以理解为知识的积累
# maven 的作用
maven 主要有两大作用：

- maven 可以管理 jar 文件，自动下载 jar 以及管理 jar 直接的依赖，即依赖管理
- maven 可以构建项目，在将程序部署到容器中的这一过程中需要使用 maven。我们在本地可以使用 idea 来构建，但是在服务器只能使用 maven 了
# 生命周期
Maven 有以下三个标准的生命周期：

- clean：项目清理的处理
- default：项目部署的处理
- site：项目站点文档创建的处理

每个生命周期中都包含着一系列的阶段。这些 phase 就相当于 Maven 提供的统一的接口

Maven 生命周期是抽象的，一个周期对应多个命令，其本身不能做任何实际工作，这些实际工作（如源代码编译）都通过调用 Maven 插件中的插件目标（plugin goal）完成的
# 插件
生命周期的实现由 Maven 的插件来完成，类似 java 中的接口与实现类的概念，插件才是真正干活的东西。有趣的是，插件也需要 jar 包来支持，因此 maven 需要自己导入自己需要的 jar 包

以下是一些常用的 maven 指令
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/a70efb41b4b0cd7254caa8e8cba83a72.png)
上图中说了 maven 的每个阶段有什么用：

- compiler：编译，maven 调用插件将我们的项目源代码编译成项目的字节码，就是 target 下的 classes 下的数据
- clean：清理 target 目录
- test-compiler：编译测试程序
- test：执行所有测试程序，可以直接执行。测试方法需要命名为 testXxx，同时类需要命名为 xxxTest，不然 maven 找不到 
- package：将项目打 jar 包或者打 war 包。它会将核心功能编译并且执行测试程序，最后才会打包
- install：将我们项目打包成 jar 包或者 war 包并且安装到本地仓库，以方便其他项目使用
- deploy：将我们项目打包成 jar 包或者 war 包并且安装到远程仓库，以方便其他项目使用

因此，执行 Lifecycle 中的 clean 其实就是执行了 Plugins 中的 clean
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/b26a28fde231adb6ce9d3a59abe22064.png)

# maven 的目录结构
我们解压 maven 后会发现他的项目中包含以下文件夹：

- bin：bin 中一般存放的是二进制文件，与计算机沟通的文件，因此里面存放 maven 的常用脚本。其实大多数的工具中 bin 中存放的都是脚本，这也是我们为什么需要把这个地址配置到环境变量中，我们执行 maven 命令时，其实就是去环境变量中找有没有对应的脚本
- conf：里面存放一些 maven 的核心配置文件
- lib：里面存放支持 maven 运行的 jar 资源包
- LICENES、NOTICE、README：争对 maven 版本的简要介绍，一般的软件都会有这三个文件
# maven 约定的目录结构
每一个maven 项目在磁盘中都是一个文件夹（项目-Hello）
	Hello/
	  ---/src
	  ------/main           #放你主程序java代码和配置文件
	  ----------/java       #你的程序包和包中的java文件
	  ----------/resources  #你的java程序中要使用的配置文件

------/test  #放测试程序代码和文件的（可以没有）
	  ----------/java       #测试程序包和包中的java文件
	  ----------/resources  #测试java程序中要使用的配置文件
	  -----/pom.xml  #maven的核心文件（maven项目必须有）

由于约定大于配置，所以这些设置都是不用改动的
# Idea 新建项目文件
使用 idea 建立 maven 文件是会生成很多文件的，我们可以删掉一些自己不需要的文件

.gitignore 用 git 做版本控制时用这个文件控制那些文件或文件夹不被提交（不用 git 的话可删除没影响）
HELP.md md 是一种文档格式，这个就是你项目的帮助文档，里面罗列了所有使用到的技术的说明文档（可删除）
mvnw linux 上处理 mevan 版本兼容问题的脚本（可干掉）
mvnw.cmd windows 上处理 mevan 版本兼容问题的脚本（可干掉）
XXX.iml 有的文件每个导入 IDEA 的项目都会生成一个项目同名的 .iml 文件用于保存你对这个项目的配置（删了程序重新导入后还会生成 但由于配置丢失可能会造成程序异常）

此外还有两个目录

. mvn 文件夹：存放 mvnw 相关文件，存放着 maven-wrapper.properties 和相关 jar 包以及名为 MavenWrapperDownloader 的 java 文件

.idea 文件夹：建立新的项目时会自动生成  .idea/ 文件夹来存放项目的配置信息。其中包括版本控制信息、历史记录等等
说白了， .idea/ 与当前项目能否正常执行无关，它只是负责对代码的历史变化进行一个记录，便于回溯查找和复原
# maven 仓库
仓库是用来存放东西的， maven 仓库就存放 maven 使用的 jar 和我们项目使用的 jar

- 本地仓库，就是在个人计算机上存放各种 jar，一般在这个仓库在用户文件夹下的.m2文件夹下
  - 远程仓库，在互联网上的，使用网络才能使用的仓库，特点是无比庞大并且在不断扩张，远程仓库又分中央仓库、镜像、私服仓库
- 中央仓库，最权威的，所有的开发人员都共享使用的一个集中的仓库
- 中央仓库的镜像：就是中央仓库的备份，在各大洲，重要的城市都是镜像
- 私服仓库：每个公司自己的仓库，一般是加密的并且不对外人开放，公司自己项目的代码一般放在私服中，我们可以使用 nexus 来创建一个私服仓库

maven 的中国镜像：

- 阿里云：http://maven.aliyun.com/
- 网易：http://maven.netease.com/repository/public/
- 华为云：https://repo.huaweicloud.com/repository/maven/
- 清华大学：https://repo.maven.apache.org/maven2/

idea 的自带 maven 的配置文件地址
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/45518fd8eb373ba7a3af85322935e0c6.png)
更改 maven 镜像：
```xml
<?xml version="1.0" encoding="UTF-8"?>
 
 
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0" 
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 
          http://maven.apache.org/xsd/settings-1.0.0.xsd">
          
	<mirrors>
	  <mirror>
	    <!--该镜像的id-->
	    <id>nexus-aliyun</id>
	    <!--该镜像用来取代的远程仓库，central是中央仓库的id-->
	    <mirrorOf>central</mirrorOf>
	    <name>Nexus aliyun</name>
	    <!--该镜像的仓库地址，这里是用的阿里的仓库-->
	    <url>http://maven.aliyun.com/nexus/content/groups/public</url>
	  </mirror>
	</mirrors>
</settings>
```
如果配置完毕还是报错，那么可能是以下的问题：

1，maven 的 setting 配置不对。idea 自带的 maven 是可以使用的，里面的 setting 也是可以修改的，但是如果不修改 idea 中的 maven 文件配置的话是读不到修改的数据的。并且需要注意单项目配置和全局配置的区别，注意自己的 idea 读读是哪个配置
2，maven 设置的大小太小了，报 oom 错误（maven 也会报 oom 我还是第一次知道），在 idea 的设置中将 vm 中的大小修改大一些
![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/181069c8dc0a92cb87548878ce325032.png)

# pom 文件
以下是 pom 文件常见的属性
## 基础属性
modelVersion：模型版本，需要设置为 4.0

   坐标：唯一值， 在互联网中唯一标识一个项目的
   - groupId：公司域名的倒写
  -  artifactId：自定义项目名称
   -  version：自定版本号，版本号是有讲究的。我们可以命名为以下名称：

 <主版本>.<次版本>.<增量版本>-<里程碑版本>
1，PRE: 灰度版本
2，SNAPSHOT：不稳定版本, 用于开发调试
3，RELEASE 或不带后缀：正式版本

比如 0.0.1-SNAPSHOT，就是测试版本
## 父子项目
parent：父（Super）POM是 Maven 默认的 POM，它包含了一些可以被继承的默认设置，它一般是用来做依赖管理和聚合的。因此，当 Maven 发现需要下载 POM 中的依赖时，它会到 Super POM 中配置的默认仓库 http://repo1.maven.org/maven2 去下载。父 POM 经常在分布式项目中做版本控制，所以经常在父项目中这么写
```xml
    <!-- 继承自该项目的所有子项目的默认依赖信息。这部分的依赖信息不会被立即解析,而是当子项目声明一个依赖（必须描述group ID和 artifact 
        ID信息），如果group ID和artifact ID以外的一些信息没有描述，则通过group ID和artifact ID 匹配到这里的依赖，并使用这里的依赖信息。 -->
    <dependencyManagement>
        <dependencies>
            <!--参见dependencies/dependency元素 -->
            <dependency>
                ......
            </dependency>
        </dependencies>
    </dependencyManagement>
```
packaging：打包方式，提示将项目打包成什么类型的文件，比如：

- packaging 为 jar：普通的 java 工程，打包后生成 .jar 文件
- packaging 为 war：web 工程，打包后生成 .war 文件
- packaging 为 pom：代表不会打包，用来做继承的父工程
## 常用属性
依赖：dependencies 和 dependency ，相当于是 java 代码中 import，dependency 中引入的依赖会自动的引入其子依赖，比如这样：
```xml
        <dependency>
            <groupId>com.google.guava</groupId>
            <artifactId>guava</artifactId>
            <version>31.1-jre</version>
        </dependency>
```
我们还可以在依赖中配置运行范围，让它在规定的作用范围中才能有效。可以设置作用范围为：编译环境、测试环境、运行环境。一般使用默认的就行，它们决定了某个依赖库（JAR 包）在项目生命周期的哪个阶段可用，手动设置一般是为了提高打包速度

- compile：编译和运行都需要使用到这个依赖，这是默认值
- test：只在运行测试代码时需要，主代码编译和项目运行时都不需要。最典型的就是 JUnit 和 Mockito 这类测试框架。你的项目上线运行时根本用不到它们
- provided：编译和测试时需要，但运行时不需要，因为目标运行环境（比如 Tomcat 服务器、JDK）已经自带了这个库，不会被打进最终的部署包，比如 Servlet API：你需要用这个库来编译你的 Web 项目（javax.servlet.HttpServlet），但项目最终是运行在 Tomcat 里的，Tomcat 自己就带了 Servlet API 的 jar 包。如果你把自己的和 Tomcat 的都打包进去，反而会造成冲突
- runtime：编译时不需要，但运行时需要。编译阶段不可用，你写的代码里不能直接 import 或调用它的类。比如 MySQL 的 JDBC 驱动 mysql-connector-java。你写代码时用的是标准的 java.sql.* 接口（由 JDK 的 java.sql 包提供， scope 是 provided），不需要直接引用 MySQL 驱动的具体类。但在运行时，需要这个驱动来实现连接
```xml
        <dependency>
            <groupId>com.google.guava</groupId>
            <artifactId>guava</artifactId>
            <version>31.1-jre</version>
            <scope>test</scope>
        </dependency>
```

dependencyManagement：配置 dependencyManagement 锁定依赖的版本，一般用于版本管理

properties：设置属性

build：maven 在进行项目的构建时，配置信息，例如指定编译 java 代码使用的 jdk 的版本等。同时可以引入其他的插件
# 依赖原则
maven 管理依赖关系，那它到底是如何管理的呢

依赖路径最短优先原则：如果多个包依赖了相同的包，只生效最短的那一个，下面的例子中，由于 X(2.0) 路径最短，所以使用 X(2.0)

A -> B -> C -> X(1.0)
A -> D -> X(2.0)

声明顺序优先原则：在 POM 中最先声明的优先，上面的两个依赖如果先声明 B，那么最后使用 X(1.0)

A -> B -> X(1.0)
A -> C -> X(2.0)

覆写优先原则：子 POM 内声明的依赖优先于父 POM 中声明的依赖

在版本冲突时，避免使用 exclude 解决版本冲突问题，尽量使用 dependencyManagement 指定版本解冲突

冲突总是表现为以下一种或多种症状：

编译时错误
```java
// 类找不到或方法不存在
error: cannot find symbol
symbol:   method newArrayList()
location: interface Lists  // Guava版本不兼容
```
运行时错误
```java
// 类加载异常
java.lang.NoSuchMethodError: 
com.google.common.collect.Lists.newArrayList()Ljava/util/ArrayList;

// 类转换异常
java.lang.ClassCastException: 
com.google.common.collect.ImmutableList cannot be cast to java.util.ArrayList
```