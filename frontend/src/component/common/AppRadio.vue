<template>
  <div class="radio" @click="clickRadio" @mouseenter="isHover = true" @mouseleave="isHover = false">
    <div class="radio-btn" :class="{'hover': isHover, 'selected': selected === props.value}">
      <div class="radio-btn-inner" v-show="selected === props.value"></div>
    </div>
    <div class="radio-text" :class="{'hover': isHover, 'selected': selected === props.value}">{{ props.text }}</div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  const props = defineProps({
    value: {
      type: Number,
      default: 0,
    },
    text: {
      type: String,
      default: '',
    }
  })
  const selected = defineModel({
    type: Number,
    default: 0,
  })
  const isHover = ref(false);

  const clickRadio = () => {
    selected.value = props.value;
  }
</script>

<style scoped lang="scss">
  .radio {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    .radio-btn {
      width: 15px;
      height: 15px;
      border-radius: 100%;
      border: 1px solid var(--root-gray);
      transition: all 0.15s ease-in-out;
      transform-origin: left;
      display: flex;
      align-items: center;
      justify-content: center;
      .radio-btn-inner {
        width: 5px;
        height: 5px;
        border-radius: 100%;
        background-color: var(--root-orange);
      }
    }
    .radio-btn.hover {
      border-color: var(--root-orange);
      transform: scale(1.02);
    }
    .radio-btn.selected {
      border-color: var(--root-orange);
    }

    .radio-text {
      transition: all 0.15s ease-in-out;
      transform-origin: left;
      font-size: 12px;
      color: var(--root-gray);
    }
    .radio-text.hover {
      transform: scale(1.02);
      color: var(--root-orange);
    }
    .radio-text.selected {
      color: var(--root-orange);
    }
  }
</style>
