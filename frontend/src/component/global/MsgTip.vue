<template>
    <div 
        v-show="msgTipCom.data.value"
        class="msg-tip"
    >
        <div>{{ msgTipCom.data.value?.userName }}</div>
        <div>{{ msgTipCom.data.value?.msgContent }}</div>
    </div>
</template>

<script setup lang="ts">
    import { msgTipCom } from './global';
</script>

<style scoped lang="scss">
    .msg-tip {
        position: fixed;
        bottom: 0;
        right: 0;
        padding: 2rem;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 1rem;
    }
</style>
