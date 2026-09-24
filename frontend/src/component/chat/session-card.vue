<template>
  <div class="session-card" :class="{'active': selectedId === props.sessionId}">
    <UserAvatar class="session-image" :user-id="props.userId" :img-url="getSessionImageUrl(props.sessionType)" width="60px" />
    <div class="session-content">
      <div class="session-name">
        <div class="name">{{ getSessionName() }}</div>
        <div class="time">{{ formatTime(props.msgTime) }}</div>
      </div>
      <div class="msg-content">{{ props.latestMsg }}</div>
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
    userName: string;
    sessionId: string;
    sessionType: number;
    latestMsg: string;
    msgTime: string;
    unreadCount: number;
  }>()

  // 获取会话图片url
  const getSessionImageUrl = (type: number) => {
    switch (type) {
      case 1:
      case 2:
        return props.userAvatarUrl;
      case 3:
      default:
        return '/images/setting.png';
    }
  }

  // 获取会话名称
  const getSessionName = () => {
    switch (props.sessionType) {
      case 1:
      case 2:
        return props.userName;
      case 3:
        return "系统通知";
      default:
          return '未知会话';
    }
  }

  // 卡片选中标志位
  const selectedId = defineModel('selectedId', {
    type: String,
    default: '',
  })
</script>

<style lang="css" scoped>
  .session-card {
    width: calc(100% - 20px);
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.5rem;
    position: relative;
    cursor: pointer;
    padding: 10px;
    border-radius: 20px;
    transition: all 0.3s ease-in-out;
    .session-content {
      display: grid;
      grid-template-columns: auto;
      gap: 0.25rem;
      .session-name {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        .name {
          grid-column: 1;
          font-size: 1rem;
          font-weight: 500;
        }
        .time {
          grid-column: 3;
          font-size: 0.7rem;
          color: var(--root-gray);
          font-weight: 500;
        }
      }
      .msg-content {
        grid-column: 1;
        font-size: 0.75rem;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        color: var(--root-gray-dark);
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
    transform: translateX(10px);
  }
</style>
