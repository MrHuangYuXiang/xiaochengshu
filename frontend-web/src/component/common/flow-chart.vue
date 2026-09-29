<template>
    <div class="flow-chart">
        <div v-for="item in props.items" :key="item.title" class="item">
            <div class="dot" :class="{'complete': item.isComplete}"></div>
            <div class="title">{{ item.title }}</div>
            <div class="extra-info">{{ item.extraInfo }}</div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    const props = defineProps<{
        items: {
            title: string
            extraInfo: string
            isComplete: boolean
        }[]
    }>()
</script>

<style lang="css" scoped>
    .flow-chart {
        display: grid;
        grid-template-columns: auto;
        grid-auto-rows: auto;
        gap: 1rem;
        .item {
            display: grid;
            grid-template-columns: auto 1fr;
            grid-auto-rows: auto;
            align-items: center;
            column-gap: 0.6rem;
            row-gap: 0.3rem;
            padding-bottom: 1rem;
            border-bottom: 1.5px solid rgba(0, 0, 0, 0.1);
            .dot {
                width: 0.5rem;
                height: 0.5rem;
                border-radius: 50%;
                background-color: var(--root-gray);
            }
            .dot.complete {
                background-color: var(--root-orange);
            }
            .title {
                font-weight: 500;
            }
            .extra-info {
                grid-column: 2;
                font-size: 0.8rem;
                color: var(--root-gray);
            }
        }
    }
</style>
