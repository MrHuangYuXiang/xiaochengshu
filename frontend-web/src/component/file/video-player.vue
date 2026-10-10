<template>
    <div class="video-player">
        <video :src="getSrc" controls></video>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';

    const props = withDefaults(defineProps<{
        src: string,
        isUploadFile?: boolean,
    }>(), {
        isUploadFile: true,
    })

    const getSrc = computed(() => {
        if (props.isUploadFile) {
            return import.meta.env.VITE_UPLOAD_URL + props.src;
        } else {
            return props.src;
        }
    })
</script>

<style scoped lang="scss">
    .video-player {
        width: 100%;
        height: 100%;
        background-color: black;
        video {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
    }
</style>
