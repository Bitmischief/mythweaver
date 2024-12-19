import { Inject } from 'tsoa';
import { MythWeaverLogger } from '@/modules/core/logging/logger';
import axios from 'axios';
import { IntegrationsService } from '@/modules/integrations/integrations.service';

export class IntegrationsController {
  constructor(
    private integrationsService: IntegrationsService,
    private logger: MythWeaverLogger,
  ) {}

  public async getDiscordConnectUrl(@Inject() userId: number) {
    this.logger.info('Generating Discord connect URL', { userId });
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    return {
      redirectUri: `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${process.env.DISCORD_REDIRECT_URI}&response_type=code&scope=identify&state=${state}`,
    };
  }

  public async handleDiscordCallback(
    @Inject() code: string,
    @Inject() state: string,
  ) {
    this.logger.info('Handling Discord callback', { code, state });

    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI!,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const { username: discordHandle } = userResponse.data;

    await this.integrationsService.updateDiscordHandle(userId, discordHandle);

    return `${process.env.APP_URL}/account-settings?tab=connections&discordConnected=true`;
  }

  public async disconnectDiscord(@Inject() userId: number) {
    this.logger.info('Disconnecting Discord account', { userId });

    await this.integrationsService.updateDiscordHandle(userId, null);

    this.logger.info('Successfully disconnected Discord account');
  }

  public async getUserTokenForDiscordHandle(@Inject() discordHandle: string) {
    this.logger.info('Getting user token for Discord handle', {
      discordHandle,
    });

    const user =
      await this.integrationsService.getUserByDiscordHandle(discordHandle);

    if (!user) {
      this.logger.info('User not found for Discord handle', { discordHandle });
      return null;
    }

    let userToken = await this.integrationsService.getUserTokenForDiscordUser(
      user.id,
    );

    if (!userToken) {
      this.logger.info('Token not found for user, creating new token', {
        userId: user.id,
      });
      userToken = await this.integrationsService.createUserTokenForDiscordUser(
        user.id,
      );
    }

    return {
      token: userToken.token,
      userId: user.id,
      discordHandle,
    };
  }
}
