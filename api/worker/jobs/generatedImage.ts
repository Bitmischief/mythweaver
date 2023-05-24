import { Character } from "@prisma/client";
import { parentLogger } from "../../lib/logger";
import * as fs from "fs";
import util from "util";
import stream from "stream";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../lib/providers/prisma";

const pipeline = util.promisify(stream.pipeline);
const logger = parentLogger.getSubLogger();

export const processGeneratedImage = async (character: Character) => {
  logger.info("");

  if (!character.imageUri) {
    throw new Error("No imageUri for character");
  }

  const request = await axios.get(character.imageUri, {
    responseType: "stream",
  });

  const imageId = uuidv4();

  await pipeline(
    request.data,
    fs.createWriteStream(`${process.env.DATA_DIR}/${imageId}.png`)
  );

  await prisma.character.update({
    where: {
      id: character.id,
    },
    data: {
      imageUri: `${process.env.API_URL}/images/${imageId}.png`,
    },
  });
};
