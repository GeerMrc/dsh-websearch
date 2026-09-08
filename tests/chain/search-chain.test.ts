import { describe, expect, it, vi } from 'vitest'
import type { WebSearchProvider, WebSearchResult } from '@deepseek-ai/dsh-web'
import type { ChainMemberResolver } from '../../src/chain/core.ts'
import { ChainSearchProvider } from '../../src/chain/core.ts'

function fakeResult(content?: string): WebSearchResult {
  return { content, sources: [], truncated: false }
}

function trackingProvider(id: string, calls: string[]): WebSearchProvider {
  return {
    id,
    available: () => true,
    search: async () => {
      calls.push(id)
      return fakeResult(`answer from ${id}`)
    },
  }
}

interface FakeMember {
  enabled?: boolean
  credentialsReady?: boolean
  multiKeyPool?: boolean
  provider: WebSearchProvider
}

function resolver(members: Record<string, FakeMember>): ChainMemberResolver<WebSearchProvider> {
  return {
    resolve: (id) => {
      const member = members[id]
      if (!member) return undefined
      return {
        id,
        provider: member.provider,
        multiKeyPool: member.multiKeyPool ?? false,
        enabled: member.enabled ?? true,
        credentialsReady: member.credentialsReady ?? true,
      }
    },
  }
}

describe('search chain ordering (必测①)', () => {
  it('serves from the first usable member in configured order and touches no later member', async () => {
    const calls: string[] = []
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-first': { provider: trackingProvider('dshws-first', calls) },
        'dshws-second': { provider: trackingProvider('dshws-second', calls) },
      }),
      order: ['dshws-first', 'dshws-second'],
      perMemberTimeoutMs: 1000,
    })
    const result = await chain.search({ query: 'q' })
    expect(calls).toEqual(['dshws-first'])
    expect(result.truncated).toBe(false)
    expect(result.sources).toEqual([])
  })

  it('follows the configured order, not member construction order', async () => {
    const calls: string[] = []
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-alpha': { provider: trackingProvider('dshws-alpha', calls) },
        'dshws-beta': { provider: trackingProvider('dshws-beta', calls) },
      }),
      order: ['dshws-beta', 'dshws-alpha'],
      perMemberTimeoutMs: 1000,
    })
    await chain.search({ query: 'q' })
    expect(calls).toEqual(['dshws-beta'])
  })
})

