import { useRef, type KeyboardEvent, type ReactNode } from 'react'

export type TabItem = {
  id: string
  label: ReactNode
  panel: ReactNode
}

export function Tabs({
  activeTab,
  ariaLabel,
  idPrefix,
  onTabChange,
  tabs,
}: {
  activeTab: string
  ariaLabel: string
  idPrefix: string
  onTabChange: (tabId: string) => void
  tabs: readonly TabItem[]
}) {
  const tabListRef = useRef<HTMLDivElement | null>(null)
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]

  function moveFocusTo(tabId: string) {
    onTabChange(tabId)
    tabListRef.current
      ?.querySelector<HTMLButtonElement>(`#${idPrefix}-tab-${tabId}`)
      ?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = tabs.findIndex((tab) => tab.id === active.id)

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      moveFocusTo(tabs[(currentIndex - 1 + tabs.length) % tabs.length].id)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      moveFocusTo(tabs[(currentIndex + 1) % tabs.length].id)
    } else if (event.key === 'Home') {
      event.preventDefault()
      moveFocusTo(tabs[0].id)
    } else if (event.key === 'End') {
      event.preventDefault()
      moveFocusTo(tabs[tabs.length - 1].id)
    }
  }

  return (
    <div className="tab-stack">
      <div
        aria-label={ariaLabel}
        className="tab-list"
        ref={tabListRef}
        role="tablist"
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => {
          const selected = tab.id === active.id

          return (
            <button
              aria-controls={selected ? `${idPrefix}-panel-${tab.id}` : undefined}
              aria-selected={selected}
              className="tab-button"
              id={`${idPrefix}-tab-${tab.id}`}
              key={tab.id}
              role="tab"
              tabIndex={selected ? 0 : -1}
              type="button"
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div
        aria-labelledby={`${idPrefix}-tab-${active.id}`}
        className="tab-panel"
        id={`${idPrefix}-panel-${active.id}`}
        key={active.id}
        role="tabpanel"
      >
        {active.panel}
      </div>
    </div>
  )
}
