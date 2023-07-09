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

export interface GeneratorResponse {
  node: Generator;
  parent: Generator;
  grandParent?: Generator;
}

export const getGenerator = (code: string): GeneratorResponse | undefined => {
  for (const generator of generators) {
    for (const child of generator?.children || []) {
      if (child.code === code) {
        return {
          node: child,
          parent: generator,
        };
      }

      for (const grandchild of child?.children || []) {
        if (grandchild.code === code) {
          return {
            node: grandchild,
            parent: child,
            grandParent: generator,
          };
        }
      }
    }
  }
};

const generators: Generator[] = [
  {
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
    children: [
      {
        name: "Townfolk",
        description:
          "Develop lively townfolk who add depth to your bustling towns and cities.",
        imageUri: "characters/townfolk.png",
        children: [
          {
            code: "characters/townfolk/bartenders",
            name: "Bartenders",
            description:
              "Breathe life into your local tavern with a unique and compelling barkeep.",
            imageUri: "characters/townfolk/bartender.png",
          },
          {
            code: "characters/townfolk/farmers",
            name: "Farmers",
            description:
              "Build hardworking farmers to cultivate the countryside and feed the populace.",
            imageUri: "characters/townfolk/farmers.png",
          },
          {
            code: "characters/townfolk/guards",
            name: "Guards",
            description:
              "Local law enforcement responsible for maintaining order, enforcing laws, and protecting the town and its citizens.",
            imageUri: "characters/townfolk/guards.png",
          },
          {
            code: "characters/townfolk/innkeepers",
            name: "Innkeepers",
            description:
              "Owners or managers of inns, who provide food, drink, and a place to sleep for travelers and sometimes locals too.",
            imageUri: "characters/townfolk/innkeepers.png",
          },
          {
            code: "characters/townfolk/scholars",
            name: "Scholars",
            description:
              "Learned individuals focused on the pursuit of knowledge, often specializing in a particular field such as history, magic, nature, or the arts.",
            imageUri: "characters/townfolk/scholars.png",
          },
          {
            code: "characters/townfolk/laborers",
            name: "Laborers",
            description:
              "General laborers who perform a variety of tasks, such as construction, mining, and farming.",
            imageUri: "characters/townfolk/laborers.png",
          },
        ],
      },
      {
        name: "Merchants",
        description:
          "Create a variety of merchants to supply goods and services in your world.",
        imageUri: "characters/merchants.png",
        children: [
          {
            code: "characters/merchants/armor",
            name: "Armor",
            description:
              "Generate hardy armor merchants who provide a variety of protective gear, from simple leather jerkins to enchanted mithril plate.",
            imageUri: "characters/merchants/armor.png",
          },
          {
            code: "characters/merchants/potions",
            name: "Potions",
            description:
              "Create mysterious potion merchants selling concoctions of various effects, from healing potions to deadly poisons.",
            imageUri: "characters/merchants/potions.png",
          },
          {
            code: "characters/merchants/magic",
            name: "Magical Items",
            description:
              "Invent magical item merchants with all sorts of wondrous trinkets and artifacts that hold magical properties.",
            imageUri: "characters/merchants/magicalItems.png",
          },
          {
            code: "characters/merchants/maps",
            name: "Maps and Scrolls",
            description:
              "Craft map and scroll merchants with an extensive collection of charts and documents, some of which might lead to buried treasure or contain powerful spells.",
            imageUri: "characters/merchants/maps.png",
          },
          {
            code: "characters/merchants/mounts",
            name: "Mounts and Animals",
            description:
              "Design merchants who deal in beasts of burden, exotic pets, and magical creatures, perfect for traveling or companionship.",
            imageUri: "characters/merchants/mounts.png",
            promptOverride:
              "merchant characters who deal in beasts of burden, exotic pets, and magical creatures, perfect for traveling or companionship",
          },
          {
            code: "characters/merchants/provisions",
            name: "Provisions and Supplies",
            description:
              "Imagine merchants who stock all necessary adventuring supplies, such as rations, torches, rope, and more.",
            imageUri: "characters/merchants/provisions.png",
          },
          {
            code: "characters/merchants/art",
            name: "Art and Luxuries",
            description:
              "Shape luxury goods merchants that peddle in fine art, jewelry, and other valuable trinkets.",
            imageUri: "characters/merchants/luxuries.png",
          },
          {
            code: "characters/merchants/curiosities",
            name: "Curiosities",
            description:
              "Conjure unusual merchants selling strange and peculiar items that defy explanation, perfect for adding a touch of the extraordinary to your game.",
            imageUri: "characters/merchants/curiosities.png",
          },
          {
            code: "characters/merchants/weapons",
            name: "Weapons",
            description:
              "Conjure unusual merchants selling strange and peculiar items that defy explanation, perfect for adding a touch of the extraordinary to your game.",
            imageUri: "characters/merchants/weapons.png",
          },
          {
            code: "characters/merchants/custom",
            name: "Custom",
            description: "Build a custom merchant to suit your needs.",
            imageUri: "characters/merchants/custom.png",
          },
        ],
      },
      {
        name: "Antagonists",
        description:
          "Create a variety of merchants to supply goods and services in your world.",
        imageUri: "characters/antagonists.png",
        children: [
          {
            code: "characters/antagonists/darkOverlord",
            name: "Dark Overlord",
            description:
              "These villains are often extremely powerful, have vast armies at their disposal, and aim to conquer, destroy, or fundamentally reshape the world. ",
            imageUri: "characters/antagonists/darkOverlord.png",
          },
          {
            code: "characters/antagonists/cunningManipulator",
            name: "Cunning Manipulator",
            description:
              "They might be a devious vizier manipulating a kingdom's politics, a secretive cult leader working to summon a dark god, or a clever crime lord seeking to control an entire city's underworld. These villains typically use deceit, manipulation, and indirect methods, making them dangerous and unpredictable foes.",
            imageUri: "characters/antagonists/cunningManipulator.png",
          },
          {
            code: "characters/antagonists/tragicVillain",
            name: "Tragic Villain",
            description:
              "They might be a fallen hero consumed by vengeance, a well-intentioned extremist trying to do good but causing harm instead, or a once-kind ruler who's been corrupted by power. These villains can bring moral complexity to your story, as they might elicit sympathy or even understanding from the players.",
            imageUri: "characters/antagonists/magicalItems.png",
          },
        ],
      },
    ],
  },
];

export default generators;
