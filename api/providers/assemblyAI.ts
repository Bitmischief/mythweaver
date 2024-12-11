import { AssemblyAI, ParagraphsResponse, Transcript } from 'assemblyai';

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
    });
  }

  async getTranscript(jobId: string): Promise<Transcript> {
    return this.client.transcripts.get(jobId);
  }

  async getParagraphs(transcriptId: string): Promise<ParagraphsResponse> {
    return this.client.transcripts.paragraphs(transcriptId);
  }
}
