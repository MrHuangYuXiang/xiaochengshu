<template>
    <div class="image-uploader" @click="clickUploader">
        <input class="input" type="file" :accept="getAccept" @change="change" ref="fileInputRef">
        <AppIcon type="plus" class="icon" />
    </div>
</template>

<script setup lang="ts">
    import { computed, useTemplateRef } from 'vue';
    import AppIcon from '../common/AppIcon.vue';

    const inputRef = useTemplateRef('fileInputRef');

    const props = defineProps<{
        accept: ("image/jpeg" | "image/png" | "video/mp4")[],
    }>()
    const emits = defineEmits<{
        (e: 'upload', file: File): void;
    }>();

    const getAccept = computed(() => {
        return props.accept.join(',');
    })

    const change = () => {
        const file = inputRef.value?.files?.[0];
        if (file) emits('upload', file);
    }

    const clickUploader = () => {
        inputRef.value?.click();
    }
</script>

<style scoped lang="scss">
    .image-uploader {
        width: 100%;
        height: 100%;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        background-color: var(--root-bg-gray);
        border-radius: 10px;
        transition: all 0.2s ease-in-out;
        cursor: pointer;
        .input {
            position: absolute;
            width: 0;
            height: 0;
        }
        .icon {
            flex: 0 0 auto;
        }
    }

    .image-uploader:hover {
        transform: scale(1.05);
        box-shadow: 0 0 5px var(--root-orange);
        .icon {
            fill: var(--root-orange);
        }
    }
</style>