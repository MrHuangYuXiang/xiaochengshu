<template>
    <div 
        :class="{'image': true, 'hoverable': props.enableHover}"
        :style="{
            backgroundImage: `url(${uploadUrl}${props.src})`,
            backgroundSize: props.size,
            backgroundPosition: 'center',
            height: props.height,
            maxHeight: props.maxHeight,
            minHeight: props.minHeight,
        }"
        @click.self="clickImage"
    >
        <div class="switch-btn switch-prev" v-show="currentIndex > 0" @click="switchImage(currentIndex - 1)">
          <AppIcon type="chevron-left" :fill="'white'" />
        </div>
        <div class="switch-btn switch-next" v-show="currentIndex < props.totalCount - 1" @click="switchImage(currentIndex + 1)">
          <AppIcon type="chevron-right" :fill="'white'" />
        </div>
    </div>
</template>

<script setup lang="ts">
    import AppIcon from '../common/AppIcon.vue';
    import { imagePreview } from "@/component/global/global"
    import { ref } from "vue"

    const currentIndex = ref(0)
    const uploadUrl = import.meta.env.VITE_UPLOAD_URL
    const props = defineProps({
        src: {
             type: String,
        },
        size: {
            type: String,
            default: "cover",
        },
        height: {
            type: String,
            default: "auto"
        },
        maxHeight: {
            type: String,
            default: "auto"
        },
        minHeight: {
            type: String,
            default: "auto"
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
            imagePreview.show(props.src)
        }
    }

    // 点击切换按钮
    const switchImage = (index: number) => {
        currentIndex.value = index
        emits('switch', index)
    }
</script>

<style scoped lang="scss">
    .image {
        position: relative;
        width: 100%;
        border-radius: 15px;
        transition: all 0.3s ease-in-out;
        background-position: center center;
        background-repeat: no-repeat;
        background-color: var(--root-bg-gray);
        .switch-btn {
            transition: all 0.3s ease-in-out;
            position: absolute;
            width: 30px;
            aspect-ratio: 1 / 1;
            top: 50%;
            transform: translateY(-50%);
            border-radius: 50%;
            cursor: pointer;
            visibility: hidden;
            opacity: 0;
            background: rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(1px);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .switch-next {
            right: 10px;
            transform: translateX(7px);
        }
        .switch-prev {
            left: 10px;
            transform: translateX(-7px);
        }
        .switch-btn:hover {
            background: rgba(0, 0, 0, 0.3);
            transform: scale(1.1);
        }
    }
    .image:hover {
      .switch-btn {
        visibility: visible;
        opacity: 1;
        transform: translateX(0%);
      }
    }
    .hoverable {
        cursor: pointer;
    }
    .hoverable:hover {
        filter: brightness(0.85);
    }
</style>