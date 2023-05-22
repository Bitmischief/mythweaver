import { Logger, ILogObj } from "tslog";
import { requestIdAsyncLocalStorage } from "./requestIdMiddleware";

const defaultLogObject: ILogObj = {
  requestId: () => requestIdAsyncLocalStorage.getStore()?.requestId,
};
export const parentLogger = new Logger<ILogObj>({}, defaultLogObject);
