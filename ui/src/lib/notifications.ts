import { useEventBus } from '@/lib/events';

export interface NotificationOptions {
  message: string;
  context?: string;
  route?: string;
}

export const showSuccess = (options: NotificationOptions) => {
  const eventBus = useEventBus();
  eventBus.$emit('showNotification', {
    timeout: 1000,
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

export const showInfo = (options: NotificationOptions) => {
  const eventBus = useEventBus();
  eventBus.$emit('showNotification', {
    timeout: 10000,
    ...options,
    type: 'info',
  });
};
