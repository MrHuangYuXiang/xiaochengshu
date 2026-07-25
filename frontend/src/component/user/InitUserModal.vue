<template>
  <BaseModal width="50vw" height="90vh" :stepTotal="3" :stepIndex="activeIndex" :canClose="false">
    <div class="container">
      <div :class="{'step': true, 'active': activeIndex === 1}">
        <div>先起一个名字吧!</div>
        <UserAvatar :width="'25%'" :isUploadable="true" :img-url="storage.initData.value?.user?.avatar_url || ''" @change="changeAvatar" />
        <AppInput v-model="form.name" placeholder="请输入昵称" width="40%" :validator="nameValidator" ref="nameInput" />
      </div>

      <div :class="{'step': true, 'info': true, 'active': activeIndex === 2}">
        <div>接下来完善你的基本信息!</div>
        <div class="info-item" :style="{ 'marginTop': '20px' }">
          <div>你的性别</div>
          <GenderRadio v-model="form.gender" />
        </div>
        <div class="info-item">
          <div>你的年龄是</div>
          <AppInput v-model="form.birthday" placeholder="请选择你的出生日期" type="date" ref="birthdayInput" :validator="birthdayValidator" />
        </div>
      </div>

      <div :class="{'step': true, 'active': activeIndex === 3}">
        <div>开始你的小橙书旅程吧!</div>
      </div>

      <div class="next">
        <AppButton :text="activeIndex === 3 ? '去探索!' : '下一步'" width="20%" @click="clickNext" />
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
  import { ref, useTemplateRef } from 'vue';
  import BaseModal from '../common/BaseModal.vue';
  import UserAvatar from './UserAvatar.vue';
  import AppInput from '../common/AppInput.vue';
  import AppButton from '../common/AppButton.vue';
  import GenderRadio from './GenderRadio.vue';
  import { validateForm } from '@/helper/form.ts';
  import { storage } from '@/storage.ts';
  import { axiosProxy } from '@/api/axios.ts';
  import type { paths } from '@/api/gen.ts';

  const emits = defineEmits(['close'])

  const activeIndex = ref(1)
  const form = ref<
  {
    name: string,
    birthday: string,
    gender: number,
    desc: string,
  }
  >({
    name: '',
    birthday: '',
    gender: 1,
    desc: '',
  })
  const nameValidator = ref({
    required: {
      errorString: "请输入昵称",
      value: true
    },
    maxlength: {
      errorString: "昵称长度不能超过20个字符",
      value: 20
    },
  })
  const nameInput = useTemplateRef("nameInput")

  const birthdayValidator = ref({
    required: {
      errorString: "请选择你的出生日期",
      value: true
    }
  })
  const birthdayInput = useTemplateRef("birthdayInput")

  const clickNext = async () => {
    switch (activeIndex.value) {
      case 1:
        if (!validateForm(nameInput.value!)) {
          return
        }
        activeIndex.value += 1
        break
      case 2:
        if (!validateForm(birthdayInput.value!)) {
          return
        }
        activeIndex.value += 1
        break
      case 3:
        await axiosProxy.post<
          paths["/update/user/info"]["post"]["requestBody"]["content"]["application/json"],
          paths["/update/user/info"]["post"]["responses"]["200"]["content"]["application/json"]
        >('/update/user/info', form.value)
        emits('close')
        break
    }
  }

  const changeAvatar = async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    await axiosProxy.post('/upload/user/avatar', formData)
    storage.updateUserAvatarUrl()
  }
</script>

<style scoped lang="scss">
  .container {
    position: relative;
    width: 100%;
    height: 100%;

    .step {
      position: absolute;
      width: 100%;
      height: 100%;
      padding: 10%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: start;
      gap: 10%;
      font-size: 25px;
      font-weight: bold;
      opacity: 0;
      transition: all 0.3s ease-in-out;
      visibility: hidden;
    }
    .step.active {
      opacity: 1;
      visibility: visible;
    }


    .info {
      gap: 15%;
      .info-item {
        width: 100%;
        display: flex;
        font-size: 17px;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 30%;
      }
    }

    .next {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      position: absolute;
      bottom: 15%;
      left: 50%;
      transform: translateX(-50%);
    }

   }
</style>
