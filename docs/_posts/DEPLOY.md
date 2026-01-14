# Vercel 部署指南

本指南将详细介绍如何将 VuePress 博客部署到 Vercel 上。

## 准备工作

1. **创建 Vercel 账号**
   - 访问 [Vercel 官网](https://vercel.com/)
   - 使用 GitHub、GitLab 或 Bitbucket 账号登录

2. **将项目托管到 Git 仓库**
   - 在 GitHub、GitLab 或 Bitbucket 上创建一个新的仓库
   - 将本地项目推送到远程仓库

## 部署步骤

### 方法一：通过 Git 集成部署（推荐）

1. **登录 Vercel 控制台**
   - 访问 [Vercel 控制台](https://vercel.com/dashboard)

2. **创建新项目**
   - 点击 "New Project" 按钮
   - 选择你的 Git 仓库
   - 点击 "Import" 按钮

3. **配置部署选项**
   - Project Name: 输入项目名称（可选）
   - Framework Preset: 选择 "VuePress" 或 "Other"
   - Build Command: 保持默认的 `npm run build`
   - Output Directory: 保持默认的 `docs/.vuepress/dist`
   - Environment Variables: 可根据需要添加（可选）

4. **部署项目**
   - 点击 "Deploy" 按钮
   - 等待部署完成
   - 部署完成后，Vercel 会提供一个临时域名访问你的网站

### 方法二：通过 Vercel CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   在项目目录中运行：
   ```bash
   vercel
   ```
   按照提示完成部署流程。

## 配置自定义域名

1. **添加域名**
   - 在 Vercel 控制台中，进入已部署的项目
   - 点击 "Settings" > "Domains"
   - 输入你的域名，点击 "Add"

2. **配置 DNS 记录**
   - 按照 Vercel 提供的 DNS 记录信息，在你的域名提供商处添加相应的记录
   - 通常需要添加一个 CNAME 记录，指向 `cname.vercel-dns.com`

3. **验证域名**
   - 等待 DNS 记录生效（通常需要几分钟到几小时）
   - Vercel 会自动验证域名并配置 HTTPS

## 持续集成

当你将代码推送到 Git 仓库时，Vercel 会自动重新部署你的网站，实现持续集成。

### 分支部署

Vercel 会为每个 Git 分支创建一个独立的部署环境，方便你在合并代码前预览更改。

## 部署后的管理

### 查看部署历史
- 在 Vercel 控制台中，进入项目的 "Deployments" 标签页
- 可以查看所有的部署历史，包括部署时间、部署人、部署状态等

### 查看网站统计
- 在 Vercel 控制台中，进入项目的 "Analytics" 标签页
- 可以查看网站的访问量、页面浏览量、平均停留时间等统计信息

### 配置环境变量
- 在 Vercel 控制台中，进入项目的 "Settings" > "Environment Variables"
- 可以添加、编辑和删除环境变量

### 设置部署钩子
- 在 Vercel 控制台中，进入项目的 "Settings" > "Git"
- 可以配置部署钩子，实现自动化部署

## 常见问题

### 部署失败怎么办？
- 查看部署日志，了解失败原因
- 检查构建命令是否正确
- 检查输出目录是否正确
- 确保项目依赖已正确安装

### 网站访问速度慢怎么办？
- Vercel 已内置全球 CDN 加速，通常不需要额外配置
- 可以优化图片大小和数量
- 可以启用浏览器缓存

### 如何回滚到之前的部署？
- 在 Vercel 控制台中，进入项目的 "Deployments" 标签页
- 找到需要回滚的部署版本
- 点击 "Redeploy" 按钮

## 总结

Vercel 是一个非常适合部署静态网站的平台，它提供了简单易用的部署流程和强大的功能。通过本指南的步骤，你应该能够成功地将你的 VuePress 博客部署到 Vercel 上，并享受 Vercel 提供的全球 CDN 加速、自动 HTTPS 等优质服务。