describe('selection-level skips (必测②③)', () => {
  it('skips an unregistered member without consuming a call', async () => {
    const calls: string[] = []
    const chain = new ChainSearchProvider({
      members: resolver({ 'dshws-present': { provider: trackingProvider('dshws-present', calls) } }),
      order: ['dshws-ghost', 'dshws-present'],
      perMemberTimeoutMs: 1000,
    })
    await chain.search({ query: 'q' })
    expect(calls).toEqual(['dshws-present'])
  })

  it('skips a disabled member without calling it', async () => {
    const calls: string[] = []
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-off': { provider: trackingProvider('dshws-off', calls), enabled: false },
        'dshws-on': { provider: trackingProvider('dshws-on', calls) },
      }),
      order: ['dshws-off', 'dshws-on'],
      perMemberTimeoutMs: 1000,
    })
    await chain.search({ query: 'q' })
    expect(calls).toEqual(['dshws-on'])
  })

  it('skips a member whose credentials are not configured', async () => {
    const calls: string[] = []
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-nokey': { provider: trackingProvider('dshws-nokey', calls), credentialsReady: false },
        'dshws-keyed': { provider: trackingProvider('dshws-keyed', calls) },
      }),
      order: ['dshws-nokey', 'dshws-keyed'],
      perMemberTimeoutMs: 1000,
    })
    await chain.search({ query: 'q' })
    expect(calls).toEqual(['dshws-keyed'])
  })

  it('skips a member whose own available() is false', async () => {
    const calls: string[] = []
    const unavailable: WebSearchProvider = {
      id: 'dshws-down',
      available: () => false,
      search: async () => {
        calls.push('dshws-down')
        return fakeResult()
      },
    }
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-down': { provider: unavailable },
        'dshws-up': { provider: trackingProvider('dshws-up', calls) },
      }),
      order: ['dshws-down', 'dshws-up'],
      perMemberTimeoutMs: 1000,
    })
    await chain.search({ query: 'q' })
    expect(calls).toEqual(['dshws-up'])
  })

  it('redraws another key within the same member before degrading (S14r 同工具重试)', async () => {
    // Two failing keys then a working third key in ONE member: the chain must
    // stay on that member (3 draws) and succeed — not degrade past it.
    let draws = 0
    const flaky = {
      id: 'dshws-flaky',
      available: () => true,
      async search(_request: { query: string }) {
        draws += 1
        if (draws < 3) throw new Error(`key ${draws} quota exhausted`)
        return { sources: [{ url: 'https://ok.example', title: 'OK' }], truncated: false }
      },
    }
    const chain = new ChainSearchProvider({
      members: resolver({ 'dshws-flaky': { provider: flaky, enabled: true, multiKeyPool: true } }),
      order: ['dshws-flaky'],
      perMemberTimeoutMs: 1000,
    })
    const result = await chain.search({ query: 'q' })
    expect(draws).toBe(3)
    expect(result.sources[0]!.url).toBe('https://ok.example')
  })

  it('degrades to the next member after the third failed draw (S14r 上限后降级)', async () => {
    let flakyDraws = 0
    const alwaysFails = {
      id: 'dshws-flaky',
      available: () => true,
      async search() {
        flakyDraws += 1
        throw new Error('quota exhausted')
      },
    }
    const backup = trackingProvider('dshws-backup', [])
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-flaky': { provider: alwaysFails as unknown as WebSearchProvider, enabled: true, multiKeyPool: true },
        'dshws-backup': { provider: backup, enabled: true },
      }),
      order: ['dshws-flaky', 'dshws-backup'],
      perMemberTimeoutMs: 1000,
    })
    // backup returns an empty result — a SUCCESS, ending the chain there.
    await chain.search({ query: 'q' })
    expect(flakyDraws).toBe(3)
  })

  it('a single-key member degrades immediately — no blind same-key retry (S14r 反盲试)', async () => {
    let draws = 0
    const single = {
      id: 'dshws-single',
      available: () => true,
      async search() {
        draws += 1
        throw new Error('quota exhausted')
      },
    }
    const backup = trackingProvider('dshws-backup', [])
    const chain = new ChainSearchProvider({
      // gate-less member: multiKeyPool defaults false → exactly ONE draw.
      members: resolver({ 'dshws-single': { provider: single as unknown as WebSearchProvider, enabled: true }, 'dshws-backup': { provider: backup, enabled: true } }),
      order: ['dshws-single', 'dshws-backup'],
      perMemberTimeoutMs: 1000,
    })
    await chain.search({ query: 'q' })
    expect(draws).toBe(1)
  })

  it('fails loud with DSHWS_NO_MEMBER_CONFIGURED when every member is selection-skipped', async () => {
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-off': { provider: trackingProvider('dshws-off', []), enabled: false },
        'dshws-nokey': { provider: trackingProvider('dshws-nokey', []), credentialsReady: false },
      }),
      order: ['dshws-off', 'dshws-nokey'],
      perMemberTimeoutMs: 1000,
    })
    await expect(chain.search({ query: 'q' })).rejects.toMatchObject({
      code: 'DSHWS_NO_MEMBER_CONFIGURED',
    })
  })

  it('names the chain order and points to the settings page in the no-member error message (S14b T3 纠偏)', async () => {
    const chain = new ChainSearchProvider({
      members: resolver({}),
      order: ['dshws-ghost-a', 'dshws-ghost-b'],
      perMemberTimeoutMs: 1000,
    })
    // S14b: the old label `(configured: ...)` mislabeled unconfigured members;
    // the chain order stays named, and the message now carries remediation.
    await expect(chain.search({ query: 'q' })).rejects.toThrow(
      /chain order: dshws-ghost-a, dshws-ghost-b\); enable or configure a member/,
    )
  })
})

