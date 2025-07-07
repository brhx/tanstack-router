import { createFileRoute } from '@tanstack/react-router'
import { createServerFn, useServerFetcher } from '@tanstack/react-start'

export const processForm1 = createServerFn({ method: 'POST' })
  .validator((data: FormData) => {
    if (!(data instanceof FormData)) {
      throw new Error('Invalid! FormData is required')
    }
    
    const value = data.get('value')?.toString() || ''
    if (!value) {
      throw new Error('Value is required')
    }
    
    return { value }
  })
  .handler(({ data: { value } }) => {
    return `Form 1 processed: ${value}`
  })

export const processForm2 = createServerFn({ method: 'POST' })
  .validator((data: FormData) => {
    if (!(data instanceof FormData)) {
      throw new Error('Invalid! FormData is required')
    }
    
    const value = data.get('value')?.toString() || ''
    if (!value) {
      throw new Error('Value is required')
    }
    
    return { value }
  })
  .handler(({ data: { value } }) => {
    return `Form 2 processed: ${value}`
  })

export const Route = createFileRoute('/progressive-enhancement-multiple')({
  component: ProgressiveEnhancementMultiple,
})

function ProgressiveEnhancementMultiple() {
  const fetcher1 = useServerFetcher(processForm1)
  const fetcher2 = useServerFetcher(processForm2)
  
  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Multiple Forms Test</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="border p-4 rounded">
          <h2 className="text-xl mb-2">Form 1</h2>
          <fetcher1.Form data-testid="form1" className="space-y-2">
            <input
              type="text"
              name="value"
              placeholder="Enter value for form 1"
              className="border rounded px-2 py-1 w-full"
              required
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
              disabled={fetcher1.state === 'submitting'}
            >
              Submit Form 1
            </button>
          </fetcher1.Form>
          
          {fetcher1.data && (
            <div data-testid="form1-result" className="text-green-600 mt-2">
              {fetcher1.data}
            </div>
          )}
          
          {fetcher1.error && (
            <div className="text-red-600 mt-2">
              {fetcher1.error.message}
            </div>
          )}
        </div>
        
        <div className="border p-4 rounded">
          <h2 className="text-xl mb-2">Form 2</h2>
          <fetcher2.Form data-testid="form2" className="space-y-2">
            <input
              type="text"
              name="value"
              placeholder="Enter value for form 2"
              className="border rounded px-2 py-1 w-full"
              required
            />
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
              disabled={fetcher2.state === 'submitting'}
            >
              Submit Form 2
            </button>
          </fetcher2.Form>
          
          {fetcher2.data && (
            <div data-testid="form2-result" className="text-green-600 mt-2">
              {fetcher2.data}
            </div>
          )}
          
          {fetcher2.error && (
            <div className="text-red-600 mt-2">
              {fetcher2.error.message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}