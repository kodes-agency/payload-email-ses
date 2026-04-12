import type { EmailAdapter } from 'payload'

export interface SESAdapterArgs {
  defaultFromAddress: string
  defaultFromName: string
  region: string
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
}

export interface SESEmailResponse {
  messageId?: string
}

export type SESEmailAdapter = EmailAdapter<SESEmailResponse>
