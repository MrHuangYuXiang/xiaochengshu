<template>
  <div class="publish-page">
    <AppSegment :fields="[{text: '发布图文', key: 'image'}, {text: '发布文章', key: 'article'}]" @change-field="(key) => currentCategory = key">
      <div v-if="currentCategory === 'image'" class="publish-form publish-image">
        <div class="form-item">
          <div class="item-label">文章标题</div>
          <AppInput ref="titleInputRef" type="textarea" placeholder="请输入文章标题" v-model="form.title" :validator="titleValidator"></AppInput>
        </div>
        <div class="form-item">
          <div class="item-label">文章正文</div>
          <AppInput ref="contentInputRef" :rows="20" type="textarea" placeholder="请输入文章正文" v-model="form.content" :validator="contentValidator"></AppInput>
        </div>
        <div class="form-item">
          <div class="item-label">设置封面</div>
          <div :class="{'cover-image': true, 'none': coverImage === null}" :style="{ backgroundImage: `url(${coverImage?.url || ''})` }">
            <span v-show="coverImage === null">请选择封面图片</span>
          </div>
        </div>
        <div class="form-item">
          <div class="item-label">文章图片</div>
          <div class="image-uploader">
            <input type="file" accept="image/jpeg"  style="display: none;" ref="inputRef" @change="changeFile" multiple />
            <div
            class="item image"
            v-for="(file, index) in files"
            :key="file.url!"
            :style="{ backgroundImage: `url(${file.url})` }"
            >
              <div class="image-options" @click.self="imagePreview.show(file.url)">
                  <div class="image-option" @click="setCover(file.file, file.url, index)">设为封面</div>
                  <div class="image-option" @click="deleteImage(file.file, file.url, index)">删除</div>
              </div>
            </div>
            <div
            class="item upload-btn"
            @mouseenter="uploadBtnFill = 'var(--root-orange)'"
            @mouseleave="uploadBtnFill = 'var(--root-gray)'"
            @click="inputRef?.click()"
            >
              <AppIcon type="plus" :fill="uploadBtnFill" />
            </div>
          </div>
        </div>
        <div class="form-item">
          <div class="item-label">谁可以看</div>
          <div class="form-btn-group">
            <AppRadio v-model="permissionSelected" text="公开" :value="1"></AppRadio>
            <AppRadio v-model="permissionSelected" text="仅自己可见" :value="2"></AppRadio>
          </div>
        </div>
        <div class="publish-btn"><AppButton text="发布" @click="publish"></AppButton></div>
      </div>
      <div v-else-if="currentCategory === 'article'" class="publish-form publish-article">
        <div style="margin-top: 300px; color: #999;">功能正在开发中...</div>
      </div>
    </AppSegment>
  </div>
</template>

<script setup lang="ts">
  import { ref, useTemplateRef } from 'vue'
  import AppRadio from '@/component/common/AppRadio.vue';
  import AppInput from '@/component/common/AppInput.vue';
  import AppSegment from '@/component/common/AppSegment.vue';
  import AppButton from '@/component/common/AppButton.vue';
  import AppIcon from '@/component/common/AppIcon.vue';
  import { ElMessage } from 'element-plus';
  import { axiosProxy } from '@/api/axios';
  import { imagePreview } from '@/component/global/global';
import { validateForm } from '@/helper/form';

  const titleInputRef = useTemplateRef("titleInputRef");
  const contentInputRef = useTemplateRef("contentInputRef");
  const form = ref({
    title: '',
    content: '',
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

  const permissionSelected = ref(1)
  // 分段器当前选中种类
  const currentCategory = ref('image')

  // 文件图片相关变量
  const files = ref<{
    file: File,
    url: string,
  }[]>([])
  const inputRef = useTemplateRef("inputRef");
  const uploadBtnFill = ref('var(--root-gray)');
  const coverImage = ref<{
    file: File,
    url: string,
  } | null>(null);

  /**
   * 利用createObjectURL渲染用户本地图片
   */
  const changeFile = () => {
    for (const file of inputRef.value?.files || []) {
      if (!files.value.find((item) => item.file.name === file.name)) {
        files.value.push({file, url: URL.createObjectURL(file)});
      } else {
        ElMessage.error('同名图片已存在')
      }
    }
  }

  /**
   * 注意url对象需要手动释放内存,否则导致内存泄漏
   */
  const deleteImage = (file: File, url: string, index: number) => {
    if (coverImage.value !== null && file.name === coverImage.value.file.name) {
      ElMessage.error("不能删除封面图片")
      return
    }
    files.value.splice(index, 1);
    URL.revokeObjectURL(url);
  }

  const setCover = (file: File, url: string, index: number) => {
    coverImage.value = {
      file,
      url,
    }

    // 需要保证formData第一张图片是封面图片,因此
    // 需要将封面图片移动到files数组第一位
    files.value.splice(index, 1);
    files.value.unshift({file, url});
  }

  const publish = async () => {
    if (!validateForm(titleInputRef.value!, contentInputRef.value!)) {
      return
    }

    if (files.value.length === 0) {
      ElMessage.error('请上传文章图片')
      return
    }

    if (coverImage.value === null) {
      ElMessage.error('请选择封面图片')
      return
    }

    const formData = new FormData();
    formData.append("title", form.value.title);
    formData.append("content", form.value.content);
    formData.append("permission", permissionSelected.value.toString());
    formData.append("workImageCount", files.value.length.toString());
    for (const item of files.value) {
      formData.append(`workImage`, item.file);
    }
    await axiosProxy.post("/create/work", formData)

    // 后续清理工作
    form.value.title = '';
    form.value.content = '';
    permissionSelected.value = 1;
    for (const file of files.value) {
      URL.revokeObjectURL(file.url);
    }
    files.value = [];
    coverImage.value = null;

    ElMessage('发布成功')
  }
</script>

<style scoped lang="scss">
  .publish-page {
    width: 100%;
    height: 100%;
    overflow: auto;
    padding-bottom: 20px;
  }

  .publish-form {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0px 15%;
    gap: 30px;
    .form-item {
      width: 100%;
      display: grid;
      align-items: start;
      gap: 30px;
      grid-template-columns: 1fr 9fr;
      .item-label {
        font-weight: bold;
      }
      .cover-image {
        height: 175px;
        width: 150px;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
      }
      .cover-image.none {
        color: var(--root-gray);
        background-color: var(--root-bg-gray);
      }
      .image-uploader {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: start;
        gap: 10px;
        .item {
          height: 175px;
          min-width: 125px;
          max-width: 150px;
          flex: 1;
          border-radius: 10px;
        }
        .upload-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: var(--root-bg-gray);
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }
        .upload-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 3px var(--root-orange);
        }
        .image {
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          .image-options {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            align-items: end;
            transition: all 0.2s ease-in-out;
            opacity: 0;
            font-size: 11px;
            .image-option {
              padding: 7px;
              text-align: center;
              color: white;
              background-color: rgba(0, 0, 0, 0.6);
              transition: all 0.2s ease-in-out;
              cursor: pointer;
            }
            .image-option:hover {
              background-color: rgba(0, 0, 0, 0.9);
              font-weight: bold;
            }
          }
          .image-options:hover {
            opacity: 1;
          }
        }
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

  .publish-article {
  }

  .publish-image {
  }
</style>
