import { CompleteSessionEvent } from '../index';
import { getClient } from '../../lib/providers/openai';
import { parentLogger } from '../../lib/logger';
import { prisma } from '../../lib/providers/prisma';
import { sanitizeJson, urlPrefix } from '../../lib/utils';
import { generateImage } from '../../services/imageGeneration';
import { SessionStatus } from '../../controllers/sessions';
import { sendTransactionalEmail } from '../../lib/transactionalEmail';

const logger = parentLogger.getSubLogger();
const openai = getClient();

export const completeSession = async (request: CompleteSessionEvent) => {
  const session = await prisma.session.findUnique({
    where: {
      id: request.sessionId,
    },
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
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

  await prisma.session.update({
    where: {
      id: request.sessionId,
    },
    data: {
      summary: gptJsonParsed.summary,
      suggestions: gptJsonParsed.suggestions,
      name: gptJsonParsed.name,
      status: SessionStatus.COMPLETED,
    },
  });

  const imageUri = (await generateImage(gptJsonParsed.prompt, 1))[0];

  await prisma.session.update({
    where: {
      id: request.sessionId,
    },
    data: {
      imageUri,
    },
  });

  const campaign = await prisma.campaign.findUnique({
    where: {
      id: session?.campaignId,
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  for (const member of campaign.members) {
    const email = member.user?.email || member.email;
    await sendTransactionalEmail(
      'post-session',
      `🎲 MythWeaver Session Recap: ${campaign.name} 🐉`,
      email || '',
      [
        {
          name: 'CHARACTER_NAME',
          content: email,
        },
        {
          name: 'CAMPAIGN_NAME',
          content: campaign.name,
        },
        {
          name: 'SUMMARY',
          content: gptJsonParsed.summary,
        },
        {
          name: 'SUGGESTIONS',
          content: gptJsonParsed.suggestions,
        },
        {
          name: 'SESSION_URL',
          content: `${urlPrefix}/sessions/${session?.id}/edit`,
        },
        {
          name: 'SESSION_IMAGE_URI',
          content: imageUri,
        },
      ],
    );
  }
};
