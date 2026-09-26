<template>
  <div class="input" :style="{ width: props.width }">
    <input
      v-if="props.type === 'text'"
      ref="inputRef"
      :style="{ backgroundColor: props.backgroundColor }"
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
    />
    <textarea
      v-if="props.type === 'textarea'"
      :style="{ backgroundColor: props.backgroundColor }"
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

  const props = defineProps({
    placeholder: {
      type: String,
      default: ""
    },
    rule: {
      type: Object,
      default: () => ({
      })
    },
    width: {
      type: String,
      default: '100%'
    },
    backgroundColor: {
      type: String,
      default: 'var(--root-bg-gray)'
    },
    type: {
      type: String,
      default: 'text'
    },
    // 只有当type为textarea时有效
    rows: {
      type: Number,
      default: 4
    },
  })
  const emits = defineEmits(['focus', 'blur'])
  const inputValue = defineModel<string>()
  const errorString = ref<string>("")
  const inputRef = useTemplateRef("inputRef")
  const textareaRef = useTemplateRef("textareaRef")

  /** 以下为组件暴露方法 */
  const validate = () => {
    switch (props.type) {
      // 文本输入框验证规则
      case 'text':
      case 'textarea':
        if ("required" in props.rule && inputValue.value!.length === 0) {
          errorString.value = props.rule.required.errorString
          return false
        }
        if ("maxlength" in props.rule && inputValue.value!.length > props.rule.maxlength.value) {
          errorString.value = props.rule.maxlength.errorString
          return false
        }
        if ("minlength" in props.rule && inputValue.value!.length < props.rule.minlength.value) {
          errorString.value = props.rule.minlength.errorString
          return false
        }
        if ("mustLength" in props.rule && inputValue.value!.length !== props.rule.mustLength.value) {
          errorString.value = props.rule.mustLength.errorString
          return false
        }
        break

      // 日期选择器验证规则
      case 'date':
        if ("required" in props.rule && (inputValue.value === null || inputValue.value === "")) {
          errorString.value = props.rule.required.errorString
          return false
        }
        break
    }

    // 延迟修改错误字符串保证动画渲染正常
    errorString.value = ""
    setTimeout(() => {
      errorString.value = ""
    }, 300)
    return true
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
  .input {
    width: 100%;
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
      transition: all 0.3s ease-in-out;
      color: red;
      font-size: 12px;
      font-weight: bold;
    }
    .error.show {
      height: 12px;
      opacity: 1;
      margin-top: 5px;
    }
  }
</style>
