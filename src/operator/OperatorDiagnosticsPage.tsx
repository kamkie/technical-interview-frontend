import { useEffect, useState } from 'react'

import {
  fetchOperatorSurface,
  getSafeOperatorApiPath,
  type AuditLog,
  type OperatorSurface,
} from '../api/operator'
import type { SessionResponse } from '../api/session'
import { getDisplayMessage, type LoadState } from '../ui/asyncState'
import { formatTimestamp } from '../ui/format'
import { StateBlock } from '../ui/StateBlock'
import {
  AuditEntryDetails,
  type SelectedAuditEntry,
} from './AuditEntryDetails'
import {
  createAuditEntryKey,
  formatAuditDescriptor,
  formatOptionalNumber,
  formatSummary,
} from './auditFormat'

export const OPERATOR_DIAGNOSTICS_ROUTE_PATH = '/operator/diagnostics' as const

const EMPTY_AUDIT_ROWS: readonly AuditLog[] = []
const HEALTHY_OPERATIONAL_VALUES = new Set([
  'UP',
  'CORRECT',
  'ACCEPTING_TRAFFIC',
])

type SurfaceCacheEntry = {
  promise: Promise<OperatorSurface>
  session: SessionResponse
  value?: OperatorSurface
}

// The operator surface payload is immutable per deployment, so one fetch per
// session avoids refetching when the diagnostics route remounts.
let surfaceCache: SurfaceCacheEntry | null = null

function loadOperatorSurface(session: SessionResponse) {
  if (surfaceCache?.session === session) {
    return surfaceCache.promise
  }

  const entry: SurfaceCacheEntry = {
    session,
    promise: fetchOperatorSurface().then(
      (surface) => {
        entry.value = surface

        return surface
      },
      (error: unknown) => {
        if (surfaceCache === entry) {
          surfaceCache = null
        }

        throw error
      },
    ),
  }

  surfaceCache = entry

  return entry.promise
}

