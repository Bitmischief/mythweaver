<script setup lang="ts">
import { ref } from 'vue';
import FilePreview from '@/components/Core/FilePreview.vue';
import DragAndDropZone from '@/components/Core/DragAndDropZone.vue';
import useFileList from '@/compositions/fileList';
import createUploader from '@/compositions/fileUploader.ts';

const props = defineProps<{
  uploadUrl: string;
}>();

const { files, addFiles, removeFile } = useFileList();

const fileInput = ref<HTMLInputElement | null>(null);

function onInputChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files) {
    const fileArray = Array.from(input.files);
    addFiles(fileArray);
    uploadFiles(files.value);
  }
  input.value = ''; // reset so that selecting the same file again will still cause it to fire this change
}

const { uploadFiles } = createUploader(props.uploadUrl);

function triggerFileInput() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}
</script>

<template>
  <DragAndDropZone
    v-slot="{ dropZoneActive }"
    class="drop-area"
    @files-dropped="addFiles"
  >
    <div
      class="my-4 p-6 py-12 flex justify-center border border-gray-500/25 rounded-md"
      :class="dropZoneActive ? 'bg-gray-500/25' : 'bg-gray-500/10'"
    >
      <div v-if="dropZoneActive">
        <div>Drop Them</div>
      </div>
      <div v-else>
        <div class="mb-2">Drag Your Files Here or</div>
        <button class="button-ghost-primary mx-auto" @click="triggerFileInput">
          Click to Upload Files
        </button>
      </div>
    </div>

    <input
      id="file-input"
      ref="fileInput"
      class="hidden"
      type="file"
      multiple
      accept=".pdf, .docx, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/pdf"
      @change="onInputChange"
    />

    <div v-show="files.length" class="w-full flex">
      <FilePreview
        v-for="file of files"
        :key="file.id"
        :file="file"
        tag="div"
        class="mb-2 mr-2"
        @remove="removeFile"
      />
    </div>
  </DragAndDropZone>
</template>
