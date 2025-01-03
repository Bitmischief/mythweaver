import { useInjectLoggingInfo } from '@/modules/core/logging/loggingMiddleware';
import { checkAuth0Jwt } from '@/modules/core/middleware/auth0';
import { useInjectUserId } from '@/modules/core/middleware/userMiddleware';
import { EmailProvider, EmailTemplates } from '@/providers/emailProvider';
import express, { Request, Response } from 'express';

const router = express.Router({ mergeParams: true });

router.post('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  async (req: Request, res: Response) => {
    const emailProvider = req.container.resolve<EmailProvider>('emailProvider');
    const { type, description } = req.body;

    await emailProvider.sendTransactionalEmail(
      'support@mythweaver.co',
      EmailTemplates.SUPPORT_REQUEST,
      [
        { key: 'SUPPORT_TYPE', value: type },
        { key: 'DESCRIPTION', value: description },
        { key: 'USER_EMAIL', value: res.locals.auth.email },
      ],
    );
    return res.status(200).send({ message: 'Support request submitted' });
  },
]);

export default router;
