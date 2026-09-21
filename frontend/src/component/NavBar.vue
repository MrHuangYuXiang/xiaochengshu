<template>
  <div class="nav-bar">
    <div
    v-for="item in navItems"
    :key="item.index"
    :class="{ 'nav-item': true, 'active': currentNav === item.index }"
    @click="clickNavItem(item.index)"
    >
      <el-icon><component :is="item.icon"></component></el-icon>
      <div>{{ item.title }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { User, Opportunity, Edit, ChatLineRound } from '@element-plus/icons-vue';
  import { storage } from '@/storage';
  import { useRouter } from 'vue-router';

  const router = useRouter()
  const navItems = [
    { title: '发现', componentName: 'DiscoverPage', index: 0, icon: Opportunity },
    { title: '直播', componentName: 'LivePage', index: 1, icon: Opportunity },
    { title: '发布', componentName: 'PublishPage', index: 2, icon: Edit },
    { title: '聊天', componentName: 'ChatPage', index: 3, icon: ChatLineRound },
    { title: '我的', componentName: 'UserPage', index: 4, icon: User },
  ]

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
 </script>

<style scoped lang="scss">
  .nav-bar {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    .nav-item {
      border-radius: 15px;
      padding: 1rem;
      display: flex;
      gap: 0.5rem;
      align-items: center;
      text-decoration: none;
      color: black;
      font-weight: 600;
    }
    .nav-item:hover {
      background-color: #f5f5f5;
    }
    .active {
      background-color: #f5f5f5;
    }
  }
</style>
