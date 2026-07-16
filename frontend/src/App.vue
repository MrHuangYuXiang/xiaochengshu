<template>
  <!-- 全局组件挂载区域 -->
  <ImagePreview />

  <div class="page">
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
  import ImagePreview from './component/global/ImagePreview.vue';
</script>

<style scoped lang="scss">
    .page {
      height: 100vh;
      width: 100vw;
    }
</style>
