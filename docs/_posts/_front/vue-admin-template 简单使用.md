---
title: vue-admin-template 简单使用
date: 2022-09-30
sidebar: ture
categories:
  - 前端
tags:
  - vue-admin-template
---
## 登录与跨域
登录需要在 env.dev 文件中修改默认访问路径，然后在 api 文件夹下修改 user 文件，api 文件夹里装有关请求访问的 js 文件的

在登录的时候可以使用开发者工具查看请求，发出的是 login 以及 getInfo 请求
```js
export function login(data) {
  return request({
    url: '/login/login',
    method: 'post',
    data
  })
}

export function getInfo(token) {
  return request({
    url: '/login/info',
    method: 'get',
    params: { token }
  })
}
```
出于安全原因，浏览器禁止Ajax调用驻留在当前原点之外的资源。例如，当你在一个标签中检查你的银行账户时，你可以在另一个选项卡上拥有EVILL网站。来自EVILL的脚本不能够对你的银行API做出Ajax请求（从你的帐户中取出钱！）使用您的凭据

其中@CrossOrigin中的2个参数：

origins： 允许可访问的域列表
maxAge:准备响应前的缓存持续的最大时间（以秒为单位）

在使用一个地址访问另一个地址的时候，出现以下三个中的一个不一样就会出现不能访问服务的问题，这个问题叫跨域问题

1，使用的协议，指http、https这些
2，IP地址，在网络上基本上每个请求都是从一个IP地址到另一个IP的，所以大部分都会出现跨域问题
3，端口号，就算IP相同，服务的端口号不同也会出现跨域

常见的解决方法有以下两种：

1，在调用服务的Controller上加上@CrossOrigin注解
2，使用网关来解决

## 路由修改
在 router 中可以修改路由，默认是侧边栏展示的，可以修改，里面的属性值如下
```js
  // 修改用户
  {
    // 前缀路径
    path: '/user',
    // 布局方式，可以修改如何布局
    component: Layout,
    // 点击这个图标，跳到哪个默认页面
    redirect: '/user/all',
    // 给开发者使用的
    name: 'user',
    // 最终展示的
    meta: { title: '用户管理', icon: 'el-icon-s-custom' },
    children: [
      {
        path: '/all',
        name: 'Table',
        // component: () => import('@/views/user/all'),
        component: Layout,
        meta: { title: '用户列表', icon: 'table' },
        // 套娃，但是需要修改 component
        children: [
          {
            path: '/all',
            name: 'Table11',
            component: () => import('@/views/user/all'),
            meta: { title: '用户列表', icon: 'table' }
          },
          {
            path: '/all',
            name: 'Table11',
            // 最终跳转的页面
            component: () => import('@/views/user/all'),
            meta: { title: '用户列表', icon: 'table' }
          }
        ]
      },
      {
        path: '/insert',
        name: 'insert',
        component: () => import('@/views/tree/index'),
        meta: { title: '增加用户', icon: 'tree' }
      }
    ]
  }
```