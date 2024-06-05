import {
  sendWebsocketMessage,
  WebSocketContext,
  WebSocketEvent,
} from '../../services/websockets';

export enum HttpCode {
  OK = 200,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

export enum ErrorType {
  ImageGenerationError = 'image-generation-error',
  ImageUpscaleError = 'image-upscale-error',
  ConjurationError = 'conjuration-error',
  TranscriptionError = 'transcription-error',
}

export interface AppErrorArgs {
  name?: string;
  isOperational?: boolean;
  httpCode: HttpCode;
  description: string;
  websocket?: AppErrorWebsocketConfig;
}

export interface AppErrorWebsocketConfig {
  userId: number;
  errorCode: ErrorType;
  context?: WebSocketContext;
}

export class AppError extends Error {
  public readonly name: string;
  public readonly httpCode: HttpCode;
  public readonly isOperational: boolean = true;
  public readonly description: string;
  public readonly websocket?: AppErrorWebsocketConfig;

  constructor(args: AppErrorArgs) {
    super(args.description);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = args.name || 'Error';
    this.description = args.description;
    this.httpCode = args.httpCode;
    this.websocket = args.websocket;

    if (args.isOperational !== undefined) {
      this.isOperational = args.isOperational;
    }

    if (this.websocket) {
      sendWebsocketMessage(this.websocket.userId, this.websocket.errorCode, {
        context: this.websocket.context,
        message: this.description,
      }).then(() => {
        console.log('Websocket error event pushed to client.');
      });
    }

    Error.captureStackTrace(this);
  }
}
