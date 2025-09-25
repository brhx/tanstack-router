import { defineHandlerCallback } from '@tanstack/router-core/ssr/server'
import { RouterServer } from './RouterServer'
import { renderRouterToString } from './renderRouterToString'

export const defaultRenderHandler = defineHandlerCallback(
  ({ router, responseHeaders, formState }) =>
    renderRouterToString({
      router,
      responseHeaders,
      formState,
      children: () => <RouterServer router={router} />,
    }),
)
