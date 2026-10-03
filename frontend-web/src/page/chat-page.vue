<template>
  <div class="chat-page">
    <ScrollContainer
      trigger-type="bottom"
      :load-more-callback="getSessions"
    >
      <div class="sessions">
        <div class="title">我的消息</div>
        <SessionCard
          v-for="session in sessions"
          v-model:selected-id="storage.activeSessionId.value"
          :key="session.session.id"
          :sessionId="session.session.id"
          :sessionType="session.session.type"
          :sessionIsPin="session.sessionMember.is_pin"
          :userId="session.user.id"
          :userAvatarUrl="session.user.avatar_url"
          :userName="session.user.name"
          :messageContent="session.latestMessage ? session.latestMessage.content : ''"
          :messageTime="session.latestMessage ? session.latestMessage.created_at : ''"
          :messageType="session.latestMessage ? session.latestMessage.type : 0"
          :unreadCount="session.unreadCount"
          @click="switchSession(session.session.id)"
        />
      </div>
    </ScrollContainer>
    <div class="chat-panel" v-if="storage.activeSessionId.value !== ''">
      <div class="message-top">
        <div class="setting">
          <AppIcon 
            type="more"
            class="setting-icon"
            fill="black"
            @click="isShwowSettingFloating = true"
          />
          <SelectFloating
            v-model:show="isShwowSettingFloating"
            class="setting-floating"
            :options="settingOptions"
            @click-option="clickSettingHandler"
          />
        </div>
      </div>
      <ScrollContainer
        trigger-type="reverse-top"
        :load-more-callback="getMessages"
        ref="msgScrollRef"
        :style="{
          height: '100%'
        }"
      >
        <div
          class="chat-messages"
          :class="{
            'private': sessions.get(storage.activeSessionId.value)?.session.type === 1,
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
            :messageCreatedAt="msg.message.created_at"
            :sessionType="sessions.get(storage.activeSessionId.value)?.session.type"
            @clickMessage="clickMessage(msg)"
          />
        </div>
      </ScrollContainer>
      <ChatSender
        @send-msg="sendMsg" 
        class="chat-sender" 
        v-if="sessions.get(storage.activeSessionId.value)?.session.type === 1"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import SessionCard from '@/component/chat/session-card.vue';
  import ChatSender from '@/component/chat/chat-sender.vue';
  import ScrollContainer from '@/component/common/scroll-container.vue';
  import ChatMessage from '@/component/chat/chat-message.vue';
  import AppIcon from '@/component/common/AppIcon.vue';
  import SelectFloating from '@/component/common/select-floating.vue';
  import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
  import type { SessionSchema, MessageSchema } from '@/api/type.ext';
  import { EnhancedList } from '@/lib/structure';
  import { axiosProxy } from '@/api/axios';
  import type { components, paths } from '@/api/gen';
  import { useRoute } from 'vue-router';
  import { globalReportModal, globalWorkModal } from '@/component/global';
  import { ElMessage } from 'element-plus';
  import { clientEvent } from '@/api/event'
  import { storage } from '@/storage';

  const route = useRoute()

  const sessions = ref<EnhancedList<SessionSchema>>(new EnhancedList(
    (item) => item.session.id,
    10,
  ))
  const messages = ref<EnhancedList<MessageSchema>>(new EnhancedList(
    (item) => item.message.id,
    10,
  ))

  // 显示设置浮动框
  const isShwowSettingFloating = ref(false)
  // 设置选项
  const settingOptions = [
    { id: 1, text: '置顶聊天' },
  ]

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
      >("/chat/get/messages", { 
        page: page, 
        pageSize: size, 
        sessionId: storage.activeSessionId.value
      })
      return data.messages
    })
    return messages.value.isEnd
  }

  // 切换当前选中会话
  const switchSession = async (sessionId: string) => {
    if (storage.activeSessionId.value === sessionId) {
      return
    }

    storage.activeSessionId.value = sessionId
    messages.value.clear()
    msgScrollRef.value?.reset()

    // 更新未读信息数据
    const session = sessions.value.get(storage.activeSessionId.value)
    if (session && storage.initData.value) {
      storage.initData.value.unreadMessageCount -= session.unreadCount
      session.unreadCount = 0
    }
  }

  // 发送消息
  const sendMsg = async (content: string) => {
    const message = await axiosProxy.post<
      paths["/chat/send/message"]["post"]["requestBody"]["content"]["application/json"],
      paths["/chat/send/message"]["post"]["responses"]["200"]["content"]["application/json"]
    >("/chat/send/message", {
      sessionId: storage.activeSessionId.value,
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
        if (!msg.message.payload[2]) return
        globalReportModal.show(msg.message.payload[2].report_id)
        break;
      // 作品互动消息
      case 4:
      case 5:
      case 6:
        if (!msg.message.payload[msg.message.type]) return
        globalWorkModal.show(msg.message.payload[msg.message.type]!.work_id)
      default:
        break;
    }
  }

  // 点击设置选项
  const clickSettingHandler = async (id: number) => {
    switch (id) {
      // 置顶聊天
      case 1:
        const session = sessions.value.get(storage.activeSessionId.value)
        if (!session) return

        session.sessionMember.is_pin = session.sessionMember.is_pin === 1 ? 0 : 1
        await axiosProxy.post<
          paths["/chat/pin/session"]["post"]["requestBody"]["content"]["application/json"],
          undefined
        >("/chat/pin/session", {
          sessionMemberId: session.sessionMember.id,
          isPin: session.sessionMember.is_pin
        })
        ElMessage("置顶成功")
        break;
      default:
        break;
    }
  }

  // 消息推送页面回调
  const messagePushPageCallback = async (data: unknown) => {
    const event = data as components["schemas"]["pushChatMessageEvent"]

    sessions.value.delete(event.message.session_id)

    // 获取新的会话信息并插入
    const session = await axiosProxy.get<
      paths["/chat/get/session"]["get"]["parameters"]["query"],
      paths["/chat/get/session"]["get"]["responses"]["200"]["content"]["application/json"]
    >(`/chat/get/session`, { sessionId: event.message.session_id })
    if (session.session) sessions.value.insert(session.session, (item) => item.sessionMember.is_pin === 0)

    // 如果当前正在和该会话聊天,则插入消息
    if (storage.activeSessionId.value === event.message.session_id) {
      messages.value.unshift(event)
    }
  }

  onMounted(async () => {
    // 创建新会话(该接口会幂等返回已存在的会话)
    await onMountedCreateSession()

    // 注册客户端事件页面回调
    clientEvent.registerCallback("page", "pushChatMessage", messagePushPageCallback)
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
    storage.activeSessionId.value = sessionData.session.id
  }

  onUnmounted(async () => {
    // 清除活跃会话
    await axiosProxy.post<
      undefined,
      undefined
    >("/chat/clear/active/session", undefined)
  })
</script>

<style scoped lang="css">
.chat-page {
  display: grid;
  grid-template-columns: 1fr 3fr;
  grid-template-rows: 100%;

  .sessions {
    height: auto;
    display: grid;
    grid-template-columns: 100%;
    padding-right: 2rem;
    .title {
      font-size: large;
      padding: 2rem;
      text-align: center;
      font-weight: bold;
    }
  }
  
  .chat-panel {
    height: 100%;
    padding: 3rem;
    display: grid;
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 100%;
    .message-top {
      display: grid;
      grid-template-columns: auto;
      justify-items: end;
      .setting {
        position: relative;
        .setting-icon {
          cursor: pointer;
          width: 2rem;
          height: 2rem;
        }
        .setting-floating {
          left: 0;
          top: 50%;
          transform: translateX(-110%) translateY(-50%);
        }
      }
    }

    .chat-messages {
      width: 100%;
      padding: 2rem 0;
      display: flex;
      flex-direction: column-reverse;
      align-items: stretch;
      justify-content: end;
      grid-row: 2 / span 2;
    }
    .private {
      grid-row: 2;
    }
    .chat-sender {
      width: 100%;
      justify-self: center;
    }
  }
}
</style>
