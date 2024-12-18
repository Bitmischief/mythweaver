export interface Worker {
  initializeWorker(): Promise<void>;
}
