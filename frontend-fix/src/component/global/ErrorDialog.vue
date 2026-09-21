<template>
  <BaseModal
    :can-close="false"
    width="30vw"
    height="30vh"
    v-model:show="errorDialogCom.enableShow.value"
  >
    <div class="dialog">
      <div>{{ errorDialogCom.content }}</div>
      <div class="btn-group">
        <AppButton text="确定" @click="confirmErrorDialog" />
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
  import BaseModal from '../common/BaseModal.vue';
  import AppButton from '../common/AppButton.vue';
  import { errorDialogCom } from './global.ts';
  import { useRouter } from 'vue-router';

  const router = useRouter()

  const confirmErrorDialog = async () => {
    errorDialogCom.close()
    await router.push({ name: "LoginPage" });
  }
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
