const readinessItems = [
  {
    label: 'Stack',
    value: 'Vite + React + TypeScript',
  },
  {
    label: 'Runtime',
    value: 'Node.js 24 with npm',
  },
  {
    label: 'Next',
    value: 'Backend contract types',
  },
] as const

export function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="brand-mark" aria-hidden="true">
          TI
        </span>
        <span className="brand-name">Technical Interview Frontend</span>
      </header>

      <main className="workspace">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">First-party browser UI</p>
          <h1 id="page-title">Technical Interview Frontend</h1>
          <p className="lede">
            Contract-first React app shell for the technical-interview-demo
            backend.
          </p>
        </section>

        <section className="readiness-grid" aria-label="Project baseline">
          {readinessItems.map((item) => (
            <article className="readiness-card" key={item.label}>
              <h2>{item.label}</h2>
              <p>{item.value}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}

export default App
