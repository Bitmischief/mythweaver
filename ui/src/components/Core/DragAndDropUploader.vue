<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import FilePreview from '@/components/Core/FilePreview.vue';
import DragAndDropZone from '@/components/Core/DragAndDropZone.vue';
import useFileList from '@/compositions/fileList';
import createUploader from '@/compositions/fileUploader.ts';
import { useSelectedCampaignId, useWebsocketChannel } from '@/lib/hooks.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';

const props = defineProps<{
  uploadUrl: string;
  dragAndDropEnabled: boolean;
}>();

const emit = defineEmits(['file-processed']);

const { files, addFiles, removeFile } = useFileList();
const campaignId = useSelectedCampaignId();

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

const channel = useWebsocketChannel();

onMounted(() => {
  channel.bind(ServerEvent.CampaignFileUploaded, handleFileUploaded);
  channel.bind(ServerEvent.CampaignFileProcessed, handleFileProcessed);
});

onUnmounted(() => {
  channel.unbind(ServerEvent.CampaignFileUploaded, handleFileUploaded);
  channel.bind(ServerEvent.CampaignFileProcessed, handleFileProcessed);
});

async function handleFileUploaded(request: {
  campaignId: number;
  filename: string;
}) {
  if (request.campaignId !== campaignId.value) {
    return;
  }

  const file = files.value.find((f) => f.file.name === request.filename);

  if (file) {
    file.status = 'uploaded';
  }
}

async function handleFileProcessed(request: {
  campaignId: number;
  filename: string;
}) {
  if (request.campaignId !== campaignId.value) {
    return;
  }

  const file = files.value.find((f) => f.file.name === request.filename);

  if (file) {
    removeFile(file);
  }
}
</script>

<template>
  <DragAndDropZone
    v-if="dragAndDropEnabled"
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

  <div v-else>
    <input
      id="file-input"
      ref="fileInput"
      class="hidden"
      type="file"
      multiple
      accept=".pdf, .docx, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/pdf"
      @change="onInputChange"
    />

    <button
      class="my-2 w-full border-2 border-dotted rounded-md border-neutral-500 py-2 text-neutral-300"
      @click="triggerFileInput"
    >
      Click to Upload Files
    </button>

    <div v-if="files.length" class="w-full mt-4">
      <div class="text-md text-neutral-300">
        Uploading and processing files...
      </div>

      <div class="flex mt-2">
        <FilePreview
          v-for="file of files"
          :key="file.id"
          :file="file"
          tag="div"
          class="mb-2 mr-2"
          @remove="removeFile"
        />
      </div>
    </div>
  </div>
</template>
