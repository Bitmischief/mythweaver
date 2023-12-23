import { useEventBus } from '@/lib/events';

export interface NotificationOptions {
  message: string;
}

export const showSuccess = (options: NotificationOptions) => {
  const eventBus = useEventBus();
  eventBus.$emit('showNotification', {
    ...options,
    type: 'success',
  });
};

export const showError = (options: NotificationOptions) => {
  const eventBus = useEventBus();
  eventBus.$emit('showNotification', {
    timeout: 10000,
    ...options,
    type: 'error',
  });
};
