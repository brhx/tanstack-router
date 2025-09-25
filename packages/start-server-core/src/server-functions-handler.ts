import { isNotFound } from '@tanstack/router-core'
import invariant from 'tiny-invariant'
import {
  TSS_FORMDATA_CONTEXT,
  TSR_ACTION_ID_FIELD,
  TSR_BOUND_ARGS_FIELD,
  X_TSS_SERIALIZED,
  getDefaultSerovalPlugins,
} from '@tanstack/start-client-core'
import { fromJSON, toCrossJSONAsync, toCrossJSONStream } from 'seroval'
import { getResponse } from './request-response'
import { getServerFnById } from './getServerFnById'

const ACTION_KEY_FIELD = '$ACTION_KEY'
const FORM_CONTENT_TYPES = [
  'multipart/form-data',
  'application/x-www-form-urlencoded',
]

interface PathServerActionDetection {
  kind: 'path'
  serverFnId: string
  isCreateServerFn: boolean
  searchParams: URLSearchParams
}

interface FormServerActionDetection {
  kind: 'form'
  serverFnId: string
  boundArgs: Array<any>
  formData: FormData
  actionKey?: string
}

type DetectedServerAction = PathServerActionDetection | FormServerActionDetection

function sanitizeBase(base: string | undefined) {
  if (!base) {
    throw new Error(
      '🚨 process.env.TSS_SERVER_FN_BASE is required in start/server-handler/index',
    )
  }

  return base.replace(/^\/|\/$/g, '')
}

async function detectServerAction({
  request,
  href,
  serverFnBase,
}: {
  request: Request
  href: string
  serverFnBase: string
}): Promise<DetectedServerAction | null> {
  const method = request.method.toUpperCase()
  const url = new URL(request.url, 'http://localhost:3000')
  const regex = new RegExp(`${sanitizeBase(serverFnBase)}/([^/?#]+)`) // matches /_serverFn/:id

  const match = url.pathname.match(regex)
  if (match && match[1]) {
    const searchParams = new URLSearchParams(url.search)
    return {
      kind: 'path',
      serverFnId: match[1],
      isCreateServerFn: searchParams.has('createServerFn'),
      searchParams,
    }
  }

  if (method !== 'POST') {
    return null
  }

  const contentType = request.headers.get('Content-Type') || ''
  if (!FORM_CONTENT_TYPES.some((type) => contentType.includes(type))) {
    return null
  }

  let parsedFormData: FormData
  try {
    const clone = request.clone()
    parsedFormData = await clone.formData()
  } catch {
    return null
  }

  const actionId = parsedFormData.get(TSR_ACTION_ID_FIELD)
  if (typeof actionId !== 'string' || !actionId) {
    return null
  }

  const rawBoundArgs = parsedFormData.get(TSR_BOUND_ARGS_FIELD)
  let boundArgs: Array<any> = []
  if (typeof rawBoundArgs === 'string' && rawBoundArgs.length > 0) {
    try {
      boundArgs = JSON.parse(rawBoundArgs)
    } catch {
      boundArgs = []
    }
  }

  const actionKeyEntry = parsedFormData.get(ACTION_KEY_FIELD)
  const actionKey = typeof actionKeyEntry === 'string' ? actionKeyEntry : undefined

  const sanitizedFormData = new FormData()
  parsedFormData.forEach((value, key) => {
    if (
      key === TSR_ACTION_ID_FIELD ||
      key === TSR_BOUND_ARGS_FIELD ||
      key === ACTION_KEY_FIELD ||
      key === TSS_FORMDATA_CONTEXT ||
      key.startsWith('$ACTION_ID_') ||
      key.startsWith('$ACTION_REF_')
    ) {
      return
    }
    sanitizedFormData.append(key, value)
  })

  return {
    kind: 'form',
    serverFnId: actionId,
    boundArgs,
    formData: sanitizedFormData,
    actionKey,
  }
}

function parsePayload(payload: any, plugins: Array<any>) {
  return fromJSON(payload, { plugins })
}

