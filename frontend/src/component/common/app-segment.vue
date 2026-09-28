<!-- 分段器组件 -->

<template>
  <div class="fields">
    <div
    v-for="(field, index) in props.fields"
    :class="{'active': index === currentIndex, 'field': true}"
    :key="index"
    @click="clickField(index)"
    >
      <div>{{ field.text }}</div>
      <div :class="{'active': index === currentIndex, 'field-border': true}"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  const props = defineProps({
    fields: {
      type: Array<{
        text: string,
        key: string,
      }>,
      default: []
    }
  })
  const emits = defineEmits(["changeField"])
  const currentIndex = ref(0)

  const clickField = (index: number) => {
    currentIndex.value = index
    emits("changeField", props.fields[index]?.key)
  }
</script>

<style scoped lang="scss">
  .fields {
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    gap: 30px;
    font-size: 18px;
    margin-bottom: 20px;
    .field {
      flex: 0 0 auto;
      transition: all 0.3s ease-in-out;
      cursor: pointer;
      .field-border {
        background-color: transparent;
        transition: all 0.3s ease-in-out;
        margin-top: 3px;
        height: 3px;
        opacity: 0;
      }
      .field-border.active {
        opacity: 1;
        background-color: var(--root-orange);
      }
    }
    .field:hover {
      color: var(--root-orange);
    }
    .field.active {
      font-weight: bold;
      color: var(--root-orange);
    }
  }
</style>
