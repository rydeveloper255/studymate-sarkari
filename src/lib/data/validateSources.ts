import { OFFICIAL_GOVERNMENT_SOURCES, getSourceStats } from '../../data/officialSources';
import { ALL_STATES_AND_UTS } from '../../data/statesData';
import { SourceCategory, SourcePriority, SourceScope, SourceType } from '../../types';

export interface ValidationIssue {
  type: 'error' | 'warning';
  sourceId: string;
  sourceName: string;
  message: string;
}

export interface ValidationReport {
  isValid: boolean;
  totalChecked: number;
  stats: ReturnType<typeof getSourceStats>;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  stateCoverageCheck: {
    missingStates: string[];
    missingUTs: string[];
    coveredStatesCount: number;
    coveredUTsCount: number;
  };
}

const VALID_SCOPES: SourceScope[] = ['central', 'state', 'union_territory', 'institution'];
const VALID_PRIORITIES: SourcePriority[] = ['high', 'medium', 'low'];
const VALID_TYPES: SourceType[] = ['html', 'pdf', 'rss', 'api', 'sitemap'];
const VALID_CATEGORIES: SourceCategory[] = [
  'vacancy',
  'admit_card',
  'result',
  'answer_key',
  'exam_update',
];

export function validateSourceRegistry(): ValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const seenUrls = new Map<string, string>(); // url -> id
  const seenIds = new Set<string>();

  const validStateCodes = new Set(ALL_STATES_AND_UTS.map((s) => s.code.toUpperCase()));
  const coveredStateCodes = new Set<string>();

  for (const src of OFFICIAL_GOVERNMENT_SOURCES) {
    // 1. Check ID uniqueness & format
    if (!src.id || src.id.trim() === '') {
      errors.push({
        type: 'error',
        sourceId: 'unknown',
        sourceName: src.sourceName || 'Unnamed',
        message: 'Missing or empty source ID',
      });
    } else if (seenIds.has(src.id)) {
      errors.push({
        type: 'error',
        sourceId: src.id,
        sourceName: src.sourceName,
        message: `Duplicate source ID: ${src.id}`,
      });
    } else {
      seenIds.add(src.id);
    }

    // 2. Check Name
    if (!src.sourceName || src.sourceName.trim() === '') {
      errors.push({
        type: 'error',
        sourceId: src.id,
        sourceName: '',
        message: 'Empty source name',
      });
    }

    // 3. Check Official URL
    if (!src.officialUrl || src.officialUrl.trim() === '') {
      errors.push({
        type: 'error',
        sourceId: src.id,
        sourceName: src.sourceName,
        message: 'Empty official URL',
      });
    } else {
      const normalizedUrl = src.officialUrl.toLowerCase().trim().replace(/\/+$/, '');
      if (seenUrls.has(normalizedUrl)) {
        errors.push({
          type: 'error',
          sourceId: src.id,
          sourceName: src.sourceName,
          message: `Duplicate official URL: ${src.officialUrl} (matches ${seenUrls.get(normalizedUrl)})`,
        });
      } else {
        seenUrls.set(normalizedUrl, src.id);
      }

      if (!src.officialUrl.startsWith('http://') && !src.officialUrl.startsWith('https://')) {
        errors.push({
          type: 'error',
          sourceId: src.id,
          sourceName: src.sourceName,
          message: `Invalid URL protocol in: ${src.officialUrl}`,
        });
      }
    }

    // 4. Check Scope
    if (!VALID_SCOPES.includes(src.scope)) {
      errors.push({
        type: 'error',
        sourceId: src.id,
        sourceName: src.sourceName,
        message: `Invalid scope: "${src.scope}". Allowed: ${VALID_SCOPES.join(', ')}`,
      });
    }

    // 5. Check State Code logic
    if (src.scope === 'state' || src.scope === 'union_territory') {
      if (!src.stateCode) {
        errors.push({
          type: 'error',
          sourceId: src.id,
          sourceName: src.sourceName,
          message: `Scope is "${src.scope}" but stateCode is missing`,
        });
      } else if (!validStateCodes.has(src.stateCode.toUpperCase())) {
        errors.push({
          type: 'error',
          sourceId: src.id,
          sourceName: src.sourceName,
          message: `Invalid stateCode "${src.stateCode}" for scope "${src.scope}"`,
        });
      } else {
        coveredStateCodes.add(src.stateCode.toUpperCase());
      }
    } else if (src.stateCode) {
      warnings.push({
        type: 'warning',
        sourceId: src.id,
        sourceName: src.sourceName,
        message: `Scope is "${src.scope}" but stateCode "${src.stateCode}" is set`,
      });
    }

    // 6. Check Categories
    if (!Array.isArray(src.category) || src.category.length === 0) {
      errors.push({
        type: 'error',
        sourceId: src.id,
        sourceName: src.sourceName,
        message: 'Category array is empty or not an array',
      });
    } else {
      for (const cat of src.category) {
        if (!VALID_CATEGORIES.includes(cat)) {
          errors.push({
            type: 'error',
            sourceId: src.id,
            sourceName: src.sourceName,
            message: `Invalid category: "${cat}". Allowed: ${VALID_CATEGORIES.join(', ')}`,
          });
        }
      }
    }

    // 7. Check Priority & Interval
    if (!VALID_PRIORITIES.includes(src.priority)) {
      errors.push({
        type: 'error',
        sourceId: src.id,
        sourceName: src.sourceName,
        message: `Invalid priority: "${src.priority}". Allowed: ${VALID_PRIORITIES.join(', ')}`,
      });
    }

    if (!src.checkIntervalMinutes || src.checkIntervalMinutes < 5) {
      warnings.push({
        type: 'warning',
        sourceId: src.id,
        sourceName: src.sourceName,
        message: `Check interval (${src.checkIntervalMinutes} min) is unusually low or missing`,
      });
    }

    // 8. Check Source Type
    if (!VALID_TYPES.includes(src.sourceType)) {
      errors.push({
        type: 'error',
        sourceId: src.id,
        sourceName: src.sourceName,
        message: `Invalid sourceType: "${src.sourceType}". Allowed: ${VALID_TYPES.join(', ')}`,
      });
    }
  }

  // State & UT Coverage Verification
  const allStates = ALL_STATES_AND_UTS.filter((s) => s.type === 'state');
  const allUTs = ALL_STATES_AND_UTS.filter((s) => s.type === 'ut');

  const missingStates = allStates
    .filter((s) => !coveredStateCodes.has(s.code.toUpperCase()))
    .map((s) => `${s.name} (${s.code})`);

  const missingUTs = allUTs
    .filter((s) => !coveredStateCodes.has(s.code.toUpperCase()))
    .map((s) => `${s.name} (${s.code})`);

  return {
    isValid: errors.length === 0,
    totalChecked: OFFICIAL_GOVERNMENT_SOURCES.length,
    stats: getSourceStats(),
    errors,
    warnings,
    stateCoverageCheck: {
      missingStates,
      missingUTs,
      coveredStatesCount: allStates.length - missingStates.length,
      coveredUTsCount: allUTs.length - missingUTs.length,
    },
  };
}
