import { prisma } from '../lib/providers/prisma';
import { createCustomer } from '../services/billing';

(async () => {
  const email = process.env.LOCAL_DEV_USER_EMAIL || 'austin@mythweaver.co';

  const users = [
    {
      id: 1,
      email,
      username: 'bitmischief',
      billingCustomerId: await createCustomer(email),
    },
  ];

  const imageModels = [
    {
      id: 1,
      createdAt: new Date('2024-05-17T16:32:09.288Z'),
      updatedAt: new Date('2024-05-17T16:32:09.288Z'),
      description: 'MythWeaver v1',
      strengths: ['Items', 'NPCs', 'Locations'],
      sampleImageUris: [
        'https://assets.mythweaver.co/0c288104-be5f-412c-a509-104f65a5fe1e.png',
        'https://assets.mythweaver.co/d67b9780-b8ff-42b3-92fe-4268b90d33f1.png',
        'https://assets.mythweaver.co/9b67f3be-2e27-4632-bda3-86d51c564551.png',
      ],
      licensedArt: false,
      stableDiffusionApiModel: true,
      defaultSteps: 70,
      default: false,
      paysRoyalties: false,
    },
    {
      id: 2,
      createdAt: new Date('2024-05-09T00:31:48.937Z'),
      updatedAt: new Date('2024-05-09T00:31:48.937Z'),
      description: 'MythWeaver v2',
      strengths: ['Items', 'NPCs', 'Locations'],
      promptPrefix:
        'colorful, bright, high fantasy, ethereal, a digital painting of',
      sampleImageUris: [
        'https://assets.mythweaver.co/0b5a74eb-56cf-48d1-a12d-b8f498d9566e.png',
        'https://assets.mythweaver.co/87800f32-b9fe-4d5c-8499-0c4416972cf5.png',
        'https://assets.mythweaver.co/0ef39e56-d3b6-48f0-97ee-4f481068e98a.png',
      ],
      executionUri:
        'https://bitmischief-development--mythweaver-image-generation-mod-8a3ed8.modal.run',
      licensedArt: true,
      stableDiffusionApiModel: false,
      defaultSteps: 70,
      default: true,
      paysRoyalties: false,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user,
    });

    for (const imageModel of imageModels) {
      await prisma.imageModel.upsert({
        where: { id: imageModel.id },
        update: imageModel,
        create: imageModel,
      });
    }
  }
})();
