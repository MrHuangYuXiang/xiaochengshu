<template>
    <div
        :class="{
            'image': true
        }"
        >
        <img 
            :src="getImageUrl()"
            :style="{ 
                objectFit: props.objectFit
            }"
            :class="{
                hoverable: props.enableHover,
            }"
            @click="clickImage"
        >
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
    import AppIcon from '../common/AppIcon.vue';
    import { globalImagePreview } from "@/component/global.ts"

    const uploadUrl = import.meta.env.VITE_UPLOAD_URL
    const props = withDefaults(defineProps<{
        src: string,
        objectFit?: 'contain' | 'cover',
        isUploadImage?: boolean,
        enableHover?: boolean,
        enablePreview?: boolean,
        enableSwitch?: boolean,
        currentIndex?: number,
        totalCount?: number,
    }>(), {
        width: "auto",
        height: "auto",
        maxHeight: "auto",
        objectFit: "cover",
        isUploadImage: true,
        enableHover: false,
        enablePreview: false,
        enableSwitch: false,
        currentIndex: 0,
        totalCount: 0,
    })

    const emits = defineEmits<{
        (e: 'switch', index: number): void
    }>()

    // 点击图片
    const clickImage = () => {
        if (props.enablePreview && props.src) {
            globalImagePreview.show(getImageUrl())
        }
    }

    // 图片url
    const getImageUrl = () => {
        if (props.isUploadImage) {
            return `${uploadUrl}${props.src}`
        } else {
            return props.src
        }
    }
</script>

<style scoped lang="scss">
    .image {
        height: auto;
        width: auto;
        position: relative;
        background-color: var(--root-bg-gray);
        border-radius: 15px;
        img {
            width: 100%;
            height: 100%;
            border-radius: 15px;
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