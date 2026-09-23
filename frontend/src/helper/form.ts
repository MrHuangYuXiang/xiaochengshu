import AppInput from "@/component/form/form-input.vue";

/**
 * 校验表单辅助函数
 */
export function validateForm(...inputs: InstanceType<typeof AppInput>[]) {
  let res = true
  for (const input of inputs) {
    if (!input.validate()) {
      res = false
    }
  }
  return res
}
