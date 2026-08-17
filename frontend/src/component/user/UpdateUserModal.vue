<template>
  <BaseModal width="50vw" @close="emits('close')">
    <div class="form-body">
      <UserAvatar :is-uploadable="true" width="30%" :img-url="storage.initData.value?.user?.avatar_url" @change="changeAvatar"></UserAvatar>
      <div class="form-item">
        <div class="label">昵称</div>
        <AppInput placeholder="请输入昵称" v-model="form.name" ref="nameInput" :validator="nameValidator"></AppInput>
      </div>
      <div class="form-item">
        <div class="label">生日</div>
        <AppInput placeholder="请选择你的出生日期" v-model="form.birthday" type="date" ref="birthdayInput" :validator="birthdayValidator"></AppInput>
      </div>
      <div class="form-item">
        <div class="label">性别</div>
        <GenderRadio v-model="form.gender"></GenderRadio>
      </div>
      <div class="form-item">
        <div class="label">简介</div>
        <AppInput type="textarea" placeholder="请输入简介" v-model="form.desc" :rows="4" ref="descInput" :validator="descValidator"></AppInput>
      </div>
      <AppButton text="保存" @click="clickSave" />
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
  import BaseModal from '../common/BaseModal.vue';
  import UserAvatar from './UserAvatar.vue';
  import AppInput from '../common/AppInput.vue';
  import AppButton from '../common/AppButton.vue';
  import GenderRadio from './GenderRadio.vue';
  import { onMounted, ref, toRaw, useTemplateRef } from 'vue';
  import { storage } from '@/storage.ts';
  import { validateForm } from '@/helper/form.ts';
  import { axiosProxy } from '@/api/axios.ts';
  import { ElMessage } from 'element-plus';
  import type { paths } from '@/api/gen.ts';

  const emits = defineEmits<{
    (e: 'close'): void
  }>()

  const nameInput = useTemplateRef("nameInput")
  const birthdayInput = useTemplateRef("birthdayInput")
  const descInput = useTemplateRef("descInput")

  const form = ref(storage.initData.value?.user || {
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
      errorString: "昵称最长不能超过20个字符",
      value: 20
    },
  })
  const birthdayValidator = ref({
    required: {
      errorString: "请选择你的出生日期",
      value: true
    }
  })
  const descValidator = ref({
    maxlength: {
      errorString: "简介最长不能超过200个字符",
      value: 200
    },
  })

  const clickSave = async () => {
    if (!validateForm(nameInput.value!, birthdayInput.value!, descInput.value!)) {
      return
    }
    await axiosProxy.post<
      paths["/update/user/info"]["post"]["requestBody"]["content"]["application/json"],
      paths["/update/user/info"]["post"]["responses"]["200"]["content"]["application/json"]
    >('/update/user/info', form.value)

    const initData = await axiosProxy.get<
      paths["/user/init-data"]["get"]["parameters"]["query"],
      paths["/user/init-data"]["get"]["responses"]["200"]["content"]["application/json"]
    >('/user/init-data', undefined)
    storage.setInitData(initData)

    ElMessage("保存成功")
    emits('close')
  }

  // 更新头像
  const changeAvatar = async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    await axiosProxy.post('/upload/user/avatar', formData)
    storage.updateUserAvatarUrl()
    ElMessage("头像保存成功")
  }

  onMounted(() => {
    // 深拷贝防止赋值引用,ref响应式对象需要用toRaw拿到原生对象
    form.value = structuredClone(toRaw(storage.initData.value!.user))
  })
</script>

<style scoped lang="scss">
  .form-body {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: start;
    padding: 5% 25%;
    gap: 5%;
    .form-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 25px;
      .label {
        font-weight: bold;
        text-wrap: nowrap;
      }
    }
  }
</style>
