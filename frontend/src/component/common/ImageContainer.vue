<template>
    <div 
        class="image"
        :style="{
            backgroundImage: `url(${uploadUrl}${props.src})`,
            backgroundSize: props.size,
        }"
    >
    </div>
</template>

<script setup lang="ts">
    const uploadUrl = import.meta.env.VITE_UPLOAD_URL
    const props = defineProps<{
        src: string
        size: 'cover' | 'contain'
    }>()
</script>

<style scoped lang="scss">
    .image {
        width: 100%;
        border-radius: 10px;
    }
</style>