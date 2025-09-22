import {
  createServerFn as createServerFnCore,
  type Method,
  type ServerFnBuilder,
  type ServerFnResponseType,
  type ServerFnBaseOptions,
} from '@tanstack/start-client-core'
import { attachReactQueryHelpers } from './reactQueryHelpers'

const ENHANCED_BUILDER = Symbol('serverFnReactQueryEnhanced')

function enhanceBuilder(builder: any) {
  if (!builder || builder[ENHANCED_BUILDER]) {
    return builder
  }

  const originalMiddleware = builder.middleware?.bind(builder)
  if (originalMiddleware) {
    builder.middleware = ((middleware: any) => {
      const next = originalMiddleware(middleware)
      return enhanceBuilder(next)
    }) as typeof builder.middleware
  }

  const originalValidator = builder.validator?.bind(builder)
  if (originalValidator) {
    builder.validator = ((validator: any) => {
      const next = originalValidator(validator)
      return enhanceBuilder(next)
    }) as typeof builder.validator
  }

  const originalType = builder.type?.bind(builder)
  if (originalType) {
    builder.type = ((typer: any) => {
      const next = originalType(typer)
      return enhanceBuilder(next)
    }) as typeof builder.type
  }

  const originalHandler = builder.handler?.bind(builder)
  if (originalHandler) {
    builder.handler = ((...args: Array<any>) => {
      const fetcher = originalHandler(...args)
      return attachReactQueryHelpers(fetcher as any, builder.options as any)
    }) as typeof builder.handler
  }

  Object.defineProperty(builder, ENHANCED_BUILDER, {
    value: true,
    enumerable: false,
    configurable: false,
  })

  return builder
}

export function createServerFn<
  TMethod extends Method,
  TServerFnResponseType extends ServerFnResponseType = 'data',
  TResponse = unknown,
  TMiddlewares = undefined,
  TValidator = undefined,
>(
  options?: {
    method?: TMethod
    response?: TServerFnResponseType
    type?: ServerFnBaseOptions<TMethod, TServerFnResponseType>['type']
  },
  __opts?: ServerFnBaseOptions<
    TMethod,
    TServerFnResponseType,
    TResponse,
    TMiddlewares,
    TValidator
  >,
) {
  const builder = createServerFnCore<
    TMethod,
    TServerFnResponseType,
    TResponse,
    TMiddlewares,
    TValidator
  >(options as any, __opts as any)

  return enhanceBuilder(builder) as ServerFnBuilder<
    TMethod,
    TServerFnResponseType
  >
}
