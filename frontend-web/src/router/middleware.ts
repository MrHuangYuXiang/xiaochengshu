import { clientEvent } from '@/api/event';
import { storage } from '@/storage';

export const middleware = (to: any, from: any) => {
  // 清空客户端事件页面回调
  clientEvent.pageCallbackMap.clear()

  // 如果当前用户已登录,则不允许访问登录页
  if (storage.token.value !== undefined && to.name === "LoginPage") {
    return {
      name: "DiscoverPage",
    }
  }

  // 如果当前用户未登录,则仅允许访问登录页
  if (storage.token.value === undefined && to.name !== "LoginPage") {
    return {
      name: "LoginPage",
    }
  }

  return true
}
