import type { AnyRouter } from '../router'

export interface HandlerCallback<TRouter extends AnyRouter> {
  (ctx: {
    request: Request
    router: TRouter
    responseHeaders: Headers
    formState?: any
  }): Response | Promise<Response>
}

export function defineHandlerCallback<TRouter extends AnyRouter>(
  handler: HandlerCallback<TRouter>,
): HandlerCallback<TRouter> {
  return handler
}
