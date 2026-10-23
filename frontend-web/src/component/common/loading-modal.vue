<template>
    <div class="loading-background">
        <div class="loading-modal">
            <div class="icon"></div>
            <div class="text">加载中</div>
        </div>
    </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
    @keyframes loading {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .loading-background {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        .loading-modal {
            width: auto;
            height: auto;
            background-color: black;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            padding: 0.5rem;
            gap: 0.5rem;
            align-items: center;
            .icon {
                width: 25px;
                height: 25px;
                border-radius: 50%;
                background-color: black;
                border: 2px solid white;
                border-bottom-color: transparent;
                animation: loading 1s linear infinite;
            }
            .text {
                color: white;
                font-size: 0.8rem;
            }
        }
    }
</style>
