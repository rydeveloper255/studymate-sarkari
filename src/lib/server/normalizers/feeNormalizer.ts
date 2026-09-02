/**
 * StudyMate Sarkari — Step 5: Application Fee & Age Limit Normalizers
 */

import { ApplicationFee, AgeLimit } from '../../../types';

/**
 * Normalizes application fees for General, OBC/EWS, SC/ST/PH, and Female categories.
 */
export function normalizeApplicationFee(rawFee: string | undefined | null): {
  fee: ApplicationFee;
  evidence: string | null;
} {
  const defaultFee: ApplicationFee = {
    general: '₹0 (No Fee / See Notification)',
    obcEws: '₹0',
    scStPh: '₹0',
    female: '₹0',
    paymentMode: 'Online via Net Banking, Debit/Credit Card or UPI',
  };

  if (!rawFee || typeof rawFee !== 'string' || !rawFee.trim()) {
    return { fee: defaultFee, evidence: null };
  }

  const cleaned = rawFee.trim();

  // Check if completely free / exempt for all candidates
  if (/^(?:for\s+all\s+candidates\s*[:=-]?\s*)?(?:no\s+fee|nil|exempted|free)\b/i.test(cleaned) && !/general|obc|rs\.?|₹/i.test(cleaned)) {
    return {
      fee: {
        general: '₹0 (Nil / Exempted)',
        obcEws: '₹0',
        scStPh: '₹0',
        female: '₹0',
        paymentMode: 'Exempted for all candidates',
      },
      evidence: cleaned,
    };
  }

  // Look for numeric amounts (e.g., "General / OBC: Rs. 500/-, SC/ST: Rs. 100/-")
  let genFee = defaultFee.general;
  let scStFee = defaultFee.scStPh;
  let femaleFee = defaultFee.female;
  let obcFee = defaultFee.obcEws;

  const genMatch = cleaned.match(/(?:general|ur|unreserved|obc|ews)\s*[:=-]?\s*(?:rs\.?|inr|₹)?\s*([0-9]+)/i);
  if (genMatch) {
    genFee = `₹${genMatch[1]}`;
    obcFee = `₹${genMatch[1]}`;
  } else {
    // Single general amount: "Rs. 250"
    const singleAmount = cleaned.match(/(?:rs\.?|inr|₹)\s*([0-9]+)/i);
    if (singleAmount) {
      genFee = `₹${singleAmount[1]}`;
    }
  }

  const scMatch = cleaned.match(/(?:sc|st|ph|pwd|divyang)\s*[:=-]?\s*(?:rs\.?|inr|₹)?\s*([0-9]+|nil|exempted)/i);
  if (scMatch) {
    scStFee = /nil|exempted/i.test(scMatch[1]) ? '₹0 (Exempted)' : `₹${scMatch[1]}`;
  }

  const femMatch = cleaned.match(/(?:female|women)\s*[:=-]?\s*(?:rs\.?|inr|₹)?\s*([0-9]+|nil|exempted)/i);
  if (femMatch) {
    femaleFee = /nil|exempted/i.test(femMatch[1]) ? '₹0 (Exempted)' : `₹${femMatch[1]}`;
  }

  return {
    fee: {
      general: genFee,
      obcEws: obcFee,
      scStPh: scStFee,
      female: femaleFee,
      paymentMode: /challan|offline/i.test(cleaned)
        ? 'Online / SBI e-Challan'
        : 'Online via Net Banking, Debit/Credit Card or UPI',
    },
    evidence: cleaned,
  };
}

/**
 * Normalizes Age Limit requirements (Min, Max, Cutoff Date, Relaxations).
 */
export function normalizeAgeLimit(rawAge: string | undefined | null): {
  ageLimit: AgeLimit;
  evidence: string | null;
} {
  const defaultAge: AgeLimit = {
    minAge: 18,
    maxAge: 30,
    relaxationDetails: 'Age relaxation applicable as per Government of India / State reservation rules',
  };

  if (!rawAge || typeof rawAge !== 'string' || !rawAge.trim()) {
    return { ageLimit: defaultAge, evidence: null };
  }

  const cleaned = rawAge.trim();

  // Pattern: "18 to 30 years" or "18-35 Years"
  const rangeMatch = cleaned.match(/\b(1[6-9]|2\d)\s*(?:to|-|–)\s*(2\d|3\d|4\d|5\d|6\d)\s*(?:years|yrs)?\b/i);
  if (rangeMatch) {
    const minAge = parseInt(rangeMatch[1], 10);
    const maxAge = parseInt(rangeMatch[2], 10);
    return {
      ageLimit: {
        minAge,
        maxAge,
        relaxationDetails: 'Age relaxation applicable as per official notification rules (SC/ST: 5 yrs, OBC: 3 yrs, PwD: 10 yrs)',
      },
      evidence: cleaned,
    };
  }

  // Pattern: "Minimum 21 years, Maximum 32 years"
  const minMatch = cleaned.match(/min(?:imum)?\s*(?:age)?\s*[:=-]?\s*(\d{2})/i);
  const maxMatch = cleaned.match(/max(?:imum)?\s*(?:age)?\s*[:=-]?\s*(\d{2})/i);

  if (minMatch || maxMatch) {
    return {
      ageLimit: {
        minAge: minMatch ? parseInt(minMatch[1], 10) : 18,
        maxAge: maxMatch ? parseInt(maxMatch[1], 10) : 32,
        relaxationDetails: 'Age relaxation applicable as per official recruitment rules',
      },
      evidence: cleaned,
    };
  }

  return { ageLimit: defaultAge, evidence: cleaned };
}
