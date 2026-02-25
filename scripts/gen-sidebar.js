const fs = require('fs');
const path = require('path');

/**
 * 生成 VuePress(v1) vdoing 主题侧边栏配置（优雅版）
 * - 将文章数组抽离到单独的数据文件，避免 sidebar.js 过大
 * - sidebar.js 只包含配置结构，数据在 sidebar-data.js 中
 * - 支持自动扫描目录下的所有 .md 文件
 *
 * 输出到：
 *   - docs/.vuepress/sidebar-data.js (文章数据)
 *   - docs/.vuepress/sidebar.js (侧边栏配置)
 */

const repoRoot = path.resolve(__dirname, '..');
const postsDir = path.join(repoRoot, 'docs', '_posts');
const dataFile = path.join(repoRoot, 'docs', '.vuepress', 'sidebar-data.js');
const sidebarFile = path.join(repoRoot, 'docs', '.vuepress', 'sidebar.js');

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
  _spring_project: 'Spring 项目',
  _project: '项目',
};

// 分组顺序（不写则按目录名排序）
const ORDER = [
  '_network',
  '_computer',
  '_data_structures_and_algorithms',
  '_Java',
  '_jvm',
  '_linux',
  '_middleware',
  '_multithreading',
  '_non_relational_db',
  '_relational_db',
  '_python',
  '_spring_project',
  '_distributed',
  '_architecture',
  '_ai',
  '_development',
  '_front',
  '_project',
  '_question',
  '_finance',
  '_other',
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
  const p = path.posix.join('/_posts', dirName, fileName);
  return p;
}

function buildSidebarData() {
  const dirNames = listTopLevelPostDirs();
  
  // 生成每个分类的文章数据
  const categoryData = {};
  dirNames.forEach((dirName) => {
    const files = listMarkdownFiles(dirName);
    if (files.length > 0) {
      categoryData[dirName] = files.map((f) => toVuepressPath(dirName, f));
    }
  });

  return { categoryData, dirNames };
}

function writeSidebarData({ categoryData, dirNames }) {
  const content =
    '// 此文件由 scripts/gen-sidebar.js 自动生成，请勿手动编辑。\n' +
    '// 包含所有分类的文章路径数据，供 sidebar.js 引用。\n' +
    '\n' +
    `const sidebarData = ${JSON.stringify(categoryData, null, 2)}\n\n` +
    'module.exports = sidebarData\n';

  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, content, 'utf8');
}

function writeSidebarConfig({ dirNames }) {
  // 直接生成 JavaScript 代码，不使用 JSON.stringify
  const items = dirNames.map((dirName) => {
    const title = JSON.stringify(TITLE_MAP[dirName] || dirName.replace(/^_/, ''));
    return `    {
      title: ${title},
      collapsable: false,
      children: sidebarData['${dirName}']
    }`;
  }).join(',\n');

  const content =
    '// 此文件由 scripts/gen-sidebar.js 自动生成，请勿手动编辑。\n' +
    '// 若需调整顺序/标题，请修改 scripts/gen-sidebar.js 中的 ORDER / TITLE_MAP。\n' +
    '// 文章数据存储在 sidebar-data.js 中，此文件只包含配置结构。\n' +
    '\n' +
    'const sidebarData = require(\'./sidebar-data\')\n' +
    '\n' +
    'const sidebar = {\n' +
    '  "/_posts/": [\n' +
    items + '\n' +
    '  ]\n' +
    '}\n' +
    '\n' +
    'module.exports = sidebar\n';

  fs.mkdirSync(path.dirname(sidebarFile), { recursive: true });
  fs.writeFileSync(sidebarFile, content, 'utf8');
}

function main() {
  const { categoryData, dirNames } = buildSidebarData();
  
  // 生成数据文件
  writeSidebarData({ categoryData, dirNames });
  console.log(`✅ sidebar-data.js 已生成：${path.relative(repoRoot, dataFile)}`);
  
  // 生成配置文件
  writeSidebarConfig({ dirNames });
  console.log(`✅ sidebar.js 已生成：${path.relative(repoRoot, sidebarFile)}`);
}

main();
