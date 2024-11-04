import { prisma } from '../../lib/providers/prisma';
import { ConjurationRequest } from '@prisma/client';

export class GeneratorsDataProvider {
  async createConjurationRequest(data: any): Promise<ConjurationRequest> {
    return prisma.conjurationRequest.create({
      data,
    });
  }

  async getConjurationRequest(
    userId: number,
    conjurationRequestId: number,
  ): Promise<any> {
    return prisma.conjurationRequest.findUnique({
      where: {
        id: conjurationRequestId,
        userId,
      },
      include: {
        conjurations: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }
}
