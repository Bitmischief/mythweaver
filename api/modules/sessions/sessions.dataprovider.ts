import { prisma } from '../../lib/providers/prisma';
import { Prisma, Session, SessionTranscription } from '@prisma/client';

export class SessionsDataProvider {
  async getSessions(
    userId: number,
    campaignId: number,
    offset?: number,
    limit?: number,
    search?: string,
    archived = false,
  ): Promise<Session[]> {
    return await prisma.session.findMany({
      where: {
        campaignId,
        archived,
        name: {
          search: search,
        },
        campaign: {
          members: {
            some: {
              userId: userId,
            },
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: {
        date: 'desc',
      },
      include: {
        images: {
          where: {
            primary: true,
          },
        },
      },
    });
  }

  async getSession(
    userId: number,
    sessionId: number,
  ): Promise<Prisma.SessionGetPayload<{
    include: { sessionTranscription: true; images: true };
  }> | null> {
    return await prisma.session.findUnique({
      where: {
        id: sessionId,
        campaign: {
          members: {
            some: {
              userId: userId,
            },
          },
        },
      },
      include: {
        sessionTranscription: true,
        images: {
          where: {
            primary: true,
          },
        },
      },
    });
  }

  async createSession(data: any): Promise<Session> {
    return await prisma.session.create({
      data: data,
    });
  }

  async updateSession(sessionId: number, data: any): Promise<Session> {
    return await prisma.session.update({
      where: { id: sessionId },
      data: data,
    });
  }

  async deleteSession(sessionId: number): Promise<void> {
    await prisma.session.delete({
      where: { id: sessionId },
    });
  }

  async getSessionTranscription(
    sessionId: number,
  ): Promise<SessionTranscription | null> {
    return await prisma.sessionTranscription.findUnique({
      where: {
        sessionId,
      },
    });
  }

  async deleteSessionTranscription(sessionId: number): Promise<void> {
    await prisma.sessionTranscription.delete({
      where: {
        sessionId,
      },
    });
  }
}