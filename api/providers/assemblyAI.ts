import {
  AssemblyAI,
  ParagraphsResponse,
  SpeechModel,
  Transcript,
} from 'assemblyai';

export class AssemblyAIProvider {
  private client: AssemblyAI;

  constructor() {
    this.client = new AssemblyAI({
      apiKey: process.env.ASSEMBLYAI_API_KEY as string,
    });
  }

  async transcribe(audioUrl: string): Promise<Transcript> {
    return this.client.transcripts.submit({
      audio_url: audioUrl,
      speaker_labels: true,
      speech_model: 'best' as SpeechModel,
      summarization: true,
      summary_model: 'conversational',
      summary_type: 'bullets_verbose',
    });
  }

  async getTranscript(jobId: string): Promise<Transcript> {
    return this.client.transcripts.get(jobId);
  }

  async getParagraphs(transcriptId: string): Promise<ParagraphsResponse> {
    return this.client.transcripts.paragraphs(transcriptId);
  }

  async generateTextForTranscript(transcriptId: string, prompt: string): Promise<string> {
    const { response } = await this.client.lemur.task({
      transcript_ids: [transcriptId],
      prompt,
      context: 'This is a tabletop roleplaying game session',
      final_model: 'anthropic/claude-3-5-sonnet',
    });
    return response;
  }
}
