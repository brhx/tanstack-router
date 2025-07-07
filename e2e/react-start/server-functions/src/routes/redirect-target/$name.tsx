import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/redirect-target/$name')({
  component: RedirectTarget,
})

function RedirectTarget() {
  const { name } = Route.useParams()
  
  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Redirect Target</h1>
      <div data-testid="redirect-target">
        Welcome, {name}!
      </div>
    </div>
  )
}