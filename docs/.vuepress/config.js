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
    nav: [
      { text: '首页', link: '/' },
      { text: '博客', link: '/_posts/' },
      { text: '分类', link: '/categories/' },
      { text: '标签', link: '/tags/' }
    ],
    sidebar: { mode: 'structuring', collapsable: false },
    sidebarOpen: true,
    sidebarDepth: 3,
    category: true,
    tag: true,
    archive: true,
    categoryText: '随笔',
    lastUpdated: '最后更新',
    search: true,
    searchMaxSuggestions: 10,
    rightMenuBar: true,
    pageButton: true
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