import { prisma } from '../../lib/providers/prisma';
import { User } from '@prisma/client';
import { Prisma } from '@prisma/client';

export class UsersDataProvider {
  async getUserById(userId: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await prisma.user.findFirst({
      where: {
        username,
      },
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findFirst({
      where: {
        email,
      },
    });
  }

  async getUserByDiscordHandle(discordHandle: string): Promise<User | null> {
    return await prisma.user.findFirst({
      where: {
        discordHandle,
      },
    });
  }

  async getCampaignUser(
    userId: number,
    campaignId: number,
  ): Promise<Prisma.UserGetPayload<{
    include: { campaignMemberships: true };
  }> | null> {
    return await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        campaignMemberships: {
          where: {
            campaignId,
          },
        },
      },
    });
  }

  async updateUser(userId: number, data: any): Promise<User> {
    return await prisma.user.update({
      where: {
        id: userId,
      },
      data,
    });
  }
}