export function OperatorDiagnosticsPage({
  session,
}: {
  session: SessionResponse
}) {
  const [overviewState, setOverviewState] = useState<LoadState<OperatorSurface>>(
    () =>
      surfaceCache?.session === session && surfaceCache.value !== undefined
        ? { status: 'ready', value: surfaceCache.value }
        : { status: 'loading' },
  )
  const [selectedAuditEntry, setSelectedAuditEntry] =
    useState<SelectedAuditEntry | null>(null)

  useEffect(() => {
    if (session.authenticated !== true) {
      return undefined
    }

    let ignore = false

    loadOperatorSurface(session)
      .then((surface) => {
        if (!ignore) {
          setOverviewState({ status: 'ready', value: surface })
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setOverviewState({
            status: 'error',
            message: getDisplayMessage(
              error,
              'Operator overview could not be loaded.',
            ),
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [session])

  function toggleDetails(entry: AuditLog, index: number) {
    setSelectedAuditEntry((current) =>
      current?.index === index ? null : { entry, index },
    )
  }

  if (session.authenticated !== true) {
    return (
      <section className="operator-panel" aria-label="System diagnostics">
        <StateBlock
          message="Sign in is required for system diagnostics."
          title="Sign in required"
          variant="error"
        />
      </section>
    )
  }

  return (
    <section className="operator-panel" aria-label="System diagnostics">
      <section className="operator-section" aria-label="Diagnostics overview">
        <OperatorOverview
          selectedAuditEntry={selectedAuditEntry}
          state={overviewState}
          onSelectEntry={toggleDetails}
        />
      </section>
    </section>
  )
}

function OperatorOverview({
  onSelectEntry,
  selectedAuditEntry,
  state,
}: {
  onSelectEntry: (entry: AuditLog, index: number) => void
  selectedAuditEntry: SelectedAuditEntry | null
  state: LoadState<OperatorSurface>
}) {
  if (state.status === 'loading') {
    return (
      <StateBlock
        message="Loading operator overview..."
        title="Loading operator overview"
        variant="loading"
      />
    )
  }

  if (state.status === 'error') {
    return (
      <StateBlock
        message={state.message}
        title="Operator overview unavailable"
        variant="error"
      />
    )
  }

  const surface = state.value

  return (
    <div className="operator-overview-grid">
      <div className="operator-overview-side">
        <OperationalStatus operations={surface.operations} />
        <RuntimeSummary runtime={surface.runtime} />
      </div>
      <AuditSummary
        audit={surface.audit}
        selectedAuditEntry={selectedAuditEntry}
        onSelectEntry={onSelectEntry}
      />
    </div>
  )
}

function AuditSummary({
  audit,
  onSelectEntry,
  selectedAuditEntry,
}: {
  audit: OperatorSurface['audit']
  onSelectEntry: (entry: AuditLog, index: number) => void
  selectedAuditEntry: SelectedAuditEntry | null
}) {
  const safeAuditEndpoint = getSafeOperatorApiPath(audit?.auditLogEndpoint)
  const recentEntries = audit?.recentEntries ?? EMPTY_AUDIT_ROWS

  return (
    <section
      className="operator-card operator-card-audit"
      aria-labelledby="audit-summary-title"
    >
      <h2 id="audit-summary-title">Audit summary</h2>
      <dl className="operator-metadata">
        <div>
          <dt>Total entries</dt>
          <dd>{formatOptionalNumber(audit?.totalEntries)}</dd>
        </div>
        <div>
          <dt>Audit API</dt>
          <dd>{safeAuditEndpoint ?? 'Unavailable'}</dd>
        </div>
      </dl>
      <div className="recent-audit-list" aria-label="Recent audit entries">
        <h3>Recent entries</h3>
        {recentEntries.length === 0 ? (
          <p className="session-message muted">
            No recent audit entries available.
          </p>
        ) : (
          <ul>
            {recentEntries.map((entry, index) => {
              const expanded = selectedAuditEntry?.index === index
              const detailsId = `recent-audit-entry-details-${index}`

              return (
                <li key={createAuditEntryKey(entry, index)}>
                  <button
                    aria-controls={detailsId}
                    aria-expanded={expanded}
                    type="button"
                    onClick={() => onSelectEntry(entry, index)}
                  >
                    <span>{formatSummary(entry.summary)}</span>
                    <span>{formatAuditDescriptor(entry)}</span>
                  </button>
                  {expanded && (
                    <div className="recent-audit-entry-details" id={detailsId}>
                      <AuditEntryDetails entry={entry} index={index} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

function RuntimeSummary({
  runtime,
}: {
  runtime: OperatorSurface['runtime']
}) {
  const overview = runtime?.technicalOverview
  const buildItems = compactMetadataItems([
    ['Name', overview?.build?.name],
    ['Group', overview?.build?.group],
    ['Artifact', overview?.build?.artifact],
    ['Version', overview?.build?.version],
    ['Build time', formatOptionalTimestamp(overview?.build?.time)],
  ])
  const gitItems = compactMetadataItems([
    ['Branch', overview?.git?.branch],
    ['Commit', overview?.git?.shortCommitId ?? overview?.git?.commitId],
    ['Commit time', formatOptionalTimestamp(overview?.git?.commitTime)],
  ])
  const runtimeItems = compactMetadataItems([
    ['Application', overview?.runtime?.applicationName],
    ['Java version', overview?.runtime?.javaVersion],
    ['Java vendor', overview?.runtime?.javaVendor],
    ['Profiles', overview?.runtime?.activeProfiles?.join(', ')],
  ])
  const dependencyItems = compactMetadataItems(
    Object.entries(overview?.dependencies ?? {}).map(([name, version]) => [
      name,
      version,
    ]),
  )
  const configurationItems = compactMetadataItems([
    ['Default page size', overview?.configuration?.pagination?.defaultPageSize],
    ['Max page size', overview?.configuration?.pagination?.maxPageSize],
    ['Session store', overview?.configuration?.session?.storeType],
    ['Session timeout', overview?.configuration?.session?.timeout],
    ['Session cookie', overview?.configuration?.session?.cookieName],
    [
      'Exposed endpoints',
      overview?.configuration?.observability?.exposedEndpoints?.join(', '),
    ],
    [
      'Health probes',
      formatOptionalBoolean(
        overview?.configuration?.observability?.healthProbesEnabled,
      ),
    ],
    [
      'Tracing sample',
      overview?.configuration?.observability?.tracingSamplingProbability,
    ],
    [
      'OpenAPI version',
      overview?.configuration?.documentation?.openApiVersion,
    ],
    ['CSRF enabled', formatOptionalBoolean(overview?.configuration?.security?.csrfEnabled)],
    ['Public API path', overview?.configuration?.security?.publicApiPathPattern],
    ['Shutdown mode', overview?.configuration?.shutdown?.serverShutdown],
  ])

  return (
    <section
      className="operator-card operator-card-runtime"
      aria-labelledby="runtime-summary-title"
    >
      <h2 id="runtime-summary-title">Runtime summary</h2>
      <dl className="operator-metadata single-column">
        <div>
          <dt>Technical overview endpoint</dt>
          <dd>{runtime?.technicalOverviewEndpoint ?? 'Unavailable'}</dd>
        </div>
      </dl>
      <OperatorMetadataGroup title="Build" items={buildItems} open />
      <OperatorMetadataGroup title="Git" items={gitItems} />
      <OperatorMetadataGroup title="Runtime" items={runtimeItems} />
      <OperatorMetadataGroup title="Dependencies" items={dependencyItems} />
      <OperatorMetadataGroup title="Configuration" items={configurationItems} />
    </section>
  )
}

function OperationalStatus({
  operations,
}: {
  operations: OperatorSurface['operations']
}) {
  const healthItems = compactMetadataItems([
    ['Health', operations?.applicationHealthStatus],
    ['Liveness', operations?.livenessState],
    ['Readiness', operations?.readinessState],
  ])
  const endpointItems = compactMetadataItems([
    ['Health endpoint', operations?.actuatorHealthEndpoint],
    ['Info endpoint', operations?.actuatorInfoEndpoint],
    ['Prometheus endpoint', operations?.actuatorPrometheusEndpoint],
  ])

  return (
    <section
      className="operator-card operator-card-status"
      aria-labelledby="operations-summary-title"
    >
      <h2 id="operations-summary-title">Operational status</h2>
      {healthItems.length === 0 && endpointItems.length === 0 ? (
        <p className="session-message muted">Operational status unavailable.</p>
      ) : (
        <>
          {healthItems.length > 0 && (
            <dl className="operator-metadata">
              {healthItems.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>
                    <span
                      className={`health-pill ${
                        isHealthyOperationalValue(value) ? 'ok' : 'attention'
                      }`}
                    >
                      {value}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {endpointItems.length > 0 && (
            <OperatorMetadataList
              items={endpointItems}
              unavailable="Operational status unavailable."
            />
          )}
        </>
      )}
    </section>
  )
}

function OperatorMetadataGroup({
  items,
  open = false,
  title,
}: {
  items: readonly [string, string][]
  open?: boolean
  title: string
}) {
  return (
    <details className="operator-metadata-group" open={open}>
      <summary>
        {title}
        <span className="metadata-count" aria-hidden="true">
          {items.length}
        </span>
      </summary>
      <OperatorMetadataList
        items={items}
        unavailable={`${title} details unavailable.`}
      />
    </details>
  )
}

function OperatorMetadataList({
  items,
  unavailable,
}: {
  items: readonly [string, string][]
  unavailable: string
}) {
  if (items.length === 0) {
    return <p className="session-message muted">{unavailable}</p>
  }

  return (
    <dl className="operator-metadata">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function isHealthyOperationalValue(value: string) {
  return HEALTHY_OPERATIONAL_VALUES.has(value.trim().toUpperCase())
}

function compactMetadataItems(
  items: readonly (readonly [string, unknown])[],
): [string, string][] {
  return items.flatMap(([label, value]) => {
    const formatted = formatOptionalValue(value)

    return formatted === undefined ? [] : [[label, formatted] as [string, string]]
  })
}

function formatOptionalBoolean(value: boolean | undefined) {
  if (value === undefined) {
    return undefined
  }

  return value ? 'Yes' : 'No'
}

function formatOptionalValue(value: unknown) {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value === 'string') {
    return value.trim() ? value : undefined
  }

  return String(value)
}

function formatOptionalTimestamp(value: string | undefined) {
  if (!value) {
    return undefined
  }

  return formatTimestamp(value)
}
