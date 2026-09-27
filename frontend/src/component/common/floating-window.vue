<template>
    <div 
        class="floating-panel"
        ref="divRef"
        @click.stop=""
    >
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { useTemplateRef, watch } from 'vue';

    const isShow = defineModel<boolean>("show")
    const divRef = useTemplateRef("divRef")

    watch(isShow, (newVal) => {
        if (newVal) {
            setTimeout(() => {
                document.addEventListener("click", clickHandler)
            }, 100)
        } else {
            document.removeEventListener("click", clickHandler)
        }
    })

    const clickHandler = (e: Event) => {
        if (!divRef.value?.contains(e.target as Node) && isShow.value) {
            isShow.value = false
        }
    }
</script>

<style scoped lang="css">
    .floating-panel {
        width: auto;
        height: auto;
        white-space: nowrap;
        position: absolute;
        border-radius: 10px;
        background-color: white;
        z-index: 1;
    }
</style>