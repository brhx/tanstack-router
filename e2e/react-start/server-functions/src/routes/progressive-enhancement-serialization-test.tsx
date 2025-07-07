import { createFileRoute } from '@tanstack/react-router'
import { createServerFn, useServerFetcher } from '@tanstack/react-start'
import * as React from 'react'

// Server function that returns complex data types
export const complexDataServerFn = createServerFn({ method: 'POST' })
  .handler(({ data }: { data: FormData }) => {
    const value = data.get('value')?.toString() || '1'
    const num = parseInt(value, 10)
    
    return {
      message: `Complex data for value: ${num}`,
      date: new Date('2024-01-15T10:30:00Z'),
      bigInt: BigInt(num) * BigInt(1000000),
      number: num,
      nested: {
        date: new Date('2023-12-25T00:00:00Z'),
        array: [
          { id: 1, createdAt: new Date('2023-01-01T00:00:00Z') },
          { id: 2, createdAt: new Date('2023-06-15T12:00:00Z') },
        ]
      }
    }
  })

export const Route = createFileRoute('/progressive-enhancement-serialization-test')({
  component: Component,
})

function Component() {
  const fetcher = useServerFetcher(complexDataServerFn)
  const [value, setValue] = React.useState(1)

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Serialization Test</h1>
      
      <fetcher.Form className="mb-4">
        <input type="hidden" name="value" value={value} />
        <button 
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          data-testid="submit-button"
        >
          Submit (value: {value})
        </button>
      </fetcher.Form>
      
      <button 
        onClick={() => setValue(v => v + 1)}
        className="bg-gray-500 text-white px-4 py-2 rounded mb-4"
        data-testid="increment-button"
      >
        Increment Value
      </button>
      
      {fetcher.data && (
        <div data-testid="result" className="bg-gray-100 p-4 rounded">
          <div data-testid="message">{fetcher.data.message}</div>
          <div data-testid="date">{fetcher.data.date.toISOString()}</div>
          <div data-testid="bigint">{fetcher.data.bigInt.toString()}</div>
          <div data-testid="nested-date">{fetcher.data.nested.date.toISOString()}</div>
          <div data-testid="array-dates">
            {fetcher.data.nested.array.map(item => 
              `${item.id}:${item.createdAt.toISOString()}`
            ).join(', ')}
          </div>
        </div>
      )}
      
      <div data-testid="fetcher-state" className="mt-2">
        State: {fetcher.state}
      </div>
    </div>
  )
}