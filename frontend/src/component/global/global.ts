import { type Ref, ref } from "vue"

class ImagePreview {
  public url: Ref<string>

  constructor() {
    this.url = ref<string>("")
  }

  show(url: string): void {
    this.url.value = url
    console.log("显示预览图片:", url)
  }
}

export const imagePreview = new ImagePreview()
