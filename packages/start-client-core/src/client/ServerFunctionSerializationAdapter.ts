import { createSerializationAdapter } from '@tanstack/router-core'
import { TSS_SERVER_FUNCTION } from '../constants'
import type { ServerReferenceFn } from '../serverReference'
import { createClientRpc } from './createClientRpc'

export const ServerFunctionSerializationAdapter = createSerializationAdapter({
  key: '$TSS/serverfn',
  test: (v): v is ServerReferenceFn => {
    if (typeof v !== 'function') return false

    if (!(TSS_SERVER_FUNCTION in v)) return false

    if (!v[TSS_SERVER_FUNCTION]) return false

    const candidate = v as Partial<ServerReferenceFn>
    return typeof candidate.functionId === 'string'
  },
  toSerializable: ({ functionId }) => ({ functionId }),
  fromSerializable: ({ functionId }) => createClientRpc(functionId),
})
