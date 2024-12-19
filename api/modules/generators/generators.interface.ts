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
  campaignId: number;
  background: any;
  context: string;
  propertyName: string;
  length: number;
}

export interface PostGenerateArbitraryFromPromptRequest {
  campaignId: number;
  background: any;
  context: string;
  prompt: string;
}

export interface PostGenerateArbitraryReplacementRequest {
  campaignId: number;
  replace: string;
  full: string;
  turbo: boolean;
}
