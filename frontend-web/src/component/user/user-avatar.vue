<template>
    <ImageSlider
      class="avatar"
      :src="getAvatarUrl"
      :type="props.imgUrl === '' ? 'noUpload' : props.type"
      :can-hover="props.canRedirectable"
      @click="redirectUserPage"
    >
      <div v-if="props.isUploadable" class="upload-text" @click="uploadAvatar">点击上传</div>
      <input type="file" accept="image/jpeg" @change="change" style="display: none;" ref="inputRef"/>
    </ImageSlider>
</template>

<script setup lang="ts">
  import ImageSlider from '../file/image-slider.vue';
  import { computed, useTemplateRef } from 'vue';
  import { useRouter } from 'vue-router';

  const router = useRouter()
  const props = withDefaults(defineProps<{
    userId: string,
    imgUrl: string,
    // 文件类型
    type?: 'local' | 'upload',
    // 是否开启可上传头像
    isUploadable?: boolean,
    // 是否允许点击跳转用户详情页
    canRedirectable?: boolean,
  }>(), {
    type: 'upload',
    isUploadable: false,
    canRedirectable: false,
  })
  const inputRef = useTemplateRef("inputRef")
  const emits = defineEmits(['change'])

  // 跳转用户详情页
  const redirectUserPage = async () => {
    if (!props.canRedirectable) return
    await router.push({
      name: 'UserPage',
      params: {
        userId: props.userId
    }})
  }

  // 上传用户头像
  const uploadAvatar = async () => {
    if (!props.isUploadable) return
    inputRef.value!.click()
  }

  const change = () => {
    if (inputRef.value && inputRef.value.files && inputRef.value.files[0]) emits('change', inputRef.value.files[0])
  }

  const getAvatarUrl = computed(() => {
    if (props.imgUrl === '') return "/images/default-avatar.png"
    else return props.imgUrl
  })

</script>

<style scoped lang="scss">
  .avatar {
    border-radius: 50%;
    .upload-text {
      font-size: 0.8rem;
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 25%;
      text-align: center;
      font-weight: bold;
      color: #fff;
      background-color: rgba(0, 0, 0, 0.5);
      padding: 10%;
      cursor: pointer;
      transition: all 0.3s ease-in-out;
    }
    .upload-text:hover {
      background-color: rgba(0, 0, 0, 0.7);
    }
  }
</style>
