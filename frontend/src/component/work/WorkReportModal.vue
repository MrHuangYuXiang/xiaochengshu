<template>
    <BaseModal v-model:show="enableShow" width="auto" height="auto">
        <div class="report-modal">
            <div class="title">举报作品</div>
            <FormRadio v-for="type in reportTypes?.types" :key="type.id" :value="type.id" :text="type.text" v-model="selectedType" />
            <FormInput 
                ref="reportContentRef"
                placeholder="请输入举报内容" 
                type="textarea"
                v-model="reportContent"
                class="textarea"
                :rule="reportContentRule"
             />
             <FormButton text="提交" @click="submitReport" />
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
    import { validateForm } from '@/helper/form.ts';
    import { ElMessage } from 'element-plus';

    const props = defineProps({
        workId: {
            type: String,
            default: ""
        }
    })

    const enableShow = defineModel<boolean>("show")
    const reportTypes = ref<paths["/report/types"]["get"]["responses"]["200"]["content"]["application/json"]>()
    const selectedType = ref<number>(1)
    const reportContent = ref<string>("")
    const reportContentRule = {
        required: {
            errorString: "请输入举报内容"
        },
        maxLength: {
            value: 100,
            errorString: "举报内容最多100个字符"
        },
    }
    const reportContentRef = useTemplateRef("reportContentRef")

    const getReportTypes = async () => {
        reportTypes.value = await axiosProxy.get<
            undefined,  
            paths["/report/types"]["get"]["responses"]["200"]["content"]["application/json"]
        >("/report/types", undefined)
    }

    // 提交举报
    const submitReport = async () => {
        if (!validateForm(reportContentRef.value!)) return

        await axiosProxy.post<
            paths["/report"]["post"]["requestBody"]["content"]["application/json"],
            paths["/report"]["post"]["responses"]["200"]["content"]["application/json"]
        >("/report", {
            workId: props.workId,
            reportType: selectedType.value,
            reason: reportContent.value
        })
        ElMessage("举报成功")
        enableShow.value = false
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