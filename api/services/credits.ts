import { prisma } from '../lib/providers/prisma';
import { ImageCreditChangeType } from '@prisma/client';
import { setIntercomCustomAttributes } from '../lib/intercom';

export const modifyImageCreditCount = async (
  userId: number,
  changeQty: number,
  type: ImageCreditChangeType,
  comment?: string,
) => {
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

  await setIntercomCustomAttributes(userId, {
    'Credit Count': updatedUser.imageCredits,
  });
};
