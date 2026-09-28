<!-- 选择器浮动框 -->
<template>
    <FloatingWindow 
        v-model:show="isShow"
        v-show="isShow"
        class="floating"
    >
        <div class="inner">
            <div 
                v-for="option in props.options"
                :key="option.id"
                class="inner-item"
                @click="clickOption(option.id)"
            >
                {{ option.text }}
            </div>
        </div>
    </FloatingWindow>
</template>

<script setup lang="ts">
    import FloatingWindow from './floating-window.vue';

    const isShow = defineModel<boolean>("show")
    const props = defineProps<{
        options: Array<{ id: number, text: string }>,
    }>()

    const emits = defineEmits<{
        clickOption: [id: number],
    }>()

    const clickOption = (id: number) => {
        isShow.value = false
        emits("clickOption", id)
    }
</script>

<style lang="css" scoped>
    .inner {
        font-weight: normal;
        display: grid;
        grid-template-columns: auto;
        .inner-item {
            padding: 0.8rem;
            cursor: pointer;
            border-radius: 15px;
        }
        .inner-item:hover {
            background-color: var(--root-bg-gray);
        }
    }

    .floating {
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    }
</style>