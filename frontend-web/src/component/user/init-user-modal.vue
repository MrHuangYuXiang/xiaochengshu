<template>
  <BaseModal 
    width="50vw"
    height="90vh"
    :stepTotal="3" 
    :stepIndex="activeIndex" 
    :canClose="false" 
    v-model:show="enableShow"
    v-if ="storage.initData.value"
  >
    <div class="container">
      <div :class="{'step': true, 'active': activeIndex === 1}">
        <div>先起一个名字吧!</div>
        <UserAvatar 
          class="user-avatar"
          :type="form.avatarFile === undefined ? 'upload' : 'local'"
          :user-id="storage.initData.value.user.id" 
          :isUploadable="true" 
          :img-url="form.avatarPath" 
          @change="changeAvatar" 
        />
        <AppInput v-model="form.name" type="text" placeholder="请输入昵称" width="40%" :rule="rules.name" ref="nameInput" />
      </div>

      <div :class="{'step': true, 'info': true, 'active': activeIndex === 2}">
        <div>接下来完善你的基本信息!</div>
        <div class="info-item" :style="{ 'marginTop': '20px' }">
          <div>你的性别</div>
          <GenderRadio v-model="form.gender" />
        </div>
        <div class="info-item">
          <div>你的年龄是</div>
          <AppInput v-model="form.birthday" placeholder="请选择你的出生日期" type="date" ref="birthdayInput" :rule="rules.birthday" />
        </div>
      </div>

      <div :class="{'step': true, 'active': activeIndex === 3}">
        <div>开始你的小橙书旅程吧!</div>
      </div>

      <div class="next">
        <AppButton :text="activeIndex === 3 ? '去探索!' : '下一步'" width="20%" @click="clickNext" color="default"/>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
  import BaseModal from '../common/BaseModal.vue';
  import UserAvatar from './user-avatar.vue';
  import AppInput from '../form/form-input.vue';
  import AppButton from '../form/form-button.vue';
  import GenderRadio from './gender-radio.vue';
  import { validateForm } from '@/helper/form.ts';
  import { ref, useTemplateRef } from 'vue';
  import { storage } from '@/storage.ts';
  import { ElMessage } from 'element-plus';
  import { axiosProxy } from '@/api/axios.ts';
  import { z } from 'zod'
  import type { paths } from '@/api/gen.ts';

  const enableShow = defineModel<boolean>("show")

  const activeIndex = ref(1)
  const form = ref<
  {
    avatarFile: File | undefined,
    avatarPath: string,
    name: string,
    birthday: string,
    gender: number,
    desc: string,
  }
  >({
    avatarFile: undefined,
    avatarPath: storage.initData.value?.user.avatar_path || '',
    name: '',
    birthday: '',
    gender: 1,
    desc: '',
  })
  const nameInput = useTemplateRef("nameInput")
  const birthdayInput = useTemplateRef("birthdayInput")
  const rules = {
    name: z.string().max(20, "昵称长度不能超过20个字符").min(1, "请输入昵称"),
    birthday: z.string()
  }

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

      // 保存用户信息
      case 3:
        const formData = new FormData()
        const jsonData: paths["/update/user"]["post"]["requestBody"]["content"]["application/json"] = {
          name: form.value.name,
          birthday: form.value.birthday,
          gender: form.value.gender,
          desc: form.value.desc,
          isUploadAvatar: form.value.avatarFile === undefined ? false : true,
        }
        formData.append("json", JSON.stringify(jsonData))
        if (form.value.avatarFile) {
          formData.append("avatar", form.value.avatarFile)
        }
        await axiosProxy.post("/update/user", formData, { showLoading: "circle" })
        ElMessage("保存成功")
        enableShow.value = false
        break
    }
  }

  const changeAvatar = async (file: File) => {
    form.value.avatarFile = file
    form.value.avatarPath = URL.createObjectURL(file)
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
      .user-avatar {
        width: 25%;
        aspect-ratio: 1 / 1;
      }
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
