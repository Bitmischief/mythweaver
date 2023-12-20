import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID as string,
  key: process.env.PUSHER_KEY as string,
  secret: process.env.PUSHER_SECRET as string,
  cluster: process.env.PUSHER_CLUSTER as string,
  useTLS: true,
});

export const sendWebsocketMessage = async (
  userId: number,
  event: string,
  message: any,
) => {
  await pusher.trigger(userId.toString(), event, message);
};

export enum WebSocketEvent {
  ConjurationCreated = 'conjuration-created',
  ConjurationError = 'conjuration-error',
  ImageCreated = 'image-created',
  ImageFiltered = 'image-filtered',
  ImagePromptRephrased = 'image-prompt-rephrased',
  ImageError = 'image-error',
  ImageGenerationDone = 'image-generation-done',
  SessionUpdated = 'session-updated',
  SessionImageUpdated = 'session-image-updated',
}
