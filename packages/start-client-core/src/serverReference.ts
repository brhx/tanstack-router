import { TSR_ACTION_ID_FIELD, TSR_BOUND_ARGS_FIELD } from './serverFunctionFormFields'

const REACT_SERVER_REFERENCE = Symbol.for('react.server.reference')

export type CallServerFn = (
  args: Array<any>,
  opts?: { signal?: AbortSignal }
) => Promise<any>

export interface CreateServerReferenceOptions {
  functionId: string
  callServer: CallServerFn
  getActionHref: () => string | undefined
  extraProperties?: Record<string | symbol, unknown>
}

type BoundArgs = Array<any>

export type ServerReferenceFn = ((...args: Array<any>) => Promise<any>) & {
  $$typeof: symbol
  $$id: string
  $$boundArgs: BoundArgs
  $$boundLength: number
  $$FORM_ACTION?: (identifierPrefix: string) => ServerFormActionMetadata
  $$IS_SIGNATURE_EQUAL?: (referenceId: string, boundArity: number) => boolean
  functionId: string
  url?: string
}

export interface ServerFormActionMetadata {
  name?: string
  action?: string
  method?: string
  encType?: string
  target?: string
  data?: FormData | null
}

function createServerReferenceInternal(
  options: CreateServerReferenceOptions,
  boundArgs: BoundArgs,
): ServerReferenceFn {
  const callServer = options.callServer

  const reference = ((...args: Array<any>) => {
    const mergedArgs = boundArgs.length ? [...boundArgs, ...args] : args
    return callServer(mergedArgs)
  }) as ServerReferenceFn

  decorateServerReference(reference, options, boundArgs)

  return reference
}

function decorateServerReference(
  reference: ServerReferenceFn,
  options: CreateServerReferenceOptions,
  boundArgs: BoundArgs,
) {
  const { functionId, getActionHref, extraProperties } = options

  Object.defineProperty(reference, '$$typeof', {
    value: REACT_SERVER_REFERENCE,
    writable: false,
  })
  Object.defineProperty(reference, '$$id', {
    value: functionId,
    writable: false,
  })
  Object.defineProperty(reference, '$$boundArgs', {
    value: boundArgs,
    writable: false,
  })
  Object.defineProperty(reference, '$$boundLength', {
    value: boundArgs.length,
    writable: false,
  })

  Object.defineProperty(reference, '$$IS_SIGNATURE_EQUAL', {
    value: function (this: ServerReferenceFn, referenceId: string, boundArity: number) {
      return referenceId === functionId && boundArity === (this.$$boundLength ?? 0)
    },
    writable: false,
  })

  Object.defineProperty(reference, '$$FORM_ACTION', {
    value: (identifierPrefix: string) =>
      encodeFormAction({
        reference,
        identifierPrefix,
        getActionHref,
      }),
    writable: false,
  })

  Object.defineProperty(reference, 'bind', {
    value(this: ServerReferenceFn, thisArg: unknown, ...argsToBind: BoundArgs) {
      if (thisArg !== null && thisArg !== undefined) {
        throw new Error(
          'Server functions cannot be bound with a "this" argument. Use undefined or null instead.',
        )
      }
      const nextBoundArgs = boundArgs.length
        ? [...boundArgs, ...argsToBind]
        : [...argsToBind]
      return createServerReferenceInternal(options, nextBoundArgs)
    },
  })

  if (extraProperties) {
    for (const [key, value] of Object.entries(extraProperties)) {
      ;(reference as unknown as Record<string, unknown>)[key] = value
    }
    const symbolEntries = Object.getOwnPropertySymbols(extraProperties) as Array<
      symbol
    >
    for (const symbolKey of symbolEntries) {
      ;(reference as unknown as Record<symbol, unknown>)[symbolKey] =
        extraProperties[symbolKey]
    }
  }
}

function encodeFormAction({
  reference,
  identifierPrefix,
  getActionHref,
}: {
  reference: ServerReferenceFn
  identifierPrefix: string
  getActionHref: () => string | undefined
}): ServerFormActionMetadata {
  const boundArgs: BoundArgs = reference.$$boundArgs ?? []
  const data = new FormData()

  data.append(TSR_ACTION_ID_FIELD, reference.$$id)

  if (boundArgs.length) {
    try {
      data.append(TSR_BOUND_ARGS_FIELD, JSON.stringify(boundArgs))
    } catch (error) {
      throw new Error(
        `Failed to serialize server function bound arguments for "${reference.$$id}"`,
      )
    }
  }

  return {
    action: getActionHref()?.toString() ?? '',
    method: 'POST',
    encType: 'multipart/form-data',
    data,
    name: boundArgs.length
      ? `$ACTION_REF_${identifierPrefix}`
      : `$ACTION_ID_${reference.$$id}`,
  }
}

export function createServerReference(options: CreateServerReferenceOptions) {
  return createServerReferenceInternal(options, [])
}
