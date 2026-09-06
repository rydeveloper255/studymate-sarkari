import React, { useState } from 'react';

interface ExamFeeStructure {
  id: string;
  name: string;
  generalMaleFee: number;
  obcMaleFee: number;
  ewsMaleFee: number;
  femaleFee: number;
  scStFee: number;
  pwdFee: number;
  exSmFee: number;
  paymentModes: string[];
  refundPolicy?: string;
}

const EXAM_FEES: ExamFeeStructure[] = [
  { id: 'ssc_cgl', name: 'SSC CGL / CHSL / MTS', generalMaleFee: 100, obcMaleFee: 100, ewsMaleFee: 100, femaleFee: 0, scStFee: 0, pwdFee: 0, exSmFee: 0, paymentModes: ['UPI', 'Net Banking', 'Debit Card', 'SBI E-Challan'], refundPolicy: 'Non-refundable' },
  { id: 'rrb_alp_ntpc', name: 'Railway RRB NTPC / ALP / Tech', generalMaleFee: 500, obcMaleFee: 500, ewsMaleFee: 250, femaleFee: 250, scStFee: 250, pwdFee: 250, exSmFee: 250, paymentModes: ['UPI', 'Internet Banking', 'Credit/Debit Card'], refundPolicy: '₹400 refunded to UR/OBC and ₹250 refunded to SC/ST/Women on appearing in CBT-1!' },
  { id: 'upsc_cse', name: 'UPSC Civil Services (IAS/IPS)', generalMaleFee: 100, obcMaleFee: 100, ewsMaleFee: 100, femaleFee: 0, scStFee: 0, pwdFee: 0, exSmFee: 0, paymentModes: ['SBI Net Banking', 'Visa/Master Card', 'SBI Cash Challan'], refundPolicy: 'Non-refundable' },
  { id: 'ibps_po_clerk', name: 'IBPS PO / Clerk / SO', generalMaleFee: 850, obcMaleFee: 850, ewsMaleFee: 850, femaleFee: 850, scStFee: 175, pwdFee: 175, exSmFee: 175, paymentModes: ['RuPay/Visa/Master Debit', 'Net Banking', 'IMPS', 'Cash Cards/Mobile Wallets'], refundPolicy: 'Non-refundable' },
  { id: 'up_police', name: 'UP Police Constable / SI', generalMaleFee: 400, obcMaleFee: 400, ewsMaleFee: 400, femaleFee: 400, scStFee: 400, pwdFee: 0, exSmFee: 400, paymentModes: ['SBI MOPS', 'UPI', 'Debit Card', 'Challan'], refundPolicy: 'Non-refundable' },
  { id: 'bpsc_cce', name: 'BPSC Bihar Combined Competitive', generalMaleFee: 600, obcMaleFee: 600, ewsMaleFee: 600, femaleFee: 150, scStFee: 150, pwdFee: 150, exSmFee: 600, paymentModes: ['State Bank PG', 'Cards', 'UPI'], refundPolicy: 'Non-refundable' },
  { id: 'nta_ugc_net', name: 'NTA UGC NET / CSIR NET', generalMaleFee: 1150, obcMaleFee: 600, ewsMaleFee: 600, femaleFee: 600, scStFee: 325, pwdFee: 325, exSmFee: 325, paymentModes: ['SBI/HDFC/Canara/ICICI Payment Gateway', 'UPI'], refundPolicy: 'Non-refundable' },
];

