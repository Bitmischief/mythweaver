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
    name: 'Muad\'Dib',
    prompt: 'Assume the role of Paul Muad\'Dib from the Frank Herbert book Dune, please respond to me as if you were him',
  },
];

(async () => {
  for(let user of users) {
    await prisma.user.create({
      data: {...user},
    });
  }

  for(let character of characters) {
    await prisma.character.create({
      data: character,
    });
  }

  for (let randomPersona of randomPersonas) {
    await prisma.randomPersona.create({
      data: randomPersona,
    });
  }

  for (let statSheet of statSheets) {
    await prisma.dnd5eRandomStatSheet.create({
      data: {
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