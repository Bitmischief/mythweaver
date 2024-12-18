import { AssemblyAIProvider } from '../../providers/assemblyAI';

export class TranscriptionService {
  constructor(private readonly assemblyAIProvider: AssemblyAIProvider) {}

  async recapTranscript(transcriptId: string): Promise<string> {
    const recapPrompt = `Provide a thorough recap of the transcript. The transcript is for my tabletop roleplaying game. 
    Please ensure to provide proper fantasy race names, character names or other general roleplaying terminology. 
    For every 10 minutes of audio, there should be at least a a sentence or two in the recap to summarize. Respond with 
    just the recap and don't include a preamble or introduction.`;

    return await this.assemblyAIProvider.generateTextForTranscript(
      transcriptId,
      recapPrompt,
    );
  }

  async summarizeTranscript(transcriptId: string) {
    const summaryPrompt = `Provide an 8-12 sentence summary of the transcript. The transcript is for my tabletop roleplaying game. 
      Please ensure to provide proper fantasy race names, character names or other general roleplaying terminology. 
      Please include all elements relevant to the plot points in my world.
      Respond with just the recap and don't include a preamble or introduction.`;

    return await this.assemblyAIProvider.generateTextForTranscript(
      transcriptId,
      summaryPrompt,
    );
  }
}
