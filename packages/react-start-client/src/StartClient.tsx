import { Await, RouterProvider } from '@tanstack/react-router'

import { hydrateStart } from '@tanstack/start-client-core/client'

import type { AnyRouter } from '@tanstack/router-core'

let hydrationPromise: Promise<AnyRouter> | undefined
export function StartClient() {
  const promise = hydrationPromise ?? hydrateStart()
  hydrationPromise = promise

  return (
    <Await
      promise={promise}
      children={(router) => <RouterProvider router={router} />}
    />
  )
}
