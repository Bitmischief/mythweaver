<script setup lang="ts">
import { useGenerateImages } from '../composables/useGenerateImages';
import GenerateImage from './GenerateImage.vue';
import FullScreenModal from '@/components/FullScreenModal.vue';

defineProps<{ 
	showCustomizeImageModal: boolean;
	customizeImageArgs: import("c:/MythWeaver/Code/mythweaver/ui/src/modules/images/composables/useImageGenerationModal").CustomizeImageRequest | undefined;
	closeModal: () => void;
}>()

const { generatedImages } = useGenerateImages();
</script>

<template>
	<FullScreenModal :show="showCustomizeImageModal" extra-dark>
		<div class="p-4 flex">
			<div>
				<GenerateImage
					:image="customizeImageArgs?.image"
					:linking="customizeImageArgs?.linking"
					:history-mode="customizeImageArgs?.historyMode"
					:show-image-credits="customizeImageArgs?.showImageCredits"
					in-modal
					@cancel="closeModal"
				/>
			</div>
			<div class="flex">
				<img v-for="image of generatedImages" :key="image.id" :src="image.uri" />
			</div>
		</div>
	</FullScreenModal>
</template>
