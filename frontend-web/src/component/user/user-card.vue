<template>
  <div class="user-card">
    <UserAvatar 
      class="avatar"
      :userId="props.userId" 
      :imgUrl="props.userAvatarUrl" 
    />
    <div class="name">{{ props.userName }}</div>
    <AppButton
      class="btn"
      v-if="props.isShowBtn"
      :text="props.btnText"
      :color="props.btnColor"
      @click="emits('clickBtn')"
    />
  </div>
</template>

<script setup lang="ts">
  import UserAvatar from './user-avatar.vue';
  import AppButton from '../form/form-button.vue';

  const props = withDefaults(defineProps<{
    userId: string,
    userName: string,
    userAvatarUrl: string,
    isShowBtn?: boolean,
    btnText: string,
    btnColor?: "default" | "orange",
  }>(), {
    isShowBtn: true,
    btnColor: "default",
    avatarSize: "1rem",
  })

  const emits = defineEmits<{
    (e: 'clickBtn'): void
  }>()
</script>

<style scoped lang="scss">
  .user-card {
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    grid-template-rows: auto;
    column-gap: 0.5rem;
    align-items: center;
    .avatar {
      width: 2.5rem;
      height: 2.5rem;
    }
    .btn {
      grid-column: 4;
    }
  }
</style>
