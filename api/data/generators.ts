export interface Generator {
  code?: string;
  name: string;
  description: string;
  imageUri: string;
  formatPrompt?: string;
  allowsImageGeneration?: boolean;
  customArgs?: GeneratorCustomArg[];
  children?: Generator[];
  promptOverride?: string;
}

export interface GeneratorCustomArg {
  slug: string;
  name: string;
  type: string;
}

export const getGenerator = (code: string): Generator | undefined => {
  return generators.find((g) => g.code === code);
};

const generators: Generator[] = [
  {
    code: "characters",
    name: "Characters",
    description: "Create rich, detailed characters to populate your world.",
    imageUri: "characters.png",
    formatPrompt:
      '[{ \n      "name": "", \n      "looks": "", \n      "imageAIPrompt": "", \n      "personality": "",\n      "background": ""\n    }]',
    allowsImageGeneration: true,
    customArgs: [
      {
        slug: "race",
        name: "Race",
        type: "string",
      },
      {
        slug: "originLocation",
        name: "Origin Location",
        type: "string",
      },
      {
        slug: "personality",
        name: "Personality",
        type: "string",
      },
      {
        slug: "factions",
        name: "Factions and Organizations",
        type: "string",
      },
      {
        slug: "languages",
        name: "Languages Spoken",
        type: "array(string)",
      },
      {
        slug: "familialStatus",
        name: "Familial Status",
        type: "array(string)",
      },
      {
        slug: "hobbies",
        name: "Hobbies and Interests",
        type: "array(string)",
      },
      {
        slug: "relationships",
        name: "Relationships and Connections",
        type: "array(object)",
      },
      {
        slug: "talents",
        name: "Talents & Abilities",
        type: "array(string)",
      },
    ],
  },
];

export default generators;
