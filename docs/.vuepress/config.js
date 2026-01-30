const sidebar = require('./sidebar')
const { readFileList, readTotalFileWords, readEachFileWords } = require('./webSiteInfo/readFile');

module.exports = {
  // 站点标题，显示在浏览器标签页和页面左上角
  title: 'disgare 的博客',
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
    // 禁用 referrer 策略，允许跨域请求发送 referrer 信息
    ['meta', { name: 'referrer', content: 'no-referrer-when-downgrade' }],
    // 阿里矢量库
    ['link', { rel: 'stylesheet', href: 'https://at.alicdn.com/t/font_3077305_pt8umhrn4k9.css' }],
    // 禁用移动端缩放，保证页面布局稳定
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' }]
  ],
  // 主题相关配置
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '博客', link: '/_posts/' },
      { text: '分类', link: '/categories/' },
      { text: '标签', link: '/tags/' }
    ],
    // 左侧总目录（所有路径共用）
    sidebar: sidebar,
    // 右侧目录深度（显示当前页面的目录）
    sidebarDepth: 4,
    // 分类 / 标签页
    category: true,
    tag: true,
    archive: true,
    lastUpdated: '最后更新',
    search: true,
    searchMaxSuggestions: 10,
    rightMenuBar: true,
    pageButton: true,
    blogInfo: {
      blogCreate: '2020-10-19', // 博客创建时间
      indexView: true,  // 开启首页的访问量和排名统计，默认 true（开启）
      pageView: true,  // 开启文章页的浏览量统计，默认 true（开启）
      readingTime: true,  // 开启文章页的预计阅读时间，条件：开启 eachFileWords，默认 true（开启）。可在 eachFileWords 的 readEachFileWords 的第二个和第三个参数自定义，默认 1 分钟 300 中文、160 英文
      eachFileWords: readEachFileWords([''], 300, 160),  // 开启每个文章页的字数。readEachFileWords(['xx']) 关闭 xx 目录（可多个，可不传参数）下的文章页字数和阅读时长，后面两个参数分别是 1 分钟里能阅读的中文字数和英文字数。无默认值。readEachFileWords() 方法默认排除了 article 为 false 的文章
      mdFileCountType: 'archives',  // 开启文档数。1. archives 获取归档的文档数（默认）。2. 数组 readFileList(['xx']) 排除 xx 目录（可多个，可不传参数），获取其他目录的文档数。提示：readFileList() 获取 docs 下所有的 md 文档（除了 `.vuepress` 和 `@pages` 目录下的文档）
      totalWords: 'archives',  // 开启本站文档总字数。1. archives 获取归档的文档数（使用 archives 条件：传入 eachFileWords，否则报错）。2. readTotalFileWords(['xx']) 排除 xx 目录（可多个，可不传参数），获取其他目录的文章字数。无默认值
      moutedEvent: '.tags-wrapper',   // 首页的站点模块挂载在某个元素后面（支持多种选择器），指的是挂载在哪个兄弟元素的后面，默认是热门标签 '.tags-wrapper' 下面，提示：'.categories-wrapper' 会挂载在文章分类下面。'.blogger-wrapper' 会挂载在博客头像模块下面
      // 下面两个选项：第一次获取访问量失败后的迭代时间
      indexIteration: 2500,   // 如果首页获取访问量失败，则每隔多少时间后获取一次访问量，直到获取成功或获取 10 次后。默认 3 秒。注意：设置时间太低，可能导致访问量 + 2、+ 3 ......
      pageIteration: 2500,    // 如果文章页获取访问量失败，则每隔多少时间后获取一次访问量，直到获取成功或获取 10 次后。默认 3 秒。注意：设置时间太低，可能导致访问量 + 2、+ 3 ......
      // 说明：成功获取一次访问量，访问量 + 1，所以第一次获取失败后，设置的每个隔段重新获取时间，将会影响访问量的次数。如 100 可能每次获取访问量 + 3
    }
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
    }],
    {
      name: 'custom-plugins',
      globalUIComponents: ["PageInfo"] // 2.x 版本 globalUIComponents 改名为 clientAppRootComponentFiles
    }
  ]
}
