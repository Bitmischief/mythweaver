import { prisma } from '@/lib/providers/prisma';
import { ImageCreditChangeType } from '@prisma/client';
import { setIntercomCustomAttributes } from '@/lib/intercom';
import {
  WebSocketEvent,
  WebSocketProvider,
} from '@/providers/websocketProvider';

export class CreditsProvider {
  constructor(private webSocketProvider: WebSocketProvider) {}

  async modifyImageCreditCount(
    userId: number,
    changeQty: number,
    type: ImageCreditChangeType,
    comment?: string,
  ): Promise<number> {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        imageCredits: {
          increment: changeQty,
        },
      },
    });

    await prisma.imageCreditAuditLog.create({
      data: {
        userId: userId,
        quantity: changeQty,
        type,
        comment,
      },
    });

    await this.webSocketProvider.sendMessage(
      userId,
      WebSocketEvent.UserImageCreditCountUpdated,
      updatedUser.imageCredits,
    );

    await setIntercomCustomAttributes(userId, {
      'Credit Count': updatedUser.imageCredits,
    });

    return updatedUser.imageCredits;
  }
}
