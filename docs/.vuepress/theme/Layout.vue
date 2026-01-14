<template>
  <ParentLayout>
    <template #page-top>
      <div v-if="showDoubleSidebar" class="double-sidebar-container">
        <LeftSidebar />
        <div class="main-content-wrapper">
          <Content />
          <RightSidebar />
        </div>
      </div>
      <Content v-else />
    </template>
  </ParentLayout>
</template>

<script>
import ParentLayout from '@parent-theme/layouts/Layout.vue'
import LeftSidebar from './components/LeftSidebar.vue'
import RightSidebar from './components/RightSidebar.vue'

export default {
  name: 'Layout',
  components: {
    ParentLayout,
    LeftSidebar,
    RightSidebar
  },
  computed: {
    showDoubleSidebar() {
      return this.$route.path.startsWith('/_posts/')
    }
  }
}
</script>

<style lang="stylus">
.double-sidebar-container
  display flex
  max-width 1440px
  margin 0 auto
  padding 0 20px
  gap 20px

.main-content-wrapper
  flex 1
  display flex
  position relative
  gap 20px
  min-width 0
</style>
