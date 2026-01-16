---
title: GitHub Pages 部署教程
date: 2026-01-01

categories:
  - 前端
tags:
  - GitHub
---
# GitHub Pages 部署教程

## 什么是 GitHub Pages

GitHub Pages 是 GitHub 提供的静态网站托管服务，可以直接从 GitHub 仓库中托管个人、组织或项目的网页。它支持 HTML、CSS 和 JavaScript，也支持 Jekyll、Hugo、VuePress 等静态站点生成器。

## 部署方式

### 方式一：使用 GitHub Actions 自动部署（推荐）

这是最现代、最自动化的部署方式，适合 VuePress、Next.js 等静态站点生成器。

#### 1. 创建 GitHub Actions 配置文件

在项目根目录下创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

permissions:
  contents: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      with:
        fetch-depth: 0
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      env:
        DEPLOY_ENV: gh-pages
        
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./docs/.vuepress/dist
        publish_branch: gh-pages
```

#### 2. 配置 VuePress

在 `docs/.vuepress/config.js` 中设置正确的 `base` 路径：

```javascript
module.exports = {
  base: '/仓库名/',
  // 其他配置...
}
```

#### 3. 推送代码

```bash
git add .
git commit -m "feat: add GitHub Actions deployment"
git push origin main
```

推送后，GitHub Actions 会自动构建并部署到 `gh-pages` 分支。

#### 4. 启用 GitHub Pages

1. 进入 GitHub 仓库的 **Settings** 页面
2. 左侧菜单选择 **Pages**
3. 在 **Source** 下选择 **gh-pages** 分支
4. 点击 **Save** 保存

几分钟后，你的网站就会在 `https://用户名.github.io/仓库名/` 上线。

### 方式二：手动部署

适用于不想使用 GitHub Actions 的情况。

#### 1. 本地构建

```bash
npm run build
```

#### 2. 推送到 gh-pages 分支

```bash
git checkout -b gh-pages
git add -f docs/.vuepress/dist
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages
git checkout main
```

#### 3. 启用 GitHub Pages

按照方式一的步骤 4 启用 GitHub Pages。

## 常见问题

### 1. 403 权限错误

**问题**：GitHub Actions 部署时出现 403 错误

**解决**：在 workflow 文件中添加权限配置：

```yaml
permissions:
  contents: write
```

### 2. 缺少依赖锁文件

**问题**：GitHub Actions 报错缺少 package-lock.json

**解决**：移除 workflow 文件中的 `cache: 'npm'` 配置

### 3. 页面样式丢失

**问题**：部署后页面样式丢失

**解决**：检查 `config.js` 中的 `base` 路径是否正确，必须与仓库名一致

### 4. 首页显示不正常

**问题**：首页只显示 README.md 内容

**解决**：确保 `docs/index.md` 文件存在，并包含正确的页面内容

### 5. 自定义域名

**问题**：想使用自定义域名

**解决**：
1. 在仓库的 **Settings** -> **Pages** 中设置自定义域名
2. 在 DNS 提供商处添加 CNAME 记录指向 `用户名.github.io`
3. 在 `docs/.vuepress/public/` 目录下创建 `CNAME` 文件，内容为你的域名
4. 将 `config.js` 中的 `base` 改为 `/`

## 部署最佳实践

1. **使用 GitHub Actions**：自动化部署流程，减少手动操作
2. **设置正确的 base 路径**：确保与仓库名一致
3. **添加权限配置**：确保 GitHub Actions 有写入权限
4. **测试本地构建**：推送前先在本地测试构建是否成功
5. **监控部署日志**：遇到问题时查看 GitHub Actions 日志

## 相关资源

- [GitHub Pages 官方文档](https://docs.github.com/en/pages)
- [VuePress 官方文档](https://vuepress.vuejs.org/)
- [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages)