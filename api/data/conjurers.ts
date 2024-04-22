export interface Generator {
  code?: string;
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
    code: 'characters',
    name: 'NPCs',
    description: 'Create rich, detailed characters to populate your world.',
    customizationHelpPrompt:
      'A gnome scribe adorned with swirling tattoos that glow faintly in the moonlight, bearing an ancient map etched into her skin, and a past entangled with forgotten gods',
    imageUri: 'characters.png',
    formatPrompt:
      '{ \n      "name": "", \n      "looks": "", \n      "imageAIPrompt": "", \n      "personality": "",\n      "quirks": ""\n      "fears": ""\n      "hobbies": ""\n      "background": ""\n      "tags": [""]\n    }',
    allowsImageGeneration: true,
    imagePromptExtraContext:
      "Include the characters' sex and any defining visual characteristics in the prompt.",
    basePromptExtraContext:
      "Please thoroughly flesh out the character's backstory, including their motivations, goals, and fears, using at least 100 words to describe the background of this character. Please populate tags with any values you think applicable to this character, to allow easy searching, including their race, occupation, gender, class and any others you deem helpful.",
    supportedImageStylePresets: ['fantasy-art', 'digital-art', 'comic-book'],
    proOnly: false,
  },
  // {
  //   code: "encounters",
  //   name: "Encounters",
  //   description: "Build exciting and engaging encounters for your players.",
  //   imageUri: "encounters.png",
  //   formatPrompt:
  //     '[{ \n      "name": "", \n      "looks": "", \n      "imageAIPrompt": "", \n      "personality": "",\n      "background": ""\n    }]',
  //   allowsImageGeneration: true,
  // },
  // {
  //   code: "treasure",
  //   name: "Treasure",
  //   description: "Intrigue your players with unique treasure.",
  //   imageUri: "treasure.png",
  //   formatPrompt:
  //     '[{ \n      "name": "", \n      "looks": "", \n      "imageAIPrompt": "", \n      "personality": "",\n      "background": ""\n    }]',
  //   allowsImageGeneration: true,
  // },
  {
    code: 'locations',
    name: 'Locations',
    description: 'Explore exotic locations in your world.',
    customizationHelpPrompt:
      'a secluded forest glen, where the trees whisper ancient secrets in the wind, encircled by stone pillars that harbor echoes of forgotten rituals, and a shimmering pond that holds the reflection of a realm not of this world',
    imageUri: 'locations.png',
    formatPrompt:
      '{ "name": "", "history": "", "imageAIPrompt": "", "tags": [""] }',
    allowsImageGeneration: true,
    basePromptExtraContext:
      "Please thoroughly flesh out the location's history, including historical events, climate and unique look, using at least 100 words to describe the history of this location. Please populate tags with any values you think applicable to this location, to allow easy searching.",
    supportedImageStylePresets: ['fantasy-art', 'digital-art'],
    proOnly: false,
  },
  {
    code: 'monsters',
    name: 'Monsters',
    description: 'Create terrifying monsters to challenge your players.',
    customizationHelpPrompt:
      'a towering, hulking beast with a single eye and a gaping maw, covered in thick, matted fur, and a long, barbed tail that lashes out at anything that comes near',
    imageUri: 'monsters.png',
    formatPrompt:
      '{ "name": "", "description": "", "storyImpact": "", "playerInteraction": "", "specialAbilities": "", "imageAIPrompt": "", "tags": [""] }',
    allowsImageGeneration: true,
    basePromptExtraContext:
      "Please generate a uniquely terrifying, monstrous creature worthy of testing our adventurer's mettle. Please populate tags with any values you think applicable to this monster, to allow easy searching.",
    supportedImageStylePresets: ['fantasy-art', 'digital-art'],
    proOnly: false,
  },
  {
    code: 'items',
    name: 'Magic Items',
    description: "Build customized items that don't break your game.",
    customizationHelpPrompt:
      'An ornate, jeweled dagger thats blade glows with an inner light.',
    imageUri: 'items.png',
    formatPrompt:
      '{ "name": "", "description": "", "magicalProperties": "", "value": "", "rarity": "", "imageAIPrompt": "" }',
    allowsImageGeneration: true,
    basePromptExtraContext:
      'Please generate an item to be used in a TTRPG game. Please populate tags with any values you think applicable to this item, to allow easy searching.',
    supportedImageStylePresets: ['fantasy-art', 'digital-art'],
    proOnly: true,
  },
];

export default conjurers;
