import { describe, expect, it } from 'vitest'
import {
  CHAIN_ERROR_CODES,
  createChainExhaustedError,
  DshwsError,
  MEMBER_ERROR_CODES,
} from '../src/errors.ts'

describe('DshwsError', () => {
  it('carries a stable string code and an error cause', () => {
    const cause = new Error('upstream 429')
    const err = new DshwsError('DSHWS_TEST', 'member failed', { cause })
    expect(err.code).toBe('DSHWS_TEST')
    expect(err.message).toBe('member failed')
    expect(err.cause).toBe(cause)
    expect(err).toBeInstanceOf(Error)
  })
})

describe('error code catalog', () => {
  it('defines the three chain-level codes', () => {
    expect(CHAIN_ERROR_CODES.exhausted).toBe('DSHWS_CHAIN_EXHAUSTED')
    expect(CHAIN_ERROR_CODES.noMemberConfigured).toBe('DSHWS_NO_MEMBER_CONFIGURED')
    expect(CHAIN_ERROR_CODES.memberTimeout).toBe('DSHWS_MEMBER_TIMEOUT')
  })

  it('defines one namespace per bundled provider family, all DSHWS_-prefixed', () => {
    expect(Object.values(MEMBER_ERROR_CODES)).toEqual([
      'DSHWS_DEEPSEEK',
      'DSHWS_TAVILY',
      'DSHWS_FIRECRAWL',
      'DSHWS_EXA',
      'DSHWS_PERPLEXITY',
    ])
  })
})

describe('createChainExhaustedError', () => {
  it('summarizes every failed member and chains the last error as cause', () => {
    const first = new Error('429 quota exceeded')
    const last = new Error('connection refused')
    const err = createChainExhaustedError([
      { memberId: 'dshws-tavily', reason: '429 quota exceeded', error: first },
      { memberId: 'dshws-exa', reason: 'timed out after 30000ms (DSHWS_MEMBER_TIMEOUT)' },
      { memberId: 'dshws-deepseek', reason: 'connection refused', error: last },
    ])
    expect(err).toBeInstanceOf(DshwsError)
    expect(err.code).toBe('DSHWS_CHAIN_EXHAUSTED')
    expect(err.message).toContain('dshws-tavily: 429 quota exceeded')
    expect(err.message).toContain('dshws-exa: timed out after 30000ms (DSHWS_MEMBER_TIMEOUT)')
    expect(err.message).toContain('dshws-deepseek: connection refused')
    expect(err.cause).toBe(last)
  })

  it('names its code in the message so the terminal failure is diagnosable', () => {
    const err = createChainExhaustedError([{ memberId: 'dshws-tavily', reason: 'boom' }])
    expect(err.message).toContain('DSHWS_CHAIN_EXHAUSTED')
  })

  it('omits the cause when the last member failed without a thrown error', () => {
    const err = createChainExhaustedError([
      { memberId: 'dshws-tavily', reason: 'timed out after 100ms (DSHWS_MEMBER_TIMEOUT)' },
    ])
    expect(err.cause).toBeUndefined()
  })
})
