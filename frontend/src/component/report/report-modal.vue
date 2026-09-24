<template>
    <BaseModal v-model:show="globalReportModal.isShow.value" width="30vw" height="90vh">
        <div class="report-modal">
            <div class="title">举报详情</div>
            <FlowChart :items="flowItems" />
        </div>
    </BaseModal>
</template>

<script lang="ts" setup>
    import BaseModal from '../common/BaseModal.vue';
    import FlowChart from '../common/flow-chart.vue';
    import type { paths } from '@/api/gen.ts';
    import { onMounted, ref } from 'vue';
    import { axiosProxy } from '@/api/axios.ts';
    import { globalReportModal } from '../global.ts';

    const report = ref<paths["/report"]["get"]["responses"]["200"]["content"]["application/json"]["report"]>()
    // 流程图数据数组
    const flowItems = ref<{
        title: string
        extraInfo: string
        isComplete: boolean
    }[]>([])

    onMounted(async () => {
        report.value = (await axiosProxy.get<
            paths["/report"]["get"]["parameters"]["query"],
            paths["/report"]["get"]["responses"]["200"]["content"]["application/json"]
        >(`/report`, {
            reportId: globalReportModal.reportId.value
        })).report

        flowItems.value.push({
            title: '提交举报',
            extraInfo: '你的举报已提交,客服正在加速处理中,请耐心等待处理结果',
            isComplete: true
        })

        if (report.value.status === 1) {
            flowItems.value.push({
                title: '审核中',
                extraInfo: '举报正在审核中,大约3个工作日内审核完毕',
                isComplete: false
            })
        } else {
            flowItems.value.push({
                title: '审核完毕',
                extraInfo: '你的举报已审核完毕',
                isComplete: true
            })
        }

        if (report.value.status === 2) {
            flowItems.value.push({
                title: '审核结果',
                extraInfo: '本次举报已通过,相关作品和用户已收到处罚',
                isComplete: true
            })
        } else if (report.value.status === 3) {
            flowItems.value.push({
                title: '审核结果',
                extraInfo: '本次举报未通过',
                isComplete: true
            })
        }
    })
</script>

<style lang="css" scoped>
    .report-modal {
        width: 100%;
        height: auto;
        padding: 2rem;
        display: grid;
        grid-template-columns: auto;
        grid-auto-rows: auto;
        gap: 2rem;
        .title {
            font-size: 1.2rem;
            font-weight: bold;
        }
    }
</style>
