const { readFileList, readTotalFileWords, readEachFileWords } = require('./webSiteInfo/readFile');

module.exports = {
  title: 'disgare 的博客',
  description: '记录学习到的知识',
  base: '/yf_blog/',
  theme: 'vdoing',
  head: [
    ['link', { rel: 'icon', href: '/blogger_icon.ico' }],
    ['meta', { name: 'theme-color', content: '#14204193' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
    ['meta', { name: 'referrer', content: 'no-referrer-when-downgrade' }],
    ['link', { rel: 'stylesheet', href: 'https://at.alicdn.com/t/font_3077305_pt8umhrn4k9.css' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' }]
  ],
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '博客', link: '/_posts/' },
      { text: '分类', link: '/categories/' },
      { text: '标签', link: '/tags/' },
      {
        text: '专栏',
        items: [
          { text: 'Java', link: '/04.Java/' },
          { text: '分布式', link: '/13.分布式/' },
          { text: '架构设计', link: '/14.架构设计/' },
          { text: 'AI', link: '/15.AI/' }
        ]
      }
    ],
    sidebar: 'structuring',
    sidebarDepth: 4,
    category: true,
    tag: true,
    archive: true,
    lastUpdated: '最后更新',
    search: true,
    searchMaxSuggestions: 10,
    rightMenuBar: true,
    pageButton: true,
    blogInfo: {
      blogCreate: '2020-10-19',
      indexView: true,
      pageView: true,
      readingTime: true,
      eachFileWords: readEachFileWords([''], 300, 160),
      mdFileCountType: 'archives',
      totalWords: 'archives',
      moutedEvent: '.tags-wrapper',
      indexIteration: 2500,
      pageIteration: 2500
    }
  },
  markdown: {
    lineNumbers: true,
    extractHeaders: ['h2', 'h3', 'h4', 'h5']
  },
  plugins: [
    ['@vuepress/search', {
      searchMaxSuggestions: 10
    }],
    {
      name: 'custom-plugins',
      globalUIComponents: ["PageInfo"]
    }
  ]
}
