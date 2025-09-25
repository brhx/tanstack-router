import {
  defineHandlerCallback,
  renderRouterToString,
} from '@tanstack/react-router/ssr/server'
import { StartServer } from './StartServer'

export const defaultRenderHandler = defineHandlerCallback(
  ({ router, responseHeaders, formState }) =>
    renderRouterToString({
      router,
      responseHeaders,
      formState,
      children: <StartServer router={router} />,
    }),
)
