import { createRouter, createWebHistory } from 'vue-router'
import UserPage from '@/page/UserPage.vue'
import DiscoverPage from '@/page/DiscoverPage.vue'
import LayoutPage from '@/page/LayoutPage.vue'
import LoginPage from '@/page/LoginPage.vue'
import PublishPage from '@/page/PublishPage.vue'
import ChatPage from '@/page/ChatPage.vue'
import LivePage from '@/page/LivePage.vue'
import { checkLogin } from './middleware';

const routes = [
  { path: "/login", component: LoginPage, name: "LoginPage" },
  {
    path: "/", component: LayoutPage, children: [
      { path: "publish", component: PublishPage, name: "PublishPage" },
      { path: "live", component: LivePage, name: "LivePage" },
      { path: "user/:userId", component: UserPage, name: "UserPage" },
      { path: "discover", component: DiscoverPage, name: "DiscoverPage" },
      { path: "chat", component: ChatPage, name: "ChatPage" },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

// 注册中间件
router.beforeEach(checkLogin);

export default router
