<template>
  <div 
    class="session-card"
   :class="{
      'active': selectedId === props.sessionId,
      'pin': props.sessionIsPin === 1
    }"
  >
    <UserAvatar 
      class="session-image"
      :user-id="props.userId"
      :img-url="getSessionImageUrl(props.sessionType)"
      :is-upload="props.sessionType === 3 ? false : true"
      width="60px"
    />
    <div class="session-content">
      <div class="session-name">
        <div class="name">{{ getSessionName() }}</div>
        <div class="time">{{ formatTime(props.messageTime) }}</div>
      </div>
      <div class="msg-content">{{ getMessage() }}</div>
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
    sessionIsPin: number;
    messageContent: string;
    messageTime: string;
    messageType: number;
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

    // 获取最近消息
  const getMessage = () => {
    switch (props.messageType) {
      // 普通消息
      case 1:
      // 举报通知
      case 2:
        return props.messageContent

      // 作品分享
      case 3:
        return "分享了作品"
      
      // 无消息
      case 0:
        return "快去给Ta打个招呼吧^.^"
      default:
        return ""
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
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.5rem;
    position: relative;
    cursor: pointer;
    padding: 10px;
    border-radius: 20px;
    transition: all 0.3s ease-in-out;
    border: 1.5px solid rgba(0,0,0,0.1);
    border-top: none;
    white-space: nowrap;
    .session-content {
      display: grid;
      grid-template-columns: auto;
      .session-name {
        display: grid;
        grid-template-columns: auto 1fr auto;
        column-gap: 3rem;
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

  .session-card.pin {
    background-color: var(--root-bg-gray);
  }

  .session-card:hover,
  .session-card.active
  {
    transform: translateX(2rem);
  }
</style>