export const ApplicationFeeCalculator: React.FC = () => {
  const [selectedExamId, setSelectedExamId] = useState('ssc_cgl');
  const [category, setCategory] = useState<'UR' | 'EWS' | 'OBC' | 'SC' | 'ST' | 'PwD' | 'ExSM'>('UR');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Transgender'>('Male');

  const currentExam = EXAM_FEES.find((e) => e.id === selectedExamId) || EXAM_FEES[0];

  let feeAmount = currentExam.generalMaleFee;
  let isExempted = false;

  if (category === 'PwD') {
    feeAmount = currentExam.pwdFee;
  } else if (category === 'SC' || category === 'ST') {
    feeAmount = currentExam.scStFee;
  } else if (gender === 'Female' && currentExam.femaleFee < currentExam.generalMaleFee) {
    feeAmount = currentExam.femaleFee;
  } else if (category === 'EWS') {
    feeAmount = currentExam.ewsMaleFee;
  } else if (category === 'OBC') {
    feeAmount = currentExam.obcMaleFee;
  } else if (category === 'ExSM') {
    feeAmount = currentExam.exSmFee;
  }

  if (feeAmount === 0) {
    isExempted = true;
  }

  return (
    <div className="bg-white dark:bg-[#070e1e] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[#e2e8f0] dark:border-[#1e324c] pb-4">
        <div className="flex items-center gap-2 text-[#00236f] dark:text-[#38bdf8]">
          <span className="material-symbols-outlined text-[24px]">payments</span>
          <h2 className="font-display font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-white">
            Application Fee Exemption &amp; Payment Breakdown
          </h2>
        </div>
        <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-1">
          Check exact payable application fees, concession eligibility, refund clauses, and supported transaction channels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="md:col-span-6 space-y-4 text-xs">
          <div>
            <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
              Select Recruitment Exam:
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-sm text-[#0b1c30] dark:text-white"
            >
              {EXAM_FEES.map((ef) => (
                <option key={ef.id} value={ef.id}>
                  {ef.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-[#0b1c30] dark:text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female (All Categories)</option>
                <option value="Transgender">Transgender</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-[#0b1c30] dark:text-white"
              >
                <option value="UR">General / Unreserved (UR)</option>
                <option value="EWS">Economically Weaker Section (EWS)</option>
                <option value="OBC">Other Backward Classes (OBC)</option>
                <option value="SC">Scheduled Caste (SC)</option>
                <option value="ST">Scheduled Tribe (ST)</option>
                <option value="PwD">Persons with Benchmark Disabilities (PwD)</option>
                <option value="ExSM">Ex-Servicemen (Ex-SM)</option>
              </select>
            </div>
          </div>

          {/* Supported Modes */}
          <div className="bg-[#eff4ff] dark:bg-[#0c182c] border border-[#d3e4fe] dark:border-[#1e324c] p-3.5 rounded-xl space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-[#00236f] dark:text-[#38bdf8] block">
              Official Payment Methods Accepted:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {currentExam.paymentModes.map((mode, idx) => (
                <span
                  key={idx}
                  className="bg-white dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] text-[#0b1c30] dark:text-white text-[11px] font-bold px-2 py-0.5 rounded-lg"
                >
                  ✓ {mode}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Result */}
        <div className="md:col-span-6 bg-gradient-to-br from-[#00236f] via-[#1e3a8a] to-[#003120] text-white p-6 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#85f8c4]">
              Payable Application Fee
            </span>
            {isExempted && (
              <span className="bg-emerald-400 text-emerald-950 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                100% EXEMPTED
              </span>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-5 rounded-xl border border-white/20 text-center">
            <span className="text-xs text-white/80 block">Total Amount to Pay:</span>
            <div className="font-display font-black text-4xl sm:text-5xl text-white mt-1">
              ₹{feeAmount}
            </div>
            <span className="text-[11px] text-[#85f8c4] font-bold block mt-1">
              {isExempted ? 'Zero Fee (Exempted under Govt Reservation Rules)' : 'Standard Application Fee'}
            </span>
          </div>

          {currentExam.refundPolicy && (
            <div className="bg-white/10 p-3.5 rounded-xl border border-white/15 text-xs text-white/90">
              <span className="font-bold text-[#85f8c4] block mb-0.5">ℹ️ Refund Clause:</span>
              <p className="text-[11px] leading-relaxed">{currentExam.refundPolicy}</p>
            </div>
          )}

          <div className="text-[11px] text-white/80 border-t border-white/15 pt-3">
            <strong>Payment Pro-Tip:</strong> Always download the generated e-Challan / Transaction Confirmation Slip immediately after making payment to resolve any bank reconciliation disputes.
          </div>
        </div>
      </div>
    </div>
  );
};
