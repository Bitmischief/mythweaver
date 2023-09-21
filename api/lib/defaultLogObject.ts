import { ILogObj } from 'tslog';
import { requestIdAsyncLocalStorage } from './requestIdMiddleware';
import { loggingInfoAsyncLocalStorage } from './loggingMiddleware';

export const defaultLogObject: ILogObj = {
  requestId: () => requestIdAsyncLocalStorage.getStore()?.requestId,
  userEmail: () => loggingInfoAsyncLocalStorage.getStore()?.userEmail,
  userId: () => loggingInfoAsyncLocalStorage.getStore()?.userId,
  url: () => loggingInfoAsyncLocalStorage.getStore()?.url,
  method: () => loggingInfoAsyncLocalStorage.getStore()?.method,
};
