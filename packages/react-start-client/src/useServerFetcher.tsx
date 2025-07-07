import * as React from 'react'
import { isRedirect } from '@tanstack/router-core'
import { useRouter } from '@tanstack/react-router'

// For compatibility with both function signatures
type AnyServerFunction = ((...args: Array<any>) => Promise<any>) & { url: string }

export interface ServerFetcherState<T = unknown> {
  data?: T
  error?: Error
  state: 'idle' | 'loading' | 'submitting'
}

export interface ServerFetcher<TServerFn extends AnyServerFunction> extends ServerFetcherState<Awaited<ReturnType<TServerFn>>> {
  Form: React.FC<React.ComponentPropsWithoutRef<'form'>>
  submit: TServerFn
  load: TServerFn
}

export function useServerFetcher<TServerFn extends AnyServerFunction>(
  serverFn: TServerFn,
): ServerFetcher<TServerFn> {
  const router = useRouter()
  const [state, setState] = React.useState<ServerFetcherState<Awaited<ReturnType<TServerFn>>>>({
    state: 'idle',
  })

  const execute = React.useCallback(
    async (...args: Parameters<TServerFn>): Promise<Awaited<ReturnType<TServerFn>>> => {
      setState((prev) => ({ ...prev, state: 'submitting' }))
      
      try {
        const res = await serverFn(...args)

        if (isRedirect(res)) {
          throw res
        }

        setState({ data: res, state: 'idle' })
        return res
      } catch (err) {
        if (isRedirect(err)) {
          err.options._fromLocation = router.state.location
          return router.navigate(router.resolveRedirect(err).options) as any
        }

        setState({ error: err as Error, state: 'idle' })
        throw err
      }
    },
    [serverFn, router],
  )

  const Form = React.useMemo(() => {
    const FormComponent: React.FC<React.ComponentPropsWithoutRef<'form'>> = (props) => {
      const { onSubmit, ...rest } = props

      const handleSubmit = React.useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
          if (onSubmit) {
            onSubmit(e)
          }

          if (!e.defaultPrevented) {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            await (execute as any)({ data: formData })
          }
        },
        [onSubmit],
      )

      // For progressive enhancement, we need to set the action and method
      return (
        <form
          {...rest}
          action={serverFn.url}
          method="POST"
          onSubmit={handleSubmit}
        />
      )
    }

    FormComponent.displayName = 'ServerFetcherForm'
    return FormComponent
  }, [serverFn.url, execute])

  // Check for flash data from non-JS form submission
  React.useEffect(() => {
    // Get flash data from window object (it should be injected during SSR)
    const flashData = (window as any).__TSR_FLASH_DATA__
    if (flashData) {
      setState({ data: flashData.data, error: flashData.error, state: 'idle' })
      delete (window as any).__TSR_FLASH_DATA__
    }
  }, [])

  return {
    ...state,
    Form,
    submit: execute as TServerFn,
    load: execute as TServerFn,
  }
}