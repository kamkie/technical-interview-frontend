import type { MutationState } from './asyncState'
import { StateMessage } from './StateBlock'

export function MutationFeedback({ state }: { state: MutationState }) {
  if (state.status === 'success') {
    return <StateMessage variant="success">{state.message}</StateMessage>
  }

  if (state.status === 'error') {
    return <StateMessage variant="error">{state.message}</StateMessage>
  }

  return null
}
