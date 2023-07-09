import { prisma } from "../lib/providers/prisma";

const users = [
  {
    id: 1,
    email: "azurfluh@bitmischief.io",
  },
];

const characters = [
  {
    id: 1,
    name: "Muad'Dib",
    userId: 1,
    looks: "",
    personality: "",
    background: "",
  },
];

(async () => {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user,
    });
  }

  for (const character of characters) {
    await prisma.character.upsert({
      where: { id: character.id },
      update: character,
      create: character,
    });
  }
})();
