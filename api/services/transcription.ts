import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY as string,
});

export const recapTranscript = async (transcriptId: string) => {
  const recapPrompt = `Provide a thorough recap of the transcript. The transcript is for my tabletop roleplaying game. 
    Please ensure to provide proper fantasy race names, character names or other general roleplaying terminology. 
    For every 10 minutes of audio, there should be at least a paragraph in the recap to summarize. Respond with 
    just the recap and don't include a preamble or introduction.`;

  const { response: recap } = await client.lemur.task({
    transcript_ids: [transcriptId],
    prompt: recapPrompt,
    context: 'This is a tabletop roleplaying game session',
    final_model: 'anthropic/claude-3-5-sonnet',
  });

  return recap;
};

export const summarizeTranscript = async (transcriptId: string) => {
  const summaryPrompt = `Provide an 8-12 sentence summary of the transcript. The transcript is for my tabletop roleplaying game. 
    Please ensure to provide proper fantasy race names, character names or other general roleplaying terminology. 
    Please include all elements relevant to the plot points in my world.
    Respond with just the recap and don't include a preamble or introduction.`;

  const { response: summary } = await client.lemur.task({
    transcript_ids: [transcriptId],
    prompt: summaryPrompt,
    context: 'This is a tabletop roleplaying game session',
    final_model: 'anthropic/claude-3-5-sonnet',
  });

  return summary;
};
