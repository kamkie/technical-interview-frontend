import type { SVGProps } from 'react'

// Simplified inline flags for the supported account languages. Flag emoji
// render as plain letter pairs on Windows, so these stay as tiny SVGs.
export type FlagProps = SVGProps<SVGSVGElement>

function flagFrame(props: FlagProps) {
  return {
    'aria-hidden': true,
    focusable: false,
    height: 14,
    viewBox: '0 0 20 14',
    width: 20,
    xmlns: 'http://www.w3.org/2000/svg',
    ...props,
  } as const
}

export function FlagEn(props: FlagProps) {
  return (
    <svg {...flagFrame(props)}>
      <rect width="20" height="14" fill="#012169" />
      <path d="M0 0 L20 14 M20 0 L0 14" stroke="#ffffff" strokeWidth="3" />
      <path d="M0 0 L20 14 M20 0 L0 14" stroke="#c8102e" strokeWidth="1.2" />
      <path d="M10 0 V14 M0 7 H20" stroke="#ffffff" strokeWidth="4.6" />
      <path d="M10 0 V14 M0 7 H20" stroke="#c8102e" strokeWidth="2.6" />
    </svg>
  )
}

export function FlagEs(props: FlagProps) {
  return (
    <svg {...flagFrame(props)}>
      <rect width="20" height="14" fill="#aa151b" />
      <rect y="3.5" width="20" height="7" fill="#f1bf00" />
    </svg>
  )
}

export function FlagDe(props: FlagProps) {
  return (
    <svg {...flagFrame(props)}>
      <rect width="20" height="14" fill="#000000" />
      <rect y="4.67" width="20" height="4.67" fill="#dd0000" />
      <rect y="9.33" width="20" height="4.67" fill="#ffce00" />
    </svg>
  )
}

export function FlagFr(props: FlagProps) {
  return (
    <svg {...flagFrame(props)}>
      <rect width="20" height="14" fill="#ffffff" />
      <rect width="6.67" height="14" fill="#002654" />
      <rect x="13.33" width="6.67" height="14" fill="#ce1126" />
    </svg>
  )
}

export function FlagPl(props: FlagProps) {
  return (
    <svg {...flagFrame(props)}>
      <rect width="20" height="14" fill="#ffffff" />
      <rect y="7" width="20" height="7" fill="#dc143c" />
    </svg>
  )
}

export function FlagUk(props: FlagProps) {
  return (
    <svg {...flagFrame(props)}>
      <rect width="20" height="14" fill="#0057b7" />
      <rect y="7" width="20" height="7" fill="#ffd700" />
    </svg>
  )
}

export function FlagNo(props: FlagProps) {
  return (
    <svg {...flagFrame(props)}>
      <rect width="20" height="14" fill="#ba0c2f" />
      <path d="M7 0 V14 M0 7 H20" stroke="#ffffff" strokeWidth="4" />
      <path d="M7 0 V14 M0 7 H20" stroke="#00205b" strokeWidth="2" />
    </svg>
  )
}

