import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  fetchOperatorSurface,
  getSafeOperatorApiPath,
  type OperatorSurface,
} from '../api/operator'
import type { SessionResponse } from '../api/session'
import { getDisplayMessage, type LoadState } from '../ui/asyncState'
import { formatTimestamp } from '../ui/format'
import { StateBlock } from '../ui/StateBlock'
import { formatOptionalNumber } from './auditFormat'
import { OPERATOR_ROUTE_PATH } from './OperatorPage'

export const OPERATOR_DIAGNOSTICS_ROUTE_PATH = '/operator/diagnostics' as const

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
        <OperatorOverview state={overviewState} />
      </section>
    </section>
  )
}

function OperatorOverview({ state }: { state: LoadState<OperatorSurface> }) {
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
        <AuditSummary audit={surface.audit} />
        <DependenciesCard runtime={surface.runtime} />
      </div>
      <div className="operator-overview-side">
        <RuntimeSummary runtime={surface.runtime} />
        <ConfigurationCard runtime={surface.runtime} />
      </div>
    </div>
  )
}

// Browsing, filtering, and pagination of audit rows live on the operations
// console; this card stays a stats summary that links there.
function AuditSummary({ audit }: { audit: OperatorSurface['audit'] }) {
  const safeAuditEndpoint = getSafeOperatorApiPath(audit?.auditLogEndpoint)

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
      <p className="audit-summary-link">
        <Link to={OPERATOR_ROUTE_PATH}>Browse audit rows</Link>
      </p>
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
      <OperatorMetadataGroup title="Build" items={buildItems} />
      <OperatorMetadataGroup title="Git" items={gitItems} />
      <OperatorMetadataGroup title="Runtime" items={runtimeItems} />
    </section>
  )
}

function DependenciesCard({
  runtime,
}: {
  runtime: OperatorSurface['runtime']
}) {
  const dependencyItems = compactMetadataItems(
    Object.entries(runtime?.technicalOverview?.dependencies ?? {}).map(
      ([name, version]) => [name, version],
    ),
  )

  return (
    <section
      className="operator-card operator-card-dependencies"
      aria-labelledby="dependencies-summary-title"
    >
      <h2 id="dependencies-summary-title">Dependencies</h2>
      <OperatorMetadataList
        items={dependencyItems}
        unavailable="Dependency details unavailable."
      />
    </section>
  )
}

function ConfigurationCard({
  runtime,
}: {
  runtime: OperatorSurface['runtime']
}) {
  const overview = runtime?.technicalOverview
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
      className="operator-card operator-card-configuration"
      aria-labelledby="configuration-summary-title"
    >
      <h2 id="configuration-summary-title">Configuration</h2>
      <OperatorMetadataList
        items={configurationItems}
        unavailable="Configuration details unavailable."
      />
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
  title,
}: {
  items: readonly [string, string][]
  title: string
}) {
  return (
    <div className="operator-metadata-group">
      <h3>{title}</h3>
      <OperatorMetadataList
        items={items}
        unavailable={`${title} details unavailable.`}
      />
    </div>
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
