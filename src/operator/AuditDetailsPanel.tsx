import { useMemo } from 'react'

import type { AuditLog } from '../api/operator'
import { formatTimestamp } from '../ui/format'
import { StateBlock } from '../ui/StateBlock'
import {
  createAuditEntryLabel,
  formatActor,
  formatEnumValue,
  formatOptionalNumber,
  formatSummary,
  hasStructuredDetails,
} from './auditFormat'

export type SelectedAuditEntry = {
  entry: AuditLog
  index: number
}

export function AuditDetailsPanel({
  description,
  onCloseDetails,
  selected,
}: {
  description: string
  onCloseDetails: () => void
  selected: SelectedAuditEntry | null
}) {
  const structuredDetailsJson = useMemo(() => {
    const details = selected?.entry.details

    return hasStructuredDetails(details)
      ? JSON.stringify(details, null, 2)
      : null
  }, [selected])

  return (
    <section
      className="operator-details-panel"
      aria-labelledby="audit-details-title"
    >
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">Details</p>
          <h2 id="audit-details-title">Audit details</h2>
          <p className="section-description">{description}</p>
        </div>
        {selected !== null && (
          <div className="section-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onCloseDetails}
            >
              Close details
            </button>
          </div>
        )}
      </div>

      {selected === null ? (
        <StateBlock
          message="Select an audit entry to inspect its read-only details."
          title="No audit entry selected"
          variant="empty"
        />
      ) : (
        <div className="audit-detail-content">
          <dl className="operator-metadata">
            <div>
              <dt>Entry</dt>
              <dd>{createAuditEntryLabel(selected.entry, selected.index)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatTimestamp(selected.entry.createdAt)}</dd>
            </div>
            <div>
              <dt>Target type</dt>
              <dd>{formatEnumValue(selected.entry.targetType)}</dd>
            </div>
            <div>
              <dt>Target ID</dt>
              <dd>{formatOptionalNumber(selected.entry.targetId)}</dd>
            </div>
            <div>
              <dt>Action</dt>
              <dd>{formatEnumValue(selected.entry.action)}</dd>
            </div>
            <div>
              <dt>Actor</dt>
              <dd>{formatActor(selected.entry.actorLogin)}</dd>
            </div>
          </dl>
          <div className="audit-detail-summary">
            <h3>Summary</h3>
            <p>{formatSummary(selected.entry.summary)}</p>
          </div>
          <div className="audit-detail-json">
            <h3>Structured details</h3>
            {structuredDetailsJson !== null ? (
              <pre>{structuredDetailsJson}</pre>
            ) : (
              <p className="session-message muted">
                No structured details available.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
