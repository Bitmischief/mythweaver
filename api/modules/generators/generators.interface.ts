export interface GetGeneratorsResponse {
  data: any[];
  offset?: number;
  limit?: number;
}

export interface PostGeneratorGenerate {
  campaignId: number;
  count: number;
  customArg?: string;
  prompt?: string;
  type?: string;
}

export interface PostGenerateArbitraryRequest {
  background: any;
  context: string;
  propertyName: string;
  length: number;
}

export interface PostGenerateArbitraryFromPromptRequest {
  background: any;
  context: string;
  prompt: string;
}

export interface PostGenerateArbitraryReplacementRequest {
  replace: string;
  full: string;
  turbo: boolean;
}
