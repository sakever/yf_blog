module.exports = {
  // 站点标题，显示在浏览器标签页和页面左上角
  title: 'sakever 的博客',
  // 站点描述，用于 SEO 与 meta 标签
  description: '记录学习到的知识',
  // 站点部署的基础路径，GitHub Pages 部署时需要修改为仓库名，如 '/yf_blog/'
  // 如果使用自定义域名，可以设置为 '/'
  base: '/yf_blog/',
  // 使用 vdoing 主题
  theme: 'vdoing',
  // 需要注入到 HTML <head> 标签中的元素
  head: [
    // 网站图标
    ['link', { rel: 'icon', href: '/blogger_icon.ico' }],
    // 移动端浏览器主题色
    ['meta', { name: 'theme-color', content: '#14204193' }],
    // 允许以 Web App 形式全屏运行
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    // 设置 iOS 状态栏样式
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
    // 禁用移动端缩放，保证页面布局稳定
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' }]
  ],
  // 主题相关配置
  themeConfig: {
    // 顶部导航
    nav: [
      { text: '首页', link: '/' },
      { text: '博客', link: '/_posts/' },
      { text: '分类', link: '/categories/' },
      { text: '标签', link: '/tags/' }
    ],
    // 左侧总目录（整体目录，不随页面展开）
    sidebar: {
      '/_posts/': [
        {
          title: '前端',
          collapsable: false,
          children: [
            '_front/GitHub Pages 部署教程',
            '_front/Vercel 部署教程',
            '_front/VuePress 博客搭建指南',
            '_front/简单了解前端页面开发'
          ]
        },
        {
          title: 'Java',
          collapsable: false,
          children: [
            '_Java/java 基础知识',
            '_Java/Java8 新特性',
            '_Java/反射学习笔记',
            '_Java/Servlet 学习笔记',
            '_Java/String、StringBuffer、StringBuilder',
            '_Java/Scanner 的各种用法',
            '_Java/如何使用 lambda 实现集合排序以及为什么 lambda 不能改变外部变量的值',
            '_Java/Java 中强、软、弱、虚引用',
            '_Java/java 的常见性能问题分析以及出现场景',
            '_Java/Guava 常用 API',
            '_Java/Guava 源码阅读：Multimap 相关',
            '_Java/CompletableFuture 相关用法',
            '_Java/CompletableFuture 源码浅要阅读',
            '_Java/FutureTask 源码阅读',
            '_Java/泛型相关概念',
            '_Java/netty 学习笔记'
          ]
        },
        {
          title: '多线程',
          collapsable: false,
          children: [
            '_multithreading/多线程基础学习笔记',
            '_multithreading/深入理解 java 多线程安全',
            '_multithreading/线程池作用、用法以及原理',
            '_multithreading/如何手写单例',
            '_multithreading/生产者消费者问题',
            '_multithreading/简单了解并发集合'
          ]
        },
        {
          title: '数据结构与算法',
          collapsable: false,
          children: [
            '_data_structures_and_algorithms/集合与数据结构学习笔记',
            '_data_structures_and_algorithms/算法导论第一部分学习笔记',
            '_data_structures_and_algorithms/算法导论第二部分排序学习笔记',
            '_data_structures_and_algorithms/动态规划算法学习笔记',
            '_data_structures_and_algorithms/基于比较的排序算法的最坏情况下的最优下界为什么是O(nlogn)'
          ]
        },
        {
          title: '计算机基础',
          collapsable: false,
          children: [
            '_computer/操作系统学习笔记',
            '_computer/计算机网络学习笔记'
          ]
        },
        {
          title: 'JVM',
          collapsable: false,
          children: [
            '_jvm/JVM 自动内存管理'
          ]
        },
        {
          title: 'MySQL',
          collapsable: false,
          children: [
            '_mysql/MySQL 基础语句学习笔记',
            '_mysql/MySQL 索引与索引优化',
            '_mysql/MySQL 事务与锁与 MVCC',
            '_mysql/MySQL 的 binglog、redolog、undolog',
            '_mysql/B 树和 B+ 树的插入、删除和数据页分裂机制'
          ]
        },
        {
          title: 'Redis',
          collapsable: false,
          children: [
            '_redis/Redis 学习笔记'
          ]
        },
        {
          title: 'Spring 项目',
          collapsable: false,
          children: [
            '_spring_project/maven 小结',
            '_spring_project/Spring 框架基础使用',
            '_spring_project/SpringBoot 基础使用',
            '_spring_project/SpringBoot 的原理',
            '_spring_project/SpringWeb 重要知识点',
            '_spring_project/MyBatis 框架的使用',
            '_spring_project/MyBatis 重要知识点总结',
            '_spring_project/MybatisPlus 的使用'
          ]
        },
        {
          title: '分布式',
          collapsable: false,
          children: [
            '_distributed/Dubbo 基础概念',
            '_distributed/Zookeeper 基础学习',
            '_distributed/分布式一致性算法',
            '_distributed/详解 Spring Cloud',
            '_distributed/nginx 学习笔记'
          ]
        },
        {
          title: '开发工具',
          collapsable: false,
          children: [
            '_development/git 的学习以及使用',
            '_development/swagger 的使用'
          ]
        },
        {
          title: 'Linux',
          collapsable: false,
          children: [
            '_linux/Linux 文件系统'
          ]
        },
        {
          title: '金融',
          collapsable: false,
          children: [
            '_finance/基金与股票'
          ]
        },
        {
          title: '其他',
          collapsable: false,
          children: [
            '_other/观罗翔讲刑法随笔',
            '_other/梅花易数学习笔记'
          ]
        }
      ]
    },
    // 右侧目录深度（显示当前页面的目录）
    sidebarDepth: 3,
    // 分类 / 标签页
    category: true,
    tag: true,
    archive: true,
    // 其它默认设置
    lastUpdated: '最后更新',
    search: true,
    searchMaxSuggestions: 10
  },
  // Markdown 解析配置
  markdown: {
    // 是否显示行号
    lineNumbers: true,
    // 提取哪些级别的标题到侧边栏
    extractHeaders: ['h2', 'h3', 'h4', 'h5']
  },
  // 插件列表
  plugins: [
    ['@vuepress/search', {
      searchMaxSuggestions: 10
    }]
  ]
}