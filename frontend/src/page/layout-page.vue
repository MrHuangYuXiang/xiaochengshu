<template>
  <!-- 全局组件挂载区 -->
  <ImagePreview />
  <MsgTip />
  <ErrorDialog></ErrorDialog>
  <WorkModal v-if="globalWorkModal.isShow.value"></WorkModal>
  <ReportModal v-if="globalReportModal.isShow.value"></ReportModal>

  <!-- 初始化用户弹窗 -->
  <InitUserModal v-model:show="enableInitUserModalShow" v-if="enableInitUserModalShow"></InitUserModal>
  <!-- 更新用户信息弹窗 -->
  <UpdateUserModal v-model:show="enableUpdateUserModalShow" v-if="enableUpdateUserModalShow"></UpdateUserModal>

  <div class="layout">
    <div class="top">
      <div class="current">
        <!-- 顶部用户菜单 -->
        <DropMenu>
          <div class="drop-menu">
            <UserAvatar  :user-id="storage.initData.value?.user.id"  :img-url="storage.initData.value?.user.avatar_url" :width="'40px'"></UserAvatar>
            <div>{{ storage.initData.value?.user.name }}</div>
          </div>
          <template #menu>
            <div class="drop-more">
              <div
                v-for="item in dropMenuItems"
                :key="item.id"
                class="more-item"
                :class="{
                  'logout': item.id === 2,
                }"
                @click="clickMenuItem(item.id)"
                style="cursor: pointer;"
              >
                {{ item.label }}
              </div>
            </div>
          </template>
        </DropMenu>
      </div>
    </div>
    <div class="bottom">
      <div class="left">
        <NavBar></NavBar>
      </div>
      <div class="right" ref="">
        <router-view :key="router.currentRoute.value.path"></router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import NavBar from '@/component/NavBar.vue'
  import DropMenu from '@/component/common/DropMenu.vue'
  import UserAvatar from '@/component/user/UserAvatar.vue';
  import InitUserModal from '@/component/user/InitUserModal.vue';
  import UpdateUserModal from '@/component/user/UpdateUserModal.vue';
  import ErrorDialog from '@/component/common/ErrorDialog.vue';
  import MsgTip from '@/component/chat/msg-tip.vue';
  import ImagePreview from '@/component/image/image-preview.vue';
  import WorkModal from '@/component/work/WorkModal.vue';
  import ReportModal from '@/component/report/report-modal.vue';
  import { onBeforeMount, ref } from 'vue';

  import { useRouter } from 'vue-router';
  import { storage } from '@/storage';
  import { clientEvent } from '@/api/event';
  import type { paths } from '@/api/gen';
  import { axiosProxy } from '@/api/axios';
  import { globalWorkModal, globalReportModal } from '@/component/global';

  const router = useRouter();
  const dropMenuItems = [
    { id: 1, label: "个人信息" },
    { id: 2, label: "退出登录" },
  ]
  const enableInitUserModalShow = ref(false)
  const enableUpdateUserModalShow = ref(false)

  const clickMenuItem = async (id: number) => {
    switch (id) {
      // 修改个人信息
      case 1:
        enableUpdateUserModalShow.value = true
        break

      // 退出登录
      case 2:
        storage.clear();
        clientEvent.disconnect()
        await router.push({ name: "LoginPage" });
        break
    }
  }

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
    .top {
      padding: 0 40px;
      display: flex;
      height: var(--root-topview-height);
      width: 100vw;
      justify-content: end;
      align-items: center;
      .current {
        .drop-menu {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .drop-more {
          display: flex;
          flex-direction: column;
          align-items: center;
          .more-item {
            padding: 10px 20px;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s ease-in-out;
            white-space: nowrap;
          }
          .more-item:hover {
            background-color: var(--root-bg-gray);
          }
          .logout {
            color: red;
          }
        }
      }
      .search {
        flex: 9;
      }
    }
    .bottom {
      height: var(--root-mainview-height);
      width: 100vw;
      display: flex;
      justify-content: center;
      align-items: center;
      .left {
        padding: 20px;
        width: 20%;
        height: 100%;
      }
      .right {
        height: 100%;
        width: 80%;
      }
    }
  }
</style>
