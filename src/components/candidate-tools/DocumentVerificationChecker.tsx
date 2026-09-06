import React, { useState } from 'react';

interface DvCheckItem {
  id: string;
  name: string;
  mandatory: boolean;
  notes: string;
}

const DV_ITEMS: DvCheckItem[] = [
  { id: '10th_cert', name: '10th (Matriculation) Certificate & Marksheet', mandatory: true, notes: 'Strict proof of Name, Father Name & Date of Birth (DOB)' },
  { id: '12th_cert', name: '12th (Higher Secondary) Marksheet & Passing Certificate', mandatory: true, notes: 'Required for 10+2 posts like CHSL, Police Constable, Stenographer' },
  { id: 'grad_degree', name: 'Graduation Degree / Final Consolidated Marksheet', mandatory: true, notes: 'Must be issued before crucial cutoff date of the notification' },
  { id: 'caste_cert', name: 'Category Certificate (OBC-NCL / SC / ST / EWS)', mandatory: true, notes: 'Must be in Central Govt Prescribed Proforma by authorized officer' },
  { id: 'domicile', name: 'Domicile / Permanent Resident Certificate (PRC)', mandatory: false, notes: 'Mandatory for State quota & Police recruitment' },
  { id: 'id_proof', name: 'Original Photo Identity Proof (Aadhaar / Voter ID / PAN)', mandatory: true, notes: 'Original + 2 self-attested photocopies' },
  { id: 'passport_photos', name: 'Recent Passport Size Color Photographs (6 Copies)', mandatory: true, notes: 'Same as uploaded in application form' },
  { id: 'noc', name: 'No Objection Certificate (NOC) for Employed Candidates', mandatory: false, notes: 'Mandatory for existing Central/State Govt employees' },
  { id: 'pwd_cert', name: 'UDID / PwBD Medical Disability Certificate', mandatory: false, notes: 'Minimum 40% permanent benchmark disability by CMO/Medical Board' },
  { id: 'admit_card_copy', name: 'Printed DV Call Letter / Admit Card', mandatory: true, notes: 'Both candidate copy and commission copy' },
  { id: 'name_affidavit', name: 'Gazette / Judicial Affidavit for Name Discrepancy', mandatory: false, notes: 'If spelling differs in 10th vs Aadhaar/Degree' },
];

