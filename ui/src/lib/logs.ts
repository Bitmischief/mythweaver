import { datadogLogs } from '@datadog/browser-logs';
import { isProduction } from '@/lib/util.ts';

export const initLogging = () => {
  if (isProduction) {
    datadogLogs.init({
      clientToken: import.meta.env.VITE_DD_CLIENT_TOKEN,
      site: 'us3.datadoghq.com',
      forwardErrorsToLogs: true,
      sessionSampleRate: 100,
    });
  }
};
