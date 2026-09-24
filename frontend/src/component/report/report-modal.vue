<template>
    <BaseModal v-model:show="globalReportModal.isShow.value" width="30vw" height="90vh">
        <div class="report-modal">
            <div class="title">举报详情</div>
        </div>
    </BaseModal>
</template>

<script lang="ts" setup>
    import BaseModal from '../common/BaseModal.vue';
    import type { paths } from '@/api/gen.ts';
    import { onMounted, ref } from 'vue';
    import { axiosProxy } from '@/api/axios.ts';
    import { globalReportModal } from '../global.ts';

    const report = ref<paths["/report"]["get"]["responses"]["200"]["content"]["application/json"]["report"]>()

    onMounted(async () => {
        report.value = (await axiosProxy.get<
            paths["/report"]["get"]["parameters"]["query"],
            paths["/report"]["get"]["responses"]["200"]["content"]["application/json"]
        >(`/report`, {
            reportId: globalReportModal.reportId.value
        })).report
    })
</script>

<style lang="css" scoped>
    .report-modal {
        width: 100%;
        height: 100%;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        .title {
            font-size: 1.2rem;
            font-weight: bold;
        }
    }
</style>
