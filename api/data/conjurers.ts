export interface Generator {
  code: string;
  name: string;
  description: string;
  customizationHelpPrompt: string;
  imageUri: string;
  formatPrompt?: string;
  allowsImageGeneration?: boolean;
  imagePromptExtraContext?: string;
  customArgs?: GeneratorCustomArg[];
  children?: Generator[];
  promptOverride?: string;
  basePromptExtraContext?: string;
  supportedImageStylePresets?: string[];
  proOnly: boolean;
  experimental: boolean;
}

export interface GeneratorCustomArg {
  slug: string;
  name: string;
  type: string;
}

export const getGenerator = (code: string): Generator | undefined => {
  return conjurers.find((g) => g.code === code);
};

const conjurers: Generator[] = [
  {
    code: 'players',
    name: 'Character',
    description:
      'Conjure up Characters with immersive backstories and unique characteristics that take your role-playing to the next level.',
    customizationHelpPrompt:
      "Tell us the key details about your Character (age, race, class, backstory) and we'll help you craft an interesting backstory, personality, and looks!",
    imageUri: 'player-characters.png',
    formatPrompt:
      '{ "name": "",  "looks": "",  "imageAIPrompt": "",  "personality": "", "quirks": "", "fears": "", "hobbies": "", "backstory": "", "age": "", "race": "", "class": "", "tags": [""] }',
    allowsImageGeneration: true,
    imagePromptExtraContext:
      "Include the characters' sex and any defining visual characteristics in the prompt.",
    basePromptExtraContext:
      "Please thoroughly flesh out the character's backstory, including their motivations, goals, and fears, using at least 100 words to describe the background of this character. Please populate tags with any values you think applicable to this character, to allow easy searching, including their race, occupation, gender, class and any others you deem helpful.",
    supportedImageStylePresets: ['fantasy-art', 'digital-art', 'comic-book'],
    proOnly: false,
    experimental: false,
  },
  {
    code: 'characters',
    name: 'NPC',
    description:
      'Conjure up compelling NPCs with distinctive traits and narratives to bring depth and intrigue to your game world.',
    customizationHelpPrompt:
      "Tell us your NPC's basic outline, and we'll craft a vivid and dynamic character to enrich your game world!",
    imageUri: 'characters.png',
    formatPrompt:
      '{ "name": "",  "looks": "",  "imageAIPrompt": "",  "personality": "", "quirks": "", "fears": "", "hobbies": "", "background": "", "tags": [""] }',
    allowsImageGeneration: true,
    imagePromptExtraContext:
      "Include the characters' sex and any defining visual characteristics in the prompt.",
    basePromptExtraContext:
      "Please thoroughly flesh out the character's backstory, including their motivations, goals, and fears, using at least 100 words to describe the background of this character. Please populate tags with any values you think applicable to this character, to allow easy searching, including their race, occupation, gender, class and any others you deem helpful.",
    supportedImageStylePresets: ['fantasy-art', 'digital-art', 'comic-book'],
    proOnly: false,
    experimental: false,
  },
  {
    code: 'locations',
    name: 'Location',
    description:
      'From bustling taverns to dank dungeons, conjure up captivating realms and settings that ignite the spirit of adventure.',
    customizationHelpPrompt:
      'Share a description of your desired locale, and we’ll craft unique features and captivating details to enrich your next session!',
    imageUri: 'locations.png',
    formatPrompt:
      '{ "name": "", "history": "", "climate": "", "notableLandmarks": "", "imageAIPrompt": "", "tags": [""] }',
    allowsImageGeneration: true,
    basePromptExtraContext:
      "Please thoroughly flesh out the location's history, including historical events, climate and unique look, using at least 100 words to describe the history of this location. Please populate tags with any values you think applicable to this location, to allow easy searching.",
    supportedImageStylePresets: ['fantasy-art', 'digital-art'],
    proOnly: false,
    experimental: false,
  },
  {
    code: 'monsters',
    name: 'Monster',
    description:
      'Conjure up fearsome and unforgettable monsters to elevate your game and thrill your adventurers.',
    customizationHelpPrompt:
      'Tell us about your monster idea: The more vivid the description, the better we can craft a unique and engaging foe for your adventure.',
    imageUri: 'monsters.png',
    formatPrompt:
      '{ "name": "", "description": "", "storyImpact": "", "playerInteraction": "", "specialAbilities": "", "imageAIPrompt": "", "tags": [""] }',
    allowsImageGeneration: true,
    basePromptExtraContext:
      "Please generate a uniquely terrifying, monstrous creature worthy of testing our adventurer's mettle. Please populate tags with any values you think applicable to this monster, to allow easy searching.",
    supportedImageStylePresets: ['fantasy-art', 'digital-art'],
    proOnly: false,
    experimental: false,
  },
  {
    code: 'items',
    name: 'Magic Item',
    description:
      'Conjure up magical treasures that are sure to dazzle, challenge, and delight your adventurers!',
    customizationHelpPrompt:
      "Describe your vision, and we'll conjure a unique Magical Item tailored to enhance your adventure with enchanting features and intriguing lore!",
    imageUri: 'items.png',
    formatPrompt:
      '{ "name": "", "description": "", "magicalProperties": "", "lore": "", "value": "", "rarity": "", "imageAIPrompt": "" }',
    allowsImageGeneration: true,
    basePromptExtraContext:
      'Please generate an item to be used in a TTRPG game. Please populate tags with any values you think applicable to this item, to allow easy searching.',
    supportedImageStylePresets: ['fantasy-art', 'digital-art'],
    proOnly: true,
    experimental: true,
  },
];

export default conjurers;
