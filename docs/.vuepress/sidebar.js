// 此文件由 scripts/gen-sidebar.js 自动生成，请勿手动编辑。
// 若需调整顺序/标题，请修改 scripts/gen-sidebar.js 中的 ORDER / TITLE_MAP。
// 文章数据存储在 sidebar-data.js 中，此文件只包含配置结构。

const sidebarData = require('./sidebar-data')

const sidebar = {
  "/_posts/": [
    {
      title: "网络",
      collapsable: false,
      children: sidebarData['_network']
    },
    {
      title: "计算机基础",
      collapsable: false,
      children: sidebarData['_computer']
    },
    {
      title: "数据结构与算法",
      collapsable: false,
      children: sidebarData['_data_structures_and_algorithms']
    },
    {
      title: "Java",
      collapsable: false,
      children: sidebarData['_Java']
    },
    {
      title: "JVM",
      collapsable: false,
      children: sidebarData['_jvm']
    },
    {
      title: "Linux",
      collapsable: false,
      children: sidebarData['_linux']
    },
    {
      title: "中间件",
      collapsable: false,
      children: sidebarData['_middleware']
    },
    {
      title: "多线程",
      collapsable: false,
      children: sidebarData['_multithreading']
    },
    {
      title: "非关系型数据库",
      collapsable: false,
      children: sidebarData['_non_relational_db']
    },
    {
      title: "关系型数据库",
      collapsable: false,
      children: sidebarData['_relational_db']
    },
    {
      title: "Python",
      collapsable: false,
      children: sidebarData['_python']
    },
    {
      title: "Spring 项目",
      collapsable: false,
      children: sidebarData['_spring_project']
    },
    {
      title: "分布式",
      collapsable: false,
      children: sidebarData['_distributed']
    },
    {
      title: "架构设计",
      collapsable: false,
      children: sidebarData['_architecture']
    },
    {
      title: "AI",
      collapsable: false,
      children: sidebarData['_ai']
    },
    {
      title: "开发工具",
      collapsable: false,
      children: sidebarData['_development']
    },
    {
      title: "前端",
      collapsable: false,
      children: sidebarData['_front']
    },
    {
      title: "项目",
      collapsable: false,
      children: sidebarData['_project']
    },
    {
      title: "问题记录",
      collapsable: false,
      children: sidebarData['_question']
    },
    {
      title: "金融",
      collapsable: false,
      children: sidebarData['_finance']
    },
    {
      title: "其他",
      collapsable: false,
      children: sidebarData['_other']
    }
  ]
}

module.exports = sidebar