describe('chain availability (链自身 available())', () => {
  it('is false when every enabled member lacks credentials', () => {
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-a': { provider: trackingProvider('dshws-a', []), credentialsReady: false },
        'dshws-b': { provider: trackingProvider('dshws-b', []), credentialsReady: false },
      }),
      order: ['dshws-a', 'dshws-b'],
      perMemberTimeoutMs: 1000,
    })
    expect(chain.available()).toBe(false)
  })

  it('is true when at least one enabled member has credentials ready', () => {
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-a': { provider: trackingProvider('dshws-a', []), credentialsReady: false },
        'dshws-b': { provider: trackingProvider('dshws-b', []) },
      }),
      order: ['dshws-a', 'dshws-b'],
      perMemberTimeoutMs: 1000,
    })
    expect(chain.available()).toBe(true)
  })

  it('is false when every member on the order is unregistered or disabled', () => {
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-off': { provider: trackingProvider('dshws-off', []), enabled: false },
      }),
      order: ['dshws-ghost', 'dshws-off'],
      perMemberTimeoutMs: 1000,
    })
    expect(chain.available()).toBe(false)
  })
})

function failingProvider(id: string, calls: string[], message: string): WebSearchProvider {
  return {
    id,
    available: () => true,
    search: async () => {
      calls.push(id)
      throw new Error(message)
    },
  }
}

describe('runtime degradation (必测④)', () => {
  it('degrades to the next member when one member throws at runtime', async () => {
    const calls: string[] = []
    const logs: string[] = []
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-quota': { provider: failingProvider('dshws-quota', calls, '429 quota exceeded') },
        'dshws-fresh': { provider: trackingProvider('dshws-fresh', calls) },
      }),
      order: ['dshws-quota', 'dshws-fresh'],
      perMemberTimeoutMs: 1000,
      log: (message) => logs.push(message),
    })
    const result = await chain.search({ query: 'q' })
    expect(calls).toEqual(['dshws-quota', 'dshws-fresh'])
    expect(result.sources).toEqual([])
    expect(logs.some((line) => line.includes('dshws-quota') && line.includes('429 quota exceeded'))).toBe(true)
  })

  it('degrades across several failing members, keeping the configured order', async () => {
    const calls: string[] = []
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-a': { provider: failingProvider('dshws-a', calls, 'first down') },
        'dshws-b': { provider: failingProvider('dshws-b', calls, 'second down') },
        'dshws-c': { provider: trackingProvider('dshws-c', calls) },
      }),
      order: ['dshws-a', 'dshws-b', 'dshws-c'],
      perMemberTimeoutMs: 1000,
    })
    await chain.search({ query: 'q' })
    expect(calls).toEqual(['dshws-a', 'dshws-b', 'dshws-c'])
  })
})

