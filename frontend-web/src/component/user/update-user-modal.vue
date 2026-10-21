<template>
  <BaseModal v-model:show="globalUpdateUserModal.isShow.value" v-if="formValues">
    <div class="form-body">
      <div class="title">更新用户信息</div>
      <UserAvatar 
        v-if="storage.initData.value" 
        class="avatar"
        :type="isLocalUrl ? 'local' : 'upload'"
        :img-url="formValues.avatar_path" 
        :user-id="storage.initData.value.user.id"
        :is-uploadable="true"
        @change="changeAvatar"
      />
      <div class="form-item">
        <div class="label">昵称</div>
        <AppInput placeholder="请输入昵称" type="text" v-model="formValues.name" ref="nameInput" :rule="rules.name"></AppInput>
      </div>
      <div class="form-item">
        <div class="label">生日</div>
        <AppInput placeholder="请选择你的出生日期" v-model="formValues.birthday" type="date" ref="birthdayInput" :rule="rules.birthday"></AppInput>
      </div>
      <div class="form-item">
        <div class="label">性别</div>
        <GenderRadio v-model="formValues.gender"></GenderRadio>
      </div>
      <div class="form-item">
        <div class="label">简介</div>
        <AppInput type="textarea" placeholder="请输入简介" v-model="formValues.desc" :rows="4" ref="descInput" :rule="rules.desc"></AppInput>
      </div>
      <AppButton text="保存" @click="save" color="default" />
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
  import BaseModal from '../common/BaseModal.vue';
  import UserAvatar from './user-avatar.vue';
  import AppInput from '../form/form-input.vue';
  import AppButton from '../form/form-button.vue';
  import GenderRadio from './gender-radio.vue';
  import { onMounted, ref, toRaw, useTemplateRef } from 'vue';
  import { storage } from '@/storage.ts';
  import { ElMessage } from 'element-plus';
  import { globalUpdateUserModal } from '../global.ts';
  import z from 'zod';
  import type { paths } from '@/api/gen.ts';
  import { axiosProxy } from '@/api/axios.ts';

  const nameInput = useTemplateRef("nameInput")
  const birthdayInput = useTemplateRef("birthdayInput")
  const descInput = useTemplateRef("descInput")
  const inputs = [nameInput, birthdayInput, descInput]

  // 是否生成本地url
  const isLocalUrl = ref(false)
  // 当前头像文件
  let currentAvatarFile: File | undefined = undefined
  const formValues = ref<{
    avatar_path: string,
    name: string,
    birthday: string,
    gender: number,
    desc: string,
  } | undefined>(undefined)
  const rules = {
    name: z.string().min(1, "请输入昵称").max(20, "昵称最长不能超过20个字符"),
    birthday: z.string(),
    gender: z.number().min(1, "请选择性别").max(2, "请选择性别"),
    desc: z.string().max(200, "简介最长不能超过200个字符"),
  }

  const save = async () => {
    if (!formValues.value) return
    if (!inputs.every(input => input.value?.validate())) {
      return
    }
    const jsonData: paths["/update/user"]["post"]["requestBody"]["content"]["application/json"] = {
      name: formValues.value.name,
      birthday: formValues.value.birthday,
      gender: formValues.value.gender,
      desc: formValues.value.desc,
      isUploadAvatar: currentAvatarFile !== undefined ? true : false,
    }
    const formData = new FormData()
    formData.append("json", JSON.stringify(jsonData))
    if (currentAvatarFile) {
      formData.append("avatar", currentAvatarFile)
    }
    await axiosProxy.post("/update/user", formData)
    ElMessage("保存成功")
  }

  // 更新头像
  const changeAvatar = async (file: File) => {
    if (!formValues.value) return
    isLocalUrl.value = true
    formValues.value.avatar_path = URL.createObjectURL(file)
    currentAvatarFile = file
  }

  onMounted(() => {
    if (!storage.initData.value?.user) return
    // 深拷贝防止赋值引用,ref响应式对象需要用toRaw拿到原生对象
    formValues.value = structuredClone(toRaw(storage.initData.value.user))
  }) 
</script>

<style scoped lang="scss">
  .form-body {
    padding: 2rem;
    width: auto;
    height: auto;
    display: grid;
    grid-template-columns: 100%;
    grid-template-rows: auto;
    row-gap: 1rem;
    .title {
      text-align: center;
      font-size: 1.3rem;
      font-weight: bold;
      padding-bottom: 1rem;
    }
    .avatar {
      width: 7rem;
      height: 7rem;
      justify-self: center;
    }
    .form-item {
      display: grid;
      grid-template-columns: auto 1fr;
      column-gap: 1rem;
      align-items: center;
      .label {
        font-weight: bold;
        text-wrap: nowrap;
      }
    }
  }
</style>
