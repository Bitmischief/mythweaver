import { TokenType, UserToken } from '@prisma/client';
import { prisma } from '@/providers/prisma';

export class UserTokensDataProvider {
  async getUserTokenForUser(
    userId: number,
    type: TokenType,
  ): Promise<UserToken | null> {
    return await prisma.userToken.findFirst({
      where: {
        userId,
        type,
      },
    });
  }

  async createUserTokenForUser(data: any): Promise<UserToken> {
    return await prisma.userToken.create({
      data,
    });
  }
}
