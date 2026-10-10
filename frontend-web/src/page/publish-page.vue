<template>
  <div class="publish-page">
    <AppSegment :fields="[{text: '发布图文', key: 'image'}, {text: '发布视频', key: 'video'}]" @change-field="changeField" />
    <div class="publish-form">
      <div class="form-item">
        <div class="item-label">作品标题</div>
        <FormInput ref="titleInputRef" type="textarea" placeholder="请输入文章标题" v-model="form.title" :rule="titleValidator"></FormInput>
      </div>
      <div class="form-item">
        <div class="item-label">作品正文</div>
        <FormInput ref="contentInputRef" :rows="20" type="textarea" placeholder="请输入文章正文" v-model="form.content" :rule="contentValidator"></FormInput>
      </div>
      <div class="form-item" v-if="currentField === 'image'">
        <div class="item-label">上传图片</div>
        <div class="images">
          <ImageSlider
            class="image"
            v-for="(file, index) in files"
            :key="index"
            :src="file.url"
            :is-upload-image="false"
            :can-preview="true"
            :can-hover="true"
          >
            <div class="image-options">
              <div class="delete-btn" @click="deleteFile(index)">删除</div>
              <div class="set-cover-btn" @click="setCover(index)">设置封面</div>
            </div>
          </ImageSlider>
          <FileUploader 
            :accept="['image/jpeg', 'image/png']" 
            @upload="changeFile"
          />
        </div>
      </div>
      <div class="form-item" v-else>
        <div class="item-label">上传视频</div>
        <div class="video">
          <FileUploader :accept="['video/mp4']" @upload="changeFile" v-if="!files[0]" />
          <VideoPlayer 
            :src="files[0].url"
            :isUploadFile="false"
            v-else 
          />
        </div>
      </div>
      <div class="form-item">
        <div class="item-label">谁可以看</div>
        <div class="form-btn-group">
          <FormRadio v-model="form.permission" text="公开" :value="1"></FormRadio>
          <FormRadio v-model="form.permission" text="仅自己可见" :value="2"></FormRadio>
        </div>
      </div>
      <div class="publish-btn"><FormButton color="orange" text="发布" @click="publish"></FormButton></div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, useTemplateRef } from 'vue'
  import FormRadio from '@/component/form/form-radio.vue';
  import FormInput from '@/component/form/form-input.vue';
  import AppSegment from '@/component/common/app-segment.vue';
  import FormButton from '@/component/form/form-button.vue';
  import FileUploader from '@/component/file/file-uploader.vue';
  import ImageSlider from '@/component/file/image-slider.vue';
  import VideoPlayer from '@/component/file/video-player.vue';
  import { ElMessage } from 'element-plus';
  import { axiosProxy } from '@/api/axios';

  const titleInputRef = useTemplateRef("titleInputRef");
  const contentInputRef = useTemplateRef("contentInputRef");
  const form = ref({
    title: '',
    content: '',
    permission: 1,
  })
  const titleValidator = {
    required: {
      errorString: '请填写标题',
    },
    minLength: {
      value: 1,
      errorString: '标题长度不能小于1个字符',
    },
    maxLength: {
      value: 20,
      errorString: '标题长度不能大于20个字符',
    },
  }
  const contentValidator = {
    required: {
      errorString: '请填写正文',
    },
    minLength: {
      value: 1,
      errorString: '正文长度不能小于1个字符',
    },
    maxLength: {
      value: 200,
      errorString: '正文长度不能大于200个字符',
    },
  }

  // 分段器当前选中项
  const currentField = ref('image')

  // 文件图片相关变量
  const files = ref<{
    file: File,
    url: string,
  }[]>([])

  // 分段器切换
  const changeField = (key: string) => {
    currentField.value = key;
    clear();
  }

  // 清理资源
  const clear = () => {
    form.value.title = '';
    form.value.content = '';
    form.value.permission = 1;
    for (const file of files.value) {
      URL.revokeObjectURL(file.url);
    }
    files.value = [];
  }

  /**
   * 利用createObjectURL渲染预览文件
   */
  const changeFile = (file: File) => {
      if (!files.value.find((item) => item.file.name === file.name)) {
        files.value.push({file, url: URL.createObjectURL(file)});
      } else {
        throw new Error('同名文件已存在')
      }
  }

  // 注意url对象需要手动释放内存,否则导致内存泄漏
  const deleteFile = (index: number) => {
    const file = files.value[index];
    if (!file) { return }
    files.value.splice(index, 1);
    URL.revokeObjectURL(file.url);
  }
  
  // 后端约定formData第一张图片是封面图片
  const setCover = (index: number) => {
    const file = files.value[index];
    if (!file) { return }
    files.value.splice(index, 1);
    files.value.unshift(file);
  }

  const publish = async () => {
    if (
      !titleInputRef.value?.validate() || 
      !contentInputRef.value?.validate()
    ) {
      return
    }

    if (!files.value[0]) {
      throw new Error('请上传文件')
    }

    if (currentField.value === 'image') {
      const formData = new FormData();
      formData.append("json", JSON.stringify({
        ...form.value,
        workImageCount: files.value.length,
      }));
      for (const item of files.value) {
        formData.append(`workImage`, item.file);
      }
      await axiosProxy.post("/create/image/work", formData)
    } else {
      const formData = new FormData();
      formData.append("json", JSON.stringify(form.value));
      formData.append("video", files.value[0].file);
      await axiosProxy.post("/create/video/work", formData)
    }

    clear();
    ElMessage('发布成功')
  }
</script>

<style scoped lang="scss">
  .publish-page {
    padding: 2rem;
    display: grid;
    grid-template-columns: 75%;
    justify-content: center;
    align-items: start;
    row-gap: 2rem;
  }

  .publish-form {
    display: flex;
    flex-direction: column;
    gap: 30px;
    .form-item {
      flex: 0 0 auto;
      width: 100%;
      display: grid;
      align-items: start;
      grid-template-columns: auto 1fr;
      column-gap: 1.5rem;
      .item-label {
        font-weight: bold;
      }
      .images {
        display: grid;
        grid-template-columns: repeat(auto-fill, 8rem);
        grid-auto-rows: 10rem;
        gap: 1rem;
        .image {
          .image-options {
            transition: all 0.3s ease-in-out;
            opacity: 0;
            visibility: hidden;
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            div {
              text-align: center;
              padding: 0.2rem;
              cursor: pointer;
              font-size: 0.8rem;
              color: white;
              background-color: black;
            }
            div:hover {
              opacity: 0.8;
            }
          }
        }
      }
      .image:hover {
        .image-options {
          opacity: 1;
          visibility: visible;
        }
      }

      .video {
        width: 20rem;
        height: 12rem;
      }
      .form-btn-group {
        height: 100%;
        display: flex;
        align-items: center;
        gap: 20px;
      }
    }
    .publish-btn {
      width: 100px;
      align-self: end;
    }
  }
</style>
