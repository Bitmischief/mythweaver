import { AwilixContainer } from 'awilix';

declare module 'express-serve-static-core' {
  interface Request {
    container: AwilixContainer;
  }
}

// This empty export is necessary to make this a module
export {};
