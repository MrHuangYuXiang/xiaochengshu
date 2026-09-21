<template>
    <div class="floating-panel" v-show="props.enableShow">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    const props = defineProps<{
        enableShow: boolean,
        direction: "right"
    }>()
</script>

<style scoped lang="css">
    .floating-panel {
        white-space: nowrap;
        position: absolute;
        bottom: 0;
        right: 0;
        transform: translateX(100%);
        border-radius: 10px;
        box-shadow: 2px 7px 7px rgba(0, 0, 0, 0.10);
        background-color: white;
        z-index: 1;
    }
</style>