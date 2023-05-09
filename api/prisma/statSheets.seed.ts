export const statSheets = [
  {
    class: 'Paladin',
    level: 3,
    strength: 16,
    dexterity: 10,
    constitution: 14,
    intelligence: 8,
    wisdom: 12,
    charisma: 16,
    hitPoints: 32,
    armorClass: 18,
    speed: 30,

    spellSlots: [
      {
        level: 1,
        count: 2,
      },
      {
        level: 2,
        count: 0,
      },
      {
        level: 3,
        count: 0,
      },
      {
        level: 4,
        count: 0,
      },
    ],
    proficiencies: [
      {
        proficiency: 'Athletics',
      },
      {
        proficiency: 'Insight',
      },
      {
        proficiency: 'Intimidation',
      },
      {
        proficiency: 'Religion',
      },
    ],
    languages: [
      {
        language: 'Common',
      },
      {
        language: 'Dwarvish',
      },
    ],
    spells: [],
  },
  {
    class: 'Barbarian',
    level: 5,
    strength: 20,
    dexterity: 12,
    constitution: 18,
    intelligence: 8,
    wisdom: 10,
    charisma: 14,
    hitPoints: 70,
    armorClass: 16,
    speed: 40,

    spellSlots: [],
    proficiencies: [
      {
        proficiency: 'Animal Handling',
      },
      {
        proficiency: 'Athletics',
      },
      {
        proficiency: 'Intimidation',
      },
      {
        proficiency: 'Survival',
      },
    ],
    languages: [
      {
        language: 'Common',
      },
      {
        language: 'Orc',
      },
    ],
    spells: [],
  },
  {
    class: 'Ranger',
    level: 2,
    strength: 14,
    dexterity: 16,
    constitution: 12,
    intelligence: 10,
    wisdom: 14,
    charisma: 8,
    hitPoints: 18,
    armorClass: 14,
    speed: 35,

    spellSlots: [
      {
        level: 1,
        count: 2,
      },
    ],
    proficiencies: [
      {
        proficiency: 'Animal Handling',
      },
      {
        proficiency: 'Nature',
      },
      {
        proficiency: 'Perception',
      },
      {
        proficiency: 'Survival',
      },
    ],
    languages: [
      {
        language: 'Common',
      },
      {
        language: 'Elvish',
      },
    ],
    spells: [
      {
        name: 'Hunter\'s Mark',
        savingThrowAmount: 0,
        savingThrowAttribute: '',
      }
    ],
  },
  {
    class: 'Bard',
    level: 4,
    strength: 10,
    dexterity: 14,
    constitution: 12,
    intelligence: 16,
    wisdom: 10,
    charisma: 18,
    hitPoints: 32,
    armorClass: 14,
    speed: 30,

    spellSlots: [
      {
        level: 1,
        count: 3,
      },
      {
        level: 2,
        count: 2,
      },
      {
        level: 3,
        count: 0,
      },
      {
        level: 4,
        count: 0,
      },
    ],
    proficiencies: [
      {
        proficiency: 'Deception',
      },
      {
        proficiency: 'Insight',
      },
      {
        proficiency: 'Performance',
      },
      {
        proficiency: 'Persuasion',
      },
    ],
    languages: [
      {
        language: 'Common',
      },
      {
        language: 'Elvish',
      },
    ],
    spells: [
      {
        name: 'Cure Wounds',
        savingThrowAmount: 0,
        savingThrowAttribute: '',
      },
      {
        name: 'Dissonant Whispers',
        savingThrowAmount: 0,
        savingThrowAttribute: '',
      },
      {
        name: 'Thunderwave',
        savingThrowAmount: 0,
        savingThrowAttribute: '',
      },
      {
        name: 'Vicious Mockery',
        savingThrowAmount: 0,
        savingThrowAttribute: '',
      },
    ],
  },
  {
    class: 'Monk',
    level: 6,
    strength: 12,
    dexterity: 18,
    constitution: 14,
    intelligence: 10,
    wisdom: 16,
    charisma: 8,
    hitPoints: 60,
    armorClass: 18,
    speed: 45,

    spellSlots: [],
    proficiencies: [
      {
        proficiency: 'Acrobatics',
      },
      {
        proficiency: 'Athletics',
      },
      {
        proficiency: 'Perception',
      },
      {
        proficiency: 'Stealth',
      },
    ],
    languages: [
      {
        language: 'Common',
      },
      {
        language: 'Draconic',
      },
    ],
    spells: [],
  },
  {
    class: 'Fighter',
    level: 8,
    strength: 20,
    dexterity: 12,
    constitution: 18,
    intelligence: 8,
    wisdom: 10,
    charisma: 14,
    hitPoints: 90,
    armorClass: 20,
    speed: 40,

    spellSlots: [],
    proficiencies: [
      {
        proficiency: 'Athletics',
      },
      {
        proficiency: 'Intimidation',
      },
      {
        proficiency: 'Perception',
      },
      {
        proficiency: 'Survival',
      },
    ],
    languages: [
      {
        language: 'Common',
      },
      {
        language: 'Giant',
      },
    ],
    spells: [],
  },
  {
    class: 'Rogue',
    level: 5,
    strength: 12,
    dexterity: 20,
    constitution: 14,
    intelligence: 10,
    wisdom: 16,
    charisma: 8,
    hitPoints: 45,
    armorClass: 16,
    speed: 35,

    spellSlots: [],
    proficiencies: [
      {
        proficiency: 'Acrobatics',
      },
      {
        proficiency: 'Deception',
      },
      {
        proficiency: 'Perception',
      },
      {
        proficiency: 'Sleight of Hand',
      },
    ],
    languages: [
      {
        language: 'Common',
      },
      {
        language: 'Thieves\' Cant',
      },
    ],
    spells: [],
  },
  {
    class: 'Sorcerer',
    level: 17,
    strength: 10,
    dexterity: 14,
    constitution: 16,
    intelligence: 18,
    wisdom: 12,
    charisma: 24,
    hitPoints: 142,
    armorClass: 18,
    speed: 30,

    spellSlots: [
      {
        level: 1,
        count: 4,
      },
      {
        level: 2,
        count: 3,
      },
      {
        level: 3,
        count: 3,
      },
      {
        level: 4,
        count: 3,
      },
      {
        level: 5,
        count: 3,
      },
      {
        level: 6,
        count: 3,
      },
      {
        level: 7,
        count: 2,
      },
      {
        level: 8,
        count: 1,
      },
      {
        level: 9,
        count: 1,
      },
    ],
    proficiencies: [
      {
        proficiency: 'Arcana',
      },
      {
        proficiency: 'Deception',
      },
      {
        proficiency: 'Insight',
      },
      {
        proficiency: 'Persuasion',
      },
    ],
    languages: [
      {
        language: 'Common',
      },
      {
        language: 'Draconic',
      },
      {
        language: 'Abyssal',
      },
      {
        language: 'Celestial',
      },
      {
        language: 'Infernal',
      },
    ],
    spells: [
      {
        name: 'Fireball',
        savingThrowAmount: 8,
        savingThrowAttribute: 'Dexterity',
      },
      {
        name: 'Lightning Bolt',
        savingThrowAmount: 8,
        savingThrowAttribute: 'Dexterity',
      },
      {
        name: 'Meteor Swarm',
        savingThrowAmount: 8,
        savingThrowAttribute: 'Dexterity',
      },
      {
        name: 'Time Stop',
        savingThrowAmount: 0,
        savingThrowAttribute: '',
      },
      {
        name: 'Wish',
        savingThrowAmount: 0,
        savingThrowAttribute: '',
      },
    ],
  },
  {
    class: 'Warlock',
    level: 19,
    strength: 12,
    dexterity: 16,
    constitution: 18,
    intelligence: 14,
    wisdom: 10,
    charisma: 24,
    hitPoints: 209,
    armorClass: 20,
    speed: 30,

    spellSlots: [
      {
        level: 1,
        count: 4,
      },
      {
        level: 2,
        count: 3,
      },
      {
        level: 3,
        count: 3,
      },
      {
        level: 4,
        count: 3,
      },
      {
        level: 5,
        count: 3,
      },
      {
        level: 6,
        count: 2,
      },
      {
        level: 7,
        count: 1,
      },
      {
        level: 8,
        count: 1,
      },
      {
        level: 9,
        count: 1,
      },
    ],
    proficiencies: [
      {
        proficiency: 'Arcana',
      },
      {
        proficiency: 'Deception',
      },
      {
        proficiency: 'Intimidation',
      },
      {
        proficiency: 'Persuasion',
      },
    ],
    languages: [
      {
        language: 'Common',
      },
      {
        language: 'Infernal',
      },
    ],
    spells: [
      {
        name: 'Eldritch Blast',
        savingThrowAmount: 0,
        savingThrowAttribute: '',
      },
      {
        name: 'Armor of Agathys',
        savingThrowAmount: 0,
        savingThrowAttribute: '',
      },
      {
        name: 'Hunger of Hadar',
        savingThrowAmount: 0,
        savingThrowAttribute: '',
      },
      {
        name: 'Mass Suggestion',
        savingThrowAmount: 8,
        savingThrowAttribute: 'Wisdom',
      },
      {
        name: 'Power Word Kill',
        savingThrowAmount: 0,
        savingThrowAttribute: '',
      },
    ],
  },
  {
    id: 14,
    createdAt: new Date(),
    updatedAt: new Date(),
    class: 'Paladin',
    level: 16,
    strength: 22,
    dexterity: 14,
    constitution: 20,
    intelligence: 10,
    wisdom: 16,
    charisma: 24,
    hitPoints: 190,
    armorClass: 21,
    speed: 30,

    spellSlots: [
      {
        level: 1,
        count: 4,
      },
      {
        level: 2,
        count: 3,
      },
      {
        level: 3,
        count: 3,
      },
      {
        level: 4,
        count: 3,
      },
      {
        level: 5,
        count: 2,
      },
      {
        level: 6,
        count: 1,
      },
      {
        level: 7,
        count: 1,
      },
      {
        level: 8,
        count: 1,
      },
      {
        level: 9,
        count: 1,
      },
    ],
    proficiencies: [
      {
        proficiency: 'Athletics',
      },
      {
        proficiency: 'Intimidation',
      },
      {
        proficiency: 'Medicine',
      },
      {
        proficiency: 'Religion',
      },
    ],
    languages: [
      {
        language: 'Common',
      },
      {
        language: 'Celestial',
      },
    ],
    spells: [
      {
        name: 'Bless',
        savingThrowAmount: 0,
        savingThrowAttribute: '',
      },
      {
        name: 'Cure Wounds',
        savingThrowAmount: 0,
        savingThrowAttribute: '',
      },
      {
        name: 'Divine Favor',
        savingThrowAmount: 0,
        savingThrowAttribute: '',
      },
      {
        name: 'Shield of Faith',
        savingThrowAmount: 0,
        savingThrowAttribute: '',
      },
    ],
  },
];