import { extractTrackingInfo } from "./tracking";
import { NextFunction, Request, Response } from "express";
import { Logger } from "tslog";
const logger = new Logger();

export const useInjectTrackingInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const trackingInfo = extractTrackingInfo(req);

  logger.info("Injecting tracking info ", trackingInfo);
  res.locals.trackingInfo = trackingInfo;

  next();
};
