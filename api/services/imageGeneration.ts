import axios from "axios";
import fs from "node:fs";
import { v4 as uuidv4 } from "uuid";

const engineId = "stable-diffusion-xl-1024-v1-0";
const apiHost = process.env.API_HOST ?? "https://api.stability.ai";
const apiKey = process.env.STABILITY_API_KEY;

interface GenerationResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}

export const generateImage = async (prompt: string, count = 1) => {
  if (!apiKey) throw new Error("Missing Stability API key.");

  const response = await axios.post(
    `${apiHost}/v1/generation/${engineId}/text-to-image`,
    {
      text_prompts: [
        {
          text: prompt,
        },
      ],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      steps: 30,
      samples: count,
      style_preset: "fantasy-art",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  if (!response.status.toString().startsWith("2")) {
    throw new Error(`Non-200 response: ${response.data}`);
  }

  const responseJSON = response.data as GenerationResponse;
  const urls: string[] = [];

  responseJSON.artifacts.forEach((image) => {
    const imageId = uuidv4();
    const dataDir = process.env.DATA_DIR ?? "./public/images";

    if (!fs.existsSync(dataDir)) 
      fs.mkdirSync(dataDir, { recursive: true });

    fs.writeFileSync(
      `${dataDir}/${imageId}.png`,
      Buffer.from(image.base64, "base64")
    );

    urls.push(`${process.env.API_URL}/images/${imageId}.png`);
  });

  return urls;
};
