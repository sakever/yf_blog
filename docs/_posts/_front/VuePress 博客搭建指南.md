---
title: VuePress 博客搭建指南
date: 2026-01-03
sidebar: true
categories:
  - 前端
tags:
  - VuePress
---
## VuePress 博客搭建指南

### 什么是 VuePress？

VuePress 是一个基于 Vue 的静态网站生成器，专为技术文档和博客设计。它具有以下特点：

- 简洁的 Markdown 语法
- 内置的默认主题
- 响应式设计
- 易于扩展
- 快速的构建速度

### 初始化项目

1. 创建一个新的目录作为你的博客项目
2. 在目录中初始化 npm 项目
3. 安装 VuePress

```bash
## 创建目录
mkdir my-blog
cd my-blog

## 初始化 npm 项目
npm init -y

## 安装 VuePress
npm install -D vuepress
```

### 配置项目结构

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
└── vercel.json
```

### 配置文件

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

### 运行和构建

在 `vercel.json` 文件中添加以下脚本：

```json
"scripts": {
  "dev": "vuepress dev docs",      // 启动开发服务器，支持热更新
  "build": "vuepress build docs"   // 构建静态网站，生成可部署的文件
}
```
下面是另外一个例子：
```json
{
  // 设置静态资源缓存策略：字体文件缓存一年且不可变
  "headers": [
    {
      "source": "/fonts/inter-var-latin.woff2",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  // 配置定时任务：每天凌晨 1 点调用 /api/cron/mtvpls 接口
  "crons": [
    {
      "path": "/api/cron/mtvpls",
      "schedule": "0 1 * * *"
    }
  ],
  // 指定部署区域：香港（hkg1）与新加坡（sin1）
  "regions": ["hkg1", "sin1"]
}
```

然后你可以：

- 运行 `npm run dev` 启动开发服务器
- 运行 `npm run build` 构建静态网站

在 Vercel 上，你可以直接将构建后的静态文件部署到 Vercel 平台。只要有 vercel.json 文件，Vercel 就会自动识别并部署你的博客。

一些纯前端项目也可以部署到 Netlify、GitHub Pages、cloudflare pages 上

### 总结

VuePress 是一个非常适合搭建技术博客的工具，它简单易用且功能强大。通过本文的指南，你应该已经掌握了如何使用 VuePress 搭建一个基本的博客。