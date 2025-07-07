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

// Helper function to get cookie value from headers
function getCookieFromHeaders(headers: Headers, name: string): string | undefined {
  const cookieHeader = headers.get('cookie')
  if (!cookieHeader) return undefined
  
  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=')
    if (cookieName === name && cookieValue) {
      return decodeURIComponent(cookieValue)
    }
  }
  return undefined
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
    
    // Check for flash data in cookies
    // Note: We can't use h3's getCookie here because we don't have access to the event
    const flashData = getCookieFromHeaders(request.headers, '__tsr_flash')
    
    if (flashData) {
      try {
        // Parse flash data using the FlashData interface
        const parsedFlashData = tsrSerializer.parse(flashData) as import('../router').FlashData
        router.serverSsr!.flashData = parsedFlashData
      } catch (e) {
        console.error('Failed to parse flash data:', e)
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
      hasFlashData: !!flashData,
    })

    return cb({
      request,
      router,
      responseHeaders,
    } as any)
  }
}

function getRequestHeaders(opts: { router: AnyRouter; hasFlashData?: boolean }): Headers {
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
  if (opts.hasFlashData) {
    headers.append('Set-Cookie', `__tsr_flash=; Max-Age=0; Path=/; HttpOnly`)
  }

  return headers
}
