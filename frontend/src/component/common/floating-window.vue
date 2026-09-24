<template>
    <div class="floating-panel" v-show="isShow" ref="divRef">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { useTemplateRef, watch } from 'vue';

    const isShow = defineModel<boolean>("show")
    const props = defineProps<{
        direction: "right",
    }>()
    const divRef = useTemplateRef("divRef")

    watch(isShow, (newVal) => {
        console.log(newVal)
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