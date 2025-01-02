import { checkAuth0Jwt } from '../lib/authMiddleware';
import { useInjectUserId } from '../lib/authMiddleware';
import { useInjectLoggingInfo } from '../lib/loggingMiddleware';
import {
  EmailTemplates,
  sendTransactionalEmail,
} from '../services/internal/email';
import express, { Request, Response } from 'express';

const router = express.Router({ mergeParams: true });

router.post('/', [
  checkAuth0Jwt,
  useInjectUserId(),
  useInjectLoggingInfo(),
  async (req: Request, res: Response) => {
    const { type, description } = req.body;
    sendTransactionalEmail(
      'support@mythweaver.co',
      EmailTemplates.SUPPORT_REQUEST,
      [
        { key: 'SUPPORT_TYPE ', value: type },
        { key: 'DESCRIPTION', value: description },
        { key: 'USER_EMAIL', value: res.locals.auth.email },
      ],
    );
    return res.status(200).send({ message: 'Support request submitted' });
  },
]);

export default router;
