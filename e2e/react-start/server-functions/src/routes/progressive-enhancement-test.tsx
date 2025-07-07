import { createFileRoute } from '@tanstack/react-router'
import { createServerFn, useServerFetcher } from '@tanstack/react-start'
import { z } from 'zod'

const greetUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.string().transform((val) => {
    const num = parseInt(val, 10)
    if (isNaN(num)) throw new Error('Age must be a number')
    return num
  }),
})

export const greetUser = createServerFn({ method: 'POST' })
  .validator((data: FormData) => {
    if (!(data instanceof FormData)) {
      throw new Error('Invalid! FormData is required')
    }
    
    const rawData = {
      name: data.get('name')?.toString() || '',
      age: data.get('age')?.toString() || '',
    }
    
    return greetUserSchema.parse(rawData)
  })
  .handler(({ data: { name, age } }) => {
    return `Hello, ${name}! You are ${age} years old.`
  })

export const Route = createFileRoute('/progressive-enhancement-test')({
  component: ProgressiveEnhancementTest,
})

function ProgressiveEnhancementTest() {
  const fetcher = useServerFetcher(greetUser)
  
  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Progressive Enhancement Test</h1>
      
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
        
        <div>
          <label htmlFor="age" className="block mb-1">Age:</label>
          <input
            type="text"
            name="age"
            id="age"
            className="border rounded px-2 py-1"
            required
          />
        </div>
        
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={fetcher.state === 'submitting'}
        >
          {fetcher.state === 'submitting' ? 'Submitting...' : 'Submit'}
        </button>
      </fetcher.Form>
      
      <div className="mt-4">
        <div data-testid="fetcher-state">{fetcher.state}</div>
        
        {fetcher.data && (
          <div data-testid="result" className="text-green-600 mt-2">
            {fetcher.data}
          </div>
        )}
        
        {fetcher.error && (
          <div data-testid="error" className="text-red-600 mt-2">
            {fetcher.error.message}
          </div>
        )}
      </div>
    </div>
  )
}