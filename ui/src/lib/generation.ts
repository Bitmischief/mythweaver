import {
  postGenerateArbitrary,
  postGenerateArbitraryFromPrompt,
  PostGenerateArbitraryFromPromptRequest,
} from '@/api/generators.ts';
import { showError } from '@/lib/notifications.ts';

export interface GenerateArbitraryPropertyRequest {
  propertyName: string;
  context: 'character' | 'location' | string;
  background: any;
  length?: number;
}

export async function generateArbitraryProperty(request: GenerateArbitraryPropertyRequest) {
  const response = await postGenerateArbitrary({
    ...request,
  });

  if (response.status !== 200) {
    showError({
      message: `Failed to create generate ${request.propertyName}. Please try again in a moment.`,
    });
  }

  return response.data.propertyValue;
}

export async function generateArbitrary(request: PostGenerateArbitraryFromPromptRequest) {
  const response = await postGenerateArbitraryFromPrompt({
    ...request,
  });

  if (response.status !== 200) {
    showError({
      message: `Failed to generate AI image prompt. Please try again in a moment.`,
    });
  }

  return response.data;
}
