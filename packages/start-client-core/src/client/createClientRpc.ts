import { TSS_SERVER_FUNCTION } from '../constants'
import { serverFnFetcher } from './serverFnFetcher'
import { createServerReference } from '../serverReference'

// make sure this get's hoisted
// eslint-disable-next-line no-var
var baseUrl: string
function sanitizeBase(base: string) {
  return base.replace(/^\/|\/$/g, '')
}

export function createClientRpc(functionId: string) {
  if (!baseUrl) {
    const sanitizedAppBase = sanitizeBase(process.env.TSS_APP_BASE || '/')
    const sanitizedServerBase = sanitizeBase(process.env.TSS_SERVER_FN_BASE!)
    baseUrl = `${sanitizedAppBase ? `/${sanitizedAppBase}` : ''}/${sanitizedServerBase}/`
  }
  const url = baseUrl + functionId

  const callServer = (args: Array<any>) => serverFnFetcher(url, args, fetch)

  const getActionHref = () => {
    try {
      const location = window.location
      return location.pathname + location.search + location.hash
    } catch {
      return undefined
    }
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
