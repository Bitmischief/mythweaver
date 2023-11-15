import Pusher from 'pusher-js';
import { isProduction } from '@/lib/util.ts';

export let pusher: Pusher | undefined = undefined;
export const connect = async (): Promise<Pusher> => {
  if (!isProduction) {
    Pusher.logToConsole = true;
  }

  if (pusher) {
    return pusher;
  }

  const pusherAppKey = import.meta.env.VITE_PUSHER_APP_KEY;
  pusher = new Pusher(pusherAppKey, {
    cluster: 'us3',
  });

  return pusher;
};
