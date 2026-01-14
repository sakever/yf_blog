<template>
  <div class="left-sidebar">
    <div class="sidebar-title">文档列表</div>
    <div class="sidebar-content">
      <div v-for="category in categories" :key="category.name" class="category">
        <div class="category-header">{{ category.name }}</div>
        <router-link
          v-for="page in category.pages"
          :key="page.path"
          :to="page.path"
          class="page-link"
          :class="{ active: isActive(page.path) }"
        >
          {{ page.title }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LeftSidebar',
  data() {
    return {
      categories: []
    }
  },
  computed: {
    currentPath() {
      return this.$route.path
    }
  },
  created() {
    this.loadCategories()
  },
  methods: {
    loadCategories() {
      const pages = this.$site.pages
      const postsPath = '/_posts/'
      
      const categoryMap = new Map()
      
      pages.forEach(page => {
        if (page.path.startsWith(postsPath) && page.path.endsWith('.html')) {
          const relativePath = page.path.substring(postsPath.length)
          const parts = relativePath.split('/')
          
          if (parts.length >= 2) {
            const categoryName = parts[0].replace(/^_/, '').replace(/_/g, ' ')
            
            if (!categoryMap.has(categoryName)) {
              categoryMap.set(categoryName, {
                name: categoryName,
                pages: []
              })
            }
            
            categoryMap.get(categoryName).pages.push({
              path: page.path,
              title: page.title || page.frontmatter.title || '未命名'
            })
          }
        }
      })
      
      this.categories = Array.from(categoryMap.values())
    },
    isActive(path) {
      return this.currentPath === path
    }
  }
}
</script>

<style lang="stylus" scoped>
.left-sidebar
  width 280px
  flex-shrink 0
  position sticky
  top 60px
  height calc(100vh - 80px)
  overflow-y auto
  border-right 1px solid #eaecef
  padding 20px 0
  
  &::-webkit-scrollbar
    width 6px
  
  &::-webkit-scrollbar-thumb
    background #c1c1c1
    border-radius 3px
  
  &::-webkit-scrollbar-track
    background transparent

.sidebar-title
  font-size 18px
  font-weight 600
  padding 0 20px 15px
  color #2c3e50
  border-bottom 1px solid #eaecef
  margin-bottom 15px

.sidebar-content
  padding 0 10px

.category
  margin-bottom 20px

.category-header
  font-size 14px
  font-weight 600
  color #606266
  padding 8px 10px
  margin-bottom 5px

.page-link
  display block
  padding 8px 10px
  font-size 14px
  color #606266
  text-decoration none
  border-radius 4px
  transition all 0.3s
  line-height 1.5
  
  &:hover
    background #f5f7fa
    color #409eff
  
  &.active
    background #409eff
    color #fff
</style>
