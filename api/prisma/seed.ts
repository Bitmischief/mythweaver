import {prisma} from '../lib/providers/prisma';
import {statSheets} from "./statSheets.seed";
import {randomPersonas} from "./personas.seed";

const users = [
  {
    email: 'azurfluh@bitmischief.io',
  },
];

const characters = [
  {
    id: 1,
    name: 'Muad\'Dib',
  },
];

(async () => {
  for(let user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
      },
    });
  }

  for(let character of characters) {
    await prisma.character.upsert({
      where: { id: character.id },
      update: {},
      create: {
        ...character,
      },
    });
  }

  for (let randomPersona of randomPersonas) {
    await prisma.randomPersona.upsert({
      where: { name: randomPersona.name },
      update: {},
      create: randomPersona,
    });
  }

  for (let statSheet of statSheets) {
    await prisma.dnd5eRandomStatSheet.upsert({
      where: {
        class_level_strength_dexterity_constitution_intelligence_wisdom_charisma_hitPoints_armorClass_speed: {
          class: statSheet.class,
          level: statSheet.level,
          strength: statSheet.strength,
          dexterity: statSheet.dexterity,
          constitution: statSheet.constitution,
          intelligence: statSheet.intelligence,
          wisdom: statSheet.wisdom,
          charisma: statSheet.charisma,
          hitPoints: statSheet.hitPoints,
          armorClass: statSheet.armorClass,
          speed: statSheet.speed,
        }
      },
      update: {},
      create: {
        ...statSheet,
        spells: {
          createMany: {
            data: statSheet.spells,
            skipDuplicates: true,
          }
        },
        spellSlots: {
          createMany: {
            data: statSheet.spellSlots,
            skipDuplicates: true,
          }
        },
        languages: {
          createMany: {
            data: statSheet.languages,
            skipDuplicates: true,
          }
        },
        proficiencies: {
          createMany: {
            data: statSheet.proficiencies,
            skipDuplicates: true,
          }
        },
      },
      include: {
        spells: true,
        spellSlots: true,
        languages: true,
        proficiencies: true,
      }
    })
  }
})();