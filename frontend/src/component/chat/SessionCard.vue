<template>
  <div class="session-card">
    <UserAvatar :user-id="props.userId" :img-url="props.userAvatarUrl" width="60px" />
    <div class="session-content">
      <div class="session-name">{{ props.sessionName }}</div>
      <div class="session-meta">
        <div class="msg-content">{{ props.latestMsg }}</div>
        <div class="msg-time">{{ formatTime(props.msgTime) }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { formatTime } from '@/helper/format.ts';
  import UserAvatar from '../user/UserAvatar.vue';

  const props = defineProps({
    userId: {
      type: String,
    },
    userAvatarUrl: {
      type: String,
    },
    sessionName: {
      type: String,
    },
    latestMsg: {
      type: String,
    },
    msgTime: {
      type: String,
      default: "",
    },
  })
</script>

<style lang="css" scoped>
  .session-card {
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
  }
  .session-card:hover {
    transform: translateX(20px);
    background-color: var(--root-bg-gray);
  }
</style>
