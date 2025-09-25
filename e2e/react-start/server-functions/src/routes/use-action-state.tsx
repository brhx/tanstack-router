import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { useActionState } from 'react'

type ActionState = {
  submissions: number
  lastName: string
}

async function submitGreeting(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  'use server'

  const nameField = formData.get('name')
  const nameValue = typeof nameField === 'string' ? nameField : ''

  return {
    submissions: prevState.submissions + 1,
    lastName: nameValue,
  }
}

export const Route = createFileRoute('/use-action-state')({
  component: UseActionStateDemo,
})

const initialState: ActionState = {
  submissions: 0,
  lastName: '',
}

function UseActionStateDemo() {
  const [state, formAction, isPending] = useActionState(submitGreeting, initialState)

  return (
    <div className="p-2 m-2 grid gap-3" data-testid="use-action-state-root">
      <h3>useActionState + 'use server'</h3>
      <form
        method="post"
        action={formAction}
        data-testid="use-action-state-form"
        className="grid gap-2"
      >
        <label className="grid gap-1">
          <span>Name</span>
          <input
            name="name"
            defaultValue="Ada"
            data-testid="use-action-state-input"
            className="rounded border px-2 py-1"
          />
        </label>
        <button
          type="submit"
          data-testid="use-action-state-submit"
          className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Submit
        </button>
      </form>
      <dl className="grid gap-2">
        <div className="grid gap-1">
          <dt className="text-sm font-medium">Submissions</dt>
          <dd data-testid="use-action-state-submissions">{state.submissions}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm font-medium">Last name</dt>
          <dd data-testid="use-action-state-last-name">{state.lastName || 'n/a'}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm font-medium">Status</dt>
          <dd data-testid="use-action-state-status">{isPending ? 'pending' : 'idle'}</dd>
        </div>
      </dl>
    </div>
  )
}
