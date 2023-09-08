export const NO_CAMPAIGNS_EVENT = 'NO_CAMPAIGNS';
export const CAMPAIGN_CREATED_EVENT = 'CAMPAIGN_CREATED';

class EventBus {
  events: any;

  constructor() {
    this.events = {};
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  $on(eventName: string, fn: Function) {
    this.events[eventName] = this.events[eventName] || [];
    this.events[eventName].push(fn);
  }

  $off(eventName: string) {
    if (this.events[eventName]) {
      for (let i = 0; i < this.events[eventName].length; i++) {
        this.events[eventName].splice(i, 1);
      }
    }
  }

  $emit(eventName: string, data: any = undefined) {
    if (this.events[eventName]) {
      // eslint-disable-next-line @typescript-eslint/ban-types
      this.events[eventName].forEach(function (fn: Function) {
        fn(data);
      });
    }
  }
}

export const useEventBus = (): EventBus => {
  if ((window as any).eventBus) {
    return (window as any).eventBus;
  }

  (window as any).eventBus = new EventBus();
  return (window as any).eventBus;
};
