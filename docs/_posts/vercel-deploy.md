# Vercel 部署教程

> 发布于：2024-01-14
> 分类：技术教程

## 什么是 Vercel？

Vercel 是一个云平台，专注于静态网站和无服务器函数的部署。它具有以下特点：

- 简单易用的部署流程
- 自动 HTTPS
- 全球 CDN 加速
- 支持 Git 集成
- 免费的基础计划

## 准备工作

在开始之前，你需要：

1. 一个 Vercel 账号（可以使用 GitHub、GitLab 或 Bitbucket 账号登录）
2. 一个已构建好的静态网站项目（如 VuePress 博客）
3. 将项目托管在 Git 仓库中

## 部署方法

### 方法一：通过 Vercel CLI 部署

1. 安装 Vercel CLI

```bash
npm install -g vercel
```

2. 登录 Vercel

```bash
vercel login
```

3. 在项目目录中部署

```bash
vercel
```

按照提示完成部署流程。

### 方法二：通过 Git 集成部署

1. 登录 Vercel 控制台
2. 点击 "New Project"
3. 选择你的 Git 仓库
4. 配置部署选项
5. 点击 "Deploy"

## 配置 VuePress 项目

对于 VuePress 项目，你需要确保以下配置正确：

1. 确保 `package.json` 文件中有正确的构建脚本：

```json
"scripts": {
  "build": "vuepress build docs"
}
```

2. 在 Vercel 部署配置中：
   - Build Command: `npm run build`
   - Output Directory: `docs/.vuepress/dist`

## 自定义域名

如果你有自己的域名，可以在 Vercel 控制台中配置：

1. 点击已部署的项目
2. 进入 "Settings" > "Domains"
3. 添加你的域名
4. 按照提示在域名提供商处添加 DNS 记录

## 部署后的管理

部署完成后，你可以：

- 在 Vercel 控制台中查看部署历史
- 查看网站访问统计
- 配置环境变量
- 设置部署钩子

## 持续集成

当你将代码推送到 Git 仓库时，Vercel 会自动重新部署你的网站，实现持续集成。

## 总结

Vercel 是一个非常适合部署静态网站的平台，它提供了简单易用的部署流程和强大的功能。通过本文的指南，你应该已经掌握了如何将你的 VuePress 博客部署到 Vercel 上。