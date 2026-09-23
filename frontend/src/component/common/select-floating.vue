<!-- 基于浮动面板的选择器面板 -->

<template>
    <FloatingWindow :direction="props.direction" :enable-show="props.enableShow">
        <div class="inner">
            <div 
                v-for="option in props.options"
                :key="option.id"
                class="inner-item"
                @click="emits('clickOption', option.id)"
            >
                {{ option.text }}
            </div>
        </div>
    </FloatingWindow>
</template>

<script setup lang="ts">
    import FloatingWindow from './floating-window.vue';
    
    const props = defineProps<{
        enableShow: boolean,
        options: Array<{ id: number, text: string }>,
        direction: "right"
    }>()

    const emits = defineEmits<{
        clickOption: [id: number],
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