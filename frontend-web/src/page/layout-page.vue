<template>
  <!-- 全局组件挂载区 -->
  <ImagePreview />
  <ErrorDialog></ErrorDialog>
  <WorkModal v-if="globalWorkModal.isShow.value"></WorkModal>
  <ReportModal v-if="globalReportModal.isShow.value"></ReportModal>
  <UpdateUserModal v-if="globalUpdateUserModal.isShow.value"></UpdateUserModal>
  <WorkReportModal v-if="globalWorkReportModal.isShow.value"></WorkReportModal>
  <FollowModal v-if="globalFollowModal.isShow.value"></FollowModal>

  <!-- 初始化用户弹窗 -->
  <InitUserModal v-model:show="enableInitUserModalShow" v-if="enableInitUserModalShow"></InitUserModal>

  <div class="layout">
    <div class="left">
      <div class="brand">商标占位</div>
      <NavBar></NavBar>
    </div>
    <router-view :key="router.currentRoute.value.path" class="right"></router-view>
  </div>
</template>

<script setup lang="ts">
  import NavBar from '@/component/NavBar.vue'
  import InitUserModal from '@/component/user/init-user-modal.vue';
  import UpdateUserModal from '@/component/user/update-user-modal.vue';
  import ErrorDialog from '@/component/common/ErrorDialog.vue';
  import ImagePreview from '@/component/file/image-preview.vue';
  import WorkModal from '@/component/work/work-modal.vue';
  import ReportModal from '@/component/report/report-modal.vue';
  import WorkReportModal from '@/component/work/work-report-modal.vue';
  import FollowModal from '@/component/user/follow-modal.vue';
  import { onBeforeMount, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { storage } from '@/storage';
  import { clientEvent } from '@/api/event';
  import type { components, paths } from '@/api/gen';
  import { axiosProxy } from '@/api/axios';
  import { globalWorkModal, globalReportModal, globalUpdateUserModal, globalWorkReportModal, globalFollowModal, globalErrorDialog } from '@/component/global';

  const router = useRouter();
  const enableInitUserModalShow = ref(false)

  /** 以下为客户端事件推送全局回调函数 */

  // 服务器错误
  const errorCallback = async (data: unknown) => {
    // 接收到错误,清理相关资源,由于后端主动断开tcp连接,客户端不需要主动断
    globalErrorDialog.show((data as components["schemas"]["errorClientEvent"]).msg)
    storage.clear()
  }

  // 心跳续约
  const heartbeatCallback = async (data: unknown) => {
    // jwt续约
    storage.setToken((data as components["schemas"]["heartbeatClientEvent"]).jwt)
  }

  // 聊天消息推送
  const chatMessagePushCallback = async (data: unknown) => {
    const event = data as components["schemas"]["pushChatMessageEvent"]

    if (storage.initData.value && event.message.session_id !== storage.activeSessionId.value) storage.initData.value.unreadMessageCount += 1
  }

  onBeforeMount(async () => {
    // 连接后端事件推送
    await clientEvent.connect()

    // 注册全局回调函数
    clientEvent.registerCallback("global", "error", errorCallback)
    clientEvent.registerCallback("global", "heartbeat", heartbeatCallback)
    clientEvent.registerCallback("global", "pushChatMessage", chatMessagePushCallback)

    // 获取初始化数据
    storage.initData.value = (
      await axiosProxy.post<
      paths["/get/user/init-data"]["post"]["requestBody"],
      paths["/get/user/init-data"]['post']["responses"]["200"]["content"]["application/json"]
    >("/get/user/init-data", undefined))

    // 如果新用户个人信息未完善,显示弹窗
    if (storage.initData.value?.user.is_complete_profile === 0) {
      setTimeout(() => {
        enableInitUserModalShow.value = true
      },500)
    }
  })
</script>

<style scoped lang="scss">
  .layout {
    height: 100vh;
    width: 100vw;
    overflow-y: hidden;
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: 100%;
    align-items: start;
    .left {
      display: grid;
      grid-template-columns: 100%;
      .brand {
        padding: 2rem;
        text-align: center;
      }
    }
    .right {
      overflow: auto;
      height: 100%;
    }
  }
</style>
