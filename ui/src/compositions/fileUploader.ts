import { UploadableFile } from '@/compositions/uploadableFile.ts';

export async function uploadFile(file: UploadableFile, url: string): Promise<Response> {
  // set up the request data
  const formData = new FormData();
  formData.append('file', file.file);

  // track status and upload file
  file.status = 'loading';
  const response = await fetch(url, { method: 'POST', body: formData });

  // change status to indicate the success of the upload request
  file.status = response.ok ? 'success' : 'error';

  return response;
}

export function uploadFiles(files: UploadableFile[], url: string): Promise<Response[]> {
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
