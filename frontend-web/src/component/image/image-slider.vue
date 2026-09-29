<template>
    <div 
        :class="{'image': true, 'hoverable': props.enableHover}"
        :style="{
            backgroundImage: `url(${getImageUrl()})`,
        }"
        @click.self="clickImage"
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
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import AppIcon from '../common/AppIcon.vue';
    import { globalImagePreview } from "@/component/global.ts"

    const uploadUrl = import.meta.env.VITE_UPLOAD_URL
    const props = defineProps({
        src: {
             type: String,
             default: "",
        },
        // 是否为后端upload图片
        isUploadImage: {
            type: Boolean,
            default: true,
        },

        // 是否开启hover效果
        enableHover: {
            type: Boolean,
            default: false,
        },

        // 是否开启点击预览大图效果
        enablePreview: {
            type: Boolean,
            default: false,
        },

        // 是否开启切换图片按钮
        enableSwitch: {
            type: Boolean,
            default: false,
        },
        // 当前显示的图片索引
        currentIndex: {
            type: Number,
            default: 0,
        },
        // 图片总数量,开启切换功能必须传入!
        totalCount: {
            type: Number,
            default: 0,
        }
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
        position: relative;
        border-radius: 15px;
        transition: all 0.3s ease-in-out;
        background-position: center center;
        background-repeat: no-repeat;
        background-color: var(--root-bg-gray);
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
    .hoverable {
        cursor: pointer;
    }
    .hoverable:hover {
        filter: brightness(0.85);
    }
</style>