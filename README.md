# payload-email-ses

AWS SESv2 email adapter for [Payload CMS](https://payloadcms.com) 3.x.

## Install

```bash
pnpm add payload-email-ses
```

Peer dependencies (`@aws-sdk/client-sesv2` and `payload`) must also be installed:

```bash
pnpm add @aws-sdk/client-sesv2 payload
```

## Usage

In your `payload.config.ts`:

```ts
import { buildConfig } from 'payload'
import { sesAdapter } from 'payload-email-ses'

export default buildConfig({
  email: sesAdapter({
    defaultFromAddress: 'noreply@example.com',
    defaultFromName: 'My App',
    region: 'eu-west-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  }),
  // ... rest of your config
})
```

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `defaultFromAddress` | `string` | Yes | Default sender email address |
| `defaultFromName` | `string` | Yes | Default sender display name |
| `region` | `string` | Yes | AWS region for SES (e.g. `eu-west-1`) |
| `credentials.accessKeyId` | `string` | Yes | AWS access key ID |
| `credentials.secretAccessKey` | `string` | Yes | AWS secret access key |

## Sending emails

```ts
await req.payload.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome',
  html: '<h1>Hello!</h1>',
  text: 'Hello!',
})
```

### Override from address per email

```ts
await req.payload.sendEmail({
  from: 'support@example.com',
  to: 'user@example.com',
  subject: 'Support',
  html: '<p>We got your message.</p>',
})
```

### Reply-To

```ts
await req.payload.sendEmail({
  to: 'user@example.com',
  subject: 'Contact',
  html: '<p>Reply to this email.</p>',
  replyTo: 'contact@example.com',
})
```

## AWS IAM permissions

The IAM user or role needs at minimum:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail"],
      "Resource": "*"
    }
  ]
}
```

## Exports

- `sesAdapter` — Adapter factory function
- `buildFromAddress` — Format "Name \<email\>" helper
- `resolveFromAddress` — Resolve from address from various formats
- `mapDestination` — Map to/cc/bcc to SESv2 destination
- `mapEmailContent` — Map subject/html/text to SESv2 content

Type exports: `SESAdapterArgs`, `SESEmailResponse`, `SESEmailAdapter`

## License

MIT
