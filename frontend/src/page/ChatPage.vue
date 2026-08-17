<template>
  <div class="chat-page">
    <div class="sessions">
      <SessionCard
        v-for="session in sessions"
        :key="session.userId"
        :user-id="session.userId"
        :user-avatar-url="session.userAvatarUrl"
        :session-name="session.sessionName"
        :latest-msg="session.latestMsg"
        :msg-time="session.msgTime"
        />
    </div>
    <div class="chat-panel" v-show="selectedSessionId === ''">
      <ChatSender :style="{ 'margin-top': '2rem' }"/>
      <div
        v-for="msg in messages"
        :key="msg.userId"
        class="chat-message"
        :style="{
          'align-self': msg.userId === storage.initData.value?.user.id ? 'end' : 'start',
          'flex-direction': msg.userId === storage.initData.value?.user.id ? 'row-reverse' : 'row',
        }"
      >
        <UserAvatar :user-id="msg.userId" width="3rem" />
        <div
          class="msg-content"
          :style="{
            'color': msg.userId === storage.initData.value?.user.id ? 'white' : 'black',
            'background-color': msg.userId === storage.initData.value?.user.id ? '#0084ff' : 'var(--root-bg-gray)'
          }"
        >
          {{ msg.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import SessionCard from '@/component/chat/SessionCard.vue';
  import ChatSender from '@/component/chat/ChatSender.vue';
  import UserAvatar from '@/component/user/UserAvatar.vue';
  import { storage } from '@/storage';
  import { ref } from 'vue';

  const sessions = ref([
    { userId: '123', userAvatarUrl: 'https://img2.baidu.com/it/u=3422224222,2822822222&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500', sessionName: '用户1', latestMsg: '你好', msgTime: '2023-08-01 12:00:00' },
    { userId: '456', userAvatarUrl: 'https://example.com/avatar2.jpg', sessionName: '用户2', latestMsg: '你好', msgTime: '2023-08-01 12:00:00' },
        { userId: '123', userAvatarUrl: 'https://img2.baidu.com/it/u=3422224222,2822822222&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500', sessionName: '用户1', latestMsg: '你好', msgTime: '2023-08-01 12:00:00' },
    { userId: '456', userAvatarUrl: 'https://example.com/avatar2.jpg', sessionName: '用户2', latestMsg: '你好', msgTime: '2023-08-01 12:00:00' },
        { userId: '123', userAvatarUrl: 'https://img2.baidu.com/it/u=3422224222,2822822222&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500', sessionName: '用户1', latestMsg: '你好', msgTime: '2023-08-01 12:00:00' },
    { userId: '456', userAvatarUrl: 'https://example.com/avatar2.jpg', sessionName: '用户2', latestMsg: '你好', msgTime: '2023-08-01 12:00:00' },
        { userId: '123', userAvatarUrl: 'https://img2.baidu.com/it/u=3422224222,2822822222&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500', sessionName: '用户1', latestMsg: '你好', msgTime: '2023-08-01 12:00:00' },
    { userId: '456', userAvatarUrl: 'https://example.com/avatar2.jpg', sessionName: '用户2', latestMsg: '你好', msgTime: '2023-08-01 12:00:00' },
        { userId: '123', userAvatarUrl: 'https://img2.baidu.com/it/u=3422224222,2822822222&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500', sessionName: '用户1', latestMsg: '你好', msgTime: '2023-08-01 12:00:00' },
    { userId: '456', userAvatarUrl: 'https://example.com/avatar2.jpg', sessionName: '用户2', latestMsg: '你好', msgTime: '2023-08-01 12:00:00' },
  ])
  const messages = ref([
    { userId: '1', userName: '用户1', content: '你好' },
    { userId: '456', userName: '用户2', content: '你好' },
    { userId: '1', userName: '用户1', content: '你好' },
    { userId: '456', userName: '用户2', content: '你好' },
  ])

  // 当前选中会话
  const selectedSessionId = ref("");
</script>

<style scoped lang="css">
.chat-page {
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 2.5fr;
  .sessions {
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  .chat-panel {
    height: 100%;
    padding: 1.5rem 5rem;
    display: flex;
    gap: 0.8rem;
    flex-direction: column-reverse;
    justify-content: end;
    align-items: center;
    .chat-message {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      .msg-content {
        font-size: 0.9rem;
        font-weight: 500;
        padding: 0.7rem 1.1rem;
        border-radius: 15px;
      }
    }
  }
}
</style>
