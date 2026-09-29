import { createRouter, createWebHistory } from 'vue-router'
import UserPage from '@/page/user-page.vue'
import DiscoverPage from '@/page/discover-page.vue'
import LayoutPage from '@/page/layout-page.vue'
import LoginPage from '@/page/login-page.vue'
import PublishPage from '@/page/publish-page.vue'
import ChatPage from '@/page/chat-page.vue'
import LivePage from '@/page/live-page.vue'
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
