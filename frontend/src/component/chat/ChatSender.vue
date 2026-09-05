<template>
  <div class="chat-sender">
    <AppInput placeholder="想想要发送什么内容" type="textarea" v-model="msgContent" />
    <div class="bottom-bar">
      <div class="ext-items">
        <AppIcon type="image" size="1.2rem" />
      </div>
      <AppButton text="发送" @click="sendMsg" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import AppInput from '../common/AppInput.vue';
  import AppButton from '../common/AppButton.vue';
  import AppIcon from '../common/AppIcon.vue';
  import { ref } from 'vue';

  const emits = defineEmits<{
    (e: "sendMsg", content: string): void
  }>()
  const msgContent = ref("")

  // 发送消息
  const sendMsg = async () => {
    emits("sendMsg", msgContent.value)
  }
</script>

<style scoped lang="css">
  .chat-sender {
    padding-top: 1rem;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    .bottom-bar {
      display: grid;
      grid-template-columns: 5fr 1fr;
      .ext-items {
        padding: 0 0.5rem;
        display: flex;
        align-items: center;
      }
    }
  }
</style>
