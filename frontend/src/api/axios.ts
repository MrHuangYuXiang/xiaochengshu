import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios"
import { storage } from '@/storage';
import { AppError } from '@/error';
import { logger } from "@/logger";

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
        throw new AppError(headers["app-error-msg"])
      }
    }, (err) => {
      throw err
    })
  }

  async get<T, Q>(url: string, queryParam: T, config: AxiosRequestConfig = {}): Promise<Q> {
    if (queryParam) {
      config.params = queryParam
    }

    return (await this.axiosInstance.get(url, config)) as Q
  }

  async post<T, Q>(url: string, bodyData: T, config: AxiosRequestConfig = {}): Promise<Q> {
    let body = {}
    if (bodyData) {
      body = bodyData
    }

    return await this.axiosInstance.post(url, body, config) as Q
  }
}

export const axiosProxy = new AxiosProxy(import.meta.env.VITE_API_URL) // 后端api axios代理
