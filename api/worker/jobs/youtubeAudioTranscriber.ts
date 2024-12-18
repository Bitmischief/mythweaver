import Queue from 'bull';
import ytdl from 'ytdl-core';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/providers/prisma';
import logger from '@/lib/logger';
import { config } from '@/worker/config';

interface DownloadYoutubeAudioEvent {
  youtubeUrl: string;
  sessionId: number;
}

export const youtubeAudioDownloaderQueue = new Queue<DownloadYoutubeAudioEvent>(
  'youtube-audio-downloader',
  config,
);

youtubeAudioDownloaderQueue.process(async (job, done) => {
  logger.info('Processing YouTube audio download job', job.data);

  try {
    await downloadYoutubeAudio(job.data);
    logger.info('Completed processing YouTube audio download job', job.data);
    done();
  } catch (err) {
    logger.error('Error processing YouTube audio download job!', err);
    done(new Error('Error processing YouTube audio download job!'));
  }
});

async function downloadYoutubeAudio({
  youtubeUrl,
  sessionId,
}: DownloadYoutubeAudioEvent) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(youtubeUrl);

  // Wait for the video to load
  await page.waitForSelector('video');

  const videoInfo = await ytdl.getInfo(youtubeUrl);
  const audioFormats = ytdl.filterFormats(videoInfo.formats, 'audioonly');

  if (audioFormats.length === 0) {
    throw new Error('No audio formats available for this video');
  }

  const audioFormat = audioFormats[0];
  const outputFilename = `session_${sessionId}_audio.mp3`;
  const outputPath = path.join(__dirname, '..', '..', 'tmp', outputFilename);

  return new Promise<void>((resolve, reject) => {
    ytdl(youtubeUrl, { format: audioFormat })
      .pipe(fs.createWriteStream(outputPath))
      .on('finish', async () => {
        await browser.close();

        // Update the session with the audio file path
        await prisma.session.update({
          where: { id: sessionId },
          data: { audioUri: outputPath },
        });

        resolve();
      })
      .on('error', (error: Error) => {
        reject(error);
      });
  });
}
