import logger from '../lib/logger';
import { getClient } from '../lib/providers/openai';

const openai = getClient();

export const rephraseImagePrompt = async (promptHistory: string[]) => {
  logger.info('Rephrasing image prompt', promptHistory);

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content:
          'You are a master AI power-user who knows about AI image prompts and their common safeguards.',
      },
      {
        role: 'user',
        content: `These image generation prompts were flagged by Stable Diffusion's content filter. Please rephrase any words or phrases that may trigger the prompt filter. Do not otherwise alter the prompt. Prior prompts: ${promptHistory.join(
          '--- ',
        )}. Please respond only with the rephrased prompt and no other text.`,
      },
    ],
  });

  const rephrasedPrompt = response.choices[0]?.message?.content || '';

  logger.info('Rephrased prompt', rephrasedPrompt);

  return rephrasedPrompt;
};
