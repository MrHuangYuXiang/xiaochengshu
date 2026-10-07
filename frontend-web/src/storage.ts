import { ref, type Ref } from "vue";
import type { paths } from "./api/gen";

class Storage {
  public initData: Ref<paths["/get/user/init-data"]["post"]["responses"]["200"]["content"]["application/json"] | undefined>
  public token: Ref<string | undefined>

  // 当前活跃会话id
  public activeSessionId: Ref<string>

  constructor() {
    this.initData = ref(undefined);
    this.token = ref(localStorage.getItem("token") || undefined);
    this.activeSessionId = ref("");
  }

  setToken(token: string) {
    this.token.value = token;
    localStorage.setItem("token", token);
  }

  clear() {
    localStorage.clear();
    this.token.value = undefined;
    this.initData.value = undefined;
    this.activeSessionId.value = "";
  }
}

export const storage = new Storage();
