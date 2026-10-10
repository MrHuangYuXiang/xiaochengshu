<template>
  <WorkMasonryLayout 
  class="page-box" 
  :fields="[
    { text: '推荐', key: 'recommend' },
    { text: '关注', key: 'following' },
  ]" />
</template>

<script setup lang="ts">
  import WorkMasonryLayout from '@/component/work/work-masonry-layout.vue';
</script>

<style scoped lang="scss">
  .page-box {
    padding: 2rem;
  }
</style>
