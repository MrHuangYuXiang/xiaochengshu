import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios"
import { storage } from '@/storage';
import { BackendError } from '@/error';
import { logger } from "@/logger";
import { globalLoadingModal } from "@/component/global";

class AxiosProxy {
  axiosInstance: AxiosInstance

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL: baseURL,
      timeout: 10000,
    })

    this.axiosInstance.interceptors.request.use((config) => {
      config.headers['Authorization'] = storage.token.value
      return config
    }, (err) => {
      throw err
    })

    this.axiosInstance.interceptors.response.use((res) => {
      logger.debug(`响应数据: ${JSON.stringify(res.data)}`)
      const headers = res.headers;
      const success = headers["app-success"];
      if (success === "1") {
        return res.data
      } else {
        throw new BackendError(headers["app-error-msg"])
      }
    }, (err) => {
      throw err
    })
  }

  async post<T, Q>(url: string, bodyData: T, ext: ExtArg = {}): Promise<Q> {
    if (ext.showLoading) {
      globalLoadingModal.show()
    }

    let body = {}
    if (bodyData) {
      body = bodyData
    }
    const data = await this.axiosInstance.post(url, body) as Q
    globalLoadingModal.close()
    return data
  }
}

// post扩展参数类型
type ExtArg = {
  showLoading?: 'circle'
}

export const axiosProxy = new AxiosProxy(import.meta.env.VITE_API_URL) // 后端api axios代理
