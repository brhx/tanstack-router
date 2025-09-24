import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SERVER_FN_KEY_PREFIX } from '../reactQueryHelpers'

const unsetDisableFlags = () => {
  if (typeof process !== 'undefined') {
    delete process.env.TANSTACK_REACT_QUERY_DISABLE
  }

  Reflect.deleteProperty(globalThis, '__TANSTACK_REACT_QUERY_DISABLE')
}

const flushMicrotasks = async () => {
  for (let i = 0; i < 3; i += 1) {
    await Promise.resolve()
  }
}

const callBuilderMethod = (
  builder: unknown,
  method: 'inputValidator' | 'validator',
  arg: unknown,
) => {
  if (typeof builder !== 'object' || builder === null) {
    return undefined
  }

  const target: object = builder
  const candidate = Reflect.get(target, method)
  if (typeof candidate !== 'function') {
    return undefined
  }

  return candidate.call(target, arg)
}

const getHelper = <T extends string>(
  target: unknown,
  key: T,
): ((...args: Array<unknown>) => unknown) | undefined => {
  if (typeof target !== 'object' && typeof target !== 'function') {
    return undefined
  }

  const candidateTarget: object = target
  const value = Reflect.get(candidateTarget, key)
  return typeof value === 'function' ? value : undefined
}

describe('react query helper attachment', () => {
  beforeEach(() => {
    unsetDisableFlags()
    vi.resetModules()
  })

  it('attaches helpers when React Query is available', async () => {
    const { createServerFn } = await import('../createServerFn')

    const builder = createServerFn()
    const enhancedBuilder =
      callBuilderMethod(builder, 'inputValidator', () => ({ data: {} })) ??
      callBuilderMethod(builder, 'validator', () => ({ data: {} })) ??
      builder

    const fetcher = enhancedBuilder.handler(() => 'ok')

    await flushMicrotasks()

    const queryOptions = getHelper(fetcher, 'queryOptions')
    const infiniteQueryOptions = getHelper(fetcher, 'infiniteQueryOptions')
    const mutationOptions = getHelper(fetcher, 'mutationOptions')

    if (typeof queryOptions !== 'function') {
      throw new Error('queryOptions helper missing')
    }

    expect(typeof queryOptions).toBe('function')
    expect(typeof infiniteQueryOptions).toBe('function')
    expect(typeof mutationOptions).toBe('function')

    const queryConfig = queryOptions()
    expect(Array.isArray(queryConfig.queryKey)).toBe(true)
    expect(queryConfig.queryKey[0]).toBe(SERVER_FN_KEY_PREFIX)
  })

  it('does not attach helpers when disabled/no React Query', async () => {
    if (typeof process !== 'undefined') {
      process.env.TANSTACK_REACT_QUERY_DISABLE = '1'
    }
    ;(globalThis as Record<string, unknown>).__TANSTACK_REACT_QUERY_DISABLE = true

    const { createServerFn } = await import('../createServerFn')

    const fetcher = createServerFn().handler(() => 'ok')

    await flushMicrotasks()

    expect('queryOptions' in fetcher).toBe(false)
    expect('infiniteQueryOptions' in fetcher).toBe(false)
    expect('mutationOptions' in fetcher).toBe(false)
  })

  it('propagates helpers through @tanstack/react-start re-export', async () => {
    const { createServerFn } = await import('../../../react-start/src/index')

    const fetcher = createServerFn().handler(() => 'ok')

    await flushMicrotasks()

    expect(typeof getHelper(fetcher, 'queryOptions')).toBe('function')
  })
})
