<template>
    <div class="login-page">
      <div class="login-card">
        <div class="qr">
          <div style="font-size: 18px; font-weight: bold;">打开小橙书app</div>
          <div style="font-size: 13px; color: var(--root-gray);">扫描下方二维码登录</div>
          <img src="/images/login-qr-code.png"/>
          <div class="download-app">点击下载小橙书app</div>
        </div>
        <div class="border"></div>
        <div class="right">
          <div class="title">登录你的账号</div>
          <FormInput
            placeholder="请输入手机号"
            :rule="phoneNumberValidator"
            v-model="loginForm.phoneNumber"
            ref="loginPhoneRef"
          />
          <FormInput
            placeholder="请输入验证码"
            :rule="codeValidator"
            v-model="loginForm.code"
            ref="loginCodeRef"
          />
          <FormButton text="登录" @click="clickLogin" type="glass" color="orange" />
          <AppDivider text="用其他方式登录" color="black" />
          <FormButton text="微信登录" type="glass" />
          <div class="bottom">如果你是新用户,将会自动注册</div>
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
  import { validateForm } from '@/helper/form';

  const loginForm = ref({
      phoneNumber: "",
      code: "",
  })
  const phoneNumberValidator = {
    required: {
      errorString: "请输入手机号",
    },
    mustLength: {
      value: 11,
      errorString: "手机号必须为11位"
    }
  }
  const codeValidator = {
    required: {
      errorString: "请输入验证码",
    },
    mustLength: {
      value: 6,
      errorString: "验证码必须为6位"
    }
  }
  const loginPhoneRef = useTemplateRef("loginPhoneRef")
  const loginCodeRef = useTemplateRef("loginCodeRef")

  const router = useRouter();

  const clickLogin = async () => {
    if (!validateForm(loginPhoneRef.value!, loginCodeRef.value!)) {
      return
    }
    const loginRes = await axiosProxy.post<
      paths["/login"]["post"]["requestBody"]["content"]["application/json"],
      paths["/login"]["post"]["responses"]["200"]["content"]["application/json"]
    >("/login", loginForm.value)
    storage.setToken(loginRes.token);
    await router.push({ name: "DiscoverPage" });
  }
</script>

<style scoped lang="scss">
    .login-page {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: url('/images/login-background.png') no-repeat center center;
      background-size: cover;
      .login-card {
        width: 800px;
        height: 500px;
        border-radius: 15px;
        display: grid;
        grid-template-columns: 1fr 1px 1.5fr;
        align-items: center;
        backdrop-filter: blur(10px);
        background: rgba($color: white, $alpha: 0.2);
        .qr {
          position: relative;
          padding: 85px 0;
          width: 100%;
          height: 100%;
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
          .download-app {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 13px;
            cursor: pointer;
          }
          .download-app:hover {
            color: var(--root-orange);
          }
        }
        .border {
          height: 100%;
          background: rgba($color: white, $alpha: 0.8);
        }
        .right {
          position: relative;
          padding: 20px 40px;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          .title {
            font-size: 25px;
            font-weight: bold;
            margin-bottom: 5%;
          }
          .bottom {
            color: var(--root-gray);
            margin-top: 5%;
            font-size: 13px;
          }
        }
      }
    }
</style>
