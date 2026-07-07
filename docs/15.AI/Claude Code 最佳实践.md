---
title: Claude Code 最佳实践
date: 2026-07-06
categories:
  - AI
tags:
  - Claude Code
  - AI Coding
---

Claude Code 是 Anthropic 推出的智能终端助手，特别适合处理大型、复杂的代码库。可以在终端里直接通过对话完成重构、调试、代码生成等任务。但要让 Claude Code 真正高效工作，需要掌握一些配置和用法技巧。本文整理了我使用 Claude Code 过程中的最佳实践，涵盖项目配置、规则管理、Skills 组织和效率优化等方面。

[Claude Code安装配置及接入Deepseek](https://blog.csdn.net/2401_87660168/article/details/160448189)
[Claude Code 官方文档](https://code.claude.com/docs/zh-CN/overview)

## CLAUDE.md 很重要

CLAUDE.md 是 Claude Code 的核心配置文件，它告诉 Claude 这个项目有哪些规则、约定和坑点。但 CLAUDE.md 最好别写成第二份 README——它更像是写给 Claude Code 的项目备忘录：哪些规则代码里看不出来、哪些命令经常被它猜错、哪些目录不要碰、改完某类代码必须跑哪条测试。

### 该放什么

我的项目文件里通常只留这些东西：

- **Claude 容易猜错的规则**：比如非标准的目录结构、特殊的命名约定
- **代码里读不出来的约定**：团队内部的编码规范、提交信息格式
- **团队必须遵守的规范**：错误码格式、API 设计约定
- **技术栈版本**：框架版本、语言版本、关键依赖版本
- **常用命令**：构建、测试、部署命令
- **架构取舍**：为什么选了 A 而不是 B，有哪些历史决策
- **项目坑点**：已知的兼容性问题、特殊的环境配置

官方文档建议每份 CLAUDE.md 目标控制在 200 行以内。文件太长会消耗更多上下文，也可能降低规则遵守度。内容继续膨胀时，再拆到带 `paths` 的 `.claude/rules/`，低频参考内容放进 Skills。

我判断一条规则该不该留，会问一句：这行删掉后，Claude 会不会更容易犯错。如果会，就保留；如果不会，直接删掉。

### 文件加载顺序以及维护

CLAUDE.md 可以放在多个位置，官方的加载顺序大致从全局到局部：

```
my-project/
├── CLAUDE.md                  # 项目根配置（全局）
├── backend/
│   └── CLAUDE.md              # 子目录配置（局部）
├── frontend/
│   └── CLAUDE.md              # 子目录配置（局部）
└── .claude/
    ├── rules/                 # 带 paths 的规则文件
```

带有 `paths` 的规则：在 `.claude/rules/` 目录下，通过 YAML Frontmatter 指定了 `paths` 的规则文件，只对匹配路径的文件生效。比如后端规则只作用于 `backend/` 下的代码。

如果在团队中个人有一些特殊的写法，可以使用个人配置。个人配置用本地级配置，比项目级高一级。`.local` 文件可以出现在任何场合：

```
my-project/
├── CLAUDE.md
├── CLAUDE.local.md            # 个人本地配置（优先级更高）
├── backend/
│   ├── CLAUDE.md
│   └── CLAUDE.local.md
├── frontend/
│   └── CLAUDE.md
│   └── CLAUDE.local.md
└── .claude/
    ├── rules/
```

`.local` 文件适合放个人的偏好配置、本地路径、个人 API key 等，可以在 gitignore 中配置不被提交到 git。

rules 中的内容不一定会全部加载。这取决于规则文件的类型和位置，按需加载（Scoped Rules）的核心触发条件是 paths 字段，比如：

```yaml
---
alwaysApply: false
description: RPC 通信开发规范：注解、Protocol 生成、Handler 开发流程
paths:
  - "**/*Rpc*.java"       # 读取 RPC 相关 Java 文件时加载
  - "**/rpc/**/*.proto"   # 读取 proto 文件时加载
  - "**/handler/**/*.java"
---
```
如果你不想设置 paths，但又希望偶尔使用它，可以在对话中手动引用它，比如输入：

“请参考 .claude/rules/rpc规范.md 中的内容...”

但这属于手动调用，不属于系统自动的按需加载机制。如果想实现自动化，记得一定要加上 paths
## 配置分层管理

Claude Code 的设置分为三层（从低到高）：

```
用户全局 settings.json  <  项目共享 .claude/settings.json  <  项目本地 .claude/settings.local.json
```

- **用户全局**（`~/.claude/settings.json`）：对所有项目生效，放通用的权限规则和个人偏好
- **项目共享**（`.claude/settings.json`）：随项目提交，放团队共享的配置
- **项目本地**（`.claude/settings.local.json`）：不提交到 git，放个人在项目中的特殊配置

分层设计的好处是：团队可以在项目共享配置中统一规则，个人再通过 local 文件覆盖。遇到权限弹窗频繁的问题，可以用 `/fewer-permission-prompts` 命令自动生成 allowlist。

## 额外工具

### CodeGraph 检索优化

CodeGraph 是一个为 AI 编程助手（如Claude Code、Cursor等）设计的代码知识图谱工具。它能把你的代码库解析成一张语义知识图谱，让 AI 不再盲目地 grep 扫描文件，而是直接查询结构化数据，从而降低 Token 消耗、提升响应速度，并且完全在本地运行。

拿 Java 或 TypeScript 项目来说，Claude 想知道某个类在哪里定义、被谁调用，不一定非得先搜关键词，再挨个打开文件确认。安装上这个，可以省 35% 费用、减少 70% 工具调用，大大减少了 agent 的 grep 和 read 次数

安装方式可以参考以下博客，里面推荐脚本安装，会自动将合适的 prompt 写入全局配置中，目前最新版本的 CodeGraph 有且只有一个 tool codegraph_explore，如果你发现 CodeGraph 安装了 codegraph_search、codegraph_node 等一坨 tool，请升级一下版本

[如何节省你的token，请看CodeGraph](https://juejin.cn/post/7648643814988120107)

### cc-switch 快速切模型
[Claude Code Switch 中文指南](https://www.ccswitch.io/zh/)

CC Switch 是一款跨平台桌面应用，专为使用 AI 编程工具的开发者设计。它帮助你统一管理 Claude Code、Claude Desktop、Codex、Gemini CLI、OpenCode、OpenClaw 和 Hermes 等受管应用的配置。

在日常开发中，你可能会遇到这些痛点：

- 多供应商切换麻烦：使用不同的 API 供应商（官方、中转服务商），需要手动修改配置文件
- 配置分散难管理：Claude Code、Claude Desktop、Codex、Gemini、OpenCode、OpenClaw、Hermes 各有独立的配置文件，格式不同
- 无法监控用量：不知道 API 调用了多少次，花了多少钱
- 服务不稳定：单一供应商出问题时，整个工作流中断

CC Switch 通过统一的界面解决这些问题。

### Superpowers

Superpowers 是一套给 AI 编程工具用的开发流程技能包，它让 AI 在写代码之前先梳理需求、制定计划，减少反复修改的次数。它把软件开发里的关键环节 -- 需求梳理、实现规划、测试驱动开发、代码审查、分支管理等等整理成技能文件，装进 AI 编程工具后，AI 会在合适的时机自动触发对应的工作流，不需要每次手动提示。

[Superpowers 使用指南](https://www.runoob.com/skills/superpowers-skill.html)
[Superpowers 中文特供版](https://pi.dev/packages/superpowers-zh)
![](image/image-21.png)
### CCH 头问题处理

问题描述为用 Claude Code 接 DeepSeek API，明明代码没怎么变，token 消耗却突然涨了好几倍，一天就把额度用完了。这个情况不是个例。在 GitHub 上，至少有 80 多个相关 issue，核心问题都指向同一个点——Claude CLI 默认添加的 CCH（Claude Code Attribution Header）导致第三方服务的缓存失效。

Claude Code 每次向模型发送请求时，会在系统提示词（system prompt）的最开头插入一段特殊字符串，格式类似这样：anthropic-attribution: cch=abc123-def456-ghi789-jkl012

这段字符串相当于一个请求指纹，每次请求都不一样。

很多第三方 API 服务（包括各种中转站、代理网关）都有提示词缓存机制。当你发送一个请求时，服务会把请求内容的开头部分作为缓存。如果下次请求的开头和之前一样，就直接用缓存，不用重新计算 KV。这样既省时间，又省 token。但是 Claude Code 每次在开头塞的 CCH 都在变，第三方服务就会以为这是个全新的请求，缓存完全失效，只能从头开始计算。结果就是响应变慢，token 消耗暴涨

解决方法很简单：在 Claude Code 的配置里禁用 CCH。请打开 cc 的安装目录，点击 settings.json，编辑：

```json
  "env": {
    "CLAUDE_CODE_ATTRIBUTION_HEADER": "0"
  }
```

## Skills：可复用的任务模板

### Rules vs Skill

规则文件和 Skill 不要混着用：

- **规则文件**放长期约束，比如技术栈版本、启动命令、目录结构、错误码格式、哪些文件不能碰
- **Skill** 放任务步骤，比如代码审查、写测试、改前端页面、网页调研、写技术文章。这些任务每次走法都差不多，不必在聊天里反复提醒

Skill 就是一份按需加载的任务说明。某类任务怎么做、有哪些约束、要检查哪些点、踩过哪些坑，都写进 SKILL.md。

它和 CLAUDE.md 的一个关键区别在于**加载时机**。Claude 默认只看到 Skill 的名称和描述，用来判断是否该调用；调用这个 Skill 时，SKILL.md 正文和相关资源才会进入上下文。这样一来，不常用的技能不会一直占用上下文窗口。

用户级 Skill 放在 `~/.claude/skills/`，项目级 Skill 放在 `.claude/skills/`。

还有一个版本变化要注意：Claude Code 里 custom commands 已经合并进 Skills。`.claude/commands/deploy.md` 和 `.claude/skills/deploy/SKILL.md` 都能创建 `/deploy` 这类命令；旧的 `.claude/commands/` 还能用，新内容更推荐按 Skill 组织。

### 哪些场景适合沉淀为 Skill

重复性很强的步骤都可以沉淀成 Skill：

- **TDD 开发流程**：写功能前固定走 TDD，先写失败测试再实现
- **代码审查**：固定检查安全、事务、性能和边界条件
- **技术文章写作**：固定核对事实来源、引用、标题层级和 AI 味
- **部署流程**：固定检查构建、测试、环境变量、回滚策略

这比每次在 prompt 里补一长串提醒稳定得多。官方对 Skill 的定义也接近这个意思：一组可复用的指令、脚本和资源，让 Claude 按固定步骤处理某类任务。

第三方 Skill 不要拿来就跑。SKILL.md 本身就是指令，里面如果带了危险命令、奇怪脚本、过宽权限，Agent 可能会照着做。装之前至少看一眼正文、`scripts/` 和 `references/`，确认它没有越权操作。
