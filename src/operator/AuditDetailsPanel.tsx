import type { AuditLog } from '../api/operator'
import { formatTimestamp } from '../ui/format'
import { StateBlock } from '../ui/StateBlock'
import {
  createAuditEntryLabel,
  formatEnumValue,
  formatOptionalNumber,
  hasStructuredDetails,
} from './auditFormat'

export function AuditDetailsPanel({
  entry,
  onCloseDetails,
}: {
  entry: AuditLog | null
  onCloseDetails: () => void
}) {
  return (
    <aside className="operator-details-panel" aria-labelledby="audit-details-title">
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">Details</p>
          <h2 id="audit-details-title">Audit details</h2>
          <p className="section-description">
            Select a row to inspect the structured audit payload without
            changing the current filters.
          </p>
        </div>
        {entry !== null && (
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

      {entry === null ? (
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
              <dd>{createAuditEntryLabel(entry, 0)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatTimestamp(entry.createdAt)}</dd>
            </div>
            <div>
              <dt>Target type</dt>
              <dd>{formatEnumValue(entry.targetType)}</dd>
            </div>
            <div>
              <dt>Target ID</dt>
              <dd>{formatOptionalNumber(entry.targetId)}</dd>
            </div>
            <div>
              <dt>Action</dt>
              <dd>{formatEnumValue(entry.action)}</dd>
            </div>
            <div>
              <dt>Actor</dt>
              <dd>{entry.actorLogin?.trim() ? entry.actorLogin : 'Unknown actor'}</dd>
            </div>
          </dl>
          <div className="audit-detail-summary">
            <h3>Summary</h3>
            <p>{entry.summary?.trim() ? entry.summary : 'No summary'}</p>
          </div>
          <div className="audit-detail-json">
            <h3>Structured details</h3>
            {hasStructuredDetails(entry.details) ? (
              <pre>{JSON.stringify(entry.details, null, 2)}</pre>
            ) : (
              <p className="session-message muted">
                No structured details available.
              </p>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
