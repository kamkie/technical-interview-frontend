import type { ReactNode } from 'react'

export type StateVariant = 'empty' | 'error' | 'loading' | 'success'

export function StateBlock({
  children,
  message,
  title,
  variant,
}: {
  children?: ReactNode
  message?: ReactNode
  title: ReactNode
  variant: StateVariant
}) {
  return (
    <div className={`state-block ${variant}-state`} data-state={variant}>
      {variant === 'loading' && (
        <span className="state-spinner" aria-hidden="true" />
      )}
      <p className="state-block-title">{title}</p>
      {children ?? <StateMessage variant={variant}>{message}</StateMessage>}
    </div>
  )
}

export function StateMessage({
  children,
  variant,
}: {
  children: ReactNode
  variant: StateVariant
}) {
  const role =
    variant === 'error'
      ? 'alert'
      : variant === 'loading' || variant === 'success'
        ? 'status'
        : undefined

  return (
    <p className={getStateMessageClassName(variant)} data-state={variant} role={role}>
      {children}
    </p>
  )
}

function getStateMessageClassName(variant: StateVariant) {
  if (variant === 'error') {
    return 'session-message error'
  }

  if (variant === 'empty') {
    return 'session-message muted'
  }

  if (variant === 'success') {
    return 'session-message success'
  }

  return 'session-message'
}
