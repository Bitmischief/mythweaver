import axios from 'axios';
import { ImageModel } from '@prisma/client';
import { ImageGenerationRequest } from '@/modules/images/images.interface';
import logger from '../lib/logger';

export interface RunPodResponse {
  id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  output?: {
    base64: string;
    seed: number;
  };
}

export class RunPodProvider {
  async submitJob(
    model: ImageModel,
    request: ImageGenerationRequest,
  ): Promise<RunPodResponse> {
    const response = await axios.post<RunPodResponse>(
      `${model.executionUri}/run`,
      {
        input: {
          prompt: `${model.promptPrefix} ${request.prompt}`,
          steps: model.defaultSteps,
          negative_prompt: request.negativePrompt,
          lora_name: model.loraName,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
        },
      },
    );
    return response.data;
  }

  async cancelJob(model: ImageModel, jobId: string): Promise<void> {
    try {
      await axios.post(
        `${model.executionUri}/cancel/${jobId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
          },
        },
      );
    } catch (error) {
      logger.error('Failed to cancel RunPod job', { jobId, error });
    }
  }

  async checkJobStatus(
    model: ImageModel,
    jobId: string,
  ): Promise<RunPodResponse> {
    const response = await axios.get<RunPodResponse>(
      `${model.executionUri}/status/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
        },
      },
    );
    return response.data;
  }
}

export default new RunPodProvider();
