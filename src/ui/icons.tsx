import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function iconDefaults(props: IconProps): IconProps {
  return {
    'aria-hidden': true,
    fill: 'none',
    focusable: false,
    height: 16,
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    viewBox: '0 0 24 24',
    width: 16,
    ...props,
  }
}

export function IconBookOpen(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

export function IconChevronDown(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function IconChevronLeft(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function IconGlobe(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </svg>
  )
}

export function IconMonitor(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

export function IconMoon(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

export function IconSun(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
    </svg>
  )
}

export function IconUser(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </svg>
  )
}
