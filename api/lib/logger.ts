import { Logger, ILogObj } from 'tslog';
import { requestIdAsyncLocalStorage } from './requestIdMiddleware';
import { isProduction } from './utils';

const defaultLogObject: ILogObj = {
  requestId: () => requestIdAsyncLocalStorage.getStore()?.requestId,
};
export const parentLogger = new Logger<ILogObj>(
  {
    type: isProduction ? 'json' : 'pretty',
  },
  defaultLogObject
);
