import { expectTypeOf, test } from 'vitest'
import { createServerFn } from '@tanstack/start-client-core'

test.skip('createServerFn rejects JSX payloads', () => {
  // @ts-expect-error JSX elements are not serializable
  createServerFn().handler(() => ({
    rscs: [
      <div key="0">I'm an RSC</div>,
      <div key="1">I'm an RSC</div>,
    ] as const,
  }))

  const _streamFn = createServerFn().handler(() => ({
    stream: {} as ReadableStream<string>,
  }))

  type StreamResult = Awaited<ReturnType<typeof _streamFn>>

  expectTypeOf<StreamResult>().toMatchTypeOf<{
    stream: ReadableStream<string>
  }>()
})
