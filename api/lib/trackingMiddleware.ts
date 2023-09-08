import { extractTrackingInfo } from './tracking';
import { NextFunction, Request, Response } from 'express';

export const useInjectTrackingInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.locals.trackingInfo = extractTrackingInfo(req);

  next();
};
