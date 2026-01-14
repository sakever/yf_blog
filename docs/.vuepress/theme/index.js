module.exports = (themeConfig, ctx) => {
  return {
    extend: '@vuepress/theme-default',
    layouts: {
      Layout: require.resolve('./Layout.vue')
    }
  }
}
