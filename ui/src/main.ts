import { createApp } from 'vue';

import '@/index.css';
import App from './App.vue';
import router from '@/router/router.ts';
import { createPinia } from 'pinia';
import '@/api/api.ts';
import VueIntercom from '@homebaseai/vue3-intercom';
import * as Sentry from '@sentry/vue';
import { isDevelopment, isLocalDevelopment, isProduction } from '@/lib/util.ts';
import auth0Client from '@/plugins/auth.ts';
import VueSafeHTML from 'vue-safe-html';
import PrimeVue from 'primevue/config';
import PrimeVueStyles from '@/primevue.styles.ts';
import ConfirmationService from 'primevue/confirmationservice';
import ConfirmDialog from 'primevue/confirmdialog';

const app = createApp(App);

app.use(VueIntercom);

app.use(PrimeVue, {
  theme: 'none',
  unstyled: true,
  pt: PrimeVueStyles,
});

app.use(createPinia());
app.use(router);

Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: isProduction ? 'production' : isDevelopment ? 'development' : 'local',
  release: import.meta.env.VITE_VERSION,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: isProduction ? 0.1 : 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: [
    'localhost',
    /^https:\/\/api\.mythweaver\.io/,
    /^https:\/\/dev-api\.mythweaver\.io/,
  ],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  beforeSend(event) {
    if (isLocalDevelopment) {
      return null;
    }

    // Check if it is an exception, and if so, show the report dialog
    // if (event.exception && event.event_id) {
    //   const currentUser = useAuthStore()?.user;
    //   Sentry.showReportDialog({
    //     eventId: event.event_id,
    //     user: { email: currentUser?.email, name: currentUser?.username },
    //   });
    // }
    return event;
  },
});

app.use(auth0Client as any);
app.use(VueSafeHTML);
app.use(ConfirmationService);
app.component('ConfirmDialog', ConfirmDialog);

app.mount('#app');
