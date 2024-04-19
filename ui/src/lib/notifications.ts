import { useEventBus } from '@/lib/events';

export interface NotificationOptions {
  message: string;
  context?: string;
  route?: string;
  position?: 'left' | 'right' | 'center';
  timeout?: number;
}

export const showSuccess = (options: NotificationOptions) => {
  const eventBus = useEventBus();
  eventBus.$emit('showNotification', {
    timeout: 2000,
    position: 'right',
    ...options,
    type: 'success',
  });
};

export const showError = (options: NotificationOptions) => {
  const eventBus = useEventBus();
  eventBus.$emit('showNotification', {
    timeout: 10000,
    position: 'right',
    ...options,
    type: 'error',
  });
};

export const showInfo = (options: NotificationOptions) => {
  const eventBus = useEventBus();
  eventBus.$emit('showNotification', {
    timeout: 10000,
    position: 'right',
    ...options,
    type: 'info',
  });
};
