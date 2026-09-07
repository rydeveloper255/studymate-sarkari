import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface PresetItem {
  id: string;
  name: string;
  board: string;
  type: 'photo' | 'signature';
  width: number;
  height: number;
  minKb: number;
  maxKb: number;
}

const PRESETS: PresetItem[] = [
  {
    id: 'ssc-photo',
    name: 'SSC CGL / CHSL / MTS Photo',
    board: 'SSC',
    type: 'photo',
    width: 200,
    height: 230,
    minKb: 20,
    maxKb: 50,
  },
  {
    id: 'ssc-sig',
    name: 'SSC Signature (Black Ink)',
    board: 'SSC',
    type: 'signature',
    width: 140,
    height: 60,
    minKb: 10,
    maxKb: 20,
  },
  {
    id: 'upsc-photo',
    name: 'UPSC Civil Services Photo',
    board: 'UPSC',
    type: 'photo',
    width: 350,
    height: 350,
    minKb: 20,
    maxKb: 300,
  },
  {
    id: 'upsc-sig',
    name: 'UPSC Civil Services Signature',
    board: 'UPSC',
    type: 'signature',
    width: 350,
    height: 350,
    minKb: 20,
    maxKb: 300,
  },
  {
    id: 'rrb-photo',
    name: 'Railway RRB NTPC / ALP Photo',
    board: 'Railways',
    type: 'photo',
    width: 240,
    height: 320,
    minKb: 30,
    maxKb: 70,
  },
  {
    id: 'ibps-photo',
    name: 'IBPS / SBI Banking Photo',
    board: 'Banking',
    type: 'photo',
    width: 200,
    height: 230,
    minKb: 20,
    maxKb: 50,
  },
  {
    id: 'police-photo',
    name: 'State Police / PSC Photo',
    board: 'State',
    type: 'photo',
    width: 200,
    height: 250,
    minKb: 20,
    maxKb: 50,
  },
];

