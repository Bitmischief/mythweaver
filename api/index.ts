import dotenv from "dotenv";
dotenv.config();

import express, {
  Application,
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import Router from "./routes";
import { useInjectRequestId } from "./lib/requestIdMiddleware";
import { errorHandler } from "./lib/errors/ErrorHandler";
import cors from "cors";
import rateLimit from "express-rate-limit";
import "./worker/index";
import { ILogObj, Logger } from "tslog";
import { useInjectTrackingInfo } from "./lib/trackingMiddleware";

const logger = new Logger<ILogObj>();

const PORT = process.env.PORT || 8000;

const app: Application = express();

app.use(express.json());
app.use(morgan("tiny"));
app.use(express.static("public"));

// Create the rate limit rule
const apiRequestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // limit each IP to 120 requests per windowMs
  handler: function (req, res /*next*/) {
    return res.status(429).json({
      error: "You sent too many requests. Please wait a while then try again",
    });
  },
});

app.use(apiRequestLimiter);
app.use(useInjectRequestId);
app.use(useInjectTrackingInfo);

const corsOptions = {
  origin: process.env.CORS_ALLOWED_ORIGINS
    ? JSON.parse(process.env.CORS_ALLOWED_ORIGINS || "*")
    : ["https://app.mythweaver.co", "https://mythweaver.co"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(Router);

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: "/swagger.json",
    },
  })
);

const errorHandlerMiddleware: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info("Error handler middleware", err?.message);
  errorHandler.handleError(err, res);
};

app.use(errorHandlerMiddleware);

app.listen(PORT, async () => {
  logger.info("Server is running on port", PORT);
});

process.on("unhandledRejection", (reason: Error | any) => {
  logger.info(`Unhandled Rejection: ${reason.message || reason}`);

  throw new Error(reason.message || reason);
});

process.on("uncaughtException", (error: Error) => {
  console.log(`Uncaught Exception: ${error.message}`);

  errorHandler.handleError(error);
});
