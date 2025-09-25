import { defineHandlerCallback } from '@tanstack/router-core/ssr/server'
import { renderRouterToString } from './renderRouterToString'
import { RouterServer } from './RouterServer'

export const defaultRenderHandler = defineHandlerCallback(
  ({ router, responseHeaders, formState }) =>
    renderRouterToString({
      router,
      responseHeaders,
      formState,
      children: <RouterServer router={router} />,
    }),
)
