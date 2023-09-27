import { datadogRum } from '@datadog/browser-rum';
import { isProduction } from '@/lib/util.ts';

export const initSessionTracking = () => {
  // if (isProduction) {
  datadogRum.init({
    applicationId: import.meta.env.VITE_DD_APP_ID,
    clientToken: import.meta.env.VITE_DD_RUM_CLIENT_TOKEN,
    site: 'us3.datadoghq.com',
    service: 'mythweaver-web-app',
    env: 'production',
    // Specify a version number to identify the deployed version of your application in Datadog
    // version: '1.0.0',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'allow',
  });

  datadogRum.startSessionReplayRecording();
  // }
};
