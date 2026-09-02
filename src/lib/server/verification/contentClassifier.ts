/**
 * StudyMate Sarkari — Step 5: Content Classifier (Deterministic Multi-Signal Engine)
 */

import { ParsedItemType } from '../../../types/parser';

export interface ClassificationResult {
  detectedType: ParsedItemType;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  matchedKeywords: string[];
  reason: string;
}

const CLASSIFIERS = {
  ADMIT_CARD: {
    strongKeywords: ['admit card', 'hall ticket', 'call letter', 'download admit', 'e-admit card', 'admit card released'],
    scoreThreshold: 2,
  },
  RESULT: {
    strongKeywords: ['result declared', 'merit list', 'final result', 'cut off marks', 'cutoff marks', 'selection list', 'score card', 'written exam result', 'interview result'],
    scoreThreshold: 2,
  },
  ANSWER_KEY: {
    strongKeywords: ['answer key', 'provisional answer key', 'final answer key', 'response sheet', 'key challenge', 'objection tracker', 'master answer key'],
    scoreThreshold: 2,
  },
  EXAM_UPDATE: {
    strongKeywords: ['exam date', 'exam schedule', 'time table', 'postponed', 'rescheduled', 'correction window', 'exam city', 'city intimation', 'important notice', 'corrigendum'],
    scoreThreshold: 2,
  },
  VACANCY: {
    strongKeywords: [
      'recruitment', 'online application', 'apply online', 'notification', 'advertisement',
      'posts', 'vacancies', 'combined graduate level', 'civil services', 'assistant', 'officer',
      'inspector', 'constable', 'teacher', 'engineer', 'clerk', 'sub-inspector'
    ],
    scoreThreshold: 2,
  },
};

/**
 * Deterministically classifies text content and titles into standard categories.
 */
export function classifyContent(title: string, bodyText = '', defaultType?: ParsedItemType): ClassificationResult {
  const combined = `${title || ''} ${bodyText || ''}`.toLowerCase();

  // 1. Check Admit Card
  const admitMatches = CLASSIFIERS.ADMIT_CARD.strongKeywords.filter((kw) => combined.includes(kw));
  if (admitMatches.length > 0 && /admit|hall\s*ticket|call\s*letter/i.test(title)) {
    return {
      detectedType: 'admit_card',
      confidence: 'HIGH',
      matchedKeywords: admitMatches,
      reason: 'Title contains explicit admit card / hall ticket release terminology',
    };
  }

  // 2. Check Result
  const resultMatches = CLASSIFIERS.RESULT.strongKeywords.filter((kw) => combined.includes(kw));
  if (resultMatches.length > 0 && /result|merit|score|cut\s*off/i.test(title)) {
    return {
      detectedType: 'result',
      confidence: 'HIGH',
      matchedKeywords: resultMatches,
      reason: 'Title contains explicit examination result / merit list terminology',
    };
  }

  // 3. Check Answer Key
  const keyMatches = CLASSIFIERS.ANSWER_KEY.strongKeywords.filter((kw) => combined.includes(kw));
  if (keyMatches.length > 0 && /answer\s*key|response\s*sheet|key\s*challenge/i.test(title)) {
    return {
      detectedType: 'answer_key',
      confidence: 'HIGH',
      matchedKeywords: keyMatches,
      reason: 'Title contains explicit answer key terminology',
    };
  }

  // 4. Check Exam Update / Notice
  const updateMatches = CLASSIFIERS.EXAM_UPDATE.strongKeywords.filter((kw) => combined.includes(kw));
  if (updateMatches.length > 0 && /exam\s*date|schedule|postponed|correction|corrigendum|city\s*intimation/i.test(title)) {
    return {
      detectedType: 'exam_update',
      confidence: 'HIGH',
      matchedKeywords: updateMatches,
      reason: 'Title indicates exam schedule, city intimation or corrigendum update',
    };
  }

  // 5. Check Vacancy / Recruitment Notice
  const vacancyMatches = CLASSIFIERS.VACANCY.strongKeywords.filter((kw) => combined.includes(kw));
  if (vacancyMatches.length > 0) {
    const isHighConfidence = /recruitment|advertisement|apply\s+online|vacanc(?:y|ies)|posts?\s+20/i.test(title);
    return {
      detectedType: 'vacancy',
      confidence: isHighConfidence ? 'HIGH' : 'MEDIUM',
      matchedKeywords: vacancyMatches,
      reason: 'Content contains recruitment / job notification keywords',
    };
  }

  // Fallback to default or other
  return {
    detectedType: defaultType || 'other',
    confidence: 'LOW',
    matchedKeywords: [],
    reason: 'Insufficient distinct keywords for confident classification',
  };
}
