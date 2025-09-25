import {
  defineHandlerCallback,
  renderRouterToStream,
} from '@tanstack/react-router/ssr/server'
import { StartServer } from './StartServer'

export const defaultStreamHandler = defineHandlerCallback(
  ({ request, router, responseHeaders, formState }) =>
    renderRouterToStream({
      request,
      router,
      responseHeaders,
      formState,
      children: <StartServer router={router} />,
    }),
)
