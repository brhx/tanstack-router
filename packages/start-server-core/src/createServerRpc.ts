import {
  TSS_SERVER_FUNCTION,
  createServerReference,
} from '@tanstack/start-client-core'
import type { ServerReferenceFn } from '@tanstack/start-client-core'
import { getStartContext } from '@tanstack/start-storage-context'
import invariant from 'tiny-invariant'

let baseUrl: string
function sanitizeBase(base: string) {
  return base.replace(/^\/|\/$/g, '')
}

export const createServerRpc = (
  functionId: string,
  splitImportFn: (...args: any) => any,
): ServerReferenceFn => {
  if (!baseUrl) {
    const sanitizedAppBase = sanitizeBase(process.env.TSS_APP_BASE || '/')
    const sanitizedServerBase = sanitizeBase(process.env.TSS_SERVER_FN_BASE!)
    baseUrl = `${sanitizedAppBase ? `/${sanitizedAppBase}` : ''}/${sanitizedServerBase}/`
  }
  invariant(
    splitImportFn,
    '🚨splitImportFn required for the server functions server runtime, but was not provided.',
  )

  const url = baseUrl + functionId

  const callServer = async (args: Array<any>) => splitImportFn(...args)

  const getActionHref = () => {
    const context = getStartContext({ throwIfNotFound: false })
    return context?.href
  }

  return createServerReference({
    functionId,
    callServer,
    getActionHref,
    extraProperties: {
      url,
      functionId,
      [TSS_SERVER_FUNCTION]: true,
    },
  })
}
