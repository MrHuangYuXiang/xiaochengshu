<template>
  <!-- 初始化用户弹窗 -->
  <InitUserModal v-if="enableInitUserModalShow" @close="enableInitUserModalShow = false"></InitUserModal>
  <!-- 更新用户信息弹窗 -->
  <UpdateUserModal v-if="enableUpdateUserModalShow" @close="enableUpdateUserModalShow = false"></UpdateUserModal>
  <!-- 事件推送错误对话框 -->
  <AppDialog v-if="enableErrorDialogShow" :content="errorDialogContent" @close="confirmErrorDialog"></AppDialog>

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
  import AppDialog from '@/component/common/AppDialog.vue';
  import { onBeforeMount, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { storage } from '@/storage';
  import { httpEvent } from '@/api/event';
  import type { components, paths } from '@/api/gen';
  import { axiosProxy } from '@/api/axios';

  const router = useRouter();
  const dropMenuItems = [
    { id: 1, label: "个人信息" },
    { id: 2, label: "退出登录" },
  ]
  const enableInitUserModalShow = ref(false)
  const enableUpdateUserModalShow = ref(false)
  const enableErrorDialogShow = ref(false)
  // 错误对话框内容
  const errorDialogContent = ref("")


  const clickMenuItem = async (id: number) => {
    switch (id) {
      // 修改个人信息
      case 1:
        enableUpdateUserModalShow.value = true
        break

      // 退出登录
      case 2:
        storage.clear();
        httpEvent.disconnect()
        await router.push({ name: "LoginPage" });
        break
    }
  }

  const confirmErrorDialog = async () => {
    enableErrorDialogShow.value = false
    await router.push({ name: "LoginPage" });
  }

  onBeforeMount(async () => {
    /** 注册后端事件推送回调函数 */

    // 错误事件
    httpEvent.registerCallback(
      "error",
      async (data) => {
        // 接收到错误,清理相关资源,由于后端主动断开tcp连接,客户端不需要主动断
        errorDialogContent.value = (data as components["schemas"]["errorClientEvent"]).msg
        storage.clear()
        enableErrorDialogShow.value = true
      }
    )

    // 心跳续约
    httpEvent.registerCallback(
      "heartbeat",
      async (data) => {
        // jwt续约
        storage.setToken((data as components["schemas"]["heartbeatClientEvent"]).jwt)
     })

    // 连接后端事件推送
    await httpEvent.connect()

    // 获取初始化数据
    storage.setInitData(
      await axiosProxy.get<
      paths["/user/init-data"]["get"]["parameters"]["query"],
      paths["/user/init-data"]['get']["responses"]["200"]["content"]["application/json"]
    >("/user/init-data", undefined))

    // 如果新用户个人信息未完善,显示弹窗
    if (storage.initData.value?.user.is_profile_completed === 0) {
      setTimeout(() => {
        enableInitUserModalShow.value = true
      },500)
    }
  })
</script>

<style scoped lang="scss">
  .layout {
    width: 100%;
    height: 100%;
    .top {
      padding: 0 40px;
      display: flex;
      height: 80px;
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
      height: calc(100% - 80px);
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
