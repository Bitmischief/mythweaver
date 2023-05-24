import Queue from "bull";
import { Character } from "@prisma/client";
import { parentLogger } from "../lib/logger";
import { processGeneratedImage } from "./jobs/generatedImage";
const logger = parentLogger.getSubLogger();

const config = {
  redis: {
    port: 6379,
    host: process.env.REDIS_ENDPOINT,
    password: process.env.REDIS_PASSWORD,
  },
};

export interface GeneratedImageEvent {
  character: Character;
}

export const generatedImageQueue = new Queue<GeneratedImageEvent>(
  "generated-image",
  config
);

generatedImageQueue.process(async (job, done) => {
  logger.info("Processing generated image job", job.data);

  try {
    await processGeneratedImage(job.data.character);
  } catch (err) {
    logger.error("Error processing generated image job!", err);
  }

  done();
});
