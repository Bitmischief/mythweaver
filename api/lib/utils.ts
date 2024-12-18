import axios from 'axios';
import fs from 'node:fs';
import logger from '@/lib/logger';

export function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

export function sanitizeJson(json: string): string {
  if (isValidJson(json)) {
    return json;
  }

  const jsonStart = Array.from(json).findIndex((char) => char === '{');
  json = json.slice(jsonStart);
  json = json.replace(/ {4}|[\t\n\r]/gm, ' ');
  json = json.replace('```json', '').replace('```', '');

  if (isValidJson(json)) {
    return json;
  }

  //escape unescaped quotes in json
  let quotesOpen = false;
  let fixedCopy = `${json}`;

  for (let i = 0; i < json.length; i++) {
    const char = json[i];

    if (char === '"') {
      quotesOpen = !quotesOpen;

      if (!quotesOpen) {
        const nextChar = json[i + 1];

        if (
          nextChar !== ',' &&
          nextChar !== '}' &&
          nextChar !== ']' &&
          nextChar !== ':'
        ) {
          fixedCopy = json.slice(0, i) + '\\' + json.slice(i);
          quotesOpen = true;
        }
      }
    }
  }

  return fixedCopy;
}

export function isValidJson(json: string): boolean {
  try {
    JSON.parse(json);
    return true;
  } catch (err) {
    return false;
  }
}

export function trimPlural(s: string | undefined): string | undefined {
  if (!s) return;

  if (s.endsWith('s')) {
    return s.slice(0, -1);
  }

  return s;
}

export const urlPrefix = process.env.APP_URL;

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

type ChunkProcessor<T> = (item: T) => Promise<void>;

export const processInChunks = async <T>(
  chunkSize: number,
  queryFunction: (skip: number, take: number) => Promise<T[]>,
  processChunkItem: ChunkProcessor<T>,
  delay = 0,
): Promise<void> => {
  let skip = 0;
  let items: T[] = [];

  do {
    logger.info(`Fetching batch of items ${skip}, ${chunkSize}`);
    items = await queryFunction(skip, chunkSize);

    for (const item of items) {
      await processChunkItem(item);
    }

    logger.info(
      `Processed batch of items: ${items.map((i: any) => i.id).join(', ')}`,
    );
    skip += chunkSize;
    logger.info(`Skip set to ${skip}, items.length: ${items.length}`);

    if (delay > 0) {
      logger.info(`Sleeping for ${delay} milliseconds`);
      await sleep(delay);
    }
  } while (items.length > 0);
};

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
