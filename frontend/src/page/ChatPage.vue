<template>
  <div class="chat-page">
    <div class="sessions">
      <ScrollContainer :load-more-callback="loadMoreSessionsCb">
        <SessionCard
          v-for="session in sessions"
          :key="session.session.id"
          :user-id="session.user.id"
          :user-avatar-url="session.user.avatar_url"
          :session-name="session.user.name"
          :latest-msg="session.latestMessage.content"
          :msg-time="session.latestMessage.created_at"
          @click="switchSelectedSession(session.session.id)"
        />
      </ScrollContainer>
    </div>
    <div class="chat-panel" v-show="selectedSessionId !== ''">
      <ChatSender :style="{ 'margin-top': '2rem' }"/>
      <div
        v-for="msg in messages"
        :key="msg.message.id"
        class="chat-message"
        :style="{
          'align-self': msg.user.id === storage.initData.value?.user.id ? 'end' : 'start',
          'flex-direction': msg.user.id === storage.initData.value?.user.id ? 'row-reverse' : 'row',
        }"
      >
        <UserAvatar :user-id="msg.user.id" width="3rem" :img-url="msg.user.avatar_url" />
        <div
          class="msg-content"
          :style="{
            'color': msg.user.id === storage.initData.value?.user.id ? 'white' : 'black',
            'background-color': msg.user.id === storage.initData.value?.user.id ? '#0084ff' : 'var(--root-bg-gray)'
          }"
        >
          {{ msg.message.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import SessionCard from '@/component/chat/SessionCard.vue';
  import ChatSender from '@/component/chat/ChatSender.vue';
  import UserAvatar from '@/component/user/UserAvatar.vue';
  import ScrollContainer from '@/component/common/ScrollContainer.vue';
  import { storage } from '@/storage';
  import { onMounted, ref } from 'vue';
  import type { SessionSchema, MessageSchema } from '@/api/type.ext';
  import { EnhancedList } from '@/lib/list';
  import { axiosProxy } from '@/api/axios';
  import type { paths } from '@/api/gen';

  const sessions = ref<EnhancedList<SessionSchema>>(new EnhancedList(
    (item) => item.session.id,
    10,
  ))
  const messages = ref<EnhancedList<MessageSchema>>(new EnhancedList(
    (item) => item.message.id,
    10,
  ))

  // 当前选中会话
  const selectedSessionId = ref("");

  // 查询会话
  const getSessions = async () => {
    await sessions.value.pagePush(async (page: number, size: number) => {
      const data = await axiosProxy.get<
        paths["/chat/get/sessions"]["get"]["parameters"]["query"],
        paths["/chat/get/sessions"]["get"]["responses"]["200"]["content"]["application/json"]
      >("/chat/get/sessions", { page: page, pageSize: size })
      return data.sessions
    })
  }

  // 查询消息
  const getMessages = async () => {
    await messages.value.pagePush(async (page: number, size: number) => {
      const data = await axiosProxy.get<
        paths["/chat/get/messages"]["get"]["parameters"]["query"],
        paths["/chat/get/messages"]["get"]["responses"]["200"]["content"]["application/json"]
      >("/chat/get/messages", { page: page, pageSize: size, sessionId: selectedSessionId.value })
      return data.messages
    })
  }

   // 会话列表滚动底部回调
  const loadMoreSessionsCb = async () => {
    await getSessions()
    return sessions.value.isEnd
  }

  // 切换当前选中会话
  const switchSelectedSession = async (sessionId: string) => {
    selectedSessionId.value = sessionId
    messages.value.clear()
    await getMessages()
  }

  onMounted(async () => {
    await getSessions()
  })
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
