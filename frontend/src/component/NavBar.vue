<template>
  <div class="nav">
    <div
    v-for="item in navItems"
    :key="item.index"
    :class="{ 'nav-item': true, 'active': currentNav === item.index }"
    @click="clickNavItem(item.index)"
    >
      <el-icon><component :is="item.icon"></component></el-icon>
      <div>{{ item.title }}</div>
    </div>
    <div 
      class="nav-item setting"
      @click="isShowSettingFloating = !isShowSettingFloating"
    >
      <el-icon><component :is="Setting"></component></el-icon>
      <div>设置</div>
      <SelectFloating
        @clickOption="clickMenuItem"
        v-model:show="isShowSettingFloating"
        :options="settingItems"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { User, Opportunity, Edit, ChatLineRound, Setting } from '@element-plus/icons-vue';
  import { storage } from '@/storage';
  import { useRouter } from 'vue-router';
  import SelectFloating from './common/select-floating.vue';
  import { clientEvent } from '@/api/event.ts';
  import { globalUpdateUserModal } from './global.ts';

  const router = useRouter()
  const navItems = [
    { title: '发现', componentName: 'DiscoverPage', index: 0, icon: Opportunity },
    { title: '直播', componentName: 'LivePage', index: 1, icon: Opportunity },
    { title: '发布', componentName: 'PublishPage', index: 2, icon: Edit },
    { title: '聊天', componentName: 'ChatPage', index: 3, icon: ChatLineRound },
    { title: '我的', componentName: 'UserPage', index: 4, icon: User },
  ]
  const settingItems = [
    { id: 1, text: '修改个人信息' },
    { id: 2, text: '退出登录' },
  ]
  const isShowSettingFloating = ref(false)

  const currentNav = ref(0)

  const clickNavItem = (index: number) => {
    currentNav.value = index
    const params: Record<string, string | undefined> = {}

    // 如果目标页面是UserPage,需要传递userId参数
    if (index === 4) {
      params.userId = storage.initData.value?.user.id
    }

    router.push({ name: navItems[index]?.componentName, params })
  }

  const clickMenuItem = async (id: number) => {
    switch (id) {
      // 修改个人信息
      case 1:
        globalUpdateUserModal.isShow.value = true
        break

      // 退出登录
      case 2:
        storage.clear();
        clientEvent.disconnect()
        await router.push({ name: "LoginPage" });
        break
    }
  }
 </script>

<style scoped lang="scss">
  .nav {
    display: grid;
    grid-template-columns: auto;
    grid-auto-rows: auto;
    gap: 0.5rem;
    padding: 1rem;
    .nav-item {
      cursor: pointer;
      display: grid;
      grid-template-columns: auto auto;
      border-radius: 15px;
      padding: 1rem 2rem;
      padding-right: 6rem;
      display: flex;
      column-gap: 0.5rem;
      align-items: center;
      text-decoration: none;
      color: black;
      font-weight: 600;
      white-space: nowrap;
    }
    .nav-item:hover {
      background-color: #f5f5f5;
    }
    .active {
      background-color: #f5f5f5;
    }
    .setting {
      position: relative;
    }
  }
</style>
