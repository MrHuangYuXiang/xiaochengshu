<template>
  <div class="chat-page">
    <ScrollContainer
      trigger-type="bottom"
      :load-more-callback="getSessions"
      class="sessions"
    >
      <SessionCard
        v-for="session in sessions"
        v-model:selected-id="selectedSessionId"
        :key="session.session.id"
        :sessionId="session.session.id"
        :userId="session.user.id"
        :userAvatarUrl="session.user.avatar_url"
        :sessionName="session.user.name"
        :latestMsg="session.latestMessage ? session.latestMessage.content : ''"
        :msgTime="session.latestMessage ? session.latestMessage.created_at : ''"
        :unreadCount="session.unreadCount"
        @click="switchSelectedSession(session.session.id)"
      />
    </ScrollContainer>
    <div class="chat-panel" v-show="selectedSessionId !== ''">
      <ChatSender @send-msg="sendMsg" class="chat-sender"/>
      <ScrollContainer
        trigger-type="reverse-top"
        :load-more-callback="getMessages"
        ref="msgScrollRef"
        class="chat-messages"
      >
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
      </ScrollContainer>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import SessionCard from '@/component/chat/SessionCard.vue';
  import ChatSender from '@/component/chat/ChatSender.vue';
  import UserAvatar from '@/component/user/UserAvatar.vue';
  import ScrollContainer from '@/component/common/ScrollContainer.vue';
  import { storage } from '@/storage';
  import { onMounted, ref, useTemplateRef } from 'vue';
  import type { SessionSchema, MessageSchema } from '@/api/type.ext';
  import { EnhancedList } from '@/lib/list';
  import { axiosProxy } from '@/api/axios';
  import type { paths } from '@/api/gen';
  import { useRoute } from 'vue-router';

  const route = useRoute()

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
  const msgScrollRef = useTemplateRef("msgScrollRef")

  // 查询会话
  const getSessions = async () => {
    await sessions.value.pagePush(async (page: number, size: number) => {
      const data = await axiosProxy.get<
        paths["/chat/get/sessions"]["get"]["parameters"]["query"],
        paths["/chat/get/sessions"]["get"]["responses"]["200"]["content"]["application/json"]
      >("/chat/get/sessions", { page: page, pageSize: size })
      return data.sessions
    })
    return sessions.value.isEnd
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
    return messages.value.isEnd
  }

  // 切换当前选中会话
  const switchSelectedSession = async (sessionId: string) => {
    if (selectedSessionId.value === sessionId) {
      return
    }

    selectedSessionId.value = sessionId
    messages.value.clear()
    msgScrollRef.value?.reset()
    await getMessages()
  }

  // 发送消息
  const sendMsg = async (content: string) => {
    const message = await axiosProxy.post<
      paths["/chat/send/message"]["post"]["requestBody"]["content"]["application/json"],
      paths["/chat/send/message"]["post"]["responses"]["200"]["content"]["application/json"]
    >("/chat/send/message", {
      sessionId: selectedSessionId.value,
      sessionMemberId: storage.initData.value!.user.id,
      content: content,
    })
    messages.value.unshift(message)
  }

  onMounted(async () => {
    // 加载当前用户会话数据
    await getSessions()
    // 创建新会话(通过传递url参数触发)
    await onMountedCreateSession()
  })

  // 挂载钩子创建会话逻辑
  const onMountedCreateSession = async () => {
    if (!route.query.targetUserId) return

    const targetUserId = route.query.targetUserId as string
    
    // 创建会话
    const sessionData = await axiosProxy.post<
      paths["/chat/create/session"]["post"]["requestBody"]["content"]["application/json"],
      paths["/chat/create/session"]["post"]["responses"]["200"]["content"]["application/json"]
    >(`/chat/create/session`, {
      userId: targetUserId,
    })
    sessions.value.unshift(sessionData)
    // 切换选中会话为新创建的会话
    selectedSessionId.value = sessionData.session.id
}
</script>

<style scoped lang="css">
.chat-page {
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 3fr;

  .sessions {
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  
  .chat-panel {
    height: var(--root-mainview-height);
    position: relative;
    .chat-messages {
      height: calc(100% - 12rem);
      width: 100%;
      overflow-y: auto;
      gap: 0.5rem;
      padding: 0 5%;
      display: flex;
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
    .chat-sender {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 70%;
      height: 11rem;
    }
  }
}
</style>
