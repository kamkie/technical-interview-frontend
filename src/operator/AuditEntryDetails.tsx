import { useMemo } from 'react'

import type { AuditLog } from '../api/operator'
import { useI18n } from '../i18n/useI18n'
import { formatTimestamp } from '../ui/format'
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

export function AuditEntryDetails({ entry, index }: SelectedAuditEntry) {
  const { t } = useI18n()
  const structuredDetailsJson = useMemo(() => {
    const details = entry.details

    return hasStructuredDetails(details)
      ? JSON.stringify(details, null, 2)
      : null
  }, [entry])

  return (
    <div className="audit-detail-content">
      <dl className="operator-metadata">
        <div>
          <dt>Entry</dt>
          <dd>{createAuditEntryLabel(entry, index)}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatTimestamp(entry.createdAt, t('ui.common.unknown'))}</dd>
        </div>
        <div>
          <dt>Target type</dt>
          <dd>{formatEnumValue(entry.targetType, t('ui.common.unknown'))}</dd>
        </div>
        <div>
          <dt>Target ID</dt>
          <dd>{formatOptionalNumber(entry.targetId, t('ui.common.unavailable'))}</dd>
        </div>
        <div>
          <dt>Action</dt>
          <dd>{formatEnumValue(entry.action, t('ui.common.unknown'))}</dd>
        </div>
        <div>
          <dt>Actor</dt>
          <dd>{formatActor(entry.actorLogin, t('ui.operator.unknown-actor'))}</dd>
        </div>
      </dl>
      <div className="audit-detail-summary">
        <h3>Summary</h3>
        <p>{formatSummary(entry.summary, t('ui.operator.no-summary'))}</p>
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
  )
}
