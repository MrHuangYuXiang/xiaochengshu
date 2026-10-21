<template>
    <div class="login-page">
      <div class="login-card">
        <div class="qr">
          <div style="font-size: 18px; font-weight: bold;">打开小橙书app</div>
          <div style="font-size: 13px; color: var(--root-gray);">扫描下方二维码登录</div>
          <img src="/images/login-qr-code.png"/>
        </div>
        <div class="border"></div>
        <div class="right">
          <div class="title">登录你的账号</div>
          <FormInput
            type="text"
            placeholder="请输入手机号"
            :rule="rules.phoneNumber"
            v-model="formValues.phoneNumber"
            ref="loginPhoneRef"
          />
          <FormInput
            type="text"
            placeholder="请输入验证码"
            :rule="rules.code"
            v-model="formValues.code"
            ref="loginCodeRef"
          />
          <FormButton text="登录" @click="clickLogin" type="glass" color="orange" />
          <AppDivider text="用其他方式登录" color="black" />
          <FormButton color="default" text="微信登录" type="glass" />
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
  import { ref, useTemplateRef } from 'vue'
  import { axiosProxy } from '@/api/axios';
  import type { paths } from '@/api/gen';
  import { storage } from '@/storage';
  import { useRouter } from 'vue-router';
  import FormInput from '@/component/form/form-input.vue';
  import FormButton from '@/component/form/form-button.vue';
  import AppDivider from '@/component/common/AppDivider.vue';
  import z from 'zod';

  const formValues = ref({
      phoneNumber: "",
      code: "",
  })
  const rules = {
    phoneNumber: z.string().length(11, "手机号必须为11位"),
    code: z.string().length(6, "验证码必须为6位"),
  }
  const loginPhoneRef = useTemplateRef("loginPhoneRef")
  const loginCodeRef = useTemplateRef("loginCodeRef")

  const router = useRouter();

  const clickLogin = async () => {
    if (!loginPhoneRef.value?.validate() || !loginCodeRef.value?.validate()) {
      return
    }
    const loginRes = await axiosProxy.post<
      paths["/login"]["post"]["requestBody"]["content"]["application/json"],
      paths["/login"]["post"]["responses"]["200"]["content"]["application/json"]
    >("/login", formValues.value)
    storage.setToken(loginRes.token);
    await router.push({ name: "DiscoverPage" });
  }
</script>

<style scoped lang="scss">
    .login-page {
      position: relative;
      height: 100vh;
      width: 100vw;
      background: url('/images/login-background.png') no-repeat center center;
      background-size: cover;
      overflow: hidden;
      .login-card {
        white-space: nowrap;
        padding: 1rem;
        overflow: auto;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        position: absolute;
        border-radius: 15px;
        display: grid;
        grid-template-columns: 1fr 1px 1.5fr;
        align-content: start;
        backdrop-filter: blur(10px);
        background: rgba($color: white, $alpha: 0.2);
        .qr {
          padding: 2rem;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: start;
          flex-direction: column;
          font-size: 20px;
          gap: 10px;
          img {
            margin-top: 40px;
            width: 125px;
            aspect-ratio: 1 / 1;
          }
        }
        .border {
          height: 100%;
          background: rgba($color: white, $alpha: 0.8);
        }
        .right {
          padding: 2rem;
          position: relative;
          display: grid;
          grid-template-columns: 100%;
          grid-template-rows: auto;
          row-gap: 0.5rem;
          .title {
            text-align: center;
            font-size: 1.4rem;
            font-weight: bold;
            margin-bottom: 1rem;
          }
        }
      }
    }
</style>
