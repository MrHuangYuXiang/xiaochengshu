import { storage } from '@/storage';

// 判断用户是否登录中间件
export const checkLogin = (to: any, from: any) => {

  // 如果当前用户已登录,则不允许访问登录页
  if (storage.token.value !== null && to.name === "LoginPage") {
    return {
      name: "DiscoverPage",
    }
  }

  // 如果当前用户未登录,则仅允许访问登录页
  if (storage.token.value === null && to.name !== "LoginPage") {
    return {
      name: "LoginPage",
    }
  }

  return true
}
