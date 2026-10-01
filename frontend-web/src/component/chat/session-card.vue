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
      :is-upload="props.sessionType === 3 || props.sessionType === 4 ? false : true"
      width="60px"
    />
    <div class="session-content">
      <div class="session-name">
        <div class="name">{{ getSessionName() }}</div>
        <div class="time">{{ formatTime(props.messageTime) }}</div>
      </div>
      <div class="msg-content">
        <div class="message">{{ getMessage() }}</div>
        <div v-if="props.unreadCount > 0" class="unread-count">{{ props.unreadCount }}</div>
      </div>
    </div>
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
        return '/images/setting.png';
      case 4:
        return '/images/interaction.png';
      default:
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
      case 4:
        return "互动消息"
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

      // 作品点赞通知
      case 4:
        return "您的作品收到了新的点赞"
      
      // 作品收藏通知
      case 5:
        return "您的作品被收藏了"

      // 作品转发通知
      case 6:
        return "您的作品被转发了"

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
      grid-template-columns: 100%;
      align-items: center;
      overflow: hidden;
      .session-name {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        .name {
          grid-column: 1;
          font-size: 1rem;
          font-weight: 500;
        }
        .time {
          justify-self: end;
          font-size: 0.7rem;
          color: var(--root-gray);
          font-weight: 500;
        }
      }
      .msg-content {
        display: grid;
        grid-template-columns: 1fr auto;
        font-size: 0.8rem;
        .message {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          color: var(--root-gray-dark);
        }
        .unread-count {
          height: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          background-color: red;
        }
      }
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
