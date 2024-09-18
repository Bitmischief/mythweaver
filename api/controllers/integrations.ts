import { Inject } from 'tsoa';
import { prisma } from '../lib/providers/prisma';
import { MythWeaverLogger } from '../lib/logger';
import axios from 'axios';
import { TokenType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export default class IntegrationsController {
  public async getDiscordConnectUrl(
    @Inject() userId: number,
    @Inject() logger: MythWeaverLogger,
  ) {
    logger.info('Generating Discord connect URL', { userId });
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    return {
      redirectUri: `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${process.env.DISCORD_REDIRECT_URI}&response_type=code&scope=identify&state=${state}`,
    };
  }

  public async handleDiscordCallback(
    @Inject() code: string,
    @Inject() state: string,
    @Inject() logger: MythWeaverLogger,
  ) {
    logger.info('Handling Discord callback', { code, state });

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

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        discordHandle,
      },
    });

    return `${process.env.APP_URL}/account-settings?tab=connections&discordConnected=true`;
  }

  public async disconnectDiscord(
    @Inject() userId: number,
    @Inject() logger: MythWeaverLogger,
  ) {
    logger.info('Disconnecting Discord account', { userId });

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        discordHandle: null,
      },
    });

    logger.info('Successfully disconnected Discord account');
  }

  public async getUserTokenForDiscordHandle(
    @Inject() discordHandle: string,
    @Inject() logger: MythWeaverLogger,
  ) {
    logger.info('Getting user token for Discord handle', { discordHandle });

    const user = await prisma.user.findFirst({
      where: {
        discordHandle: discordHandle,
      },
    });

    if (!user) {
      logger.info('User not found for Discord handle', { discordHandle });
      return null;
    }

    let userToken = await prisma.userToken.findFirst({
      where: {
        userId: user.id,
        type: TokenType.DISCORD,
      },
    });

    if (!userToken) {
      logger.info('Token not found for user, creating new token', {
        userId: user.id,
      });
      userToken = await prisma.userToken.create({
        data: {
          userId: user.id,
          type: TokenType.DISCORD,
          token: this.generateToken(), // Implement this method to generate a unique token
        },
      });
    }

    return {
      token: userToken.token,
      userId: user.id,
      discordHandle,
    };
  }

  private generateToken(): string {
    const uuid = uuidv4();
    return Buffer.from(uuid).toString('base64');
  }
}
