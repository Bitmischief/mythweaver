import { AwilixContainer } from 'awilix';

declare global {
  namespace Express {
    interface Request {
      container: AwilixContainer;
    }
  }
}

// This empty export is necessary to make this a module
export {};