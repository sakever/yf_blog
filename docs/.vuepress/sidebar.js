// 侧边栏配置
module.exports = {
  '/_posts/': [
    {
      title: '前端',
      collapsable: true,
      children: [
        '_front/vercel-deploy',
        '_front/vuepress-guide'
      ]
    },
    {
      title: '后端',
      collapsable: true,
      children: []
    },
    {
      title: '数据库',
      collapsable: true,
      children: []
    },
    {
      title: '其他',
      collapsable: true,
      children: []
    }
  ],
  '/': [
    {
      title: '首页',
      collapsable: false,
      children: ['']
    }
  ]
}