import { ref } from 'vue'
import { useEventBus } from '@/lib/events'

export interface CustomizeImageRequest {
  image?: {
    id: number
    uri: string
    prompt: string
    negativePrompt: string
    stylePreset: string
    seed: string
  }
  linking?: {
    sessionId?: number
    characterId?: number
    conjurationId?: number
  }
  historyMode?: boolean
  showImageCredits?: boolean
}

export function useImageGenerationModal() {
  const showCustomizeImageModal = ref(false)
  const customizeImageArgs = ref<CustomizeImageRequest | undefined>(undefined)
  const eventBus = useEventBus()

  eventBus.$on('toggle-customize-image-modal', (args: CustomizeImageRequest) => {
    showCustomizeImageModal.value = !showCustomizeImageModal.value
    
    if (!args) {
      customizeImageArgs.value = undefined
    } else {
      customizeImageArgs.value = args
    }
  })

  const closeModal = () => {
    showCustomizeImageModal.value = false
    customizeImageArgs.value = undefined
  }

  return {
    showCustomizeImageModal,
    customizeImageArgs,
    closeModal
  }
} 