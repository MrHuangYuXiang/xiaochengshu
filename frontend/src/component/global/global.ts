import { type Ref, ref } from "vue"

class ImagePreview {
  public url: Ref<string>

  constructor() {
    this.url = ref<string>("")
  }

  show(url: string): void {
    this.url.value = url
  }
}

export const imagePreview = new ImagePreview()