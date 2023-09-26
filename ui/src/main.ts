import { createApp } from 'vue';
import vue3GoogleLogin from 'vue3-google-login';

import '@/index.css';
import App from './App.vue';
import router from '@/router/router.ts';
import { createPinia } from 'pinia';
import '@/api/api.ts';
import { initLogging } from '@/lib/logs.ts';

const app = createApp(App);

app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
});

initLogging();

app.use(createPinia());
app.use(router);
app.mount('#app');
