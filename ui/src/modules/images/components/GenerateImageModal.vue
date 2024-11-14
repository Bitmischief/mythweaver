<script setup lang="ts">
import GenerateImage from './GenerateImage.vue';
import FullScreenModal from '@/components/FullScreenModal.vue';
import { useGenerateImages } from '../composables/useGenerateImages';
import { CustomizeImageRequest } from '../composables/useImageGenerationModal';

defineProps<{ 
	showCustomizeImageModal: boolean;
	customizeImageArgs: CustomizeImageRequest | undefined;
}>();

const { generatedImages } = useGenerateImages();
</script>

<template>
	<FullScreenModal :show="showCustomizeImageModal" extra-dark>
		<div class="p-4 flex gap-4 overflow-y-none">
			<div class="w-[33%]">
				<GenerateImage
					:image="customizeImageArgs?.image"
					:linking="customizeImageArgs?.linking"
					:history-mode="customizeImageArgs?.historyMode"
					:show-image-credits="customizeImageArgs?.showImageCredits"
				/>
			</div>
			<div class="w-full overflow-y-scroll">
				<div class="w-full flex justify-end gap-2">
					<button class="bg-neutral-800 text-neutral-500 hover:text-red-500 rounded-md px-3 py-1">Cancel</button>
					<button class="bg-green-500 rounded-md px-3 py-1 text-neutral-800">Select Image</button>
				</div>
				<div v-for="model in generatedImages" :key="model.modelId" class="space-y-2  overflow-y-scroll">
					<h3 class="text-lg font-medium">{{ model.modelName }}</h3>

					<div class="flex flex-wrap gap-4  overflow-y-scroll">
						<img 
							v-for="image in model.images" 
							:key="image.id" 
							:src="image.uri"
							class="object-contain rounded-lg"
						/>
					</div>
				</div>
			</div>
		</div>
	</FullScreenModal>
</template>