describe('chain exhausted (必测⑤)', () => {
  function throwingProvider(id: string, calls: string[], error: Error): WebSearchProvider {
    return {
      id,
      available: () => true,
      search: async () => {
        calls.push(id)
        throw error
      },
    }
  }

  it('throws DSHWS_CHAIN_EXHAUSTED with a per-member summary and the last error as cause', async () => {
    const calls: string[] = []
    const firstError = new Error('first quota exceeded')
    const lastError = new Error('connection refused')
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-alpha': { provider: throwingProvider('dshws-alpha', calls, firstError) },
        'dshws-beta': { provider: throwingProvider('dshws-beta', calls, lastError) },
      }),
      order: ['dshws-alpha', 'dshws-beta'],
      perMemberTimeoutMs: 1000,
    })
    const error = await chain.search({ query: 'q' }).then(
      () => {
        throw new Error('expected the chain to reject')
      },
      (caught: unknown) => caught,
    )
    expect(error).toMatchObject({ code: 'DSHWS_CHAIN_EXHAUSTED' })
    expect((error as Error).message).toContain('dshws-alpha: first quota exceeded')
    expect((error as Error).message).toContain('dshws-beta: connection refused')
    expect((error as { cause?: unknown }).cause).toBe(lastError)
  })

  it('reports exhaustion, not a missing configuration, when failures exist alongside skipped members', async () => {
    const calls: string[] = []
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-off': { provider: trackingProvider('dshws-off', calls), enabled: false },
        'dshws-down': { provider: throwingProvider('dshws-down', calls, new Error('only member failed')) },
      }),
      order: ['dshws-off', 'dshws-down'],
      perMemberTimeoutMs: 1000,
    })
    const error = await chain.search({ query: 'q' }).then(
      () => {
        throw new Error('expected the chain to reject')
      },
      (caught: unknown) => caught,
    )
    expect(error).toMatchObject({ code: 'DSHWS_CHAIN_EXHAUSTED' })
    expect((error as Error).message).toContain('dshws-down: only member failed')
    expect(calls).toEqual(['dshws-down'])
  })
})

describe('servedBy attribution (必测⑥)', () => {
  it('prepends the served-by line to member-generated content', async () => {
    const logs: string[] = []
    const withContent: WebSearchProvider = {
      id: 'dshws-answerer',
      available: () => true,
      search: async () => fakeResult('generated answer body'),
    }
    const chain = new ChainSearchProvider({
      members: resolver({ 'dshws-answerer': { provider: withContent } }),
      order: ['dshws-answerer'],
      perMemberTimeoutMs: 1000,
      log: (message) => logs.push(message),
    })
    const result = await chain.search({ query: 'q' })
    expect(result.content).toBe('[served-by: dshws-answerer]\ngenerated answer body')
    expect(logs).toHaveLength(1)
    expect(logs[0]).toContain('dshws-answerer')
  })

  it('sets content to the served-by line alone when the member returns none', async () => {
    const silent: WebSearchProvider = {
      id: 'dshws-silent',
      available: () => true,
      search: async () => fakeResult(),
    }
    const chain = new ChainSearchProvider({
      members: resolver({ 'dshws-silent': { provider: silent } }),
      order: ['dshws-silent'],
      perMemberTimeoutMs: 1000,
    })
    const result = await chain.search({ query: 'q' })
    expect(result.content).toBe('[served-by: dshws-silent]')
  })

  it('keeps sources and truncation flags from the member result untouched', async () => {
    const sourced: WebSearchProvider = {
      id: 'dshws-sourced',
      available: () => true,
      search: async () => ({
        sources: [{ url: 'https://example.test/a', title: 'A' }],
        truncated: true,
      }),
    }
    const chain = new ChainSearchProvider({
      members: resolver({ 'dshws-sourced': { provider: sourced } }),
      order: ['dshws-sourced'],
      perMemberTimeoutMs: 1000,
    })
    const result = await chain.search({ query: 'q' })
    expect(result.sources).toEqual([{ url: 'https://example.test/a', title: 'A' }])
    expect(result.truncated).toBe(true)
  })
})

