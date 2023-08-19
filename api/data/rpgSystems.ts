export interface RpgSystem {
  code?: string;
  name: string;
  versions: string[];
  imageUri?: string;
  releaseDate?: string;
  relevance: number;
  tags?: string[];
  imageAIPromptPrefixes?: string[];
  customAttributes?: any[];
  publicAdventures?: PublicAdventure[];
}

export interface PublicAdventure {
  code: string;
  name: string;
  description: string;
}

export const getRpgSystem = (code: string): RpgSystem | undefined => {
  return rpgSystems.find((rpgSystem) => rpgSystem.code === code);
};

const rpgSystems: RpgSystem[] = [
  {
    code: "dnd",
    name: "Dungeons & Dragons",
    versions: [
      "1st Edition",
      "2nd Edition",
      "3rd Edition",
      "3.5 Edition",
      "4th Edition",
      "5th Edition",
    ],
    imageUri: "dnd.png",
    releaseDate: "1974-01-01",
    relevance: 99,
    publicAdventures: [
      {
        name: "Other",
        code: "other",
        description: "An adventure not listed here.",
      },
      {
        name: "Lost Mine of Phandelver",
        code: "lmop",
        description:
          "An adventure set in the Sword Coast region, featuring a goblin ambush, an exploration of a ruined manor, and the challenges of a dwarven mine.",
      },
      {
        name: "Hoard of the Dragon Queen",
        code: "hotdq",
        description:
          "The Cult of the Dragon seeks to bring Tiamat from her prison in the Nine Hells to Faerûn. Adventurers must thwart the cult's plans.",
      },
      {
        name: "Rise of Tiamat",
        code: "roft",
        description:
          "Continuing the story from Hoard of the Dragon Queen, adventurers engage in a race against time to prevent Tiamat's arrival.",
      },
      {
        name: "Princes of the Apocalypse",
        code: "pota",
        description:
          "Four apocalyptic cults of Elemental Evil are building secret sanctuaries and outposts throughout the North, bringing terror and destruction.",
      },
      {
        name: "Out of the Abyss",
        code: "ootb",
        description:
          "Adventurers are tasked to escape the drow-infested Underdark, while facing madness and the abominable denizens of the Demon Lords' realms.",
      },
      {
        name: "Curse of Strahd",
        code: "cos",
        description:
          "Characters are drawn into the terror-filled land of Barovia, home to the vampire Strahd, and are tasked to end his reign of terror.",
      },
      {
        name: "Storm King's Thunder",
        code: "skt",
        description:
          "The Storm King has disappeared and giants are rampaging across the North. Characters are pitted against these huge foes to prevent widespread destruction.",
      },
      {
        name: "Tales from the Yawning Portal",
        code: "tfyp",
        description:
          "Seven classic adventures updated to D&D fifth edition, which can be run as standalone games or dropped into existing campaigns.",
      },
      {
        name: "Tomb of Annihilation",
        code: "toa",
        description:
          "The characters must navigate the deadly jungles of Chult, as well as a trap-filled dungeon, in order to stop the death curse.",
      },
      {
        name: "Waterdeep: Dragon Heist",
        code: "wdh",
        description:
          "A city-based adventure set in Waterdeep, pitting adventurers against various factions vying to find a hidden fortune.",
      },
      {
        name: "Waterdeep: Dungeon of the Mad Mage",
        code: "wdmm",
        description:
          "Adventurers delve into the mega-dungeon of Undermountain, filled with dungeons, monsters, and powerful artifacts.",
      },
      {
        name: "Ghosts of Saltmarsh",
        code: "gos",
        description:
          "This book brings together several classic adventures from previous editions updated for D&D 5th Edition, all set in the town of Saltmarsh.",
      },
      {
        name: "Baldur's Gate: Descent into Avernus",
        code: "bgda",
        description:
          "Characters begin in the city of Baldur's Gate and find themselves drawn into a dramatic story that spans the planes.",
      },
    ],
    tags: ["dnd", "classic", "tabletop", "fantasy", "roleplaying"],
    imageAIPromptPrefixes: ["fantasy", "medieval", "dungeons and dragons"],
    customAttributes: [
      {
        name: "race",
        values: [
          "Human",
          "Elf",
          "Half-Elf",
          "Dwarf",
          "Halfling",
          "Gnome",
          "Half-Orc",
          "Dragonborn",
          "Tiefling",
        ],
      },
      {
        name: "originLocation",
        values: [
          "Faerun",
          "Eberron",
          "Greyhawk",
          "Dragonlance",
          "Ravenloft",
          "Forgotten Realms",
        ],
      },
      {
        name: "personality",
        values: [
          "Cheerful",
          "Grumpy",
          "Angry",
          "Sad",
          "Happy",
          "Excited",
          "Bored",
          "Calm",
          "Anxious",
        ],
      },
      {
        name: "factions",
        values: [
          "Thieves' Guild",
          "Warrior's Guild",
          "Mages' Guild",
          "Assassin's Guild",
          "Merchant's Guild",
          "Temple of the Gods",
          "Cult of the Dragon",
          "Harpers",
          "Order of the Gauntlet",
          "Emerald Enclave",
          "Lords' Alliance",
          "Zhentarim",
          "Red Wizards of Thay",
          "Bregan D'aerthe",
          "The Kraken Society",
        ],
      },
      {
        name: "languages",
        values: [
          "Common",
          "Dwarvish",
          "Elvish",
          "Giant",
          "Gnomish",
          "Goblin",
          "Halfling",
          "Orc",
          "Abyssal",
          "Celestial",
          "Draconic",
          "Deep Speech",
          "Infernal",
          "Primordial",
          "Sylvan",
          "Undercommon",
        ],
      },
      {
        name: "familialStatus",
        values: ["Nobility", "Commoner", "Merchant", "Criminal", "Orphan"],
      },
      {
        name: "hobbies",
        values: [
          "Reading",
          "Writing",
          "Painting",
          "Sculpting",
          "Singing",
          "Dancing",
          "Playing an instrument",
          "Cooking",
          "Baking",
          "Gardening",
          "Fishing",
          "Hunting",
          "Woodworking",
          "Leatherworking",
          "Blacksmithing",
          "Armorsmithing",
          "Jewelcrafting",
          "Alchemy",
          "Brewing",
          "Carpentry",
          "Masonry",
          "Mining",
          "Tailoring",
          "Farming",
          "Animal husbandry",
          "Animal training",
          "Falconry",
          "Horseback riding",
          "Archery",
          "Fencing",
          "Wrestling",
          "Boxing",
          "Jousting",
          "Heraldry",
          "Calligraphy",
          "Cartography",
          "Gambling",
          "Sewing",
          "Embroidery",
          "Knitting",
          "Crocheting",
          "Weaving",
          "Spinning",
          "Pottery",
          "Glassblowing",
          "Candlemaking",
          "Cobbling",
          "Lockpicking",
        ],
      },
      {
        name: "talents",
        values: [
          "Acrobatics",
          "Animal Handling",
          "Arcana",
          "Athletics",
          "Deception",
          "History",
          "Insight",
          "Intimidation",
          "Investigation",
          "Medicine",
          "Nature",
          "Perception",
          "Performance",
          "Persuasion",
          "Religion",
          "Sleight of Hand",
          "Stealth",
          "Survival",
        ],
      },
    ],
  },
  {
    name: "Pathfinder",
    code: "pathfinder",
    versions: ["1st Edition", "2nd Edition"],
    imageUri: "pathfinder.jpg",
    releaseDate: "2009-08-01",
    relevance: 80,
    publicAdventures: [
      {
        name: "Other",
        code: "other",
        description: "An adventure not listed here.",
      },
      {
        name: "Rise of the Runelords",
        code: "ror",
        description:
          "The town of Sandpoint needs heroes to investigate the strange happenings in the nearby wilderness and stop an ancient evil from returning.",
      },
      {
        name: "Curse of the Crimson Throne",
        code: "cotct",
        description:
          "The city of Korvosa is in turmoil and the queen's rule is both harsh and seemingly ill-fated. The heroes must navigate city politics and dark magic to survive.",
      },
      {
        name: "Kingmaker",
        code: "km",
        description:
          "The adventurers carve their own nation out of the wilderness, exploring, claiming and defending territory against rivals and monstrous inhabitants.",
      },
      {
        name: "Carrion Crown",
        code: "cc",
        description:
          "A tale of horror where heroes face gothic beasts such as werewolves, vampires, and ghouls as they investigate a series of dark happenings.",
      },
      {
        name: "Iron Gods",
        code: "ig",
        description:
          "In Numeria, land of savagery and super science, adventurers explore the strange and alien landscape, braving the Iron Gods' ruins and surviving their unearthly machines.",
      },
      {
        name: "Wrath of the Righteous",
        code: "wotr",
        description:
          "An adventure through the Worldwound to fight against the demonic hordes, using the power of the mythic rules to take on incredible foes.",
      },
      {
        name: "Reign of Winter",
        code: "row",
        description:
          "The winter-touched land of Irrisen, where a cruel witch-queen rules, beckons heroes to stop a new ice age from engulfing the world.",
      },
      {
        name: "Skull and Shackles",
        code: "sas",
        description:
          "Pirates and sea battles abound in this swashbuckling adventure. The players strive to become infamous pirates themselves.",
      },
      {
        name: "Shattered Star",
        code: "ss",
        description:
          "The heroes gather seven ancient Thassilonian artifacts to combat a new threat rising in the land of Varisia.",
      },
      {
        name: "Jade Regent",
        code: "jr",
        description:
          "This journey takes the adventurers from their home in Varisia on a long trek to the far-off land of Tian Xia, on the trail of an ancient and mysterious artifact.",
      },
    ],
    tags: ["pathfinder", "d20", "tabletop", "fantasy", "roleplaying"],
  },
  // {
  //   name: "Shadowrun",
  //   code: "shadowrun",
  //   versions: [
  //     "1st Edition",
  //     "2nd Edition",
  //     "3rd Edition",
  //     "4th Edition",
  //     "5th Edition",
  //     "6th Edition",
  //   ],
  //   releaseDate: "1989-01-01",
  //   relevance: 3,
  //   tags: ["shadowrun", "cyberpunk", "fantasy", "tabletop", "roleplaying"],
  // },
  // {
  //   name: "Warhammer Fantasy Roleplay",
  //   code: "warhammer",
  //   versions: ["1st Edition", "2nd Edition", "3rd Edition", "4th Edition"],
  //   releaseDate: "1986-01-01",
  //   relevance: 3,
  //   tags: ["warhammer", "fantasy", "tabletop", "roleplaying"],
  // },
  // {
  //   name: "Call of Cthulhu",
  //   code: "cthulhu",
  //   versions: [
  //     "1st Edition",
  //     "2nd Edition",
  //     "3rd Edition",
  //     "4th Edition",
  //     "5th Edition",
  //     "6th Edition",
  //     "7th Edition",
  //   ],
  //   releaseDate: "1981-01-01",
  //   relevance: 75,
  //   tags: ["cthulhu", "horror", "tabletop", "roleplaying"],
  // },
  // {
  //   name: "Star Wars Roleplaying Game",
  //   code: "starwars",
  //   versions: [
  //     "West End Games Edition",
  //     "Wizards of the Coast Edition",
  //     "Fantasy Flight Games Edition",
  //   ],
  //   releaseDate: "1987-01-01",
  //   relevance: 5,
  //   tags: ["star wars", "sci-fi", "tabletop", "roleplaying"],
  // },
  // {
  //   name: "Cyberpunk",
  //   code: "cyberpunk",
  //   versions: [
  //     "Cyberpunk 2013",
  //     "Cyberpunk 2020",
  //     "Cyberpunk V3.0",
  //     "Cyberpunk Red",
  //   ],
  //   releaseDate: "1988-01-01",
  //   relevance: 65,
  //   tags: ["cyberpunk", "sci-fi", "tabletop", "roleplaying"],
  // },
  // {
  //   name: "World of Darkness",
  //   code: "worldofdarkness",
  //   versions: [
  //     "Old World of Darkness",
  //     "New World of Darkness",
  //     "Chronicles of Darkness",
  //   ],
  //   releaseDate: "1991-01-01",
  //   relevance: 60,
  //   tags: ["world of darkness", "horror", "tabletop", "roleplaying"],
  // },
  // {
  //   name: "Vampire: The Masquerade",
  //   code: "vampire",
  //   versions: [
  //     "1st Edition",
  //     "2nd Edition",
  //     "3rd Edition",
  //     "Revised Edition",
  //     "20th Anniversary Edition",
  //     "5th Edition",
  //   ],
  //   releaseDate: "1991-01-01",
  //   relevance: 50,
  //   tags: [
  //     "vampire",
  //     "masquerade",
  //     "world of darkness",
  //     "tabletop",
  //     "roleplaying",
  //   ],
  // },
  // {
  //   name: "Savage Worlds",
  //   code: "savageworlds",
  //   versions: ["Explorers Edition", "Deluxe Edition", "Adventure Edition"],
  //   releaseDate: "2007-08-15",
  //   relevance: 60,
  //   tags: ["savage worlds", "tabletop", "roleplaying", "universal"],
  // },
  // {
  //   name: "GURPS",
  //   code: "gurps",
  //   versions: ["1st Edition", "2nd Edition", "3rd Edition", "4th Edition"],
  //   releaseDate: "1986-01-01",
  //   relevance: 50,
  //   tags: ["GURPS", "tabletop", "roleplaying", "universal"],
  // },
  // {
  //   name: "FATE",
  //   code: "fate",
  //   versions: [
  //     "FATE Accelerated Edition",
  //     "FATE Core System",
  //     "FATE System Toolkit",
  //     "FATE Worlds",
  //     "FATE Condensed",
  //   ],
  //   releaseDate: "2013-01-01",
  //   relevance: 33,
  //   tags: ["FATE", "tabletop", "roleplaying", "universal"],
  // },
  // {
  //   name: "Homebrew",
  //   code: "homebrew",
  //   versions: [],
  //   relevance: 80,
  //   tags: ["homebrew", "tabletop", "roleplaying", "custom"],
  // },
  {
    name: "Other",
    code: "other",
    versions: [],
    relevance: 1,
    tags: ["other", "tabletop", "roleplaying"],
  },
];

export default rpgSystems;
