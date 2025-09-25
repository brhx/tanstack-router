import { defineHandlerCallback } from '@tanstack/start-server-core'
import { renderRouterToString } from '@tanstack/solid-router/ssr/server'
import { StartServer } from './StartServer'

export const defaultRenderHandler = defineHandlerCallback(
  ({ router, responseHeaders, formState }) =>
    renderRouterToString({
      router,
      responseHeaders,
      formState,
      children: () => <StartServer router={router} />,
    }),
)
