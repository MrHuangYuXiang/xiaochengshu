<!-- 基于浮动面板的选择器面板 -->

<template>
    <FloatingPanel :direction="props.direction" :enable-show="props.enableShow">
        <div class="inner">
            <div 
                v-for="option, index in props.options"
                :key="index"
                class="inner-item"
            >
                {{ option }}
            </div>
        </div>
    </FloatingPanel>
</template>

<script setup lang="ts">
    import FloatingPanel from './FloatingPanel.vue';
    
    const props = defineProps<{
        enableShow: boolean,
        options: string[],
        direction: "right"
    }>()

    const emits = defineEmits<{
        clickOption: (index: number) => void, 
    }>()
</script>

<style lang="css" scoped>
    .inner {
        display: flex;
        flex-direction: column;
        align-items: center;
        .inner-item {
            padding: 1rem;
            cursor: pointer;
            border-radius: 15px;
        }
        .inner-item:hover {
            background-color: var(--root-bg-gray);
        }
    }
</style>