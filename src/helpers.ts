import type { SendEmailCommandInput } from '@aws-sdk/client-sesv2'
import type { SendEmailOptions } from 'payload'

export function buildFromAddress(name: string, address: string): string {
  if (!name) return address
  return `${name} <${address}>`
}

export function resolveFromAddress(
  from: unknown,
  defaultName: string,
  defaultAddress: string,
): string {
  if (typeof from === 'string') return from
  if (from && typeof from === 'object') {
    const obj = from as Record<string, unknown>
    if (typeof obj.address === 'string') {
      return buildFromAddress(typeof obj.name === 'string' ? obj.name : defaultName, obj.address)
    }
  }
  return buildFromAddress(defaultName, defaultAddress)
}

type AddressLike = string | { address: string } | undefined

function toAddressArray(input: AddressLike | AddressLike[]): string[] | undefined {
  if (!input) return undefined
  const items = Array.isArray(input) ? input : [input]
  const addresses = items
    .map((item) => (typeof item === 'string' ? item : item?.address))
    .filter((a): a is string => !!a)
  return addresses.length > 0 ? addresses : undefined
}

export function mapDestination(
  message: Partial<Pick<SendEmailOptions, 'to' | 'cc' | 'bcc'>>,
): NonNullable<SendEmailCommandInput['Destination']> {
  const destination: NonNullable<SendEmailCommandInput['Destination']> = {}

  const to = toAddressArray(message.to as AddressLike | AddressLike[])
  if (to) destination.ToAddresses = to

  const cc = toAddressArray(message.cc as AddressLike | AddressLike[])
  if (cc) destination.CcAddresses = cc

  const bcc = toAddressArray(message.bcc as AddressLike | AddressLike[])
  if (bcc) destination.BccAddresses = bcc

  return destination
}

export function mapEmailContent(
  message: Partial<Pick<SendEmailOptions, 'subject' | 'html' | 'text'>>,
): Pick<SendEmailCommandInput, 'Content'> {
  const body: Record<string, { Data: string; Charset: string }> = {}

  if (typeof message.html === 'string') {
    body.Html = { Data: message.html, Charset: 'UTF-8' }
  }
  if (typeof message.text === 'string') {
    body.Text = { Data: message.text, Charset: 'UTF-8' }
  }

  return {
    Content: {
      Simple: {
        Subject: { Data: message.subject || '', Charset: 'UTF-8' },
        Body: body,
      },
    },
  }
}
