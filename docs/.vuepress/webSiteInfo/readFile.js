// require 导入模块，fs 是一个对象，可以调用里面的方法
const fs = require('fs'); // 文件系统模块，用于读取文件和目录
const path = require('path'); // 路径处理模块，用于处理文件路径
const matter = require('gray-matter'); // FrontMatter解析器，用于解析Markdown文件头部的元数据
const chalk = require('chalk') // 命令行输出美化工具，让错误和警告信息更醒目
const log = console.log
// __dirname 是 Node.js 中的内置全局变量，表示当前模块所在目录的绝对路径
const docsRoot = path.join(__dirname, '..', '..', '..', 'docs');

/**
 * 获取本站的文章数据
 * 获取所有的 md 文档，可以排除指定目录下的文档
 * 
 * @param {Array} excludeFiles - 需要排除的目录名称数组，例如 ['_posts', 'about']
 * @param {string} dir - 要扫描的目录路径，默认为docs目录
 * @param {Array} filesList - 递归时使用的文件列表参数，外部调用时不需要传
 * @returns {Array} 返回文件信息数组，每个元素包含 {name: 文件名, filePath: 文件完整路径}
 */
function readFileList(excludeFiles = [''], dir = docsRoot, filesList = []) {
    // 读取指定目录下的所有文件和文件夹名称
    const files = fs.readdirSync(dir);
    files.forEach((item, index) => {
        let filePath = path.join(dir, item); // 拼接得到文件或文件夹的完整路径
        const stat = fs.statSync(filePath); // 获取文件或文件夹的状态信息（判断是文件还是目录）
        
        // 检查参数是否为数组类型
        if (!(excludeFiles instanceof Array)) {
            log(chalk.yellow(`error: 传入的参数不是一个数组。`))
        }
        
        // 遍历需要排除的目录
        excludeFiles.forEach((excludeFile) => {
            // 如果是目录，且不是 .vuepress 和 @pages 目录，且不在排除列表中
            if (stat.isDirectory() && item !== '.vuepress' && item !== '@pages' && item !== excludeFile) {
                // 递归读取该目录下的文件
                readFileList(excludeFiles, path.join(dir, item), filesList);
            } else if (stat.isFile() && path.extname(filePath) === '.md') {
                // 如果是文件且扩展名为 .md，则处理该文件
                const fileNameArr = path.basename(filePath).split('.')
                let name = null, type = null;
                
                if (fileNameArr.length === 2) { // 没有序号的文件，例如 "文章名.md"
                    name = fileNameArr[0]
                    type = fileNameArr[1]
                } else if (fileNameArr.length === 3) { // 有序号的文件，例如 "01.文章名.md"
                    name = fileNameArr[1]
                    type = fileNameArr[2]
                } else { // 超过两个点号的文件名，不符合命名规范
                    log(chalk.yellow(`warning: 该文件 "${filePath}" 没有按照约定命名，将忽略生成相应数据。`))
                    return
                }
                
                // 只处理 .md 文件
                if (type === 'md') {
                    filesList.push({
                        name, // 文件名（不含序号和扩展名）
                        filePath // 文件完整路径
                    });
                }
            }
        });
    });
    return filesList; // 返回所有找到的文件列表
}

/**
 * 获取本站的文章总字数
 * 可以排除某个目录下的 md 文档字数
 * 
 * @param {Array} excludeFiles - 需要排除的目录名称数组
 * @returns {string|number} 返回总字数，超过1000字会转换为 k 单位，例如 "12.5k"
 */
function readTotalFileWords(excludeFiles = ['']) {
    const filesList = readFileList(excludeFiles); // 获取所有文件列表
    var wordCount = 0; // 初始化总字数
    
    // 遍历每个文件，累加字数
    filesList.forEach((item) => {
        const content = getContent(item.filePath); // 读取文件内容
        var len = counter(content); // 统计字数，返回 [中文字数, 英文字数]
        wordCount += len[0] + len[1]; // 累加中英文字数
    });
    
    // 如果字数小于1000，直接返回数字
    if (wordCount < 1000) {
        return wordCount;
    }
    // 超过1000字，转换为 k 单位，保留一位小数
    return Math.round(wordCount / 100) / 10 + 'k';
}

/**
 * 获取每一个文章的字数
 * 可以排除某个目录下的 md 文档字数
 * 
 * @param {Array} excludeFiles - 需要排除的目录名称数组
 * @param {number} cn - 中文阅读速度（字/分钟），默认300字/分钟
 * @param {number} en - 英文阅读速度（词/分钟），默认160词/分钟
 * @returns {Array} 返回文章信息数组，每个元素包含文件名、路径、字数、阅读时间等
 */
