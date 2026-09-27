<template>
  <div class="user-card">
    <UserAvatar 
      :userId="props.userId" 
      :imgUrl="props.userAvatarUrl" 
      :width="props.avatarSize"
      />
    <div class="name">{{ props.userName }}</div>
    <AppButton
      class="btn"
      v-if="props.userId !== storage.initData.value?.user.id"
      :text="props.btnText"
      color="default"
      @click="emits('clickBtn')"
    />
  </div>
</template>

<script setup lang="ts">
  import UserAvatar from './UserAvatar.vue';
  import AppButton from '../form/form-button.vue';
  import { storage } from '@/storage.ts';

  const props = defineProps<{
    userId: string,
    userName: string,
    userAvatarUrl: string,
    avatarSize: string,
    btnText: string,
  }>()

  const emits = defineEmits<{
    (e: 'clickBtn'): void
  }>()
</script>

<style scoped lang="scss">
  .user-card {
    padding: 1rem;
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    grid-template-rows: auto;
    column-gap: 0.5rem;
    align-items: center;
    .btn {
      grid-column: 4;
    }
  }
</style>
