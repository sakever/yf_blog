module.exports = {
  // 站点标题，显示在浏览器标签页和页面左上角
  title: '易凡的博客',
  // 站点描述，用于 SEO 与 meta 标签
  description: '记录学习到的知识',
  // 站点部署的基础路径，GitHub Pages 部署时需要修改为仓库名，如 '/yf_blog/'
  // 如果使用自定义域名，可以设置为 '/'
  base: process.env.DEPLOY_ENV === 'gh-pages' ? '/yf_blog/' : '/',
  // 使用自定义主题
  theme: require.resolve('./theme'),
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
    // 顶部导航栏链接
    nav: [
      { text: '首页', link: '/' },
      { text: '博客', link: '/_posts/' },
      { text: '分类', link: '/categories/' },
      { text: '标签', link: '/tags/' }
    ],
    // 侧边栏配置（使用自动侧边栏插件）
    sidebar: 'auto',
    // 侧边栏自动提取的标题深度（h2、h3、h4）
    sidebarDepth: 3,
    // 页面底部"最后更新"文案
    lastUpdated: '最后更新',
    // 仓库地址，留空则不显示
    repo: '',
    // 仓库链接显示文字
    repoLabel: 'GitHub',
    // 是否显示"编辑此页"链接
    editLinks: false,
    // "编辑此页"链接文字（此处留空）
    editLinkText: '',
    // 是否启用搜索框
    search: true,
    // 搜索建议最大条数
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
    // 自动侧边栏插件配置
    ['vuepress-plugin-sidebar-auto', {
      // 扫描的目录
      scanPath: './_posts',
      // 是否只显示 Markdown 文件
      onlyMd: true
    }],
    // 官方搜索插件配置
    ['@vuepress/search', {
      // 搜索建议最大条数
      searchMaxSuggestions: 10
    }],
    // 分类与标签插件配置
    ['vuepress-plugin-category', {
      // 分类页面标题
      categoryText: '分类',
      // 标签页面标题
      tagText: '标签',
      // 需要生成分类/标签的页面路径
      pages: ['/_posts/']
    }]
  ]
}