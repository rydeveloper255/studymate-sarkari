/**
 * StudyMate Sarkari — Step 5: Vacancy Count Normalizer & Validator
 *
 * Strict context-aware extraction to avoid false positives (e.g., fees, years, applicant counts).
 */

export interface VacancyExtractionResult {
  totalVacancies: number | string;
  isNumeric: boolean;
  rawSnippet: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  warning?: string;
}

/**
 * Normalizes and validates vacancy numbers from raw text or structured cell.
 */
export function normalizeVacancyCount(rawInput: string | number | undefined | null): VacancyExtractionResult {
  if (typeof rawInput === 'number') {
    if (rawInput > 0 && rawInput <= 500000) {
      return {
        totalVacancies: rawInput,
        isNumeric: true,
        rawSnippet: String(rawInput),
        confidence: 'HIGH',
      };
    }
  }

  if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
    return {
      totalVacancies: 'To be notified',
      isNumeric: false,
      rawSnippet: null,
      confidence: 'LOW',
    };
  }

  const cleaned = rawInput.trim();

  // Reject false positives: candidate counts, fee amounts, years, age strings
  if (/candidates?\s+applied|applicants|registered|admit\s+cards?\s+downloaded/i.test(cleaned)) {
    return {
      totalVacancies: 'To be notified',
      isNumeric: false,
      rawSnippet: cleaned,
      confidence: 'LOW',
      warning: 'Input resembles candidate count or applicant statistics, not total vacancies',
    };
  }

  // 1. Look for explicit total patterns: "Total Vacancies: 1,250", "Total Posts : 450", "Posts: 85"
  const strongPatterns = [
    /(?:total\s+(?:posts?|vacanc(?:y|ies)|seats?)|no\.?\s+of\s+posts?|vacancies)\s*[:=\-–]?\s*([0-9,]+)/i,
    /([0-9,]+)\s*(?:posts?|vacancies|seats?)\s+(?:available|notified|advertised)/i,
    /^([0-9,]+)$/,
  ];

  for (const pattern of strongPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const numStr = match[1].replace(/,/g, '');
      const val = parseInt(numStr, 10);

      // Validate reasonable government recruitment range (1 to 200,000) and ignore 4-digit years (e.g. 2026) if context matches year
      if (!isNaN(val) && val > 0 && val < 500000) {
        if (val >= 2020 && val <= 2035 && /year|exam\s*20/i.test(cleaned)) {
          // This is a year, not a vacancy count!
          continue;
        }

        return {
          totalVacancies: val,
          isNumeric: true,
          rawSnippet: match[0].trim(),
          confidence: 'HIGH',
        };
      }
    }
  }

  // 2. Check for category breakdown sum (e.g., "UR: 50, OBC: 20, SC: 15, ST: 10, EWS: 5")
  const categorySum = tryComputeCategorySum(cleaned);
  if (categorySum) {
    return categorySum;
  }

  // 3. Fallback: check for keywords like "Various", "Multiple", "Not Specified"
  if (/various|multiple|different\s+posts/i.test(cleaned)) {
    return {
      totalVacancies: 'Various',
      isNumeric: false,
      rawSnippet: cleaned,
      confidence: 'MEDIUM',
    };
  }

  return {
    totalVacancies: 'To be notified',
    isNumeric: false,
    rawSnippet: cleaned,
    confidence: 'LOW',
  };
}

/**
 * Attempts to parse category breakdown if clearly specified.
 */
function tryComputeCategorySum(text: string): VacancyExtractionResult | null {
  const urMatch = text.match(/\bUR\s*[:=-]?\s*(\d+)/i);
  const obcMatch = text.match(/\bOBC\s*[:=-]?\s*(\d+)/i);
  const scMatch = text.match(/\bSC\s*[:=-]?\s*(\d+)/i);
  const stMatch = text.match(/\bST\s*[:=-]?\s*(\d+)/i);

  if (urMatch || (obcMatch && scMatch)) {
    const ur = urMatch ? parseInt(urMatch[1], 10) : 0;
    const obc = obcMatch ? parseInt(obcMatch[1], 10) : 0;
    const sc = scMatch ? parseInt(scMatch[1], 10) : 0;
    const st = stMatch ? parseInt(stMatch[1], 10) : 0;
    const ewsMatch = text.match(/\bEWS\s*[:=-]?\s*(\d+)/i);
    const ews = ewsMatch ? parseInt(ewsMatch[1], 10) : 0;

    const total = ur + obc + sc + st + ews;
    if (total > 0 && total < 100000) {
      return {
        totalVacancies: total,
        isNumeric: true,
        rawSnippet: `Calculated from category breakdown: UR=${ur}, OBC=${obc}, SC=${sc}, ST=${st}, EWS=${ews} (Total: ${total})`,
        confidence: 'HIGH',
      };
    }
  }

  return null;
}
