import type { MutationState } from './asyncState'

export function MutationFeedback({ state }: { state: MutationState }) {
  if (state.status === 'success') {
    return (
      <p className="session-message" role="status">
        {state.message}
      </p>
    )
  }

  if (state.status === 'error') {
    return (
      <p className="session-message error" role="alert">
        {state.message}
      </p>
    )
  }

  return null
}
