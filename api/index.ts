import dotenv from 'dotenv';
dotenv.config();

import express, {Application, ErrorRequestHandler, NextFunction} from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import Router from "./routes";
import {useInjectRequestId} from "./lib/requestIdMiddleware";
import {errorHandler} from "./lib/errors/ErrorHandler";
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const PORT = process.env.PORT || 8000;

const app: Application = express();

app.use(express.json());
app.use(morgan("tiny"));
app.use(express.static("public"));

// Create the rate limit rule
const apiRequestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  handler: function (req, res, /*next*/) {
    return res.status(429).json({
      error: 'You sent too many requests. Please wait a while then try again'
    });
  },
})

// Use the limit rule as an application middleware
app.use(apiRequestLimiter)

app.use(useInjectRequestId);
app.use(cors());
app.options('*', cors());

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

const errorHandlerMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  errorHandler.handleError(err, res);
};

app.use(errorHandlerMiddleware);

app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});

process.on('unhandledRejection', (reason: Error | any) => {
  console.log(`Unhandled Rejection: ${reason.message || reason}`);

  throw new Error(reason.message || reason);
});

process.on('uncaughtException', (error: Error) => {
  console.log(`Uncaught Exception: ${error.message}`);

  errorHandler.handleError(error);
});