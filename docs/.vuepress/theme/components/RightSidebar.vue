<template>
  <div class="right-sidebar" v-if="headers.length > 0">
    <div class="sidebar-title">目录</div>
    <div class="sidebar-content">
      <a
        v-for="header in headers"
        :key="header.slug"
        :href="`#${header.slug}`"
        class="toc-link"
        :class="[
          `toc-link-${header.level}`,
          { active: activeHeader === header.slug }
        ]"
        @click.prevent="scrollToHeader(header.slug)"
      >
        {{ header.title }}
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RightSidebar',
  data() {
    return {
      activeHeader: '',
      observer: null
    }
  },
  computed: {
    headers() {
      return this.$page.headers || []
    }
  },
  mounted() {
    this.initScrollSpy()
  },
  beforeDestroy() {
    if (this.observer) {
      this.observer.disconnect()
    }
  },
  methods: {
    scrollToHeader(slug) {
      const element = document.getElementById(slug)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    },
    initScrollSpy() {
      const headers = this.headers
      if (headers.length === 0) return

      const observerOptions = {
        rootMargin: '-100px 0px -66%',
        threshold: 0
      }

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id
            this.activeHeader = id
          }
        })
      }, observerOptions)

      headers.forEach(header => {
        const element = document.getElementById(header.slug)
        if (element) {
          this.observer.observe(element)
        }
      })
    }
  },
  watch: {
    '$route'() {
      this.$nextTick(() => {
        this.initScrollSpy()
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
.right-sidebar
  width 280px
  flex-shrink 0
  position sticky
  top 60px
  height calc(100vh - 80px)
  overflow-y auto
  border-left 1px solid #eaecef
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

.toc-link
  display block
  padding 6px 10px
  font-size 13px
  color #606266
  text-decoration none
  border-radius 4px
  transition all 0.3s
  line-height 1.6
  cursor pointer
  
  &:hover
    color #409eff
  
  &.active
    color #409eff
    background #f0f7ff

.toc-link-2
  font-weight 600
  margin-top 8px

.toc-link-3
  padding-left 25px
  font-weight 400

.toc-link-4
  padding-left 40px
  font-weight 400
  font-size 12px
</style>
