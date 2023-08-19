export interface Generator {
  code?: string;
  name: string;
  description: string;
  imageUri: string;
  formatPrompt?: string;
  allowsImageGeneration?: boolean;
  imagePromptExtraContext?: string;
  customArgs?: GeneratorCustomArg[];
  children?: Generator[];
  promptOverride?: string;
  basePromptExtraContext?: string;
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
    code: "characters",
    name: "Characters",
    description: "Create rich, detailed characters to populate your world.",
    imageUri: "characters.png",
    formatPrompt:
      '[{ \n      "name": "", \n      "looks": "", \n      "imageAIPrompt": "", \n      "personality": "",\n      "background": ""\n      "tags": [""]\n    }]',
    allowsImageGeneration: true,
    imagePromptExtraContext:
      "Include the character's TTRPG class, gender, facial features and clothing.",
    basePromptExtraContext:
      "Please thoroughly flesh out the character's backstory, including their motivations, goals, and fears, using at least 100 words to describe the background of this character. Please populate tags with any values you think applicable to this character, to allow easy searching, including their race, occupation, gender, class and any others you deem helpful.",
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
    code: "locations",
    name: "Locations",
    description: "Explore exotic locations in your world.",
    imageUri: "locations.png",
    formatPrompt:
      '[{ \n      "name": "", \n      "history": "", \n      "imageAIPrompt": "", \n      "tags": [""]\n    }]',
    allowsImageGeneration: true,
    basePromptExtraContext:
      "Please thoroughly flesh out the location's history, including historical events, climate and unique look, using at least 100 words to describe the history of this location. Please populate tags with any values you think applicable to this location, to allow easy searching.",
  },
  // {
  //   code: "items",
  //   name: "Items",
  //   description: "Build customized items that don't break your game.",
  //   imageUri: "items.png",
  //   formatPrompt:
  //     '[{ \n      "name": "", \n      "looks": "", \n      "imageAIPrompt": "", \n      "personality": "",\n      "background": ""\n    }]',
  //   allowsImageGeneration: true,
  // },
];

export default conjurers;
