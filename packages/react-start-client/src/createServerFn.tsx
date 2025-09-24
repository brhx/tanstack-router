import { createServerFn as createServerFnCore } from '@tanstack/start-client-core'
import { attachReactQueryHelpers } from './reactQueryHelpers'
import type {
  Method,
  Register,
  ServerFnBaseOptions,
  ServerFnBuilder,
} from '@tanstack/start-client-core'

const ENHANCED_BUILDER = Symbol('serverFnReactQueryEnhanced')

function enhanceBuilder<TBuilder extends { [key: string]: unknown }>(
  builder: TBuilder,
): TBuilder {
  if (!builder || (builder as any)[ENHANCED_BUILDER]) {
    return builder
  }

  const builderAny = builder as any

  const originalMiddleware = builderAny.middleware?.bind(builderAny)
  if (originalMiddleware) {
    builderAny.middleware = (middleware: unknown) => {
      const next = originalMiddleware(middleware)
      return enhanceBuilder(next)
    }
  }

  const originalInputValidator = builderAny.inputValidator?.bind(builderAny)
  if (originalInputValidator) {
    builderAny.inputValidator = (validator: unknown) => {
      const next = originalInputValidator(validator)
      return enhanceBuilder(next)
    }
  }

  const originalValidator = builderAny.validator?.bind(builderAny)
  if (originalValidator) {
    builderAny.validator = (validator: unknown) => {
      const next = originalValidator(validator)
      return enhanceBuilder(next)
    }
  }

  const originalType = builderAny.type?.bind(builderAny)
  if (originalType) {
    builderAny.type = (typer: unknown) => {
      const next = originalType(typer)
      return enhanceBuilder(next)
    }
  }

  const originalHandler = builderAny.handler?.bind(builderAny)
  if (originalHandler) {
    builderAny.handler = (...args: Array<unknown>) => {
      const fetcher = originalHandler(...args)
      return attachReactQueryHelpers(fetcher, builderAny.options)
    }
  }

  Object.defineProperty(builderAny, ENHANCED_BUILDER, {
    value: true,
    enumerable: false,
    configurable: false,
  })

  return builder
}

export function createServerFn<
  TMethod extends Method,
  TResponse = unknown,
  TMiddlewares = undefined,
  TValidator = undefined,
>(
  options?: {
    method?: TMethod
  },
  __opts?: ServerFnBaseOptions<
    Register,
    TMethod,
    TResponse,
    TMiddlewares,
    TValidator
  >,
) {
  const builder = createServerFnCore<
    TMethod,
    TResponse,
    TMiddlewares,
    TValidator
  >(options as any, __opts as any)

  return enhanceBuilder(builder) as ServerFnBuilder<Register, TMethod>
}
