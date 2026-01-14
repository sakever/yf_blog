# VuePress 博客搭建指南

@[TOC](VuePress 博客搭建指南)

## 什么是 VuePress？

VuePress 是一个基于 Vue 的静态网站生成器，专为技术文档和博客设计。它具有以下特点：

- 简洁的 Markdown 语法
- 内置的默认主题
- 响应式设计
- 易于扩展
- 快速的构建速度

## 环境准备

在开始之前，你需要安装以下软件：

1. Node.js (版本 >= 8.6)
2. npm 或 yarn

## 初始化项目

1. 创建一个新的目录作为你的博客项目
2. 在目录中初始化 npm 项目
3. 安装 VuePress

```bash
# 创建目录
mkdir my-blog
cd my-blog

# 初始化 npm 项目
npm init -y

# 安装 VuePress
npm install -D vuepress
```

## 配置项目结构

VuePress 项目的基本结构如下：

```
my-blog/
├── docs/
│   ├── .vuepress/
│   │   ├── config.js
│   │   └── public/
│   ├── _posts/
│   ├── about/
│   └── index.md
└── package.json
```

## 配置文件

在 `docs/.vuepress/config.js` 文件中配置你的博客：

```javascript
module.exports = {
  title: '我的博客',
  description: '记录学习到的知识',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '博客', link: '/_posts/' },
      { text: '关于', link: '/about/' }
    ]
  }
}
```

## 运行和构建

在 `package.json` 文件中添加以下脚本：

```json
"scripts": {
  "dev": "vuepress dev docs",
  "build": "vuepress build docs"
}
```

然后你可以：

- 运行 `npm run dev` 启动开发服务器
- 运行 `npm run build` 构建静态网站

## 部署

你可以将构建后的静态文件部署到任何静态网站托管服务，如 Vercel、Netlify、GitHub Pages 等。

## 总结

VuePress 是一个非常适合搭建技术博客的工具，它简单易用且功能强大。通过本文的指南，你应该已经掌握了如何使用 VuePress 搭建一个基本的博客。