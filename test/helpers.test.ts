import { describe, it, expect } from 'vitest'
import { buildFromAddress, mapDestination, mapEmailContent } from '../src/helpers'

describe('buildFromAddress', () => {
  it('formats from address with name', () => {
    expect(buildFromAddress('Oshinov', 'hi@oshinov.com')).toBe('Oshinov <hi@oshinov.com>')
  })

  it('returns bare address when name is empty', () => {
    expect(buildFromAddress('', 'hi@oshinov.com')).toBe('hi@oshinov.com')
  })

})

describe('mapDestination', () => {
  it('maps string "to" to ToAddresses array', () => {
    const result = mapDestination({ to: 'user@example.com' })
    expect(result.ToAddresses).toEqual(['user@example.com'])
  })

  it('maps array "to" to ToAddresses array', () => {
    const result = mapDestination({ to: ['a@test.com', 'b@test.com'] })
    expect(result.ToAddresses).toEqual(['a@test.com', 'b@test.com'])
  })

  it('maps cc and bcc when provided', () => {
    const result = mapDestination({ to: 'a@test.com', cc: 'cc@test.com', bcc: 'bcc@test.com' })
    expect(result.CcAddresses).toEqual(['cc@test.com'])
    expect(result.BccAddresses).toEqual(['bcc@test.com'])
  })

  it('omits cc/bcc when not provided', () => {
    const result = mapDestination({ to: 'a@test.com' })
    expect(result).not.toHaveProperty('CcAddresses')
    expect(result).not.toHaveProperty('BccAddresses')
  })

  it('returns empty object when to is undefined', () => {
    const result = mapDestination({})
    expect(result).toEqual({})
  })

  it('maps object-form addresses with address field', () => {
    const result = mapDestination({ to: { address: 'obj@test.com' } })
    expect(result.ToAddresses).toEqual(['obj@test.com'])
  })

  it('maps mixed string and object addresses in an array', () => {
    const result = mapDestination({
      to: ['plain@test.com', { address: 'obj@test.com' }],
    })
    expect(result.ToAddresses).toEqual(['plain@test.com', 'obj@test.com'])
  })

  it('filters out undefined entries from address arrays', () => {
    const result = mapDestination({ to: [{ address: '' }] as any })
    expect(result).not.toHaveProperty('ToAddresses')
  })
})

describe('mapEmailContent', () => {
  it('maps subject and html body', () => {
    const result = mapEmailContent({ subject: 'Hello', html: '<p>World</p>' })
    expect(result.Content?.Simple?.Subject?.Data).toBe('Hello')
    expect(result.Content?.Simple?.Body?.Html?.Data).toBe('<p>World</p>')
  })

  it('maps subject and text body without html', () => {
    const result = mapEmailContent({ subject: 'Hello', text: 'World' })
    expect(result.Content?.Simple?.Body?.Text?.Data).toBe('World')
    expect(result.Content?.Simple?.Body?.Html).toBeUndefined()
  })

  it('maps html and text together', () => {
    const result = mapEmailContent({ subject: 'Hi', html: '<b>Hi</b>', text: 'Hi' })
    expect(result.Content?.Simple?.Body?.Html?.Data).toBe('<b>Hi</b>')
    expect(result.Content?.Simple?.Body?.Text?.Data).toBe('Hi')
  })

  it('defaults subject to empty string when missing', () => {
    const result = mapEmailContent({ html: '<p>Body</p>' })
    expect(result.Content?.Simple?.Subject?.Data).toBe('')
  })

  it('returns empty body when neither html nor text provided', () => {
    const result = mapEmailContent({ subject: 'No body' })
    expect(result.Content?.Simple?.Body).toEqual({})
  })

  it('sets UTF-8 charset on all content parts', () => {
    const result = mapEmailContent({ subject: 'Test', html: '<p>Hi</p>', text: 'Hi' })
    expect(result.Content?.Simple?.Subject?.Charset).toBe('UTF-8')
    expect(result.Content?.Simple?.Body?.Html?.Charset).toBe('UTF-8')
    expect(result.Content?.Simple?.Body?.Text?.Charset).toBe('UTF-8')
  })
})
