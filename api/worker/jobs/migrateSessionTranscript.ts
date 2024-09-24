import Queue from 'bull';
import { config } from '../config';
import logger from '../../lib/logger';
import { prisma } from '../../lib/providers/prisma';
import { Prisma } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface MigrateSessionTranscriptionEvent {}

export const migrateSessionTranscriptionQueue = new Queue<MigrateSessionTranscriptionEvent>(
  'migrate-session-transcription',
  config
);

migrateSessionTranscriptionQueue.process(async (job, done) => {
  logger.info('Processing migrate session transcription job');

  try {
    await migrateSessionTranscriptionSentences();
    logger.info('Completed processing migrate session transcription job');
    done();
  } catch (err) {
    logger.error('Error processing migrate session transcription job!', err);
    done(new Error('Error processing migrate session transcription job!'));
  }
});

async function migrateSessionTranscriptionSentences() {
  const batchSize = 100;
  let processedCount = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const sessionTranscriptions = await prisma.sessionTranscription.findMany({
      take: batchSize,
    });

    if (sessionTranscriptions.length === 0) {
      break;
    }

    for (const transcription of sessionTranscriptions) {
      const updateData: Prisma.SessionTranscriptionUpdateInput = {
        transcript: transcription.transcription as any,
        transcription: Prisma.DbNull,
      };

      if (
        transcription.transcription &&
        typeof transcription.transcription === 'object'
      ) {
        if ('sentences' in transcription.transcription) {
          updateData.sentences = transcription.transcription.sentences as any;
        }

        if ('paragraphs' in transcription.transcription) {
          updateData.paragraphs = transcription.transcription.paragraphs as any;
        }
      }

      await prisma.sessionTranscription.update({
        where: { sessionId: transcription.sessionId },
        data: updateData,
      });

      processedCount++;
      logger.info(`Migrated data for SessionTranscription with sessionId: ${transcription.sessionId}`);
    }

    logger.info(`Processed ${processedCount} records so far`);
  }

  logger.info(`Migration completed. Total records processed: ${processedCount}`);
}
