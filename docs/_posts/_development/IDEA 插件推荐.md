---
title: IDEA 插件推荐
date: 2023-06-23
categories:
  - 开发工具
tags:
  - IDEA
  - 插件
---
## Alibaba Java Coding Guidelines
目前插件实现了开发手册中的的53条规则，大部分基于PMD实现，其中有4条规则基于IDEA实现，并且基于IDEA Inspection (https://www.jetbrains.com/help/idea/code-inspection.html)实现了实时检测功能。部分规则实现了Quick Fix功能，目前插件检测有两种模式：实时检测、手动触发

实时检测：实时检测功能会在开发过程中对当前文件进行检测，并以高亮的形式提示出来，同时也可以支持Quick Fix，该功能默认开启，可以通过配置关闭

结果高亮提示：检测结果高亮提示，并且鼠标放上去会弹出提示信息

目前这款插件已经不维护了，但是可以下载 Alibaba Java Coding Guidelines plugin support.(XenoAmess TPM) 版本，有三方的大佬维护它
## Chinese ​(Simplified)​ Language Pack

中文语言包将为您的 IntelliJ IDEA, AppCode, CLion, DataGrip, GoLand, PyCharm, PhpStorm, RubyMine, 和 WebStorm 带来完全中文化的界面

在 idea 高版本中，我们已经有简体中文版本了，因此不需要安装这个插件了
## EasyCode
EasyCode 是基于 IntelliJ IDEA 开发的代码生成插件，支持自定义任意模板（Java，html，js，xml）。只要是与数据库相关的代码都可以通过自定义模板来生成。支持数据库类型与java类型映射关系配置。支持同时生成生成多张表的代码。每张表有独立的配置信息。完全的个性化定义，规则由你设置

## Gitee
## GsonFormatPlus
在开发中，经常会有这样的场景，给一个 JSON 例子，然后定义成对象类，来和前端进行联调测试，如果 Json 很长，会浪费很多时间在编写对象类上。该插件可以快速将 JSON 转换为 POJO 对象
## IDE Eval Reset
30天自动重置脚本

建议下载 idea 2021.2.2 版本，不需要登录
## Lombok
必备插件，支持编译时插入
## maven helper
在写 Java 代码的时候，我们可能会出现 Jar 包的冲突的问题，这时候就需要我们去解决依赖冲突了，而解决依赖冲突就需要先找到是那些依赖发生了冲突，当项目比较小的时候，还比较依靠 IEDA 的【Diagrams】查看依赖关系，当项目比较大依赖比较多后就比较难找了，这时候就需要一款 IDEA 插件实现快速解决依赖冲突了
## MyBatisX
可自动找到 dao 与 mapper 的映射，以及自动关联数据库中的表，还有 sql 检查等等功能，非常方便

## Apifox Helper
该插件主要用于 IDEA 项目快速生成 API 文档，并同步到 Apifox，代码零入侵

基于 javadoc（Java）、KDoc（Kotlin）、ScalaDoc（Scala） 解析API 文档

支持 Swagger 注解

导入到 Apifox 的 API 文档都符合 OpenAPI 的规范。

同时也推荐 Apifox 这个软件，用起来非常爽
## Translation
将 idea 中的配置文本啥的翻译成中文，对于我这种四级还没过的同学挺好的

同时说一下 idea 自带的谷歌翻译，下载之后我们可能会出现 Google 翻译不能使用的现象，是因为 Google 在前几周关闭了国内的服务，我们需要配置其他的翻译源，比如百度。在下面的网站点通用翻译，申请一个账号就可以了
```
https://fanyi-api.baidu.com/
```
申请完之后提示百度翻译账号无效是因为没有开通服务，点击开通申请就可以了
## Codeium
AI 写代码
## Python
支持 python 语言
## Go
支持 go 语言
## Redis Helper
支持连接 redis