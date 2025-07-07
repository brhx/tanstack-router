# Progressive Enhancement with useServerFetcher

Progressive enhancement is a web development strategy that ensures your application works for all users, regardless of their browser capabilities or whether JavaScript is enabled. With TanStack Router's `useServerFetcher` hook, you can build forms that work both with and without JavaScript.

## Overview

The `useServerFetcher` hook provides a fetcher-like API similar to React Router's `useFetcher`, allowing you to:

- Submit forms that work without JavaScript
- Handle server function results seamlessly
- Maintain application state across page reloads
- Support complex data types like Date and BigInt

## Basic Usage

```tsx
import { useServerFetcher } from '@tanstack/react-start'
import { createServerFn } from '@tanstack/react-start'

// Define a server function
const greetUser = createServerFn({ method: 'POST' })
  .handler(({ data }) => {
    const formData = data as FormData
    const name = formData.get('name')
    return `Hello, ${name}!`
  })

function MyComponent() {
  const fetcher = useServerFetcher(greetUser)

  return (
    <div>
      <fetcher.Form>
        <input type="text" name="name" required />
        <button type="submit">Submit</button>
      </fetcher.Form>
      
      {fetcher.data && <p>{fetcher.data}</p>}
      {fetcher.error && <p>Error: {fetcher.error.message}</p>}
    </div>
  )
}
```

## How It Works

### With JavaScript Enabled

When JavaScript is enabled, the form submission is intercepted and handled via AJAX:

1. The form's `onSubmit` event is captured
2. Form data is sent to the server function endpoint
3. The response is processed and state is updated
4. No page reload occurs

### Without JavaScript

When JavaScript is disabled, the form falls back to standard HTML form submission:

1. The form submits to the server function's URL endpoint
2. The server processes the request and stores the result in a flash cookie
3. The server redirects back to the original page
4. On page load, the flash data is injected and hydrated
5. The result is displayed to the user

## API Reference

### useServerFetcher

```tsx
function useServerFetcher<TServerFn>(
  serverFn: TServerFn
): ServerFetcher<TServerFn>
```

Returns a fetcher object with the following properties:

- `Form`: A React component that renders a progressively enhanced form
- `submit`: A function to programmatically submit data
- `load`: An alias for `submit`
- `data`: The result data from the last successful submission
- `error`: Any error from the last submission
- `state`: The current state ('idle' | 'loading' | 'submitting')

### Form Component

The `Form` component accepts all standard HTML form attributes and automatically:

- Sets the correct `action` URL for the server function
- Uses `POST` method by default
- Handles progressive enhancement transparently

## Advanced Features

### Complex Data Serialization

The system automatically handles serialization of complex data types:

```tsx
const serverFn = createServerFn({ method: 'POST' })
  .handler(() => {
    return {
      date: new Date(),
      bigInt: BigInt(123456789),
      nested: {
        dates: [new Date('2023-01-01'), new Date('2024-01-01')]
      }
    }
  })
```

### Error Handling

Errors are automatically captured and made available through the `error` property:

```tsx
if (fetcher.error) {
  return <div>Error: {fetcher.error.message}</div>
}
```

### Redirects

Server functions can return redirects, which work seamlessly with or without JavaScript:

```tsx
const submitForm = createServerFn({ method: 'POST' })
  .handler(({ data }) => {
    // Process form...
    return redirect({ to: '/success' })
  })
```

## Best Practices

1. **Always provide meaningful fallbacks**: Ensure your UI makes sense when JavaScript is disabled
2. **Use semantic HTML**: Proper form elements ensure accessibility
3. **Test without JavaScript**: Regularly test your forms with JavaScript disabled
4. **Handle loading states**: Show appropriate feedback during submissions
5. **Validate on the server**: Never trust client-side validation alone

## Example: Complete Form

```tsx
import { useServerFetcher } from '@tanstack/react-start'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
})

const submitContact = createServerFn({ method: 'POST' })
  .validator((data: FormData) => {
    return schema.parse({
      name: data.get('name'),
      email: data.get('email'),
    })
  })
  .handler(async ({ data }) => {
    // Save to database, send email, etc.
    return { success: true, message: `Thanks ${data.name}!` }
  })

function ContactForm() {
  const fetcher = useServerFetcher(submitContact)

  return (
    <div>
      <fetcher.Form>
        <label>
          Name:
          <input type="text" name="name" required />
        </label>
        
        <label>
          Email:
          <input type="email" name="email" required />
        </label>
        
        <button type="submit" disabled={fetcher.state === 'submitting'}>
          {fetcher.state === 'submitting' ? 'Sending...' : 'Send'}
        </button>
      </fetcher.Form>
      
      {fetcher.data?.success && (
        <p>{fetcher.data.message}</p>
      )}
      
      {fetcher.error && (
        <p>Error: {fetcher.error.message}</p>
      )}
    </div>
  )
}
```