import { UsersDataProvider } from '../users/users.dataprovider';
import { UserTokensDataProvider } from '../userTokens/userTokens.dataprovider';
import { User, UserToken, TokenType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class IntegrationsService {
  constructor(
    private usersDataProvider: UsersDataProvider,
    private userTokensDataProvider: UserTokensDataProvider,
  ) {}

  async updateDiscordHandle(userId: number, discordHandle: string | null) {
    await this.usersDataProvider.updateUser(userId, {
      discordHandle,
    });
  }

  async getUserByDiscordHandle(discordHandle: string): Promise<User | null> {
    return await this.usersDataProvider.getUserByDiscordHandle(discordHandle);
  }

  async getUserTokenForDiscordUser(userId: number): Promise<UserToken | null> {
    return await this.userTokensDataProvider.getUserTokenForUser(
      userId,
      TokenType.DISCORD,
    );
  }

  async createUserTokenForDiscordUser(userId: number): Promise<UserToken> {
    return await this.userTokensDataProvider.createUserTokenForUser({
      userId: userId,
      type: TokenType.DISCORD,
      token: this.generateToken(),
    });
  }

  private generateToken(): string {
    const uuid = uuidv4();
    return Buffer.from(uuid).toString('base64');
  }
}
