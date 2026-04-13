import type { EmailAdapter } from "payload";

export interface Logger {
  info: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
}

export interface SESAdapterArgs {
  defaultFromAddress: string;
  defaultFromName: string;
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  logger?: Logger;
}

export interface SESEmailResponse {
  messageId?: string;
}

export type SESEmailAdapter = EmailAdapter<SESEmailResponse>;
