import { prisma } from '../lib/providers/prisma';
import { ImageCreditChangeType } from '@prisma/client';
import { setIntercomCustomAttributes } from '../lib/intercom';
import { sendWebsocketMessage, WebSocketEvent } from '../services/websockets';

export class CreditsProvider {
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

    await sendWebsocketMessage(
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

export default new CreditsProvider();
