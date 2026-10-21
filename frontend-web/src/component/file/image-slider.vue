<template>
    <div class="image">
        <img
            :src="getImageUrl"
            :style="{ 
                objectFit: props.objectFit
            }"
            :class="{
                hoverable: props.canHover,
            }"
            @click="clickImage"
        >
        <slot></slot>
        <AppIcon
            type="chevron-left"
            :fill="'white'"
            class="switch-btn switch-prev"
            v-if="props.currentIndex > 0"
            @click="emits('switch', props.currentIndex - 1)"
        />
        <AppIcon 
            type="chevron-right" 
            :fill="'white'"
            class="switch-btn switch-next" 
            v-if="props.currentIndex < props.totalCount - 1" 
            @click="emits('switch', props.currentIndex + 1)"
        />
    </div>
</template>

<script setup lang="ts">
    import { computed, onUnmounted, watch } from 'vue';
    import AppIcon from '../common/AppIcon.vue';
    import { globalImagePreview } from "@/component/global.ts"

    const uploadUrl = import.meta.env.VITE_UPLOAD_URL
    // 已使用过的url
    const usedUrls: string[] = []
    const props = withDefaults(defineProps<{
        // 图片类型: 上传图片 | 本地图片 | 非上传图片
        type: 'upload' | 'local' | 'noUpload'
        // 图片url
        src: string,
        // 填充方式
        objectFit?: 'contain' | 'cover',
        // 是否有悬停效果
        canHover?: boolean,
        // 是否可大图预览
        canPreview?: boolean,
        // 是否可滑动切换
        canSwitch?: boolean,
        // 当前图片索引
        currentIndex?: number,
        // 总图片数量
        totalCount?: number,
    }>(), {
        localFile: undefined,
        objectFit: "cover",
        isUploadImage: true,
        canHover: false,
        canPreview: false,
        canSwitch: false,
        currentIndex: 0,
        totalCount: 0,
    })

    const emits = defineEmits<{
        (e: 'switch', index: number): void
    }>()

    // 点击图片
    const clickImage = () => {
        if (props.canPreview && props.src) {
            globalImagePreview.show(getImageUrl.value)
        }
    }

    // 图片url
    const getImageUrl = computed(() => {
        switch (props.type) {
            case 'upload':
                return `${uploadUrl}${props.src}`
            case 'local':
            case 'noUpload':
                return props.src
            default:
                return ''
        }
    })

    onUnmounted(() => {
        clearLocalUrl()
    })

    watch(() => props.src, (newVal) => {
        usedUrls.push(newVal)
    })

    // 清理本地url资源
    const clearLocalUrl = () => {
        for (const url of usedUrls) {
            URL.revokeObjectURL(url)
        }
    }
</script>

<style scoped lang="scss">
    .image {
        height: auto;
        width: auto;
        position: relative;
        background-color: var(--root-bg-gray);
        border-radius: 1rem;
        overflow: hidden;
        img {
            width: 100%;
            height: 100%;
            transition: all 0.3s ease-in-out;
            display: block;
            border-radius: 15px;
        }
        .hoverable {
            cursor: pointer;
        }
        .hoverable:hover {
            filter: brightness(0.85);
        }
        .switch-btn {
            transition: transform 0.25s ease-in-out;
            width: 2rem;
            height: 2rem;
            padding: 0.5rem;
            position: absolute;
            top: 50%;
            border-radius: 50%;
            cursor: pointer;
            background: rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(1px);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .switch-next {
            right: 1rem;
        }
        .switch-prev {
            left: 1rem;
        }
        .switch-btn:hover {
            background: rgba(0, 0, 0, 0.3);
            transform: scale(1.1);
        }
    }
</style>