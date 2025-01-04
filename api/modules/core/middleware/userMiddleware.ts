import { NextFunction, Request, Response } from 'express';
import { useLogger } from '@/modules/core/logging/loggingMiddleware';
import { jwtDecode } from 'jwt-decode';
import { prisma } from '@/providers/prisma';
import { UsersService } from '@/modules/users/users.service';

export const useInjectUserId = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const logger = useLogger();

    if (!req.container) {
      logger.error('Container not found');
      return next();
    }

    const usersService = req.container.resolve<UsersService>('usersService');

    if (res.locals.auth?.email) {
      logger.info('Auth context already injected');
      return next();
    }

    if (!req.auth?.token) {
      return next();
    }

    const token = req.auth?.token || '';
    const jwt = jwtDecode(token) as any;

    if (!jwt.email) {
      return res.status(401).send();
    }

    let user = await prisma.user.findUnique({
      where: {
        email: jwt.email,
      },
    });

    if (!user) {
      user = await usersService.createNewUser(jwt.email);
    }

    res.locals.auth = {
      userId: user.id,
      email: jwt.email,
      user: user,
    };

    return next();
  };
};
