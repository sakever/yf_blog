module.exports = {
  title: '易凡的博客',
  description: '记录学习到的知识',
  base: '/',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' }]
  ],
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '博客', link: '/_posts/' }
    ],
    sidebar: 'auto',
    sidebarDepth: 2,
    lastUpdated: '最后更新',
    repo: '',
    repoLabel: 'GitHub',
    editLinks: false,
    editLinkText: ''
  },
  markdown: {
    lineNumbers: true,
    extractHeaders: ['h2', 'h3', 'h4']
  }
}