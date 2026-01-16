const fs = require('fs')
const path = require('path')

// 分类名称映射（将目录名转换为中文显示名）
const categoryNameMap = {
  '_front': '前端',
  '_Java': 'Java',
  '_multithreading': '多线程',
  '_data_structures_and_algorithms': '数据结构与算法',
  '_computer': '计算机基础',
  '_jvm': 'JVM',
  '_relational_db': '关系型数据库',
  '_non_relational_db': '非关系型数据库',
  '_spring_project': 'Spring 项目',
  '_distributed': '分布式',
  '_development': '开发工具',
  '_linux': 'Linux',
  '_finance': '金融',
  '_other': '其他',
  '_network': '网络',
  '_middleware': '中间件',
  '_architecture': '架构设计',
  '_ai': 'AI',
  '_python': 'Python',
  '_question': '问题记录'
}

/**
 * 自动生成侧边栏配置
 * @param {string} postsDir - _posts 目录路径
 * @returns {Object} sidebar 配置对象
 */
function generateSidebar(postsDir) {
  const sidebar = {}
  const sidebarContent = []

  // 读取 _posts 目录
  if (!fs.existsSync(postsDir)) {
    console.warn(`目录不存在: ${postsDir}`)
    return { '/_posts/': [] }
  }

  const items = fs.readdirSync(postsDir, { withFileTypes: true })
  
  // 按目录分组
  const dirs = items
    .filter(item => item.isDirectory() && item.name.startsWith('_'))
    .map(item => item.name)
    .sort()

  dirs.forEach(dirName => {
    const dirPath = path.join(postsDir, dirName)
    const files = fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.md') && file !== 'index.md')
      .map(file => file.replace('.md', ''))
      .sort()

    if (files.length > 0) {
      // 获取分类显示名
      const categoryName = categoryNameMap[dirName] || dirName.replace(/^_/, '')
      
      sidebarContent.push({
        title: categoryName,
        collapsable: false,
        children: files.map(file => `/_posts/${dirName}/${file}`)
      })
    }
  })

  // 为所有可能的路径配置相同的 sidebar
  // 包括根路径和所有子目录路径
  sidebar['/_posts/'] = sidebarContent
  dirs.forEach(dirName => {
    sidebar[`/_posts/${dirName}/`] = sidebarContent
    // 也添加不带尾部斜杠的路径匹配
    sidebar[`/_posts/${dirName}`] = sidebarContent
  })

  // 调试输出（开发时可以看到生成的配置）
  if (process.env.NODE_ENV !== 'production') {
    console.log('生成的侧边栏路径:', Object.keys(sidebar))
    console.log('侧边栏分类数量:', sidebarContent.length)
  }

  return sidebar
}

// 自动生成侧边栏
const postsDir = path.join(__dirname, '../_posts')
const sidebar = generateSidebar(postsDir)

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
    // 自动生成的左侧总目录（整体目录，不随页面展开）
    sidebar: sidebar,
    // 右侧目录深度（显示当前页面的目录）
    sidebarDepth: 3,
    // 不在左侧边栏显示当前页面的标题（只显示整体目录）
    displayAllHeaders: false,
    // 分类 / 标签页
    category: true,
    tag: true,
    archive: true,
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