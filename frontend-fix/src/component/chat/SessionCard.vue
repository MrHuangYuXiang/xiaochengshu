<template>
  <div class="session-card" :class="{'active': selectedId === props.sessionId}">
    <UserAvatar :user-id="props.userId" :img-url="props.userAvatarUrl" width="60px" />
    <div class="session-content">
      <div class="session-name">{{ props.sessionName }}</div>
      <div class="session-meta">
        <div class="msg-content">{{ props.latestMsg }}</div>
        <div class="msg-time">{{ formatTime(props.msgTime) }}</div>
      </div>
    </div>
    <div v-if="props.unreadCount > 0" class="unread-count">{{ props.unreadCount }}</div>
  </div>
</template>

<script lang="ts" setup>
  import { formatTime } from '@/helper/format.ts';
  import UserAvatar from '../user/UserAvatar.vue';

  const props = defineProps<{
    userId: string;
    userAvatarUrl: string;
    sessionId: string;
    sessionName: string;
    latestMsg: string;
    msgTime: string;
    unreadCount: number;
  }>()

  // 卡片选中标志位
  const selectedId = defineModel('selectedId', {
    type: String,
    default: '',
  })
</script>

<style lang="css" scoped>
  .session-card {
    position: relative;
    cursor: pointer;
    width: calc(100% - 20px);
    display: flex;
    padding: 10px;
    gap: 15px;
    align-items: center;
    border-radius: 20px;
    transition: all 0.3s ease-in-out;
    .session-content {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-evenly;
      .session-name {
        font-size: 0.9rem;
        font-weight: 500;
      }
      .session-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        .msg-content {
          font-size: 0.75rem;
          color: var(--root-gray-dark);
        }
        .msg-time {
          font-size: 0.75rem;
          color: var(--root-gray)
        }
      }
    }
    .unread-count {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      right: 1rem;
      font-size: 0.8rem;
      font-weight: bold;
      height: 1.4rem;
      width: 1.4rem;
      color: white;
      background-color: red;
      border-radius: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .session-card:hover,
  .session-card.active {
    background-color: var(--root-bg-gray);
  }

  .session-card:hover {
    transform: translateX(20px);
  }
</style>
