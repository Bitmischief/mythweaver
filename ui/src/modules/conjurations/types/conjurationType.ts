export interface ConjurationType {
  code: string;
  name: string;
  description: string;
  customizationHelpPrompt?: string;
  imageUri?: string;
  supportedImageStylePresets?: string[];
  proOnly?: boolean;
  experimental?: boolean;
  examples: string[];
}
