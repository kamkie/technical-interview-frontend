import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('App', () => {
  it('renders the frontend shell baseline', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Technical Interview Frontend',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Vite + React + TypeScript')).toBeInTheDocument()
  })
})
