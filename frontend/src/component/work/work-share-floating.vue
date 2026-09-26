<template>
    <FloatingWindow 
        class="share-floating"
        :class="{'show': isShow}"
        v-model:show="constantShow"
    >
        <div class="title">分享给</div>
        <div class="users">
            <div v-for="value in 100" :key="value">
                用户{{ value }}
            </div>
        </div>
    </FloatingWindow>
</template>

<script lang="ts" setup>
    import { ref } from 'vue';
    import FloatingWindow from '../common/floating-window.vue';

    const isShow = defineModel<boolean>('show');
    const constantShow = ref(true)
</script>

<style scoped lang="scss">
    .share-floating {
        animation: all 0.3s ease-in-out;
        height: 0;
        width: 100%;
        padding: 0.5rem;
        top: 0;
        left: 0;
        transform: translateY(-100%);
        background-color: yellow;
        display: grid;
        grid-template-rows: auto auto;
        grid-template-columns: auto;
        row-gap: 1rem;
        .title {
            font-weight: bold;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        .users {
            overflow-x: auto;
            display: grid;
            grid-auto-flow: column;
            grid-template-rows: auto;
            grid-template-columns: auto;
        }
    }
    .show {
        height: 10rem;
    }
</style>
