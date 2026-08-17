<template>
  <div class="chat-sender">
    <AppInput placeholder="想想要发送什么内容" type="textarea" />
    <div class="bottom-bar">
      <div class="ext-items">
        <AppIcon type="image" size="1.2rem" />
      </div>
      <AppButton text="发送" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import AppInput from '../common/AppInput.vue';
  import AppButton from '../common/AppButton.vue';
  import AppIcon from '../common/AppIcon.vue';
</script>

<style scoped lang="css">
  .chat-sender {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
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