function readEachFileWords(excludeFiles = [''], cn, en) {
    const filesListWords = []; // 存储每个文章的详细信息
    const filesList = readFileList(excludeFiles); // 获取所有文件列表
    
    filesList.forEach((item) => {
        const content = getContent(item.filePath); // 读取文件内容
        var len = counter(content); // 统计字数，返回 [中文字数, 英文字数]
        
        // 计算预计的阅读时间
        var readingTime = readTime(len, cn, en);
        
        // 精确字数（不做 k 缩写，用于文章页展示）
        var exactWords = len[0] + len[1];
        
        // 兼容主题原有逻辑的缩写形式，用于归档 / 统计等场景
        var wordsCount = exactWords;
        if (wordsCount >= 1000) {
            wordsCount = Math.round(wordsCount / 100) / 10 + 'k';
        }
        
        // 解析 Markdown 文件的 FrontMatter（文件头部的元数据）
        // fileMatterObj => {content:'剔除frontmatter后的文件内容字符串', data:{<frontmatter对象>}, ...}
        const fileMatterObj = matter(content, {});
        const matterData = fileMatterObj.data; // 获取 FrontMatter 数据对象
        
        // 将文件信息、字数、阅读时间、FrontMatter数据合并后添加到数组
        filesListWords.push({ ...item, wordsCount, exactWords, readingTime, ...matterData });
    });
    
    return filesListWords; // 返回所有文章的详细信息
}

/**
 * 计算预计的阅读时间
 * 
 * @param {Array} len - 字数数组，格式为 [中文字数, 英文字数]
 * @param {number} cn - 中文阅读速度（字/分钟），默认300字/分钟
 * @param {number} en - 英文阅读速度（词/分钟），默认160词/分钟
 * @returns {string} 返回格式化的阅读时间，例如 "5m"、"1h30m"、"2d3h"
 */
function readTime(len, cn = 300, en = 160) {
    // 计算阅读时间（分钟）= 中文字数/中文速度 + 英文字数/英文速度
    var readingTime = len[0] / cn + len[1] / en;
    
    // 大于一个小时，小于一天
    if (readingTime > 60 && readingTime < 60 * 24) {
        let hour = parseInt(readingTime / 60); // 计算小时数
        let minute = parseInt((readingTime - hour * 60)); // 计算剩余分钟数
        if (minute === 0) {
            return hour + 'h'; // 如果没有剩余分钟，只返回小时
        }
        return hour + 'h' + minute + 'm'; // 返回小时和分钟
    } 
    // 大于一天
    else if (readingTime > 60 * 24) {
        let day = parseInt(readingTime / (60 * 24)); // 计算天数
        let hour = parseInt((readingTime - day * 24 * 60) / 60); // 计算剩余小时数
        if (hour === 0) {
            return day + 'd'; // 如果没有剩余小时，只返回天数
        }
        return day + 'd' + hour + 'h'; // 返回天数和小时
    }
    
    // 小于一小时，取一位小数，最少显示1分钟
    return readingTime < 1 ? '1' : parseInt((readingTime * 10)) / 10 + 'm';
}

/**
 * 读取文件内容
 * 
 * @param {string} filePath - 文件的完整路径
 * @returns {string} 返回文件的文本内容
 */
function getContent(filePath) {
    return fs.readFileSync(filePath, 'utf8'); // 同步读取文件内容，使用 UTF-8 编码
}

/**
 * 获取文件内容的字数
 * 分别统计中文字数和英文字数
 * 
 * @param {string} content - 文件的文本内容
 * @returns {Array} 返回 [中文字数, 英文字数]
 * 
 * 说明：
 * - cn：中文字数，统计所有中文字符
 * - en：英文字数，统计连续的英文字母、数字、下划线等为一个单词
 */
function counter(content) {
    // 统计中文字数：匹配所有中文字符（Unicode范围 \u4E00-\u9FA5）
    const cn = (content.match(/[\u4E00-\u9FA5]/g) || []).length;
    
    // 统计英文字数：匹配连续的英文字母、数字、下划线等为一个单词
    // 先移除所有中文字符，然后匹配英文单词
    const en = (content.replace(/[\u4E00-\u9FA5]/g, '').match(/[a-zA-Z0-9_\u0392-\u03c9\u0400-\u04FF]+|[\u4E00-\u9FFF\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af\u0400-\u04FF]+|[\u00E4\u00C4\u00E5\u00C5\u00F6\u00D6]+|\w+/g) || []).length;
    
    return [cn, en]; // 返回 [中文字数, 英文字数]
}

// 导出模块，供其他文件使用。每个模块都需要配置 module.exports，别人才知道可以调用这个对象的什么方法
module.exports = {
    readFileList, // 导出读取文件列表的函数
    readTotalFileWords, // 导出统计总字数的函数
    readEachFileWords, // 导出统计每个文章字数的函数
}
