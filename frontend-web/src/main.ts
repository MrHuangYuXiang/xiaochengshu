import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.ts'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { AppError } from './error.ts'
import './static/css/global.css';
import { logger } from './logger.ts'

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.mount('#app')

// 全局错误捕捉器
app.config.errorHandler = (err, vm, info) => {
  if (err instanceof AppError) {
    const binaryStr = atob(err.message);
    const uint8 = Uint8Array.from(
      [...binaryStr].map(char => char.charCodeAt(0))
    );
    const msg = new TextDecoder("utf-8").decode(uint8)
    logger.debug(`全局错误捕捉器: ${msg}`)
    ElMessage({
      type: 'error',
      message: msg,
    })
    return
  }
}
