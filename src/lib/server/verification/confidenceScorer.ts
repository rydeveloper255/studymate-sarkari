/**
 * StudyMate Sarkari — Step 5: Extraction Confidence & Verification Status Scorer
 */

import { ExtractionConfidence, VerificationStatus, NormalizedExtractedItem } from '../../../types/parser';

export interface ConfidenceEvaluation {
  confidence: ExtractionConfidence;
  verificationStatus: VerificationStatus;
  score: number; // 0 to 100
  reasons: string[];
}

export function evaluateExtractionConfidence(params: {
  item: Partial<NormalizedExtractedItem>;
  isOfficialDomain: boolean;
  isConfidentOrgMatch: boolean;
  isValidChronology: boolean;
}): ConfidenceEvaluation {
  let score = 0;
  const reasons: string[] = [];

  // 1. Official domain verification (30 points)
  if (params.isOfficialDomain) {
    score += 30;
    reasons.push('Authoritative official government domain (.gov.in/.nic.in/portal)');
  } else {
    reasons.push('Domain authority requires verification');
  }

  // 2. Confident organization match (25 points)
  if (params.isConfidentOrgMatch) {
    score += 25;
    reasons.push('Matched registered government organization registry');
  } else {
    reasons.push('Organization requires editorial confirmation');
  }

  // 3. Clear title and post name (15 points)
  if (params.item.title && params.item.title.length > 5 && params.item.title !== 'Recruitment Notice') {
    score += 15;
    reasons.push('Explicit recruitment title and post name parsed');
  }

  // 4. Valid dates and chronology (15 points)
  if (params.isValidChronology && params.item.importantDates?.applyStartDate) {
    score += 15;
    reasons.push('Valid chronological application timeline');
  }

  // 5. Official notification / apply URL presence (15 points)
  if (params.item.officialNotificationUrl && params.item.officialNotificationUrl.startsWith('http')) {
    score += 15;
    reasons.push('Direct official notification link confirmed');
  }

  let confidence: ExtractionConfidence = 'LOW';
  let verificationStatus: VerificationStatus = 'PENDING_REVIEW';

  if (score >= 80) {
    confidence = 'HIGH';
    verificationStatus = 'VERIFIED';
  } else if (score >= 50) {
    confidence = 'MEDIUM';
    verificationStatus = 'PENDING_REVIEW';
  } else {
    confidence = 'LOW';
    verificationStatus = 'PENDING_REVIEW';
  }

  if (!params.isConfidentOrgMatch) {
    verificationStatus = 'ORGANIZATION_REVIEW_REQUIRED';
  }

  return {
    confidence,
    verificationStatus,
    score,
    reasons,
  };
}
