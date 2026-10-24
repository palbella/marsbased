import type { AiInsightKind, Evidence } from '@/domain'
import type { MilestoneView } from '@/mocks/engine/timeline'

// 04 §14: every Phase 1 output names the mock model.
export const MOCK_MODEL = 'mock-v1'

// 02 §6.3: the envelope shared by every AI output (P3).
export function insight<Kind extends AiInsightKind, Content>(
  kind: Kind,
  content: Content,
  confidence: number,
  evidence: Evidence[],
  now: Date,
) {
  return { kind, content, confidence, evidence, generatedAt: now.toISOString(), model: MOCK_MODEL }
}

export function milestoneEvidence(text: string, milestone: MilestoneView): Evidence {
  return { text, ref: { kind: 'milestone', id: milestone.id } }
}

// A fact without a raw event (e.g. a booking date) has no anchor.
export function rawEventEvidence(text: string, rawEventId: string | null): Evidence {
  return rawEventId === null ? { text } : { text, ref: { kind: 'raw_event', id: rawEventId } }
}

export function documentEvidence(text: string, documentId: string): Evidence {
  return { text, ref: { kind: 'document', id: documentId } }
}
