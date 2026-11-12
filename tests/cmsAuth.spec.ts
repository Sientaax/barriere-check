import { describe, it, expect } from 'vitest'
import { checkCredentials, signToken, verifyToken, safeEqual } from '../cms-worker/src/auth'

const env = { CMS_USER: 'redaktion', CMS_PASSWORD: 'geheim-und-lang', SESSION_SECRET: 's3cr3t' }

describe('CMS-Anmeldung', () => {
  it('akzeptiert nur die richtige Kombination', async () => {
    expect(await checkCredentials('redaktion', 'geheim-und-lang', env)).toBe(true)
    expect(await checkCredentials('redaktion', 'falsch', env)).toBe(false)
    expect(await checkCredentials('andere', 'geheim-und-lang', env)).toBe(false)
    expect(await checkCredentials(undefined, undefined, env)).toBe(false)
  })
  it('lehnt alles ab, wenn kein Zugang konfiguriert ist', async () => {
    expect(await checkCredentials('', '', { ...env, CMS_USER: '', CMS_PASSWORD: '' })).toBe(false)
  })
  it('safeEqual vergleicht korrekt', async () => {
    expect(await safeEqual('abc', 'abc', 'k')).toBe(true)
    expect(await safeEqual('abc', 'abd', 'k')).toBe(false)
    expect(await safeEqual('abc', 'abcd', 'k')).toBe(false)
  })
})

describe('Sitzungstoken', () => {
  it('ist gültig, solange es nicht abgelaufen ist', async () => {
    const now = 1_700_000_000_000
    const t = await signToken('s3cr3t', now, 8)
    expect(await verifyToken(t, 's3cr3t', now + 60_000)).toBe(true)
    expect(await verifyToken(t, 's3cr3t', now + 9 * 3600_000)).toBe(false)
  })
  it('lehnt manipulierte oder fremd signierte Tokens ab', async () => {
    const t = await signToken('s3cr3t')
    const [payload, sig] = t.split('.')
    const forged = btoa(JSON.stringify({ exp: Date.now() + 1e12 })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(await verifyToken(`${forged}.${sig}`, 's3cr3t')).toBe(false)
    expect(await verifyToken(`${payload}.${sig}x`, 's3cr3t')).toBe(false)
    expect(await verifyToken(t, 'anderes-secret')).toBe(false)
    expect(await verifyToken('', 's3cr3t')).toBe(false)
    expect(await verifyToken('nur-ein-teil', 's3cr3t')).toBe(false)
  })
})
