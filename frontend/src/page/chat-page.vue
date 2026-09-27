<template>
  <div class="chat-page">
    <ScrollContainer
      trigger-type="bottom"
      :load-more-callback="getSessions"
      class="sessions"
    >
      <div class="title">我的消息</div>
      <SessionCard
        v-for="session in sessions"
        v-model:selected-id="selectedSessionId"
        :key="session.session.id"
        :sessionId="session.session.id"
        :sessionType="session.session.type"
        :userId="session.user.id"
        :userAvatarUrl="session.user.avatar_url"
        :userName="session.user.name"
        :latestMsg="session.latestMessage ? session.latestMessage.content : ''"
        :msgTime="session.latestMessage ? session.latestMessage.created_at : ''"
        :unreadCount="session.unreadCount"
        @click="switchSession(session.session.id)"
      />
    </ScrollContainer>
    <div class="chat-panel" v-show="selectedSessionId !== ''">
      <ScrollContainer
        trigger-type="reverse-top"
        :load-more-callback="getMessages"
        ref="msgScrollRef"
        class="chat-messages"
        :class="{
          'system': sessions.get(selectedSessionId)?.session.type === 3,
        }"
      >
        <ChatMessage
          v-for="msg in messages"
          :key="msg.message.id"
          :userId="msg.user.id"
          :userAvatarUrl="msg.user.avatar_url"
          :messageType="msg.message.type"
          :messageContent="msg.message.content"
          :messagePayload="msg.message.payload"
          :sessionType="sessions.get(selectedSessionId)?.session.type"
          @clickMessage="clickMessage(msg)"
        />
      </ScrollContainer>
      <ChatSender 
        @send-msg="sendMsg" 
        class="chat-sender" 
        v-if="sessions.get(selectedSessionId)?.session.type !== 3"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import SessionCard from '@/component/chat/session-card.vue';
  import ChatSender from '@/component/chat/chat-sender.vue';
  import ScrollContainer from '@/component/common/scroll-container.vue';
  import ChatMessage from '@/component/chat/chat-message.vue';
  import { onMounted, ref, useTemplateRef } from 'vue';
  import type { SessionSchema, MessageSchema } from '@/api/type.ext';
  import { EnhancedList } from '@/lib/list';
  import { axiosProxy } from '@/api/axios';
  import type { paths } from '@/api/gen';
  import { useRoute } from 'vue-router';
  import { globalReportModal } from '@/component/global';

  const route = useRoute()

  const sessions = ref<EnhancedList<SessionSchema>>(new EnhancedList(
    (item) => item.session.id,
    10,
  ))
  const messages = ref<EnhancedList<MessageSchema>>(new EnhancedList(
    (item) => item.message.id,
    10,
  ))

  // 当前选中会话id
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
  const switchSession = async (sessionId: string) => {
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
      content: content,
      type: 1,
      payload: {
        1: {}
      },
    })
    messages.value.unshift(message)
  }

  // 点击消息
  const clickMessage = (msg: MessageSchema) => {
    switch (msg.message.type) {
      // 普通文本消息
      case 1:
        break;
      // 举报通知
      case 2:
        console.log(msg.message)
        if (!msg.message.payload[2]) return
        globalReportModal.show(msg.message.payload[2].report_id)
        break;
      default:
        break;
    }
  }

  onMounted(async () => {
    // 加载当前用户会话数据
    await getSessions()
    // 创建新会话(该接口会幂等返回已存在的会话)
    await onMountedCreateSession()
  })

  // 挂载钩子:创建会话逻辑
  const onMountedCreateSession = async () => {
    if (!route.query.createOptionUserId) return

    const userId = route.query.createOptionUserId as string
    
    // 创建会话
    const sessionData = await axiosProxy.post<
      paths["/chat/create/session"]["post"]["requestBody"]["content"]["application/json"],
      paths["/chat/create/session"]["post"]["responses"]["200"]["content"]["application/json"]
    >(`/chat/create/session`, {
      userId,
    })
    sessions.value.unshift(sessionData)
    // 切换选中会话为新创建的会话
    selectedSessionId.value = sessionData.session.id
    // 获取该会话消息
    await getMessages()
  }

</script>

<style scoped lang="css">
.chat-page {
  display: grid;
  grid-template-columns: 1fr 3fr;

  .sessions {
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    .title {
      font-size: large;
      padding: 2rem;
      text-align: center;
      font-weight: bold;
    }
  }
  
  .chat-panel {
    height: 100%;
    padding-bottom: 1rem;
    display: grid;
    grid-template-rows: 1fr auto;
    grid-template-columns: 100%;
    justify-items: center;
    .chat-messages {
      width: 100%;
      gap: 0.5rem;
      padding: 1rem 3rem;
      display: flex;
      flex-direction: column-reverse;
      justify-content: end;
      align-items: center;
    }
    .system {
      grid-row: 2;
    }
    .chat-sender {
      width: 75%;
    }
  }
}
</style>
