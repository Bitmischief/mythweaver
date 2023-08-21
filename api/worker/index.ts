import Queue from "bull";
import { parentLogger } from "../lib/logger";
import { processTags } from "./jobs/processTags";
const logger = parentLogger.getSubLogger();

const config = {
  redis: {
    port: 6379,
    host: process.env.REDIS_ENDPOINT,
    password: process.env.REDIS_PASSWORD,
  },
};

export interface ProcessTagsEvent {
  conjurationIds: number[];
}

export const processTagsQueue = new Queue<ProcessTagsEvent>(
  "process-tags",
  config
);

processTagsQueue.process(async (job, done) => {
  logger.info("Processing tags job", job.data);

  try {
    await processTags(job.data.conjurationIds);
  } catch (err) {
    logger.error("Error processing generated image job!", err);
  }

  done();
});
