const fs = require('fs');
const path = require('path');

/**
 * 生成 VuePress(v1) vdoing 主题侧边栏配置：
 * - 扫描 docs/_posts 下的一级目录（如 _ai、_architecture）
 * - 每个目录生成一个分组，children 为该目录下所有 .md（排除 index.md / README.md）
 * - 忽略 image 等资源目录
 *
 * 输出到：docs/.vuepress/sidebar.generated.js
 */

const repoRoot = path.resolve(__dirname, '..');
const postsDir = path.join(repoRoot, 'docs', '_posts');
const outFile = path.join(repoRoot, 'docs', '.vuepress', 'sidebar.generated.js');

// 目录显示名（可按需补充/修改）
const TITLE_MAP = {
  _ai: 'AI',
  _architecture: '架构设计',
  _computer: '计算机基础',
  _data_structures_and_algorithms: '数据结构与算法',
  _development: '开发工具',
  _distributed: '分布式',
  _front: '前端',
  _finance: '金融',
  _Java: 'Java',
  _jvm: 'JVM',
  _linux: 'Linux',
  _middleware: '中间件',
  _multithreading: '多线程',
  _network: '网络',
  _non_relational_db: '非关系型数据库',
  _other: '其他',
  _python: 'Python',
  _question: '问题记录',
  _relational_db: '关系型数据库',
  _spring_project: 'Spring 项目'
};

// 分组顺序（不写则按目录名排序）
const ORDER = [
  '_ai',
  '_architecture',
  '_computer',
  '_data_structures_and_algorithms',
  '_development',
  '_distributed',
  '_front',
  '_Java',
  '_jvm',
  '_linux',
  '_middleware',
  '_multithreading',
  '_network',
  '_non_relational_db',
  '_other',
  '_python',
  '_question',
  '_relational_db',
  '_spring_project',
  '_finance',
];

function isDirectory(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function listTopLevelPostDirs() {
  if (!isDirectory(postsDir)) {
    throw new Error(`目录不存在：${postsDir}`);
  }
  const dirs = fs
    .readdirSync(postsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => name !== 'image');

  const orderSet = new Set(ORDER);
  const inOrder = ORDER.filter((d) => dirs.includes(d));
  const rest = dirs.filter((d) => !orderSet.has(d)).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  return [...inOrder, ...rest];
}

function listMarkdownFiles(dirName) {
  const abs = path.join(postsDir, dirName);
  if (!isDirectory(abs)) return [];
  return fs
    .readdirSync(abs, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => n.toLowerCase().endsWith('.md'))
    .filter((n) => !['index.md', 'readme.md'].includes(n.toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
}

function toVuepressPath(dirName, fileName) {
  // VuePress 侧边栏需要用 POSIX 路径
  const p = path.posix.join('/_posts', dirName, fileName);
  return p;
}

function buildSidebar() {
  const dirNames = listTopLevelPostDirs();
  const sidebarContent = dirNames
    .map((dirName) => {
      const childrenFiles = listMarkdownFiles(dirName);
      if (childrenFiles.length === 0) return null;
      return {
        title: TITLE_MAP[dirName] || dirName.replace(/^_/, ''),
        collapsable: false,
        children: childrenFiles.map((f) => toVuepressPath(dirName, f))
      };
    })
    .filter(Boolean);

  const sidebar = {
    '/_posts/': sidebarContent
  };
  for (const dirName of dirNames) {
    sidebar[`/_posts/${dirName}/`] = sidebarContent;
  }

  return { sidebarContent, sidebar };
}

function writeOut({ sidebarContent, sidebar }) {
  const content =
    '// 此文件由 scripts/gen-sidebar.js 自动生成，请勿手动编辑。\n' +
    '// 若需调整顺序/标题，请修改 scripts/gen-sidebar.js 中的 ORDER / TITLE_MAP。\n' +
    '\n' +
    `const sidebarContent = ${JSON.stringify(sidebarContent, null, 2)}\n\n` +
    `const sidebar = ${JSON.stringify(sidebar, null, 2)}\n\n` +
    'module.exports = sidebar\n';

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, content, 'utf8');
}

function main() {
  const built = buildSidebar();
  writeOut(built);
  // eslint-disable-next-line no-console
  console.log(`✅ sidebar 已生成：${path.relative(repoRoot, outFile)}`);
}

main();


