<template>
    <div 
        class="msg-tip"
        :class="{ 'active': msgTipCom.showFlag.value }"
        @click="redirect"
    >
        <div class="user">{{ msgTipCom.data.value?.userName }}</div>
        <div class="msg-content">{{ msgTipCom.data.value?.msgContent }}</div>
    </div>
</template>

<script setup lang="ts">
    import { msgTipCom } from './global';
    import { useRouter } from 'vue-router';

    const router = useRouter()
    const redirect = () => {
        router.push({ 
            name: "ChatPage",
            query: {
                createOptionUserId: msgTipCom.data.value?.userId,
            }
        })
    }
</script>

<style scoped lang="scss">
    .msg-tip {
        visibility: hidden;
        opacity: 0;
        position: fixed;
        z-index: 1;
        top: 0;
        right: 0;
        background-color: white;
        box-shadow: 0px 3px 20px rgba($color: black, $alpha: 0.2);
        padding: 1rem;
        border-radius: 10px;
        gap: 1rem;
        transition: visibility 0.3s ease-in-out,
                    opacity 0.3s ease-in-out;
        display: flex;
        flex-direction: column;
        justify-content: center;
        cursor: pointer;
    }
    .msg-tip.active {
        visibility: visible;
        opacity: 1;
    }
</style>
