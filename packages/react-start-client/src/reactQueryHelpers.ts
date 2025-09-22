import {
  infiniteQueryOptions as createInfiniteQueryOptions,
  queryOptions as createQueryOptions,
} from '@tanstack/react-query'
import type {
  DefaultError,
  MutationKey,
  QueryFunction,
  QueryKey,
  UseInfiniteQueryOptions,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/query-core'
import type {
  Fetcher,
  FetcherBaseOptions,
  IntersectAllValidatorInputs,
  Method,
  ServerFnBaseOptions,
  ServerFnResponseType,
} from '@tanstack/start-client-core'

type AnyRecord = Record<string, unknown>
type Simplify<T> = { [K in keyof T]: T[K] } & {}

type FetcherWithMeta = {
  (...args: Array<any>): Promise<any>
  functionId?: string
}

export const SERVER_FN_KEY_PREFIX = '__tsr_server_fn__' as const
const SERVER_OPTION_KEYS = ['data', 'headers', 'type'] as const
type OptionKey = (typeof SERVER_OPTION_KEYS)[number]

type ValidatorInput<TMiddlewares, TValidator> = IntersectAllValidatorInputs<
  TMiddlewares,
  TValidator
>

type ValidatorData<TMiddlewares, TValidator> = ValidatorInput<
  TMiddlewares,
  TValidator
>

type ServerFnCallOptions<
  TMiddlewares,
  TValidator,
> = Simplify<
  FetcherBaseOptions &
    (undefined extends ValidatorData<TMiddlewares, TValidator>
      ? {
          data?: ValidatorData<TMiddlewares, TValidator>
        }
      : {
          data: ValidatorData<TMiddlewares, TValidator>
        })
>

type KeyPayload<TOptions> = Simplify<
  Pick<
    NonNullable<TOptions>,
    Extract<OptionKey, keyof NonNullable<TOptions>>
  >
>

type StripServerOptions<T> = Omit<T, OptionKey | 'signal'>

export type ServerFnQueryFnData<
  TMiddlewares,
  TValidator,
  TResponse,
  TServerFnResponseType extends ServerFnResponseType,
> = Awaited<
  ReturnType<Fetcher<TMiddlewares, TValidator, TResponse, TServerFnResponseType>>
>

export type ServerFnQueryKey<
  TMethod extends Method,
  TMiddlewares,
  TValidator,
> = Readonly<
  [
    typeof SERVER_FN_KEY_PREFIX,
    TMethod,
    'query',
    string,
    KeyPayload<ServerFnCallOptions<TMiddlewares, TValidator>> | undefined,
  ]
>

export type ServerFnMutationKey<
  TMethod extends Method,
  TMiddlewares,
  TValidator,
> = Readonly<
  [
    typeof SERVER_FN_KEY_PREFIX,
    TMethod,
    'mutation',
    string,
    KeyPayload<ServerFnCallOptions<TMiddlewares, TValidator>> | undefined,
  ]
>

type ServerFnQueryOptionsConstraint<
  TMethod extends Method,
  TMiddlewares,
  TValidator,
  TResponse,
  TServerFnResponseType extends ServerFnResponseType,
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
> = Simplify<
  ServerFnCallOptions<TMiddlewares, TValidator> &
    Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryFn' | 'queryKey'>
>

export type ServerFnQueryOptionsInput<
  TMethod extends Method,
  TMiddlewares,
  TValidator,
  TResponse,
  TServerFnResponseType extends ServerFnResponseType,
  TQueryFnData = ServerFnQueryFnData<
    TMiddlewares,
    TValidator,
    TResponse,
    TServerFnResponseType
  >,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = ServerFnQueryKey<
    TMethod,
    TMiddlewares,
    TValidator
  >,
> = ServerFnQueryOptionsConstraint<
  TMethod,
  TMiddlewares,
  TValidator,
  TResponse,
  TServerFnResponseType,
  TQueryFnData,
  TError,
  TData,
  TQueryKey
>

export type ServerFnQueryOptionsArg<
  TMiddlewares,
  TValidator,
  TInput,
> = undefined extends ValidatorData<TMiddlewares, TValidator>
  ? TInput | undefined
  : TInput

export type ServerFnQueryOptionsResult<
  TOptions extends object,
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
> = Simplify<
  StripServerOptions<TOptions> & {
    queryFn: QueryFunction<TQueryFnData, TQueryKey, any>
    queryKey: TQueryKey
  }
>

type ServerFnInfiniteQueryOptionsConstraint<
  TMethod extends Method,
  TMiddlewares,
  TValidator,
  TResponse,
  TServerFnResponseType extends ServerFnResponseType,
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
> = Simplify<
  ServerFnCallOptions<TMiddlewares, TValidator> &
    Omit<
      UseInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryFnData,
        TQueryKey,
        TPageParam
      >,
      'queryFn' | 'queryKey'
    >
>

export type ServerFnInfiniteQueryOptionsInput<
  TMethod extends Method,
  TMiddlewares,
  TValidator,
  TResponse,
  TServerFnResponseType extends ServerFnResponseType,
  TQueryFnData = ServerFnQueryFnData<
    TMiddlewares,
    TValidator,
    TResponse,
    TServerFnResponseType
  >,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = ServerFnQueryKey<
    TMethod,
    TMiddlewares,
    TValidator
  >,
  TPageParam = unknown,
> = ServerFnInfiniteQueryOptionsConstraint<
  TMethod,
  TMiddlewares,
  TValidator,
  TResponse,
  TServerFnResponseType,
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
>

export type ServerFnInfiniteQueryOptionsArg<
  TMiddlewares,
  TValidator,
  TInput,
> = ServerFnQueryOptionsArg<TMiddlewares, TValidator, TInput>

export type ServerFnInfiniteQueryOptionsResult<
  TOptions extends object,
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
> = Simplify<
  StripServerOptions<TOptions> & {
    queryFn: QueryFunction<TQueryFnData, TQueryKey, TPageParam>
    queryKey: TQueryKey
  }
>

export type ServerFnMutationVariables<
  TMiddlewares,
  TValidator,
> = ServerFnCallOptions<TMiddlewares, TValidator>

type ServerFnMutationOptionsConstraint<
  TMethod extends Method,
  TMiddlewares,
  TValidator,
  TResponse,
  TServerFnResponseType extends ServerFnResponseType,
  TData,
  TError,
  TVariables,
  TContext,
  TMutationKey extends MutationKey,
> = Simplify<
  Partial<ServerFnCallOptions<TMiddlewares, TValidator>> &
    Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn' | 'mutationKey'>
>

export type ServerFnMutationOptionsInput<
  TMethod extends Method,
  TMiddlewares,
  TValidator,
  TResponse,
  TServerFnResponseType extends ServerFnResponseType,
  TData = ServerFnQueryFnData<
    TMiddlewares,
    TValidator,
    TResponse,
    TServerFnResponseType
  >,
  TError = DefaultError,
  TVariables = ServerFnMutationVariables<TMiddlewares, TValidator>,
  TContext = unknown,
  TMutationKey extends MutationKey = ServerFnMutationKey<
    TMethod,
    TMiddlewares,
    TValidator
  >,
> = ServerFnMutationOptionsConstraint<
  TMethod,
  TMiddlewares,
  TValidator,
  TResponse,
  TServerFnResponseType,
  TData,
  TError,
  TVariables,
  TContext,
  TMutationKey
>

export type ServerFnMutationOptionsResult<
  TOptions extends object,
  TData,
  TError,
  TVariables,
  TContext,
  TMutationKey extends MutationKey,
> = Simplify<
  StripServerOptions<TOptions> & {
    mutationFn: (variables?: TVariables) => Promise<TData>
    mutationKey: TMutationKey
  }
>

function pickCallOptions(input: AnyRecord | undefined) {
  if (!input) return {}

  const result: AnyRecord = {}

  for (const key of SERVER_OPTION_KEYS) {
    const value = input[key]
    if (value !== undefined) {
      result[key] = value
    }
  }

  return result
}

function sanitizeForKey<T extends AnyRecord | undefined>(input: T) {
  if (!input) return undefined

  const result: AnyRecord = {}

  for (const key of SERVER_OPTION_KEYS) {
    const value = input[key]
    if (value !== undefined) {
      result[key] = value
    }
  }

  return Object.keys(result).length
    ? (result as KeyPayload<T>)
    : undefined
}

function makeQueryKey<TMethod extends Method, TOptions extends AnyRecord | undefined>(
  method: TMethod,
  functionId: string,
  callOptions: TOptions,
) {
  return [
    SERVER_FN_KEY_PREFIX,
    method,
    'query',
    functionId,
    sanitizeForKey(callOptions),
  ] as const
}

function makeMutationKey<TMethod extends Method, TOptions extends AnyRecord | undefined>(
  method: TMethod,
  functionId: string,
  baseVariables: TOptions,
) {
  return [
    SERVER_FN_KEY_PREFIX,
    method,
    'mutation',
    functionId,
    sanitizeForKey(baseVariables),
  ] as const
}

function toQueryOptions(
  fetcher: FetcherWithMeta,
  method: Method,
  functionId: string,
  input: AnyRecord | undefined,
) {
  const { signal, ...rest } = (input || {}) as AnyRecord
  const callOptions = pickCallOptions(rest)
  const queryKey = makeQueryKey(method, functionId, callOptions)

  const queryFn = async ({ signal: ctxSignal }: { signal?: AbortSignal }) => {
    const payload = {
      ...callOptions,
      signal: signal ?? ctxSignal,
    }

    return fetcher(payload)
  }

  return createQueryOptions({
    ...rest,
    queryKey,
    queryFn,
  })
}

function toInfiniteQueryOptions(
  fetcher: FetcherWithMeta,
  method: Method,
  functionId: string,
  input: AnyRecord | undefined,
) {
  const { signal, ...rest } = (input || {}) as AnyRecord
  const callOptions = pickCallOptions(rest)
  const queryKey = makeQueryKey(method, functionId, callOptions)

  const queryFn = async ({
    signal: ctxSignal,
    pageParam,
    direction,
  }: {
    signal?: AbortSignal
    pageParam?: unknown
    direction?: unknown
  }) => {
    const payload: AnyRecord = {
      ...callOptions,
      signal: signal ?? ctxSignal,
    }

    if (pageParam !== undefined) {
      payload.pageParam = pageParam
    }

    if (direction !== undefined) {
      payload.direction = direction
    }

    return fetcher(payload)
  }

  return createInfiniteQueryOptions({
    ...rest,
    queryKey,
    queryFn,
  } as any)
}

function toMutationOptions(
  fetcher: FetcherWithMeta,
  method: Method,
  functionId: string,
  input: AnyRecord | undefined,
) {
  const { signal, ...rest } = (input || {}) as AnyRecord
  const baseVariables = pickCallOptions(rest)
  const mutationKey = makeMutationKey(method, functionId, baseVariables)

  const mutationFn = async (variables?: AnyRecord) => {
    const variableSignal = variables?.signal as AbortSignal | undefined
    const payload = {
      ...baseVariables,
      ...(variables ? pickCallOptions(variables) : {}),
      signal: variableSignal ?? signal,
    }

    return fetcher(payload)
  }

  return {
    ...rest,
    mutationKey,
    mutationFn,
  }
}

interface ServerFnReactQueryHelpers<
  TMethod extends Method,
  TMiddlewares,
  TValidator,
  TResponse,
  TServerFnResponseType extends ServerFnResponseType,
> {
  queryOptions<
    TQueryFnData = ServerFnQueryFnData<
      TMiddlewares,
      TValidator,
      TResponse,
      TServerFnResponseType
    >,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = ServerFnQueryKey<
      TMethod,
      TMiddlewares,
      TValidator
    >,
    TOptions extends ServerFnQueryOptionsConstraint<
      TMethod,
      TMiddlewares,
      TValidator,
      TResponse,
      TServerFnResponseType,
      TQueryFnData,
      TError,
      TData,
      TQueryKey
    > = ServerFnQueryOptionsConstraint<
      TMethod,
      TMiddlewares,
      TValidator,
      TResponse,
      TServerFnResponseType,
      TQueryFnData,
      TError,
      TData,
      TQueryKey
    >,
  >(
    input: ServerFnQueryOptionsArg<TMiddlewares, TValidator, TOptions>,
  ): ServerFnQueryOptionsResult<TOptions, TQueryFnData, TError, TData, TQueryKey>
  infiniteQueryOptions<
    TQueryFnData = ServerFnQueryFnData<
      TMiddlewares,
      TValidator,
      TResponse,
      TServerFnResponseType
    >,
    TError = DefaultError,
    TData = InfiniteData<TQueryFnData>,
    TQueryKey extends QueryKey = ServerFnQueryKey<
      TMethod,
      TMiddlewares,
      TValidator
    >,
    TPageParam = unknown,
    TOptions extends ServerFnInfiniteQueryOptionsConstraint<
      TMethod,
      TMiddlewares,
      TValidator,
      TResponse,
      TServerFnResponseType,
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    > = ServerFnInfiniteQueryOptionsConstraint<
      TMethod,
      TMiddlewares,
      TValidator,
      TResponse,
      TServerFnResponseType,
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >,
  >(
    input: ServerFnInfiniteQueryOptionsArg<TMiddlewares, TValidator, TOptions>,
  ): ServerFnInfiniteQueryOptionsResult<
    TOptions,
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >
  mutationOptions<
    TData = ServerFnQueryFnData<
      TMiddlewares,
      TValidator,
      TResponse,
      TServerFnResponseType
    >,
    TError = DefaultError,
    TVariables = ServerFnMutationVariables<TMiddlewares, TValidator>,
    TContext = unknown,
    TMutationKey extends MutationKey = ServerFnMutationKey<
      TMethod,
      TMiddlewares,
      TValidator
    >,
    TOptions extends ServerFnMutationOptionsConstraint<
      TMethod,
      TMiddlewares,
      TValidator,
      TResponse,
      TServerFnResponseType,
      TData,
      TError,
      TVariables,
      TContext,
      TMutationKey
    > = ServerFnMutationOptionsConstraint<
      TMethod,
      TMiddlewares,
      TValidator,
      TResponse,
      TServerFnResponseType,
      TData,
      TError,
      TVariables,
      TContext,
      TMutationKey
    >,
  >(
    input?: TOptions,
  ): ServerFnMutationOptionsResult<
    TOptions,
    TData,
    TError,
    TVariables,
    TContext,
    TMutationKey
  >
}

export function attachReactQueryHelpers<
  TMethod extends Method,
  TMiddlewares,
  TValidator,
  TResponse,
  TServerFnResponseType extends ServerFnResponseType,
>(
  fetcher: FetcherWithMeta,
  options: ServerFnBaseOptions<
    TMethod,
    TServerFnResponseType,
    TResponse,
    TMiddlewares,
    TValidator
  >,
) {
  if (!fetcher) return fetcher

  const method = options.method ?? 'GET'
  const functionId = fetcher.functionId ?? options.functionId

  const helpers = {
    queryOptions: (input?: AnyRecord) =>
      toQueryOptions(fetcher, method, functionId, input),
    infiniteQueryOptions: (input?: AnyRecord) =>
      toInfiniteQueryOptions(fetcher, method, functionId, input),
    mutationOptions: (input?: AnyRecord) =>
      toMutationOptions(fetcher, method, functionId, input),
  } as unknown as ServerFnReactQueryHelpers<
    TMethod,
    TMiddlewares,
    TValidator,
    TResponse,
    TServerFnResponseType
  >

  return Object.assign(fetcher, helpers)
}

declare module '@tanstack/start-client-core' {
  interface OptionalFetcher<
    TMiddlewares,
    TValidator,
    TResponse,
    TServerFnResponseType extends ServerFnResponseType,
  >
    extends ServerFnReactQueryHelpers<
        Method,
        TMiddlewares,
        TValidator,
        TResponse,
        TServerFnResponseType
      > {}

  interface RequiredFetcher<
    TMiddlewares,
    TValidator,
    TResponse,
    TServerFnResponseType extends ServerFnResponseType,
  >
    extends ServerFnReactQueryHelpers<
        Method,
        TMiddlewares,
        TValidator,
        TResponse,
        TServerFnResponseType
      > {}
}
