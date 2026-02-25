const fs = require('fs');
const path = require('path');

/**
 * 生成 VuePress(v1) vdoing 主题侧边栏配置（优雅版）
 * - 使用 VuePress 的自动侧边栏功能，无需硬编码所有文件路径
 * - 只配置必要的路径映射，大幅减少文件大小
 * - 支持自动扫描目录下的所有 .md 文件
 *
 * 输出到：docs/.vuepress/sidebar.js
 */

const repoRoot = path.resolve(__dirname, '..');
const postsDir = path.join(repoRoot, 'docs', '_posts');
const outFile = path.join(repoRoot, 'docs', '.vuepress', 'sidebar.js');

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

function buildSidebar() {
  const dirNames = listTopLevelPostDirs();

  // 优雅的侧边栏配置：使用 VuePress 的自动侧边栏功能
  // 只配置路径映射，让 VuePress 自动扫描目录下的所有 .md 文件
  const sidebar = {
    // 全局侧边栏：所有 /_posts/ 下的页面都显示相同的侧边栏
    '/_posts/': dirNames.map((dirName) => {
      return {
        title: TITLE_MAP[dirName] || dirName.replace(/^_/, ''),
        collapsable: false,
        // 使用自动侧边栏：深度为 2，自动扫描该目录下的所有 .md 文件
        // 这样就不需要硬编码所有文件路径了
        children: `/_posts/${dirName}/`,
        sidebarDepth: 2
      };
    })
  };

  return { sidebar };
}

function writeOut({ sidebar }) {
  const content =
    '// 此文件由 scripts/gen-sidebar.js 自动生成，请勿手动编辑。\n' +
    '// 若需调整顺序/标题，请修改 scripts/gen-sidebar.js 中的 ORDER / TITLE_MAP。\n' +
    '// 使用 VuePress 自动侧边栏功能，大幅减少文件大小。\n' +
    '\n' +
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