describe('per-member timeout (必测⑦)', () => {
  function hangingProvider(id: string, calls: string[]): { provider: WebSearchProvider; signals: (AbortSignal | undefined)[] } {
    const signals: (AbortSignal | undefined)[] = []
    return {
      signals,
      provider: {
        id,
        available: () => true,
        search: async (_request, signal) =>
          new Promise<WebSearchResult>((_resolve, reject) => {
            calls.push(id)
            signals.push(signal)
            signal?.addEventListener('abort', () => reject(new Error('aborted by chain')), { once: true })
          }),
      },
    }
  }

  it('degrades with DSHWS_MEMBER_TIMEOUT when a member hangs past its budget', async () => {
    vi.useFakeTimers()
    try {
      const calls: string[] = []
      const logs: string[] = []
      const hang = hangingProvider('dshws-hang', calls)
      const chain = new ChainSearchProvider({
        members: resolver({
          'dshws-hang': { provider: hang.provider },
          'dshws-fast': { provider: trackingProvider('dshws-fast', calls) },
        }),
        order: ['dshws-hang', 'dshws-fast'],
        perMemberTimeoutMs: 1000,
        log: (message) => logs.push(message),
      })
      const settled = chain.search({ query: 'q' })
      await vi.advanceTimersByTimeAsync(1000)
      const result = await settled
      expect(calls).toEqual(['dshws-hang', 'dshws-fast'])
      expect(result.content?.startsWith('[served-by: dshws-fast]')).toBe(true)
      expect(logs.some((line) => line.includes('DSHWS_MEMBER_TIMEOUT') && line.includes('dshws-hang'))).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('aborts the hanging member request when the budget expires', async () => {
    vi.useFakeTimers()
    try {
      const calls: string[] = []
      const hang = hangingProvider('dshws-hang', calls)
      const chain = new ChainSearchProvider({
        members: resolver({
          'dshws-hang': { provider: hang.provider },
          'dshws-fast': { provider: trackingProvider('dshws-fast', calls) },
        }),
        order: ['dshws-hang', 'dshws-fast'],
        perMemberTimeoutMs: 500,
      })
      const settled = chain.search({ query: 'q' })
      await vi.advanceTimersByTimeAsync(500)
      await settled
      expect(hang.signals[0]?.aborted).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('propagates caller cancellation instead of degrading', async () => {
    const calls: string[] = []
    const abortable: WebSearchProvider = {
      id: 'dshws-abortable',
      available: () => true,
      search: async (_request, signal) =>
        new Promise<WebSearchResult>((_resolve, reject) => {
          calls.push('dshws-abortable')
          signal?.addEventListener('abort', () => reject(new Error('caller cancelled')), { once: true })
        }),
    }
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-abortable': { provider: abortable },
        'dshws-next': { provider: trackingProvider('dshws-next', calls) },
      }),
      order: ['dshws-abortable', 'dshws-next'],
      perMemberTimeoutMs: 1000,
    })
    const controller = new AbortController()
    const settled = chain.search({ query: 'q' }, controller.signal)
    controller.abort()
    await expect(settled).rejects.toThrow('caller cancelled')
    expect(calls).toEqual(['dshws-abortable'])
  })
})

describe('member budget & exhaustion aggregation (S14u)', () => {
  it('aggregates a multi-draw member into ONE summary line and counts members, not draws', async () => {
    let draws = 0
    const flaky = {
      id: 'dshws-flaky',
      available: () => true,
      async search() {
        draws += 1
        throw new Error(`quota exhausted on draw ${draws}`)
      },
    }
    const calls: string[] = []
    const beta = failingProvider('dshws-beta', calls, 'connection refused')
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-flaky': { provider: flaky as unknown as WebSearchProvider, multiKeyPool: true },
        'dshws-beta': { provider: beta },
      }),
      order: ['dshws-flaky', 'dshws-beta'],
      perMemberTimeoutMs: 1000,
    })
    const error = await chain.search({ query: 'q' }).then(
      () => {
        throw new Error('expected the chain to reject')
      },
      (caught: unknown) => caught,
    )
    expect(error).toMatchObject({ code: 'DSHWS_CHAIN_EXHAUSTED' })
    const message = (error as Error).message
    // Two MEMBERS failed — never "4" (3 draws + 1 member) as the per-draw
    // summary used to count.
    expect(message).toContain('all 2 configured chain members failed')
    // One line per member; the multi-draw member carries its draws inline.
    expect(message).toContain('- dshws-flaky: failed (3 draws: quota exhausted on draw 1; quota exhausted on draw 2; quota exhausted on draw 3)')
    expect(message).toContain('- dshws-beta: connection refused')
    // The last member's last-draw error still rides as cause (ADR-0002 D3).
    expect((error as { cause?: unknown }).cause).toBeInstanceOf(Error)
    expect((error as { cause: Error }).cause.message).toBe('connection refused')
  })

  it('shares ONE timeout budget across a member redraws — the member degrades at the budget, not 3× it', async () => {
    vi.useFakeTimers()
    try {
      let draws = 0
      const slowFail = {
        id: 'dshws-slowfail',
        available: () => true,
        search: async () => {
          draws += 1
          // Every draw rejects 600ms in. With a 1000ms SHARED budget:
          // draw 1 fails at t=600; draw 2 inherits the remaining 400ms and
          // times out at t=1000 — budget spent, degrade. A per-DRAW budget
          // would instead run draw 2 and draw 3 to completion (t=1800).
          await new Promise((_resolve, reject) => {
            setTimeout(() => reject(new Error('quota exhausted')), 600)
          })
          return fakeResult()
        },
      }
      const calls: string[] = []
      let backupCalledAt = 0
      const backup: WebSearchProvider = {
        id: 'dshws-backup',
        available: () => true,
        search: async () => {
          calls.push('dshws-backup')
          backupCalledAt = Date.now()
          return fakeResult('backup answer')
        },
      }
      const chain = new ChainSearchProvider({
        members: resolver({
          'dshws-slowfail': { provider: slowFail as unknown as WebSearchProvider, multiKeyPool: true },
          'dshws-backup': { provider: backup },
        }),
        order: ['dshws-slowfail', 'dshws-backup'],
        perMemberTimeoutMs: 1000,
      })
      const startedAt = Date.now()
      const settled = chain.search({ query: 'q' })
      await vi.advanceTimersByTimeAsync(2000)
      const result = await settled
      expect(result.content?.startsWith('[served-by: dshws-backup]')).toBe(true)
      expect(draws).toBe(2)
      // The member degraded at its 1000ms shared deadline — the backup is
      // reached within the budget, never at 3× it (a per-draw budget would
      // hand the backup over only at t=1800).
      expect(backupCalledAt - startedAt).toBeLessThanOrEqual(1000)
    } finally {
      vi.useRealTimers()
    }
  })

  it('records the shared-budget exhaustion as a member-timeout reason when a redraw cannot start', async () => {
    vi.useFakeTimers()
    try {
      // Draw 1 hangs to the full budget; the timeout reason is recorded and
      // NO further draw starts (budget spent) — a multi-key member whose
      // first key hangs degrades at exactly perMemberTimeoutMs.
      let draws = 0
      const hangThenFail = {
        id: 'dshws-hangkey',
        available: () => true,
        search: async () => {
          draws += 1
          await new Promise((_resolve, reject) => {
            setTimeout(() => reject(new Error('never reached in time')), 1500)
          })
          return fakeResult()
        },
      }
      const chain = new ChainSearchProvider({
        members: resolver({ 'dshws-hangkey': { provider: hangThenFail as unknown as WebSearchProvider, multiKeyPool: true } }),
        order: ['dshws-hangkey'],
        perMemberTimeoutMs: 1000,
      })
      const settled = chain.search({ query: 'q' })
      await vi.advanceTimersByTimeAsync(2000)
      const error = await settled.then(
        () => {
          throw new Error('expected the chain to reject')
        },
        (caught: unknown) => caught,
      )
      expect(draws).toBe(1)
      expect(error).toMatchObject({ code: 'DSHWS_CHAIN_EXHAUSTED' })
      expect((error as Error).message).toContain('DSHWS_MEMBER_TIMEOUT')
      expect((error as Error).message).toContain('- dshws-hangkey: DSHWS_MEMBER_TIMEOUT')
    } finally {
      vi.useRealTimers()
    }
  })
})
