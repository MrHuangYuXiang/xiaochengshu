<template>
    <BaseModal v-model:show="globalWorkReportModal.isShow.value">
        <div class="report-modal">
            <div class="title">举报作品</div>
            <FormRadio v-for="type in reportTypes?.types" :key="type.id" :value="type.id" :text="type.text" v-model="selectedType" />
            <FormInput 
                ref="inputRef"
                placeholder="请输入举报内容" 
                type="textarea"
                v-model="reportContent"
                class="textarea"
                :rule="rule"
             />
             <FormButton text="提交" @click="submitReport" color="default" />
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
    import BaseModal from '../common/BaseModal.vue';
    import FormRadio from '../form/form-radio.vue';
    import FormInput from '../form/form-input.vue';
    import FormButton from '../form/form-button.vue';
    import { onMounted, ref, useTemplateRef } from 'vue';
    import type { paths } from '@/api/gen.ts';
    import { axiosProxy } from '@/api/axios.ts';
    import { ElMessage } from 'element-plus';
    import { globalWorkReportModal } from '../global.ts';
    import z from 'zod';

    const reportTypes = ref<paths["/get/report/types"]["post"]["responses"]["200"]["content"]["application/json"]>()
    const selectedType = ref<number>(1)
    const reportContent = ref<string>("")
    const rule = z.string().min(1, "请输入举报内容").max(200, "举报内容长度不能超过200")
    const inputRef = useTemplateRef("inputRef")

    const getReportTypes = async () => {
        reportTypes.value = await axiosProxy.post<
            undefined,  
            paths["/get/report/types"]["post"]["responses"]["200"]["content"]["application/json"]
        >("/get/report/types", undefined)
    }

    // 提交举报
    const submitReport = async () => {
        // 表单校验
        if (!inputRef.value?.validate()) return

        await axiosProxy.post<
            paths["/report"]["post"]["requestBody"]["content"]["application/json"],
            paths["/report"]["post"]["responses"]["200"]["content"]["application/json"]
        >("/report", {
            workId: globalWorkReportModal.workId.value,
            reportType: selectedType.value,
            reason: reportContent.value
        })
        ElMessage("举报成功")
        globalWorkReportModal.close()
    }

    onMounted(async () => {
        await getReportTypes()
    })
</script>

<style lang="css" scoped>
    .report-modal {
        padding: 2rem 3rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        .title {
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        .textarea {
            margin-top: 1rem;
            margin-bottom: 1rem;
        }
    }
</style>