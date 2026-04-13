import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import type { SESv2ServiceException } from '@aws-sdk/client-sesv2'
import type { SendEmailOptions } from 'payload'

import { mapDestination, mapEmailContent, resolveFromAddress } from './helpers'
import type { SESAdapterArgs, SESEmailResponse, SESEmailAdapter } from './types'

function safeLog(
  log: SESAdapterArgs['logger'],
  level: 'info' | 'error',
  msg: string,
  meta?: Record<string, unknown>,
) {
  try {
    log?.[level](msg, meta)
  } catch {
    // Logging failures must never affect email delivery
  }
}

export function sesAdapter(args: SESAdapterArgs): SESEmailAdapter {
  const client = new SESv2Client({
    region: args.region,
    credentials: {
      accessKeyId: args.credentials.accessKeyId,
      secretAccessKey: args.credentials.secretAccessKey,
    },
  })

  const log = args.logger

  return () => ({
    name: 'ses',
    defaultFromAddress: args.defaultFromAddress,
    defaultFromName: args.defaultFromName,
    sendEmail: async (message: SendEmailOptions): Promise<SESEmailResponse> => {
      const fromAddress = resolveFromAddress(
        message.from,
        args.defaultFromName,
        args.defaultFromAddress,
      )

      const destination = mapDestination(message)
      const content = mapEmailContent(message)

      const replyTo =
        typeof message.replyTo === 'string'
          ? [message.replyTo]
          : Array.isArray(message.replyTo)
            ? message.replyTo
                .map((r: unknown) =>
                  typeof r === 'string' ? r : (r as Record<string, string>)?.address,
                )
                .filter(Boolean)
            : undefined

      const command = new SendEmailCommand({
        FromEmailAddress: fromAddress,
        Destination: destination,
        ...content,
        ...(replyTo ? { ReplyToAddresses: replyTo } : {}),
      })

      safeLog(log, 'info', 'Sending email via SES', {
        to: destination.ToAddresses,
        cc: destination.CcAddresses,
        bcc: destination.BccAddresses,
        from: fromAddress,
        subject: message.subject,
      })

      try {
        const response = await client.send(command)
        safeLog(log, 'info', 'Email sent via SES', { messageId: response.MessageId })
        return { messageId: response.MessageId }
      } catch (error) {
        const sesError = error as SESv2ServiceException
        safeLog(log, 'error', 'SES email send failed', {
          errorName: sesError.name,
          errorMessage: sesError.message,
          to: destination.ToAddresses,
          from: fromAddress,
        })
        throw new Error(`SES email send failed: ${sesError.name} — ${sesError.message}`)
      }
    },
  })
}
