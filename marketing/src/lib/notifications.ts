import { useEventBus } from "@/lib/events.ts";

export interface NotificationOptions {
  message: string;
}

export const showSuccess = (options: NotificationOptions) => {
  const eventBus = useEventBus();
  eventBus.$emit("showNotification", {
    ...options,
    type: "success",
  });
};

export const showError = (options: NotificationOptions) => {
  const eventBus = useEventBus();
  eventBus.$emit("showNotification", {
    ...options,
    type: "error",
  });
};
