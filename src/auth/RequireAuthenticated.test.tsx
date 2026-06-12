import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  subscribeToConnectionRecovery,
  useHasPageConnectionSurface,
} from '../ui/asyncState'
import { RequireAuthenticated } from './RequireAuthenticated'

// Mirrors the topbar's suppression read so the guard's registration is
// observable without mounting the whole shell.
function PageSurfaceProbe() {
  return useHasPageConnectionSurface() ? (
    <p>page surface registered</p>
  ) : (
    <p>no page surface</p>
  )
}

describe('RequireAuthenticated', () => {
  it('renders the session error surface with a retry that broadcasts connection recovery', () => {
    const recoveryListener = vi.fn()
    const unsubscribe = subscribeToConnectionRecovery(recoveryListener)

    render(
      <RequireAuthenticated
        state={{ status: 'error', message: 'boom', unreachable: true }}
      >
        <p>guarded content</p>
      </RequireAuthenticated>,
    )

    expect(
      screen.getByRole('heading', { name: 'Session unavailable' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The service cannot be reached right now. Check your connection or try again shortly.',
    )
    expect(screen.queryByText('guarded content')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(recoveryListener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('renders the sign-in guard with the available login providers', () => {
    render(
      <RequireAuthenticated
        state={{
          status: 'ready',
          session: {
            authenticated: false,
            loginProviders: [
              {
                clientName: 'GitHub',
                registrationId: 'github',
                authorizationPath: '/api/oauth2/authorization/github',
              },
            ],
          },
        }}
      >
        <p>guarded content</p>
      </RequireAuthenticated>,
    )

    expect(
      screen.getByRole('heading', { name: 'Sign in required' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Use an available login provider to access this area.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Sign in with GitHub' }),
    ).toHaveAttribute('href', '/api/oauth2/authorization/github')
    expect(screen.queryByText('guarded content')).not.toBeInTheDocument()
  })

  it('registers the error block as the page connection surface only while erroring', () => {
    const { rerender } = render(
      <>
        <RequireAuthenticated state={{ status: 'error', message: 'boom' }}>
          <p>guarded content</p>
        </RequireAuthenticated>
        <PageSurfaceProbe />
      </>,
    )

    expect(screen.getByText('page surface registered')).toBeInTheDocument()

    rerender(
      <>
        <RequireAuthenticated state={{ status: 'loading' }}>
          <p>guarded content</p>
        </RequireAuthenticated>
        <PageSurfaceProbe />
      </>,
    )

    expect(screen.getByText('no page surface')).toBeInTheDocument()
    expect(screen.getByText('Checking authentication')).toBeInTheDocument()
  })
})
