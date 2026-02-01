// 全局变量声明
var bszCaller, bszTag, scriptTag, ready; // bszCaller: 调用器对象, bszTag: 标签管理对象, scriptTag: 脚本标签, ready: DOM就绪函数
var t, e, n, a = !1, c = []; // t: 定时器ID, e: 执行回调函数, n: DOM加载完成处理函数, a: 是否已就绪标志, c: 待执行的回调队列

// 修复Node.js同构代码的问题
// 在Node.js环境中不存在document对象，所以需要检查
if (typeof document !== "undefined") {
  // ready函数：确保DOM加载完成后执行回调函数
  // 如果DOM已经就绪，立即执行；否则将回调加入队列等待
  (ready = function (t) {
    return (
      a || // 已经就绪
      "interactive" === document.readyState || // DOM正在交互（加载中）
      "complete" === document.readyState // DOM完全加载完成
        ? t.call(document) // 立即执行回调
        : c.push(function () { // 将回调加入队列
            return t.call(this);
          }),
      this
    );
  }),

  // e函数：执行队列中的所有回调函数
  (e = function () {
    for (var t = 0, e = c.length; t < e; t++) c[t].apply(document); // 遍历执行所有回调
    c = []; // 清空队列
  }),

  // n函数：标记DOM已就绪并执行所有待执行的回调
  (n = function () {
    a ||
      ((a = !0), // 标记为已就绪
      e.call(window), // 执行队列中的回调
      document.removeEventListener
        ? document.removeEventListener("DOMContentLoaded", n, !1) // 移除事件监听（现代浏览器）
        : document.attachEvent &&
          (document.detachEvent("onreadystatechange", n), // 移除事件监听（IE浏览器）
          window == window.top && (clearInterval(t), (t = null)))); // 清除定时器
  }),

  // 添加DOM加载完成事件监听（现代浏览器）
  document.addEventListener
    ? document.addEventListener("DOMContentLoaded", n, !1)
    : // 添加DOM加载完成事件监听（IE浏览器）
      document.attachEvent &&
      (document.attachEvent("onreadystatechange", function () {
        /loaded|complete/.test(document.readyState) && n(); // 检查文档状态
      }),
      window == window.top && // 只在顶层窗口执行
        (t = setInterval(function () { // 定时检查DOM是否就绪（兼容旧版IE）
          try {
            a || document.documentElement.doScroll("left"); // 尝试滚动文档，如果失败说明DOM未就绪
          } catch (t) {
            return;
          }
          n(); // 成功则触发就绪处理
        }, 5)));
}

// bszCaller对象：负责从服务器获取不蒜子统计数据
bszCaller = {
  // fetch方法：发起JSONP请求获取统计数据
  // t: 请求URL, e: 数据处理回调函数
  fetch: function (t, e) {
    // 生成唯一的回调函数名，避免冲突
    var n = "BusuanziCallback_" + Math.floor(1099511627776 * Math.random());
    t = t.replace("=BusuanziCallback", "=" + n); // 替换URL中的回调函数名

    // 创建script标签用于JSONP跨域请求
    (scriptTag = document.createElement("SCRIPT")),
      (scriptTag.type = "text/javascript"),
      (scriptTag.defer = !0), // 延迟执行
      (scriptTag.src = t), // 设置请求URL
      document.getElementsByTagName("HEAD")[0].appendChild(scriptTag); // 将script标签添加到页面

    // 设置全局回调函数，接收服务器返回的数据
    window[n] = this.evalCall(e);
  },

  // evalCall方法：生成回调函数包装器
  // e: 数据处理回调函数
  evalCall: function (e) {
    return function (t) {
      ready(function () { // 确保DOM就绪后执行
        try {
          e(t), // 调用数据处理函数
          scriptTag &&
            scriptTag.parentElement &&
            scriptTag.parentElement.removeChild &&
            scriptTag.parentElement.removeChild(scriptTag); // 移除script标签，清理DOM
        } catch (t) {
          console.log(t), bszTag.hides(); // 出错时隐藏统计信息
        }
      });
    };
  },
};

// bszTag对象：负责管理页面上的统计数据显示
bszTag = {
  bszs: ["site_pv", "page_pv", "site_uv"], // 统计类型：site_pv(站点总访问量), page_pv(页面访问量), site_uv(站点访客数)

  // texts方法：更新页面上的统计数字
  // n: 包含统计数据的对象，如 {site_pv: 12345, page_pv: 100, site_uv: 500}
  texts: function (n) {
    this.bszs.map(function (t) {
      var e = document.getElementById("busuanzi_value_" + t); // 查找对应的显示元素
      e && (e.innerHTML = n[t]); // 更新显示的数字
    });
  },

  // hides方法：隐藏所有统计信息
  hides: function () {
    this.bszs.map(function (t) {
      var e = document.getElementById("busuanzi_container_" + t); // 查找对应的容器元素
      e && (e.style.display = "none"); // 隐藏容器
    });
  },

  // shows方法：显示所有统计信息
  shows: function () {
    this.bszs.map(function (t) {
      var e = document.getElementById("busuanzi_container_" + t); // 查找对应的容器元素
      e && (e.style.display = "inline"); // 显示容器
    });
  },
};

// 默认导出函数：初始化不蒜子统计
export default () => {
  bszTag && bszTag.hides(); // 先隐藏所有统计信息，避免显示默认值
  // 发起请求获取统计数据
  bszCaller.fetch("//busuanzi.ibruce.info/busuanzi?jsonpCallback=BusuanziCallback", function (t) {
    bszTag.texts(t), bszTag.shows(); // 更新统计数字并显示
  })
};
