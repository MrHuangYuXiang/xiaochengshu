<template>
  <div class="input-box">
    <input
      v-if="props.type === 'text'"
      ref="inputRef"
      type="text"
      :placeholder="props.placeholder"
      v-model="inputValue"
    >
    <el-date-picker
      v-if="props.type === 'date'"
      style="width: 100%"
      type="date"
      :placeholder="props.placeholder"
      v-model="inputValue"
      size="default"
      value-format="YYYY-MM-DDTHH:mm:ss.sssZ"
      :clearable="false"
    />
    <textarea
      v-if="props.type === 'textarea'"
      ref="textareaRef"
      :placeholder="props.placeholder"
      :rows="props.rows"
      v-model="inputValue"
      @focus="emits('focus')"
      @blur="emits('blur')"
    />
    <div :class="{ 'error': true, 'show': errorString !== '' }">{{ errorString }}</div>
  </div>
</template>

<script setup lang="ts">
  import { ref, useTemplateRef } from 'vue'
  import { ZodString } from 'zod'

  const props = withDefaults(defineProps<{
    placeholder?: string,
    rule: ZodString,
    type: string,
    // 只有当type为textarea时有效
    rows?: number,
  }>(), {
    placeholder: '',
    rows: 4,
  })
  const emits = defineEmits(['focus', 'blur'])
  const inputValue = defineModel<string>()
  const errorString = ref<string>("")
  const inputRef = useTemplateRef("inputRef")
  const textareaRef = useTemplateRef("textareaRef")

  /** 以下为组件暴露方法 */
  const validate = () => {
    const result = props.rule.safeParse(inputValue.value)
    if (!result.success) {
      errorString.value = result.error.issues[0]?.message || ""
      return false
    } else {
      errorString.value = ""
      return true
    }
  }

  const focus = () => {
    switch (props.type) {
      case 'text':
        inputRef.value?.focus()
        break
      case 'textarea':
        textareaRef.value?.focus()
        break
    }
  }

  defineExpose({
    validate,
    focus
  })
</script>

<style scoped lang="scss">
  .input-box {
    height: auto;
    display: flex;
    flex-direction: column;
    input,
    textarea {
      width: 100%;
      border-radius: 15px;
      padding: 1rem;
      border: none;
      transition: all 0.2s ease-in-out;
      resize: none;
      background-color: var(--root-bg-gray);
    }
    input:hover,
    textarea:hover,
    input:focus,
    textarea:focus
    {
      outline: none;
      box-shadow: 0 0 3px var(--root-orange);
    }
    .error {
      height: 0;
      opacity: 0;
      transition: all 0.5s ease-in-out;
      color: red;
      font-weight: bold;
      overflow: hidden;
      font-size: 0.8rem;
    }
    .error.show {
      padding-top: 0.2rem;
      height: 1.3rem;
      opacity: 1;
    }
  }
</style>
