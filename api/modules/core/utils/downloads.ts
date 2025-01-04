import axios from 'axios';
import fs from 'node:fs';

export const downloadFile = async (
  uri: string,
  outputPath: string,
): Promise<void> => {
  try {
    const response = await axios({
      method: 'GET',
      url: uri,
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(outputPath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Failed to download file:', error);
    throw error;
  }
};
