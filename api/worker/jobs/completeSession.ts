import { CompleteSessionEvent } from '../index';
import { getClient } from '../../lib/providers/openai';
import { parentLogger } from '../../lib/logger';
import { prisma } from '../../lib/providers/prisma';
import { sanitizeJson } from '../../lib/utils';
import { generateImage } from '../../services/imageGeneration';
import {
  sendWebsocketMessage,
  WebSocketEvent,
} from '../../services/websockets';

const logger = parentLogger.getSubLogger();
const openai = getClient();

export const completeSession = async (request: CompleteSessionEvent) => {
  const session = await prisma.session.findUnique({
    where: {
      id: request.sessionId,
    },
  });

  await prisma.session.update({
    where: {
      id: request.sessionId,
    },
    data: {
      processing: true,
    },
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4-1106-preview',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant who is knowledgeable in dungeons and dragons.',
      },
      {
        role: 'user',
        content: `Please perform 3 tasks for me. 
        1) Summarize the ttrpg session that just happened, that has the following details: ${session?.recap}. 
        2) Generate a 6 words or less name for this session based on the summary.
        3) Write a prompt for an AI text-to-image engine that will represent this session. Please limit this to under 15 words, focusing on the most impactful scene from the recap.
        4) Analyze our actions and tell me what we did well and what we could have done better.
        Please return your responses in the following JSON format: 
        { "name": "", "summary": "", "prompt": "", "suggestions": "" }`,
      },
    ],
  });

  const gptResponse = response.choices[0]?.message?.content;
  logger.info('Received raw response from openai', gptResponse);
  const gptJson = sanitizeJson(gptResponse || '');
  logger.info('Received sanitized json', gptJson);

  let gptJsonParsed;
  try {
    gptJsonParsed = JSON.parse(gptJson);
  } catch (err) {
    throw new Error('Error parsing JSON from GPT response');
  }

  logger.info('Received summary from openai', gptJsonParsed);

  if (session?.summary) {
    await prisma.session.update({
      where: {
        id: request.sessionId,
      },
      data: {
        suggestedSummary: gptJsonParsed.summary,
      },
    });
  } else {
    await prisma.session.update({
      where: {
        id: request.sessionId,
      },
      data: {
        name: session?.name === 'New Session' ? gptJsonParsed.name : undefined,
        summary: !session?.summary ? gptJsonParsed.summary : undefined,
        suggestions: !session?.suggestions
          ? gptJsonParsed.suggestions
          : undefined,
        suggestedName:
          session?.name === 'New Session' ? undefined : gptJsonParsed.name,
        suggestedSummary: !session?.summary ? undefined : gptJsonParsed.summary,
        suggestedSuggestions: !session?.suggestions
          ? undefined
          : gptJsonParsed.suggestions,
        suggestedImagePrompt: gptJsonParsed.prompt,
      },
    });

    const uris = await generateImage({
      userId: request.userId,
      prompt: gptJsonParsed.prompt,
      count: 1,
    });

    if (!uris) {
      throw new Error('Error generating image');
    }

    const payload = {
      imageUri: !session?.imageUri ? uris[0] : undefined,
      suggestedImageUri: uris[0],
    };

    await prisma.session.update({
      where: {
        id: request.sessionId,
      },
      data: payload,
    });

    await sendWebsocketMessage(
      request.userId,
      WebSocketEvent.SessionImageUpdated,
      payload,
    );
  }

  await prisma.session.update({
    where: {
      id: request.sessionId,
    },
    data: {
      processing: false,
    },
  });

  await sendWebsocketMessage(request.userId, WebSocketEvent.SessionUpdated, {});
};
