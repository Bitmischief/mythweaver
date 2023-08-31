import { prisma } from "../lib/providers/prisma";

const users = [
  {
    id: 1,
    email: "austin@mythweaver.co",
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
})();
