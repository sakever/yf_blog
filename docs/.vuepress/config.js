const fs = require('fs');
const path = require('path');

function getSidebarContent() {
  const postsPath = path.join(__dirname, '../../_posts');
  const categories = [];

  if (!fs.existsSync(postsPath)) {
    return categories;
  }

  const dirs = fs.readdirSync(postsPath).filter(item => {
    const itemPath = path.join(postsPath, item);
    return fs.statSync(itemPath).isDirectory() && item.startsWith('_');
  });

  dirs.forEach(dir => {
    const dirPath = path.join(postsPath, dir);
    const files = fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.md'))
      .sort();

    if (files.length === 0) return;

    const categoryTitle = getCategoryTitle(dir);
    const children = files.map(file => `/_posts/${dir}/${file}`);

    categories.push({
      title: categoryTitle,
      collapsable: false,
      children: children
    });
  });

  return categories;
}

function getCategoryTitle(dir) {
  const titles = {
    '_ai': 'AI',
    '_architecture': '架构设计',
    '_computer': '计算机基础',
    '_data_structures_and_algorithms': '数据结构与算法',
    '_development': '开发工具',
    '_distributed': '分布式',
    '_front': '前端',
    '_finance': '金融',
    '_Java': 'Java',
    '_jvm': 'JVM',
    '_linux': 'Linux',
    '_middleware': '中间件',
    '_multithreading': '多线程',
    '_network': '网络',
    '_non_relational_db': '非关系型数据库',
    '_other': '其他',
    '_python': 'Python',
    '_question': '问题记录',
    '_relational_db': '关系型数据库',
    '_spring_project': 'Spring 项目'
  };
  return titles[dir] || dir.replace(/^_/, '');
}

const sidebarContent = getSidebarContent();

const sidebar = {
  '/_posts/': sidebarContent
};

module.exports = {
  title: 'sakever 的博客',
  description: '记录学习到的知识',
  base: '/yf_blog/',
  theme: 'vdoing',
  head: [
    ['link', { rel: 'icon', href: '/blogger_icon.ico' }],
    ['meta', { name: 'theme-color', content: '#14204193' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' }]
  ],
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '博客', link: '/_posts/' },
      { text: '分类', link: '/categories/' },
      { text: '标签', link: '/tags/' }
    ],
    sidebar: sidebar,
    sidebarDepth: 3,
    // displayAllHeaders: false,
    category: true,
    tag: true,
    archive: true,
    lastUpdated: '最后更新',
    search: true,
    searchMaxSuggestions: 10,
    rightMenuBar: true,
    pageButton: true
  },
  markdown: {
    lineNumbers: true,
    extractHeaders: ['h2', 'h3', 'h4', 'h5']
  },
  plugins: [
    ['@vuepress/search', {
      searchMaxSuggestions: 10
    }]
  ]
}
