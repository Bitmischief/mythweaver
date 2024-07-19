import { ref, Ref } from 'vue';
import { UploadableFile } from '@/compositions/uploadableFile.ts';

export default function useFileList() {
  const files: Ref<UploadableFile[]> = ref([]);

  function addFiles(newFiles: File[]) {
    const newUploadableFiles = [...newFiles]
      .map((file) => new UploadableFile(file))
      .filter((file) => !fileExists(file.id));

    files.value = files.value.concat(newUploadableFiles);
  }

  function fileExists(otherId: string) {
    return files.value.some(({ id }) => id === otherId);
  }

  function removeFile(file: UploadableFile) {
    const index = files.value.indexOf(file);
    if (index > -1) files.value.splice(index, 1);
  }

  return { files, addFiles, removeFile };
}