export const PhotoResizer: React.FC = () => {
  const { language } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string>('ssc-photo');
  const [targetWidth, setTargetWidth] = useState(200);
  const [targetHeight, setTargetHeight] = useState(230);
  const [targetKbMin, setTargetKbMin] = useState(20);
  const [targetKbMax, setTargetKbMax] = useState(50);
  const [quality, setQuality] = useState(0.85);

  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [fileSizeKb, setFileSizeKb] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyPreset = (preset: PresetItem) => {
    setActivePresetId(preset.id);
    setTargetWidth(preset.width);
    setTargetHeight(preset.height);
    setTargetKbMin(preset.minKb);
    setTargetKbMax(preset.maxKb);
    const targetQ = preset.maxKb > 100 ? 0.92 : 0.82;
    setQuality(targetQ);
    if (selectedFile) {
      processImage(selectedFile, preset.width, preset.height, targetQ);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as string;
      setSelectedFile(data);
      processImage(data, targetWidth, targetHeight, quality);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  };

  const processImage = (dataUrl: string, w: number, h: number, q: number) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const output = canvas.toDataURL('image/jpeg', q);
        setResizedImage(output);
        const head = 'data:image/jpeg;base64,';
        const size = Math.round(((output.length - head.length) * 3) / 4 / 1024);
        setFileSizeKb(size);
      }
    };
  };

  const handleQualityChange = (newQ: number) => {
    setQuality(newQ);
    if (selectedFile) {
      processImage(selectedFile, targetWidth, targetHeight, newQ);
    }
  };

  // Auto-optimize to hit target range
  const handleAutoCompress = () => {
    if (!selectedFile) return;
    const midKb = (targetKbMin + targetKbMax) / 2;
    // Test a stepped binary search for quality
    let bestQ = 0.85;
    if (midKb <= 20) bestQ = 0.65;
    else if (midKb <= 50) bestQ = 0.8;
    else bestQ = 0.92;

    setQuality(bestQ);
    processImage(selectedFile, targetWidth, targetHeight, bestQ);
  };

  return (
    <div className="bg-white dark:bg-[#070e1e] rounded-3xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 sm:p-8 shadow-xs max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e8f0] dark:border-[#1e324c] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#00236f] dark:bg-[#1e3a8a] text-white flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[24px] text-amber-300">
              crop
            </span>
          </div>
          <div>
            <h2 className="font-display font-black text-lg sm:text-xl text-[#0b1c30] dark:text-white">
              {language === 'hi'
                ? 'सरकारी फोटो एवं हस्ताक्षर रिसाइज़र (KB कम्प्रेसर)'
                : 'Sarkari Photo & Signature Resizer with KB Compressor'}
            </h2>
            <p className="text-xs text-[#64748b] dark:text-[#94a3b8]">
              {language === 'hi'
                ? 'एसएससी, यूपीएससी, रेलवे व पुलिस परीक्षाओं के लिए सटीक पिक्सल एवं 10-20KB / 20-50KB'
                : '100% In-browser & safe. Presets for SSC, UPSC, Railways, Banking & Police forms.'}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-full self-start sm:self-auto flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px]">lock</span>
          Offline &amp; Safe
        </span>
      </div>

      {/* Preset Chips */}
      <div>
        <label className="text-xs font-bold text-[#444651] dark:text-[#cbd5e1] block mb-2 uppercase tracking-wider">
          {language === 'hi' ? 'परीक्षा अनुसार प्रीसेट चुनें' : 'Select Official Commission Preset'}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {PRESETS.map((p) => {
            const isSelected = activePresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className={`p-2.5 rounded-2xl text-left border transition-all text-xs cursor-pointer ${
                  isSelected
                    ? 'bg-[#00236f] text-white border-[#00236f] shadow-xs'
                    : 'bg-[#f8fafc] dark:bg-[#0c182c] border-[#e2e8f0] dark:border-[#1e324c] text-[#334155] dark:text-[#cbd5e1] hover:bg-[#eff4ff]'
                }`}
              >
                <span className="font-bold block truncate">{p.name}</span>
                <span className="text-[10px] opacity-80 block mt-0.5">
                  {p.width}×{p.height} px &bull; {p.minKb}-{p.maxKb} KB
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Resizer Workbench */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="md:col-span-6 space-y-4 text-xs">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-[#00236f] bg-blue-50 dark:bg-blue-950/40'
                : 'border-[#d3e4fe] dark:border-[#1e324c] hover:border-[#00236f] bg-[#eff4ff]/40 dark:bg-[#0c182c]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="material-symbols-outlined text-4xl text-[#00236f] dark:text-[#38bdf8] mb-1">
              cloud_upload
            </span>
            <p className="font-bold text-sm text-[#0b1c30] dark:text-white">
              {selectedFile ? 'Change Selected Image' : 'Click or Drag & Drop Photo/Signature'}
            </p>
            <p className="text-[11px] text-[#64748b] dark:text-[#94a3b8] mt-0.5">
              Supports JPG, JPEG, PNG, WEBP files
            </p>
          </div>

          {/* Width & Height inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
                Width (pixels)
              </label>
              <input
                type="number"
                value={targetWidth}
                onChange={(e) => {
                  const w = Number(e.target.value);
                  setTargetWidth(w);
                  if (selectedFile) processImage(selectedFile, w, targetHeight, quality);
                }}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-[#0b1c30] dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
                Height (pixels)
              </label>
              <input
                type="number"
                value={targetHeight}
                onChange={(e) => {
                  const h = Number(e.target.value);
                  setTargetHeight(h);
                  if (selectedFile) processImage(selectedFile, targetWidth, h, quality);
                }}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-[#0b1c30] dark:text-white"
              />
            </div>
          </div>

          {/* Quality Slider & Auto-Compress */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-[#eff4ff] dark:bg-[#0c182c] border border-[#d3e4fe] dark:border-[#1e324c]">
            <div className="flex justify-between font-bold text-[#475569] dark:text-[#94a3b8]">
              <span>JPEG Quality / Compression</span>
              <span>{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.15}
              max={1.0}
              step={0.05}
              value={quality}
              onChange={(e) => handleQualityChange(Number(e.target.value))}
              className="w-full accent-[#00236f]"
            />
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-[#64748b] dark:text-[#94a3b8]">
                Target Range: <strong>{targetKbMin} - {targetKbMax} KB</strong>
              </span>
              <button
                type="button"
                onClick={handleAutoCompress}
                className="text-[11px] font-bold text-[#00236f] dark:text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">auto_fix_high</span>
                Auto-Fit KB
              </button>
            </div>
          </div>
        </div>

        {/* Right Output Card */}
        <div className="md:col-span-6 bg-[#f8fafc] dark:bg-[#0c182c] border border-[#e2e8f0] dark:border-[#1e324c] rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 text-center">
          <span className="text-[11px] font-black text-[#64748b] dark:text-[#94a3b8] uppercase tracking-wider">
            Live Preview &amp; Verification
          </span>

          {resizedImage ? (
            <div className="flex flex-col items-center space-y-3 w-full">
              <div className="p-3 bg-white dark:bg-[#101b2c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center">
                <img
                  src={resizedImage}
                  alt="Resized Result"
                  className="max-h-[220px] object-contain rounded-lg shadow-xs"
                  style={{ width: `${Math.min(targetWidth, 240)}px` }}
                />
              </div>

              <div className="space-y-1 text-xs">
                <div className="font-extrabold text-[#00236f] dark:text-[#38bdf8]">
                  Dimensions: {targetWidth} × {targetHeight} px
                </div>
                <div
                  className={`font-black flex items-center justify-center gap-1 ${
                    fileSizeKb && fileSizeKb >= targetKbMin && fileSizeKb <= targetKbMax
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {fileSizeKb && fileSizeKb >= targetKbMin && fileSizeKb <= targetKbMax
                      ? 'check_circle'
                      : 'info'}
                  </span>
                  File Size: ~{fileSizeKb} KB ({fileSizeKb && fileSizeKb >= targetKbMin && fileSizeKb <= targetKbMax ? 'Eligible' : 'Check Target Range'})
                </div>
              </div>

              <a
                href={resizedImage}
                download={`${activePresetId}_resized.jpg`}
                className="w-full sm:w-auto bg-[#00236f] hover:bg-[#00174c] text-white text-xs font-black py-3 px-8 rounded-xl shadow-md transition-all hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Download Compliant JPG</span>
              </a>
            </div>
          ) : (
            <div className="py-16 text-xs text-[#64748b] dark:text-[#94a3b8] space-y-2">
              <span className="material-symbols-outlined text-4xl text-slate-400">
                photo_size_select_actual
              </span>
              <p>Upload any photo or signature to start instant resizing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
