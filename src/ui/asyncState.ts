export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'error'; message: string }

export type MutationState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

export function getDisplayMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function formatLoadStatus(status: LoadState<unknown>['status']) {
  if (status === 'ready') {
    return 'Ready'
  }

  if (status === 'error') {
    return 'Needs attention'
  }

  return 'Loading'
}
