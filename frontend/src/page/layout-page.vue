<template>
  <!-- 全局组件挂载区 -->
  <ImagePreview />
  <MsgTip />
  <ErrorDialog></ErrorDialog>
  <WorkModal v-if="globalWorkModal.isShow.value"></WorkModal>
  <ReportModal v-if="globalReportModal.isShow.value"></ReportModal>
  <UpdateUserModal v-if="globalUpdateUserModal.isShow.value"></UpdateUserModal>

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
  import InitUserModal from '@/component/user/InitUserModal.vue';
  import UpdateUserModal from '@/component/user/update-user-modal.vue';
  import ErrorDialog from '@/component/common/ErrorDialog.vue';
  import MsgTip from '@/component/chat/msg-tip.vue';
  import ImagePreview from '@/component/image/image-preview.vue';
  import WorkModal from '@/component/work/work-modal.vue';
  import ReportModal from '@/component/report/report-modal.vue';
  import { onBeforeMount, ref } from 'vue';

  import { useRouter } from 'vue-router';
  import { storage } from '@/storage';
  import { clientEvent } from '@/api/event';
  import type { paths } from '@/api/gen';
  import { axiosProxy } from '@/api/axios';
  import { globalWorkModal, globalReportModal, globalUpdateUserModal } from '@/component/global';

  const router = useRouter();
  const enableInitUserModalShow = ref(false)

  onBeforeMount(async () => {
    // 连接后端事件推送
    await clientEvent.connect()

    // 获取初始化数据
    storage.setInitData(
      await axiosProxy.get<
      paths["/user/init-data"]["get"]["parameters"]["query"],
      paths["/user/init-data"]['get']["responses"]["200"]["content"]["application/json"]
    >("/user/init-data", undefined))

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
    align-items: start;
    .left {
      display: grid;
      grid-template-columns: auto;
      .brand {
        padding: 2rem;
        text-align: center;
      }
    }
    .right {
      padding: 2rem;
      height: 100%;
    }
  }
</style>
