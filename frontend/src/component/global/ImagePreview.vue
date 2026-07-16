<template>
  <div class="image-preview" @click.self="imagePreview.url.value = ''" v-show="imagePreview.url.value !== ''">
    <img :src="imagePreview.url.value" alt="预览图片" />
  </div>
</template>

<script setup lang="ts">
  import { imagePreview } from './global';
</script>

<style scoped lang="scss">
  .image-preview {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0,0,0,0.2);
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    img {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
    }
  }
</style>
