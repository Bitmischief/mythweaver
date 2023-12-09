import { createApp } from 'vue';
import { defaultConfig, DefaultConfigOptions, plugin } from '@formkit/vue';
import config from '../formkit.config.ts';

import '@/index.css';
import App from './App.vue';
import router from '@/router/router.ts';
import { createPinia } from 'pinia';
import '@/api/api.ts';
import { initLogging } from '@/lib/logs.ts';
import { initSessionTracking } from '@/lib/sessionTracking.ts';
import VueIntercom from '@homebaseai/vue3-intercom';

const app = createApp(App);

app.use(VueIntercom);

app.use(plugin, defaultConfig(config as unknown as DefaultConfigOptions));

initLogging();
initSessionTracking();

app.use(createPinia());
app.use(router);
app.mount('#app');
