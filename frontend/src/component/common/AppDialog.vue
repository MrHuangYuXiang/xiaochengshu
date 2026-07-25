<template>
  <BaseModal
    :can-close="false"
    width="30vw"
    height="30vh"
  >
    <div class="dialog">
      <div>{{ props.content }}</div>
      <div class="btn-group">
        <AppButton text="确定" @click="emits('close')" />
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
  import BaseModal from './BaseModal.vue';
  import AppButton from './AppButton.vue';

  const props = defineProps({
    content: {
      type: String,
    },
  })
  const emits = defineEmits(['close'])
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
