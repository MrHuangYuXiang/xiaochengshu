<template>
  <div class="image-preview" v-show="globalImagePreview.url.value !== ''">
    <img :src="globalImagePreview.url.value" alt="预览图片" />
    <div class="close-btn" @click="globalImagePreview.url.value = ''">
      <AppIcon
        type="close" 
        size="30px" 
        :fill="closeFillColor"
        @mouseenter="closeFillColor = 'var(--root-gray-dark)'"
        @mouseleave="closeFillColor = 'black'">
      </AppIcon>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AppIcon from '@/component/common/AppIcon.vue';
  import { globalImagePreview } from '@/component/global';
  import { ref } from 'vue';

  const closeFillColor = ref('black');
</script>

<style scoped lang="scss">
  .image-preview {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0,0,0,0.3);
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 4;
    img {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
    }
    .close-btn {
      position: absolute;
      top: 50px;
      right: 50px;
      cursor: pointer;
    }
  }
</style>
