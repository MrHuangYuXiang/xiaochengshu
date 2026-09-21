<template>
  <input type="file" accept="image/jpeg" @change="change" style="display: none;" ref="inputRef"/>
  <div class="avatar-box" :style="{ width: props.width }">
    <div
      class="avatar"
      :style="{
        backgroundImage: `url(${getAvatarUrl()})`,
      }"
      @click="click"
    >
      <div v-if="props.topCount > 0" class="top-count">{{ props.topCount }}</div>
      <div v-if="props.isUploadable" class="upload-text">点击上传</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useTemplateRef } from 'vue';
  import { useRouter } from 'vue-router';

  const uploadUrl = import.meta.env.VITE_UPLOAD_URL
  const router = useRouter()
  const props = defineProps({
    userId: {
      type: String,
    },
    imgUrl: {
      type: String,
      default: ''
    },
    width: {
      type: String,
      default: '100%'
    },
    // 右上角消息数量
    topCount: {
      type: Number,
      default: 0
    },
    // 是否可上传
    isUploadable: {
      type: Boolean,
      default: false
    },
    // 是否允许点击跳转用户详情页
    enableRedirectable: {
      type: Boolean,
      default: true
    },
  })
  const inputRef = useTemplateRef("inputRef")
  const emits = defineEmits(['change'])

  const click = async () => {
    if (props.isUploadable) {
      inputRef.value!.click()
    } else if (props.enableRedirectable) {
      await router.push({
        name: 'UserPage',
        params: {
          userId: props.userId
      }})
    } else {}
  }

  const change = () => {
    const file = inputRef.value!.files![0]
    emits('change', file)
  }

  const getAvatarUrl = () => {
    switch (props.imgUrl) {
      case "":
        return "'/images/default-avatar.png'"
      case "0":
        return "'/images/setting.png'"
      default:
        return `${uploadUrl}${props.imgUrl}`
    }
  }

</script>

<style scoped lang="scss">
  .avatar-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    .avatar {
      position: relative;
      width: 100%;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      border: 1px solid #f5f5f5;
      box-sizing: border-box;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      background-color: #f5f5f5;
      overflow: hidden;
      cursor: pointer;
      .top-count {
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        top: 0;
        right: 0;
        width: 10%;
        aspect-ratio: 1 / 1;
        font-weight: bold;
        color: #fff;
        background-color: red;
        padding: 5px;
        border-radius: 50%;
      }
      .upload-text {
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
    }
    .avatar:hover {
      .upload-text {
        background-color: rgba(0, 0, 0, 0.7);
      }
    }
  }
</style>
