import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn, useServerFetcher } from '@tanstack/react-start'

export const redirectUser = createServerFn({ method: 'POST' })
  .validator((data: FormData) => {
    if (!(data instanceof FormData)) {
      throw new Error('Invalid! FormData is required')
    }
    
    const name = data.get('name')?.toString() || ''
    if (!name) {
      throw new Error('Name is required')
    }
    
    return { name }
  })
  .handler(({ data: { name } }) => {
    throw redirect({
      to: '/redirect-target/$name',
      params: { name },
    })
  })

export const Route = createFileRoute('/progressive-enhancement-redirect-test')({
  component: ProgressiveEnhancementRedirectTest,
})

function ProgressiveEnhancementRedirectTest() {
  const fetcher = useServerFetcher(redirectUser)
  
  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Progressive Enhancement Redirect Test</h1>
      
      <fetcher.Form className="space-y-4 mb-4">
        <div>
          <label htmlFor="name" className="block mb-1">Name:</label>
          <input
            type="text"
            name="name"
            id="name"
            className="border rounded px-2 py-1"
            required
          />
        </div>
        
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={fetcher.state === 'submitting'}
        >
          {fetcher.state === 'submitting' ? 'Redirecting...' : 'Submit and Redirect'}
        </button>
      </fetcher.Form>
      
      {fetcher.error && (
        <div data-testid="error" className="text-red-600 mt-2">
          {fetcher.error.message}
        </div>
      )}
    </div>
  )
}