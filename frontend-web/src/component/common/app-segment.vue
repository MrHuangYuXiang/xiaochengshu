<!-- 分段器组件 -->

<template>
  <div :class="['fields', props.type]">
    <div
      v-for="(field, index) in props.fields"
      :class="['field', props.type, {'active': index === currentIndex}]"
      :key="index"
      @click="clickField(index)"
    >
      <div>{{ field.text }}</div>
      <div v-if="props.type === 'underline'" :class="{'active': index === currentIndex, 'field-border': true}"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref, watch } from 'vue'

  const props = withDefaults(defineProps<{
    fields: {text: string, key: string}[]
    // underline: 下划线 background: 背景色
    type?: "underline" | "background"
  }>(), {
    type: "underline"
  })
  const emits = defineEmits(["changeField"])
  const currentIndex = ref(0)

  const clickField = (index: number) => {
    currentIndex.value = index
    emits("changeField", props.fields[index]!.key)
  }

  watch(() => props.fields, (newFields) => {
    if (newFields[0]) emits("changeField", newFields[0].key)
  }, { immediate: true })

</script>

<style scoped lang="scss">
  .fields {
    display: flex;
    align-items: center;
    justify-content: start;
    .field {
      flex: 0 0 auto;
      transition: all 0.25s ease-in-out;
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
    .background {
        background-color: rgba(black, 0.3);
        border-radius: 5px;
        padding: 0.3rem 0.5rem;
        color: white;
    }
    .background.active {
        background-color: color-mix(in srgb, var(--root-orange) 20%, transparent);
    }
    .field:hover {
      color: var(--root-orange);
    }
    .field.active {
      font-weight: bold;
      color: var(--root-orange);
    }
  }

  .fields.underline {
    gap: 1.5rem;
    font-size: 1.3rem;
  }

  .fields.background {
    gap: 0.5rem;
    font-size: 0.9rem;
  }
</style>
