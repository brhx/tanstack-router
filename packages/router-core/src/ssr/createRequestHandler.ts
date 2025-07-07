import { createMemoryHistory } from '@tanstack/history'
import { mergeHeaders } from './headers'
import { attachRouterServerSsrUtils, dehydrateRouter } from './ssr-server'
import { tsrSerializer } from '../serializer'
import type { HandlerCallback } from './handlerCallback'
import type { AnyRouter } from '../router'
import type { Manifest } from '../manifest'

export type RequestHandler<TRouter extends AnyRouter> = (
  cb: HandlerCallback<TRouter>,
) => Promise<Response>

// Helper function to parse cookies from request headers
function parseCookiesFromHeaders(headers: Headers): Record<string, string> {
  const cookieHeader = headers.get('cookie')
  if (!cookieHeader) return {}
  
  const cookies: Record<string, string> = {}
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=')
    if (name && value) {
      cookies[name] = decodeURIComponent(value)
    }
  })
  return cookies
}

export function createRequestHandler<TRouter extends AnyRouter>({
  createRouter,
  request,
  getRouterManifest,
}: {
  createRouter: () => TRouter
  request: Request
  getRouterManifest?: () => Manifest | Promise<Manifest>
}): RequestHandler<TRouter> {
  return async (cb) => {
    const router = createRouter()

    attachRouterServerSsrUtils(router, await getRouterManifest?.())

    const url = new URL(request.url, 'http://localhost')

    const href = url.href.replace(url.origin, '')
    
    // Check for flash data in URL and cookies
    const searchParams = new URLSearchParams(url.search)
    const flashKey = searchParams.get('__tsr_flash')
    
    if (flashKey) {
      const cookies = parseCookiesFromHeaders(request.headers)
      const flashCookieName = `__tsr_flash_${flashKey}`
      const flashData = cookies[flashCookieName]
      
      if (flashData) {
        try {
          const parsedFlashData = tsrSerializer.parse(flashData)
          router.serverSsr!.flashData[flashKey] = parsedFlashData
        } catch (e) {
          console.error('Failed to parse flash data:', e)
        }
      }
    }

    // Create a history for the router
    const history = createMemoryHistory({
      initialEntries: [href],
    })

    // Update the router with the history and context
    router.update({
      history,
    })

    await router.load()

    dehydrateRouter(router)

    const responseHeaders = getRequestHeaders({
      router,
      flashKey,
    })

    return cb({
      request,
      router,
      responseHeaders,
    } as any)
  }
}

function getRequestHeaders(opts: { router: AnyRouter; flashKey?: string | null }): Headers {
  let headers = mergeHeaders(
    {
      'Content-Type': 'text/html; charset=UTF-8',
    },
    ...opts.router.state.matches.map((match) => {
      return match.headers
    }),
  )

  // Handle Redirects
  const { redirect } = opts.router.state

  if (redirect) {
    headers = mergeHeaders(headers, redirect.headers)
  }
  
  // Delete flash cookie if present
  if (opts.flashKey) {
    const cookieName = `__tsr_flash_${opts.flashKey}`
    headers.append('Set-Cookie', `${cookieName}=; Max-Age=0; Path=/; HttpOnly`)
  }

  return headers
}
