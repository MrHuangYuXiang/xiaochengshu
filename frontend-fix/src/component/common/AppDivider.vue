<template>
  <div class="divider-container">
    <div class="divider" :style="{ borderTop: '1px solid ' + props.color }"></div>
    <div :style="{ color: props.color, padding: '0 10px' }">{{ props.text }}</div>
    <div class="divider" :style="{ borderTop: '1px solid ' + props.color }"></div>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps({
    text: {
      type: String,
      default: ""
    },
    color: {
      type: String,
      default: "white"
    }
  })
</script>

<style scoped lang="scss">
  .divider-container {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    white-space: nowrap;
    margin: 15px 0;
    .divider {
      width: 100%;
      height: 0px;
    }
  }
</style>
