import logger from '@/modules/core/logging/logger';
import { sleep } from '@/modules/core/utils/time';

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
