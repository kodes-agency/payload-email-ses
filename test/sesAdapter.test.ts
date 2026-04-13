import { describe, it, expect, vi } from 'vitest'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { sesAdapter } from '../src/sesAdapter'

vi.mock('@aws-sdk/client-sesv2', () => {
  return {
    SESv2Client: vi.fn().mockImplementation(() => ({
      send: vi.fn().mockResolvedValue({ MessageId: 'mock-message-id' }),
    })),
    SendEmailCommand: vi.fn(),
  }
})

describe('sesAdapter', () => {
  const createAdapter = () =>
    sesAdapter({
      defaultFromAddress: 'hi@oshinov.com',
      defaultFromName: 'Oshinov',
      region: 'eu-west-3',
      credentials: { accessKeyId: 'test-key', secretAccessKey: 'test-secret' },
    })

  it('returns adapter with correct shape', () => {
    const adapter = createAdapter()
    const initialized = adapter({ payload: {} as any })

    expect(initialized.name).toBe('ses')
    expect(initialized.defaultFromAddress).toBe('hi@oshinov.com')
    expect(initialized.defaultFromName).toBe('Oshinov')
    expect(typeof initialized.sendEmail).toBe('function')
  })

  it('sendEmail returns messageId on success', async () => {
    const initialized = createAdapter()({ payload: {} as any })
    const result = await initialized.sendEmail({
      to: 'user@example.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
    })
    expect(result).toEqual({ messageId: 'mock-message-id' })
  })

  it('sendEmail throws wrapped error on failure', async () => {
    vi.mocked(SESv2Client).mockImplementationOnce(
      () =>
        ({
          send: vi.fn().mockRejectedValue({
            name: 'MessageRejected',
            message: 'Email address is not verified.',
            $metadata: {},
          } as any),
        }) as any,
    )

    const failingAdapter = sesAdapter({
      defaultFromAddress: 'hi@oshinov.com',
      defaultFromName: 'Oshinov',
      region: 'eu-west-3',
      credentials: { accessKeyId: 'key', secretAccessKey: 'secret' },
    })

    const failingInit = failingAdapter({ payload: {} as any })

    await expect(
      failingInit.sendEmail({ to: 'unverified@test.com', subject: 'Fail', html: '<p>x</p>' }),
    ).rejects.toThrow('SES email send failed: MessageRejected')
  })

  it('creates SES client once at construction time', () => {
    const beforeCalls = vi.mocked(SESv2Client).mock.calls.length
    createAdapter()
    expect(vi.mocked(SESv2Client).mock.calls.length).toBe(beforeCalls + 1)
  })

  it('handles replyTo as string', async () => {
    const initialized = createAdapter()({ payload: {} as any })
    await initialized.sendEmail({
      to: 'user@example.com',
      subject: 'Reply',
      html: '<p>Test</p>',
      replyTo: 'reply@test.com',
    })
    expect(SendEmailCommand).toHaveBeenCalledWith(
      expect.objectContaining({ ReplyToAddresses: ['reply@test.com'] }),
    )
  })

  it('handles replyTo as array of strings', async () => {
    const initialized = createAdapter()({ payload: {} as any })
    await initialized.sendEmail({
      to: 'user@example.com',
      subject: 'Reply',
      html: '<p>Test</p>',
      replyTo: ['reply1@test.com', 'reply2@test.com'],
    })
    expect(SendEmailCommand).toHaveBeenCalledWith(
      expect.objectContaining({ ReplyToAddresses: ['reply1@test.com', 'reply2@test.com'] }),
    )
  })

  it('handles replyTo as array of objects', async () => {
    const initialized = createAdapter()({ payload: {} as any })
    await initialized.sendEmail({
      to: 'user@example.com',
      subject: 'Reply',
      html: '<p>Test</p>',
      replyTo: [{ address: 'reply@test.com' }],
    })
    expect(SendEmailCommand).toHaveBeenCalledWith(
      expect.objectContaining({ ReplyToAddresses: ['reply@test.com'] }),
    )
  })

  it('omits ReplyToAddresses when replyTo is undefined', async () => {
    const initialized = createAdapter()({ payload: {} as any })
    await initialized.sendEmail({
      to: 'user@example.com',
      subject: 'No Reply',
      html: '<p>Test</p>',
    })
    expect(SendEmailCommand).toHaveBeenCalledWith(
      expect.not.objectContaining({ ReplyToAddresses: expect.anything() }),
    )
  })

  it('passes FromEmailAddress to SendEmailCommand', async () => {
    const initialized = createAdapter()({ payload: {} as any })
    await initialized.sendEmail({
      to: 'user@example.com',
      subject: 'From',
      html: '<p>Test</p>',
    })
    expect(SendEmailCommand).toHaveBeenCalledWith(
      expect.objectContaining({ FromEmailAddress: 'Oshinov <hi@oshinov.com>' }),
    )
  })

  describe('with logger', () => {
    const createLogger = () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    })

    it('logs info before sending and on success', async () => {
      const logger = createLogger()
      const adapter = sesAdapter({
        defaultFromAddress: 'hi@oshinov.com',
        defaultFromName: 'Oshinov',
        region: 'eu-west-3',
        credentials: { accessKeyId: 'test-key', secretAccessKey: 'test-secret' },
        logger,
      })
      const initialized = adapter({ payload: {} as any })

      await initialized.sendEmail({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Hello</p>',
      })

      expect(logger.info).toHaveBeenCalledWith('Sending email via SES', {
        to: ['user@example.com'],
        cc: undefined,
        bcc: undefined,
        from: 'Oshinov <hi@oshinov.com>',
        subject: 'Test Subject',
      })

      expect(logger.info).toHaveBeenCalledWith('Email sent via SES', {
        messageId: 'mock-message-id',
      })
    })

    it('logs error on failure', async () => {
      const logger = createLogger()
      vi.mocked(SESv2Client).mockImplementationOnce(
        () =>
          ({
            send: vi.fn().mockRejectedValue({
              name: 'MessageRejected',
              message: 'Email address is not verified.',
              $metadata: {},
            } as any),
          }) as any,
      )

      const adapter = sesAdapter({
        defaultFromAddress: 'hi@oshinov.com',
        defaultFromName: 'Oshinov',
        region: 'eu-west-3',
        credentials: { accessKeyId: 'key', secretAccessKey: 'secret' },
        logger,
      })
      const initialized = adapter({ payload: {} as any })

      await expect(
        initialized.sendEmail({ to: 'unverified@test.com', subject: 'Fail', html: '<p>x</p>' }),
      ).rejects.toThrow('SES email send failed: MessageRejected')

      expect(logger.error).toHaveBeenCalledWith('SES email send failed', {
        errorName: 'MessageRejected',
        errorMessage: 'Email address is not verified.',
        to: ['unverified@test.com'],
        from: 'Oshinov <hi@oshinov.com>',
      })
    })

    it('works without logger (no logging)', async () => {
      const adapter = sesAdapter({
        defaultFromAddress: 'hi@oshinov.com',
        defaultFromName: 'Oshinov',
        region: 'eu-west-3',
        credentials: { accessKeyId: 'test-key', secretAccessKey: 'test-secret' },
      })
      const initialized = adapter({ payload: {} as any })

      const result = await initialized.sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      })

      expect(result).toEqual({ messageId: 'mock-message-id' })
    })

    it('continues email delivery when logger throws on pre-send', async () => {
      const logger = {
        info: vi.fn().mockImplementation(() => {
          throw new Error('logger broke')
        }),
        error: vi.fn(),
        warn: vi.fn(),
      }

      const adapter = sesAdapter({
        defaultFromAddress: 'hi@oshinov.com',
        defaultFromName: 'Oshinov',
        region: 'eu-west-3',
        credentials: { accessKeyId: 'test-key', secretAccessKey: 'test-secret' },
        logger,
      })
      const initialized = adapter({ payload: {} as any })

      const result = await initialized.sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      })

      expect(result).toEqual({ messageId: 'mock-message-id' })
    })

    it('continues email delivery when logger throws on post-success', async () => {
      let callCount = 0
      const logger = {
        info: vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 2) throw new Error('logger broke on success')
        }),
        error: vi.fn(),
        warn: vi.fn(),
      }

      const adapter = sesAdapter({
        defaultFromAddress: 'hi@oshinov.com',
        defaultFromName: 'Oshinov',
        region: 'eu-west-3',
        credentials: { accessKeyId: 'test-key', secretAccessKey: 'test-secret' },
        logger,
      })
      const initialized = adapter({ payload: {} as any })

      const result = await initialized.sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      })

      expect(result).toEqual({ messageId: 'mock-message-id' })
    })

    it('still throws SES error when logger throws in catch block', async () => {
      const logger = {
        info: vi.fn(),
        error: vi.fn().mockImplementation(() => {
          throw new Error('logger broke')
        }),
        warn: vi.fn(),
      }

      vi.mocked(SESv2Client).mockImplementationOnce(
        () =>
          ({
            send: vi.fn().mockRejectedValue({
              name: 'MessageRejected',
              message: 'Email address is not verified.',
              $metadata: {},
            } as any),
          }) as any,
      )

      const adapter = sesAdapter({
        defaultFromAddress: 'hi@oshinov.com',
        defaultFromName: 'Oshinov',
        region: 'eu-west-3',
        credentials: { accessKeyId: 'key', secretAccessKey: 'secret' },
        logger,
      })
      const initialized = adapter({ payload: {} as any })

      await expect(
        initialized.sendEmail({ to: 'unverified@test.com', subject: 'Fail', html: '<p>x</p>' }),
      ).rejects.toThrow('SES email send failed: MessageRejected')
    })
  })
})
