import {
  MAPPING_SUGGESTION_LIMIT,
  mappingTargetSchema,
  type MappingSuggestionInsight,
  type MappingTarget,
} from '@/domain'
import { insight, rawEventEvidence } from './insight'
import { SYNONYMS } from './synonyms'

// BR-AI-04: below this best score there is "No confident suggestion".
export const MIN_SUGGESTION_SCORE = 0.4

interface Match {
  target: MappingTarget
  score: number
  synonym: string
}

// BR-AI-04 (AI-4): token similarity of the raw label against each target's synonyms; the
// best score of a target is its confidence. The agent confirms the mapping (P3).
export function suggestMapping(
  rawEvent: { rawEventId: string; label: string },
  now: Date,
): MappingSuggestionInsight {
  const tokens = tokenise(rawEvent.label)
  const ranked = mappingTargetSchema.options
    .map((target) => bestMatch(target, SYNONYMS[target], tokens))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
  const best = ranked[0]
  const confident = best !== undefined && best.score >= MIN_SUGGESTION_SCORE
  const top = confident ? ranked.slice(0, MAPPING_SUGGESTION_LIMIT) : []
  return insight(
    'mapping',
    { candidates: top.map(({ target, score }) => ({ target, score })) },
    best?.score ?? 0,
    top.map((match) =>
      rawEventEvidence(`"${rawEvent.label}" is close to "${match.synonym}"`, rawEvent.rawEventId),
    ),
    now,
  )
}

// BR-AI-04: lowercase, strip accents and punctuation, split into words.
export function tokenise(label: string): Set<string> {
  const plain = label
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, ' ')
  return new Set(plain.split(/\s+/).filter((token) => token.length > 0))
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  const shared = [...a].filter((token) => b.has(token)).length
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : shared / union
}

function bestMatch(target: MappingTarget, synonyms: string[], tokens: Set<string>): Match {
  return synonyms
    .map((synonym) => ({ target, synonym, score: round(jaccard(tokens, tokenise(synonym))) }))
    .reduce((best, match) => (match.score > best.score ? match : best), {
      target,
      synonym: '',
      score: 0,
    })
}

function round(score: number): number {
  return Math.round(score * 100) / 100
}
