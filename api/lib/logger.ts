import { Logger, ILogObj } from 'tslog';
import { isProduction } from './utils';
import { defaultLogObject } from './defaultLogObject';

export const parentLogger = new Logger<ILogObj>(
  {
    // type: isProduction ? 'json' : 'pretty',
    type: 'json',
  },
  defaultLogObject
);
