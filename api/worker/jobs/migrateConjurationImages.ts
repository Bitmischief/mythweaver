import { prisma } from '../../lib/providers/prisma';
import { uploadImage } from '../../services/imageGeneration';
import { parentLogger } from '../../lib/logger';
import axios from 'axios';

const logger = parentLogger.getSubLogger();

export const migrateConjurationImages = async () => {
  const take = 100;
  let skip = 0;
  let moreConjurations = true;

  while (moreConjurations) {
    logger.info(
      `Grabbing batch ${skip}-${skip + take} of conjurations to migrate`
    );

    const conjurations = await prisma.conjuration.findMany({
      skip,
      take,
    });

    for (const conjuration of conjurations) {
      logger.info('Migrating conjuration', conjuration.id);
      if (!conjuration.imageUri) continue;

      const imageId = conjuration.imageUri
        ?.split('/')
        ?.pop()
        ?.replace('.png', '');

      const image = await axios.get(conjuration?.imageUri || '', {
        responseType: 'arraybuffer',
      });
      const imageBase64 = Buffer.from(image.data).toString('base64');

      const imageUri = await uploadImage(imageId || '', imageBase64);
      logger.info(`Migrated image ${imageId} to ${imageUri}`);

      await prisma.conjuration.update({
        where: {
          id: conjuration.id,
        },
        data: {
          imageUri,
        },
      });

      logger.info('Successfully updated conjuration with new imageUri');
    }

    moreConjurations = conjurations.length > 0;
    skip += take;
  }
};
