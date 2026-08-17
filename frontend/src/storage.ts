import { ref, type Ref } from "vue";
import type { paths } from "./api/gen";

class Storage {
  public initData: Ref<paths["/user/init-data"]["get"]["responses"]["200"]["content"]["application/json"] | null>
  public token: Ref<string | null>

  constructor() {
    this.initData = ref(null);
    this.token = ref(localStorage.getItem("token") || null);
  }

  setToken(token: string) {
    this.token.value = token;
    localStorage.setItem("token", token);
  }

  setInitData(initData: paths["/user/init-data"]["get"]["responses"]["200"]["content"]["application/json"]) {
    this.initData.value = initData;
    
    // 如果用户有头像,对头像加随机时间戳防止浏览器缓存
    if (this.initData.value!.user.avatar_url){
          this.initData.value!.user.avatar_url += '?timestamp=' + Date.now()
    }
  }

  // 更新用户头像URL时间戳,避免浏览器缓存
  updateUserAvatarUrl() {
    this.initData.value!.user.avatar_url = `${this.initData.value!.user.avatar_url.split('?')[0]}?time=${new Date().getTime()}`
  }

  clear() {
    localStorage.clear();
    this.token.value = null;
    this.initData.value = null;
  }
}

export const storage = new Storage();
