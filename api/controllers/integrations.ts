import { Inject } from 'tsoa';
import { prisma } from '../lib/providers/prisma';
import { MythWeaverLogger } from '../lib/logger';
import axios from 'axios';

export default class IntegrationsController {
  public async getDiscordConnectUrl(
    @Inject() userId: number,
    @Inject() logger: MythWeaverLogger
  ) {
    logger.info('Generating Discord connect URL', { userId });
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    return {
      redirectUri: `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${process.env.DISCORD_REDIRECT_URI}&response_type=code&scope=identify&state=${state}`
    };
  }

  public async handleDiscordCallback(
    @Inject() code: string,
    @Inject() state: string,
    @Inject() logger: MythWeaverLogger
  ) {
    logger.info('Handling Discord callback', { code, state });

    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
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
      }
    );

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const { username: discordHandle } = userResponse.data;

    await this.updateDiscordConnection(userId, logger, discordHandle);

    return `${process.env.APP_URL}/user/settings?discordConnected=true`;
  }

  public async updateDiscordConnection(
    userId: number,
    logger: MythWeaverLogger,
    discordHandle: string,
  ) {
    logger.info('Updating Discord connection', { userId, discordHandle });

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        discordHandle,
      }
    });

    logger.info('Successfully updated Discord handle');
  }
}