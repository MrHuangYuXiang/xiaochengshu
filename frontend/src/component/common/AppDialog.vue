<template>
  <BaseModal
    :can-close="false"
    width="30vw"
    height="30vh"
    ref="baseModalRef"
  >
    <div class="dialog">
      <div>{{ props.content }}</div>
      <div class="btn-group">
        <AppButton text="确定" @click="confirm" />
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
  import { useTemplateRef } from 'vue';
  import BaseModal from '../modal/BaseModal.vue';
  import AppButton from './AppButton.vue';

  const props = defineProps({
    content: {
      type: String,
    },
  })
  const emits = defineEmits(['confirm'])
  const baseModalRef = useTemplateRef("baseModalRef")

  const confirm = () => {
    emits('confirm')
    close()
  }

  /** 以下为组件暴露方法 */
  const close = () => {
    baseModalRef.value?.close()
  }

  const show = () => {
    baseModalRef.value?.show()
  }

  defineExpose({
    close,
    show,
  })
</script>

<style scoped lang="css">
  .dialog {
    width: 100%;
    height: 100%;
    position: relative;
    padding: 30px;
    .btn-group {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
}
</style>
