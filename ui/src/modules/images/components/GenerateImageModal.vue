<script setup lang="ts">
import FullScreenModal from '@/components/FullScreenModal.vue';
import GenerateImage from './GenerateImage.vue';

defineProps<{ 
	showCustomizeImageModal: boolean;
}>();
</script>

<template>
	<FullScreenModal :show="showCustomizeImageModal" extra-dark>
		<div class="p-4 flex gap-4 overflow-y-none">
			<GenerateImage />
		</div>
	</FullScreenModal>
</template>
