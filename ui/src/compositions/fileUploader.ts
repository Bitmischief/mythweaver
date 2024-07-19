import { UploadableFile } from '@/compositions/uploadableFile.ts';
import axios, { AxiosResponse } from 'axios';

export async function uploadFile(file: UploadableFile, url: string): Promise<AxiosResponse> {
  // set up the request data
  const formData = new FormData();
  formData.append('file', file.file);

  const response = await axios.post(url, formData);

  if (response.status === 422) {
    const overwrite = confirm(
      'A file with this filename already exists, do you want to overwrite it?',
    );

    if (overwrite) {
      formData.append('force', 'true');
      await axios.post(`${url}`, formData);
    }
  }

  return response;
}

export function uploadFiles(files: UploadableFile[], url: string): Promise<AxiosResponse[]> {
  return Promise.all(files.map((file) => uploadFile(file, url)));
}

export default function createUploader(url: string) {
  return {
    uploadFile: function (file: UploadableFile) {
      return uploadFile(file, url);
    },
    uploadFiles: function (files: UploadableFile[]) {
      return uploadFiles(files, url);
    },
  };
}
