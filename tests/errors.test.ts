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

  it('lands concrete code objects for all five provider families (ADR-0014 removed the fetch-search member)', () => {
    expect(MEMBER_ERROR_CODES.deepseek).toEqual({
      credentialMissing: 'DSHWS_DEEPSEEK_CREDENTIAL_MISSING',
      requestFailed: 'DSHWS_DEEPSEEK_REQUEST_FAILED',
      httpError: 'DSHWS_DEEPSEEK_HTTP_ERROR',
      badResponse: 'DSHWS_DEEPSEEK_BAD_RESPONSE',
      aborted: 'DSHWS_DEEPSEEK_ABORTED',
    })
    expect(MEMBER_ERROR_CODES.tavily).toEqual({
      credentialMissing: 'DSHWS_TAVILY_CREDENTIAL_MISSING',
      requestFailed: 'DSHWS_TAVILY_REQUEST_FAILED',
      httpError: 'DSHWS_TAVILY_HTTP_ERROR',
      badResponse: 'DSHWS_TAVILY_BAD_RESPONSE',
      aborted: 'DSHWS_TAVILY_ABORTED',
    })
    expect(MEMBER_ERROR_CODES.exa).toEqual({
      credentialMissing: 'DSHWS_EXA_CREDENTIAL_MISSING',
      requestFailed: 'DSHWS_EXA_REQUEST_FAILED',
      httpError: 'DSHWS_EXA_HTTP_ERROR',
      badResponse: 'DSHWS_EXA_BAD_RESPONSE',
      aborted: 'DSHWS_EXA_ABORTED',
    })
    expect(MEMBER_ERROR_CODES.anysearch).toEqual({
      credentialMissing: 'DSHWS_ANYSEARCH_CREDENTIAL_MISSING',
      requestFailed: 'DSHWS_ANYSEARCH_REQUEST_FAILED',
      httpError: 'DSHWS_ANYSEARCH_HTTP_ERROR',
      badResponse: 'DSHWS_ANYSEARCH_BAD_RESPONSE',
      aborted: 'DSHWS_ANYSEARCH_ABORTED',
    })
    expect(MEMBER_ERROR_CODES.perplexity).toEqual({
      credentialMissing: 'DSHWS_PERPLEXITY_CREDENTIAL_MISSING',
      requestFailed: 'DSHWS_PERPLEXITY_REQUEST_FAILED',
      httpError: 'DSHWS_PERPLEXITY_HTTP_ERROR',
      badResponse: 'DSHWS_PERPLEXITY_BAD_RESPONSE',
      aborted: 'DSHWS_PERPLEXITY_ABORTED',
    })
    expect(MEMBER_ERROR_CODES.firecrawl).toEqual({
      credentialMissing: 'DSHWS_FIRECRAWL_CREDENTIAL_MISSING',
      requestFailed: 'DSHWS_FIRECRAWL_REQUEST_FAILED',
      httpError: 'DSHWS_FIRECRAWL_HTTP_ERROR',
      badResponse: 'DSHWS_FIRECRAWL_BAD_RESPONSE',
      aborted: 'DSHWS_FIRECRAWL_ABORTED',
    })
  })
})

describe('createChainExhaustedError', () => {
  it('summarizes every failed member and chains the last error as cause', () => {
    const first = new Error('429 quota exceeded')
    const last = new Error('connection refused')
    const err = createChainExhaustedError([
      { memberId: 'dshws-tavily', drawReasons: ['429 quota exceeded'], error: first },
      { memberId: 'dshws-exa', drawReasons: ['timed out after 30000ms (DSHWS_MEMBER_TIMEOUT)'] },
      { memberId: 'dshws-deepseek', drawReasons: ['connection refused'], error: last },
    ])
    expect(err).toBeInstanceOf(DshwsError)
    expect(err.code).toBe('DSHWS_CHAIN_EXHAUSTED')
    expect(err.message).toContain('dshws-tavily: 429 quota exceeded')
    expect(err.message).toContain('dshws-exa: timed out after 30000ms (DSHWS_MEMBER_TIMEOUT)')
    expect(err.message).toContain('dshws-deepseek: connection refused')
    expect(err.cause).toBe(last)
  })

  it('renders a multi-draw member as ONE line with its draws inline (S14u 聚合)', () => {
    const err = createChainExhaustedError([
      {
        memberId: 'dshws-tavily',
        drawReasons: ['429 on key 1', '429 on key 2', 'connection reset on key 3'],
        error: new Error('connection reset on key 3'),
      },
      { memberId: 'dshws-exa', drawReasons: ['connection refused'], error: new Error('connection refused') },
    ])
    expect(err.message).toContain('all 2 configured chain members failed')
    expect(err.message).toContain(
      '- dshws-tavily: failed (3 draws: 429 on key 1; 429 on key 2; connection reset on key 3)',
    )
    expect(err.message).toContain('- dshws-exa: connection refused')
  })

  it('names its code in the message so the terminal failure is diagnosable', () => {
    const err = createChainExhaustedError([{ memberId: 'dshws-tavily', drawReasons: ['boom'] }])
    expect(err.message).toContain('DSHWS_CHAIN_EXHAUSTED')
  })

  it('omits the cause when the last member failed without a thrown error', () => {
    const err = createChainExhaustedError([
      { memberId: 'dshws-tavily', drawReasons: ['timed out after 100ms (DSHWS_MEMBER_TIMEOUT)'] },
    ])
    expect(err.cause).toBeUndefined()
  })
})