export const DocumentVerificationChecker: React.FC = () => {
  const [certType, setCertType] = useState<'EWS' | 'OBC_NCL' | 'SC_ST' | 'PwD'>('EWS');
  const [certIssueDate, setCertIssueDate] = useState('2024-05-10');
  const [examCrucialYear, setExamCrucialYear] = useState('2024-2025');

  const [checkedIds, setCheckedIds] = useState<string[]>(['10th_cert', '12th_cert', 'id_proof', 'passport_photos']);

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // EWS & OBC validity diagnostic
  let validityReport = '';
  let isValid = true;

  if (certType === 'EWS') {
    validityReport = `For EWS candidates in Financial Year ${examCrucialYear}: The certificate MUST be based on gross family income of Financial Year ${examCrucialYear.split('-')[0]} and valid for year ${examCrucialYear.split('-')[1]}. Certificates issued after notification closing date are strictly scrutinised.`;
  } else if (certType === 'OBC_NCL') {
    validityReport = `For OBC Non-Creamy Layer: Certificate must NOT be older than 3 consecutive financial years prior to the closing date of application and must explicitly state "Does not belong to Creamy Layer". State OBC certificates are NOT valid for Central SSC/Railway posts unless caste is in Central OBC list.`;
  } else if (certType === 'SC_ST') {
    validityReport = `For SC/ST: Caste certificate has lifetime validity once issued by District Magistrate / Sub-Divisional Magistrate (SDM) in standard central format.`;
  } else if (certType === 'PwD') {
    validityReport = `For PwBD: Permanent UDID card or certificate mentioning >= 40% disability issued by designated Govt Specialist Medical Board.`;
  }

  const mandatoryCount = DV_ITEMS.filter((i) => i.mandatory).length;
  const checkedMandatory = DV_ITEMS.filter((i) => i.mandatory && checkedIds.includes(i.id)).length;
  const readinessPercent = Math.round((checkedIds.length / DV_ITEMS.length) * 100);

  return (
    <div className="bg-white dark:bg-[#070e1e] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[#e2e8f0] dark:border-[#1e324c] pb-4">
        <div className="flex items-center gap-2 text-[#00236f] dark:text-[#38bdf8]">
          <span className="material-symbols-outlined text-[24px]">verified_user</span>
          <h2 className="font-display font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-white">
            Document Verification (DV) Checklist &amp; Certificate Validity Checker
          </h2>
        </div>
        <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-1">
          Prevent instant cancellation during physical DV round. Check reservation certificate validity norms &amp; compulsory dossier checklist.
        </p>
      </div>

      {/* Certificate Rule Checker */}
      <div className="bg-[#eff4ff] dark:bg-[#0c182c] p-4 rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#00236f] dark:text-[#38bdf8]">verified</span>
          <h3 className="text-xs font-black uppercase text-[#00236f] dark:text-[#38bdf8]">
            Reservation Certificate Validity Diagnosis:
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
              Certificate Category
            </label>
            <select
              value={certType}
              onChange={(e) => setCertType(e.target.value as any)}
              className="w-full bg-white dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] p-2 rounded-xl font-bold text-[#0b1c30] dark:text-white"
            >
              <option value="EWS">EWS (Income &amp; Asset)</option>
              <option value="OBC_NCL">OBC Non-Creamy Layer</option>
              <option value="SC_ST">SC / ST Caste Certificate</option>
              <option value="PwD">PwBD Medical UDID</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
              Certificate Issue Date
            </label>
            <input
              type="date"
              value={certIssueDate}
              onChange={(e) => setCertIssueDate(e.target.value)}
              className="w-full bg-white dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] p-2 rounded-xl font-bold text-[#0b1c30] dark:text-white"
            />
          </div>

          <div>
            <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
              Target Exam Financial Year
            </label>
            <select
              value={examCrucialYear}
              onChange={(e) => setExamCrucialYear(e.target.value)}
              className="w-full bg-white dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] p-2 rounded-xl font-bold text-[#0b1c30] dark:text-white"
            >
              <option value="2024-2025">2024-2025 (Valid for 2025-26 Exams)</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-[#070e1e] rounded-xl border border-[#cbd5e1] dark:border-[#1e324c] text-xs text-[#334155] dark:text-[#cbd5e1] leading-relaxed">
          <strong className="text-[#00236f] dark:text-[#38bdf8] block mb-0.5">Official Guideline:</strong>
          {validityReport}
        </div>
      </div>

      {/* 12-Point Checklist */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-bold text-sm text-[#0b1c30] dark:text-white">
            Official 11-Point Document Verification Dossier:
          </h3>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            Mandatory Documents Ready: {checkedMandatory} / {mandatoryCount}
          </span>
        </div>

        <div className="space-y-2">
          {DV_ITEMS.map((item) => {
            const isChecked = checkedIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-[#070e1e] border-[#e2e8f0] dark:border-[#1e324c] hover:border-[#00236f]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-0.5 w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isChecked ? 'line-through text-[#64748b] dark:text-[#94a3b8]' : 'text-[#0b1c30] dark:text-white'}`}>
                        {item.name}
                      </span>
                      {item.mandatory && (
                        <span className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                          Mandatory
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748b] dark:text-[#94a3b8] mt-0.5">
                      {item.notes}
                    </p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shrink-0 ${
                  isChecked ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' : 'bg-slate-100 dark:bg-[#0f1d33] text-[#64748b]'
                }`}>
                  {isChecked ? 'Ready in File' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