export const handleServerAction = async ({
  request,
  context,
  href,
  serverFnBase,
  executeRouter,
}: {
  request: Request
  context: any
  href: string
  serverFnBase: string
  executeRouter: (opts: { serverContext: any; formState?: any }) => Promise<Response>
}): Promise<Response | null> => {
  const controller = new AbortController()
  const signal = controller.signal
  const abort = () => controller.abort()
  request.signal.addEventListener('abort', abort)

  const detection = await detectServerAction({ request, href, serverFnBase })

  if (!detection) {
    request.signal.removeEventListener('abort', abort)
    return null
  }

  const action = await getServerFnById(detection.serverFnId)

  const serovalPlugins = getDefaultSerovalPlugins()
  const method = request.method
  const contentType = request.headers.get('Content-Type')

  try {
    let result = await (async () => {
      if (detection.kind === 'form') {
        const args = detection.boundArgs.length
          ? [...detection.boundArgs, detection.formData]
          : [detection.formData]
        return await action(...args)
      }

      const { searchParams, isCreateServerFn } = detection
      const search = Object.fromEntries(searchParams.entries()) as {
        payload?: any
        createServerFn?: boolean
      }

      // FormData from createServerFn
      if (
        FORM_CONTENT_TYPES.some(
          (type) => contentType && contentType.includes(type),
        )
      ) {
        invariant(
          method.toLowerCase() !== 'get',
          'GET requests with FormData payloads are not supported',
        )
        const formData = await request.formData()
        const serializedContext = formData.get(TSS_FORMDATA_CONTEXT)
        formData.delete(TSS_FORMDATA_CONTEXT)

        const params = {
          context,
          data: formData,
        }
        if (typeof serializedContext === 'string') {
          try {
            const parsedContext = JSON.parse(serializedContext)
            if (typeof parsedContext === 'object' && parsedContext) {
              params.context = { ...context, ...parsedContext }
            }
          } catch {}
        }

        return await action(params, signal)
      }

      if (method.toLowerCase() === 'get') {
        invariant(
          isCreateServerFn,
          'expected GET request to originate from createServerFn',
        )
        let payload: any = search.payload
        payload = payload
          ? (parsePayload(JSON.parse(payload), serovalPlugins) as any)
          : payload
        payload.context = { ...context, ...payload.context }
        return await action(payload, signal)
      }

      if (method.toLowerCase() !== 'post') {
        throw new Error('expected POST method')
      }

      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('expected application/json content type')
      }

      const jsonPayload = await request.json()
      if (isCreateServerFn) {
        const payload = parsePayload(jsonPayload, serovalPlugins) as any
        payload.context = { ...payload.context, ...context }
        return await action(payload, signal)
      }

      return await action(...jsonPayload)
    })()

    if (result.result instanceof Response) {
      return result.result
    }

    const isCreateServerFn = detection.kind === 'path' && detection.isCreateServerFn

    if (!isCreateServerFn) {
      result = result.result

      if (result instanceof Response) {
        return result
      }
    }

    if (detection.kind === 'form') {
      if (isNotFound(result)) {
        return isNotFoundResponse(result)
      }

      const boundLength = detection.boundArgs.length
      const formState = [
        result,
        detection.actionKey ?? '',
        detection.serverFnId,
        boundLength,
      ]

      return await executeRouter({
        serverContext: context,
        formState,
      })
    }

    if (isNotFound(result)) {
      return isNotFoundResponse(result)
    }

    const response = getResponse()
    let nonStreamingBody: any = undefined

    if (result !== undefined) {
      let done = false as boolean
      const callbacks: {
        onParse: (value: any) => void
        onDone: () => void
        onError: (error: any) => void
      } = {
        onParse: (value) => {
          nonStreamingBody = value
        },
        onDone: () => {
          done = true
        },
        onError: (error) => {
          throw error
        },
      }
      toCrossJSONStream(result, {
        refs: new Map(),
        plugins: serovalPlugins,
        onParse(value) {
          callbacks.onParse(value)
        },
        onDone() {
          callbacks.onDone()
        },
        onError: (error) => {
          callbacks.onError(error)
        },
      })
      if (done) {
        return new Response(
          nonStreamingBody ? JSON.stringify(nonStreamingBody) : undefined,
          {
            status: response?.status,
            statusText: response?.statusText,
            headers: {
              'Content-Type': 'application/json',
              [X_TSS_SERIALIZED]: 'true',
            },
          },
        )
      }

      const stream = new ReadableStream({
        start(controller) {
          callbacks.onParse = (value) =>
            controller.enqueue(JSON.stringify(value) + '\n')
          callbacks.onDone = () => {
            try {
              controller.close()
            } catch (error) {
              controller.error(error)
            }
          }
          callbacks.onError = (error) => controller.error(error)
          if (nonStreamingBody !== undefined) {
            callbacks.onParse(nonStreamingBody)
          }
        },
      })
      return new Response(stream, {
        status: response?.status,
        statusText: response?.statusText,
        headers: {
          'Content-Type': 'application/x-ndjson',
          [X_TSS_SERIALIZED]: 'true',
        },
      })
    }

    return new Response(undefined, {
      status: response?.status,
      statusText: response?.statusText,
    })
  } catch (error: any) {
    if (error instanceof Response) {
      return error
    }

    if (isNotFound(error)) {
      return isNotFoundResponse(error)
    }

    console.info()
    console.info('Server Fn Error!')
    console.info()
    console.error(error)
    console.info()

    const serializedError = JSON.stringify(
      await Promise.resolve(
        toCrossJSONAsync(error, {
          refs: new Map(),
          plugins: serovalPlugins,
        }),
      ),
    )
    const response = getResponse()
    return new Response(serializedError, {
      status: response?.status ?? 500,
      statusText: response?.statusText,
      headers: {
        'Content-Type': 'application/json',
        [X_TSS_SERIALIZED]: 'true',
      },
    })
  } finally {
    request.signal.removeEventListener('abort', abort)
  }
}

function isNotFoundResponse(error: any) {
  const { headers, ...rest } = error

  return new Response(JSON.stringify(rest), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  })
}
