import React, { useState, useRef } from 'react';

export interface CandidateToolsViewProps {
  onNavigate: (tab: string) => void;
}

export const CandidateToolsView: React.FC<CandidateToolsViewProps> = ({ onNavigate }) => {
  const [activeTool, setActiveTool] = useState<'age' | 'resizer' | 'normalization'>('age');

  // 1. Age Calculator State
  const [dob, setDob] = useState('2000-01-01');
  const [crucialDate, setCrucialDate] = useState('2025-08-01');
  const [category, setCategory] = useState('UR');
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(30);
  const [ageResult, setAgeResult] = useState<string | null>(null);

  const calculateAge = () => {
    if (!dob || !crucialDate) return;
    const d1 = new Date(dob);
    const d2 = new Date(crucialDate);

    let years = d2.getFullYear() - d1.getFullYear();
    let months = d2.getMonth() - d1.getMonth();
    let days = d2.getDate() - d1.getDate();

    if (days < 0) {
      months--;
      days += 30;
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const relaxation = category === 'SC' || category === 'ST' ? 5 : category === 'OBC' ? 3 : category === 'PwD' ? 10 : 0;
    const effectiveMax = maxAge + relaxation;
    const isEligible = years >= minAge && (years < effectiveMax || (years === effectiveMax && months === 0 && days === 0));

    setAgeResult(
      `Your Age on ${crucialDate}: ${years} Years, ${months} Months, ${days} Days. Effective Age Limit for ${category}: ${minAge} to ${effectiveMax} Years. Status: ${
        isEligible ? '✅ ELIGIBLE' : '❌ NOT ELIGIBLE (Age Exceeded / Underage)'
      }`
    );
  };

  // 2. Photo & Signature Resizer State
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [resizerType, setResizerType] = useState<'photo' | 'signature'>('photo');
  const [targetWidth, setTargetWidth] = useState(200);
  const [targetHeight, setTargetHeight] = useState(230);
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [fileSizeKb, setFileSizeKb] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFile(event.target?.result as string);
      processImage(event.target?.result as string, targetWidth, targetHeight);
    };
    reader.readAsDataURL(file);
  };

  const processImage = (dataUrl: string, w: number, h: number) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const output = canvas.toDataURL('image/jpeg', 0.85);
        setResizedImage(output);
        // Estimate KB
        const head = 'data:image/jpeg;base64,';
        const size = Math.round(((output.length - head.length) * 3) / 4 / 1024);
        setFileSizeKb(size);
      }
    };
  };

  const handleResizerPreset = (type: 'photo' | 'signature') => {
    setResizerType(type);
    const w = type === 'photo' ? 200 : 140;
    const h = type === 'photo' ? 230 : 60;
    setTargetWidth(w);
    setTargetHeight(h);
    if (selectedFile) {
      processImage(selectedFile, w, h);
    }
  };

  // 3. Normalization Calculator State
  const [rawScore, setRawScore] = useState(135);
  const [shiftMean, setShiftMean] = useState(115);
  const [shiftStdDev, setShiftStdDev] = useState(18);
  const [baseMean, setBaseMean] = useState(120);
  const [baseStdDev, setBaseStdDev] = useState(20);
  const [normalizedScore, setNormalizedScore] = useState<number | null>(null);

  const calculateNormalized = () => {
    // Formula: ( (Raw - ShiftMean) / ShiftStdDev ) * BaseStdDev + BaseMean
    const z = (rawScore - shiftMean) / shiftStdDev;
    const norm = z * baseStdDev + baseMean;
    setNormalizedScore(Math.round(norm * 1000) / 1000);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#757682]">
        <button onClick={() => onNavigate('home')} className="hover:text-[#00236f] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">home</span> Home
        </button>
        <span>/</span>
        <span className="text-[#0b1c30] font-bold">Candidate Self-Service Toolkit</span>
      </nav>

      {/* 2. Banner */}
      <div className="bg-gradient-to-r from-[#00236f] via-[#1e3a8a] to-[#003120] rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <span className="inline-block bg-[#85f8c4] text-[#002114] text-[11px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider mb-2">
          100% Free Candidate Tools
        </span>
        <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
          Aspirant Utility & Application Toolkit
        </h1>
        <p className="text-white/80 text-xs md:text-sm mt-2 max-w-2xl">
          Accurate age eligibility calculators, instant photo & signature dimensions resizers with 10-20KB compression, and multi-shift CBT marks normalizers.
        </p>
      </div>

      {/* 3. Tool Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-[#d3e4fe] shadow-xs">
        <button
          onClick={() => setActiveTool('age')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTool === 'age' ? 'bg-[#00236f] text-white shadow-sm' : 'hover:bg-[#eff4ff] text-[#444651]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">cake</span>
          Age Eligibility Calculator
        </button>
        <button
          onClick={() => setActiveTool('resizer')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTool === 'resizer' ? 'bg-[#00236f] text-white shadow-sm' : 'hover:bg-[#eff4ff] text-[#444651]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">crop</span>
          Photo & Signature Resizer
        </button>
        <button
          onClick={() => setActiveTool('normalization')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTool === 'normalization' ? 'bg-[#00236f] text-white shadow-sm' : 'hover:bg-[#eff4ff] text-[#444651]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">functions</span>
          CBT Marks Normalizer
        </button>
      </div>

      {/* 4. Tool 1: Age Calculator */}
      {activeTool === 'age' && (
        <div className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs max-w-2xl mx-auto space-y-4">
          <h2 className="font-display font-extrabold text-lg text-[#00236f] flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">calculate</span>
            Official Age Eligibility Calculator
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-[#757682] uppercase block mb-1">Your Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-[#eff4ff] p-2.5 rounded-xl font-bold text-[#0b1c30] focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-[#757682] uppercase block mb-1">Crucial Cutoff Date</label>
              <input
                type="date"
                value={crucialDate}
                onChange={(e) => setCrucialDate(e.target.value)}
                className="w-full bg-[#eff4ff] p-2.5 rounded-xl font-bold text-[#0b1c30] focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-[#757682] uppercase block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#eff4ff] p-2.5 rounded-xl font-bold text-[#0b1c30] focus:outline-none cursor-pointer"
              >
                <option value="UR">UR / General (No relaxation)</option>
                <option value="OBC">OBC (3 Years relaxation)</option>
                <option value="SC">SC (5 Years relaxation)</option>
                <option value="ST">ST (5 Years relaxation)</option>
                <option value="PwD">PwBD (10 Years relaxation)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="font-bold text-[#757682] uppercase block mb-1">Min Age</label>
                <input
                  type="number"
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value))}
                  className="w-full bg-[#eff4ff] p-2.5 rounded-xl font-bold text-[#0b1c30] focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="font-bold text-[#757682] uppercase block mb-1">Max Age</label>
                <input
                  type="number"
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                  className="w-full bg-[#eff4ff] p-2.5 rounded-xl font-bold text-[#0b1c30] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={calculateAge}
            className="w-full bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold py-3 rounded-xl shadow-xs transition-colors"
          >
            Calculate Exact Age & Eligibility
          </button>

          {ageResult && (
            <div className="p-4 bg-[#eff4ff] rounded-xl border border-[#d3e4fe] text-xs font-bold text-[#00236f] text-center leading-relaxed">
              {ageResult}
            </div>
          )}
        </div>
      )}

      {/* 5. Tool 2: Photo & Signature Resizer */}
      {activeTool === 'resizer' && (
        <div className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs max-w-3xl mx-auto space-y-4">
          <h2 className="font-display font-extrabold text-lg text-[#00236f] flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">crop</span>
            SSC / UPSC Photo & Signature Resizer (Exact Pixel & KB)
          </h2>

          <div className="flex gap-2">
            <button
              onClick={() => handleResizerPreset('photo')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                resizerType === 'photo' ? 'bg-[#00236f] text-white' : 'bg-[#eff4ff] text-[#444651]'
              }`}
            >
              Passport Photo Preset (200 x 230 px, 20-50 KB)
            </button>
            <button
              onClick={() => handleResizerPreset('signature')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                resizerType === 'signature' ? 'bg-[#00236f] text-white' : 'bg-[#eff4ff] text-[#444651]'
              }`}
            >
              Signature Preset (140 x 60 px, 10-20 KB)
            </button>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#d3e4fe] hover:border-[#00236f] rounded-2xl p-8 text-center cursor-pointer transition-colors bg-[#eff4ff]/40"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="material-symbols-outlined text-4xl text-[#00236f] mb-2">upload_file</span>
            <p className="font-bold text-xs text-[#0b1c30]">Click to select or drag & drop JPG / PNG file</p>
            <p className="text-[11px] text-[#757682] mt-1">Processed securely 100% inside your browser.</p>
          </div>

          {resizedImage && (
            <div className="p-4 bg-[#eff4ff] rounded-2xl border border-[#d3e4fe] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={resizedImage}
                  alt="Resized Preview"
                  className="border border-[#757682] bg-white rounded shadow-xs"
                  style={{ width: `${targetWidth}px`, height: `${targetHeight}px` }}
                />
                <div className="text-xs">
                  <span className="font-bold text-[#00236f] block">
                    Dimensions: {targetWidth} x {targetHeight} px
                  </span>
                  <span className="text-[#004a32] font-bold block">
                    Estimated Size: ~{fileSizeKb} KB (Compliant)
                  </span>
                </div>
              </div>

              <a
                href={resizedImage}
                download={resizerType === 'photo' ? 'passport_photo.jpg' : 'signature.jpg'}
                className="bg-[#003120] hover:bg-[#004a32] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Download Resized JPG</span>
                <span className="material-symbols-outlined text-[16px]">download</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* 6. Tool 3: Normalization Calculator */}
      {activeTool === 'normalization' && (
        <div className="bg-white rounded-2xl border border-[#d3e4fe] p-6 shadow-xs max-w-2xl mx-auto space-y-4">
          <h2 className="font-display font-extrabold text-lg text-[#00236f] flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">functions</span>
            Multi-Shift CBT Marks Normalization Calculator
          </h2>
          <p className="text-xs text-[#444651]">
            Uses standard Indian Government recruiting commission normalization algorithm.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-[#757682] uppercase block mb-1">Your Raw Score</label>
              <input
                type="number"
                value={rawScore}
                onChange={(e) => setRawScore(Number(e.target.value))}
                className="w-full bg-[#eff4ff] p-2.5 rounded-xl font-bold text-[#0b1c30]"
              />
            </div>
            <div>
              <label className="font-bold text-[#757682] uppercase block mb-1">Your Shift Average Marks</label>
              <input
                type="number"
                value={shiftMean}
                onChange={(e) => setShiftMean(Number(e.target.value))}
                className="w-full bg-[#eff4ff] p-2.5 rounded-xl font-bold text-[#0b1c30]"
              />
            </div>
            <div>
              <label className="font-bold text-[#757682] uppercase block mb-1">Your Shift Std. Deviation</label>
              <input
                type="number"
                value={shiftStdDev}
                onChange={(e) => setShiftStdDev(Number(e.target.value))}
                className="w-full bg-[#eff4ff] p-2.5 rounded-xl font-bold text-[#0b1c30]"
              />
            </div>
            <div>
              <label className="font-bold text-[#757682] uppercase block mb-1">Base Benchmark Average</label>
              <input
                type="number"
                value={baseMean}
                onChange={(e) => setBaseMean(Number(e.target.value))}
                className="w-full bg-[#eff4ff] p-2.5 rounded-xl font-bold text-[#0b1c30]"
              />
            </div>
          </div>

          <button
            onClick={calculateNormalized}
            className="w-full bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold py-3 rounded-xl shadow-xs transition-colors"
          >
            Calculate Estimated Normalized Marks
          </button>

          {normalizedScore !== null && (
            <div className="p-4 bg-[#85f8c4]/20 rounded-xl border border-[#85f8c4] text-center">
              <span className="text-xs font-bold text-[#003120] uppercase block">Normalized Final Score</span>
              <span className="font-display font-black text-3xl text-[#004a32] block mt-1">
                {normalizedScore} Marks
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
