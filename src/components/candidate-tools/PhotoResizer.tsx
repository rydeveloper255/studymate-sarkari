import React, { useState, useRef } from 'react';

export const PhotoResizer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [resizerType, setResizerType] = useState<'photo' | 'signature' | 'custom'>('photo');
  const [targetWidth, setTargetWidth] = useState(200);
  const [targetHeight, setTargetHeight] = useState(230);
  const [targetKbMin, setTargetKbMin] = useState(20);
  const [targetKbMax, setTargetKbMax] = useState(50);
  const [quality, setQuality] = useState(0.85);

  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [fileSizeKb, setFileSizeKb] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFile(event.target?.result as string);
      processImage(event.target?.result as string, targetWidth, targetHeight, quality);
    };
    reader.readAsDataURL(file);
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

  const handleResizerPreset = (type: 'photo' | 'signature' | 'custom') => {
    setResizerType(type);
    let w = 200;
    let h = 230;
    let q = 0.85;
    if (type === 'photo') {
      w = 200; h = 230; q = 0.85;
      setTargetKbMin(20); setTargetKbMax(50);
    } else if (type === 'signature') {
      w = 140; h = 60; q = 0.80;
      setTargetKbMin(10); setTargetKbMax(20);
    }
    setTargetWidth(w);
    setTargetHeight(h);
    setQuality(q);
    if (selectedFile) {
      processImage(selectedFile, w, h, q);
    }
  };

  const handleQualityChange = (newQ: number) => {
    setQuality(newQ);
    if (selectedFile) {
      processImage(selectedFile, targetWidth, targetHeight, newQ);
    }
  };

  return (
    <div className="bg-white dark:bg-[#070e1e] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[#e2e8f0] dark:border-[#1e324c] pb-4">
        <div className="flex items-center gap-2 text-[#00236f] dark:text-[#38bdf8]">
          <span className="material-symbols-outlined text-[24px]">crop</span>
          <h2 className="font-display font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-white">
            Photo &amp; Signature Resizer with KB Compressor
          </h2>
        </div>
        <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-1">
          Resize image pixels (Width × Height) and compress file weight to exact 10-20KB (Sign) or 20-50KB (Photo).
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          onClick={() => handleResizerPreset('photo')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            resizerType === 'photo'
              ? 'bg-[#00236f] text-white shadow-xs'
              : 'bg-[#f8fafc] dark:bg-[#0c182c] border border-[#e2e8f0] dark:border-[#1e324c] text-[#334155] dark:text-[#cbd5e1]'
          }`}
        >
          📷 Passport Photo (200x230 px • 20-50 KB)
        </button>
        <button
          onClick={() => handleResizerPreset('signature')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            resizerType === 'signature'
              ? 'bg-[#00236f] text-white shadow-xs'
              : 'bg-[#f8fafc] dark:bg-[#0c182c] border border-[#e2e8f0] dark:border-[#1e324c] text-[#334155] dark:text-[#cbd5e1]'
          }`}
        >
          ✍️ Signature (140x60 px • 10-20 KB)
        </button>
        <button
          onClick={() => handleResizerPreset('custom')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            resizerType === 'custom'
              ? 'bg-[#00236f] text-white shadow-xs'
              : 'bg-[#f8fafc] dark:bg-[#0c182c] border border-[#e2e8f0] dark:border-[#1e324c] text-[#334155] dark:text-[#cbd5e1]'
          }`}
        >
          ⚙️ Custom Dimensions
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="md:col-span-6 space-y-4 text-xs">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#d3e4fe] dark:border-[#1e324c] hover:border-[#00236f] dark:hover:border-[#38bdf8] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[#eff4ff]/40 dark:bg-[#0c182c]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="material-symbols-outlined text-4xl text-[#00236f] dark:text-[#38bdf8] mb-1">upload_file</span>
            <p className="font-bold text-[#0b1c30] dark:text-white">
              {selectedFile ? 'Click to Change Image' : 'Select Photo / Signature File'}
            </p>
            <p className="text-[11px] text-[#64748b] dark:text-[#94a3b8] mt-0.5">JPG, JPEG or PNG formats supported</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">Target Width (px)</label>
              <input
                type="number"
                value={targetWidth}
                onChange={(e) => {
                  const w = Number(e.target.value);
                  setTargetWidth(w);
                  if (selectedFile) processImage(selectedFile, w, targetHeight, quality);
                }}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2 rounded-xl font-bold text-[#0b1c30] dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">Target Height (px)</label>
              <input
                type="number"
                value={targetHeight}
                onChange={(e) => {
                  const h = Number(e.target.value);
                  setTargetHeight(h);
                  if (selectedFile) processImage(selectedFile, targetWidth, h, quality);
                }}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2 rounded-xl font-bold text-[#0b1c30] dark:text-white"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-bold text-[#475569] dark:text-[#94a3b8] mb-1">
              <span>Compression Level / Quality</span>
              <span>{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1.0}
              step={0.05}
              value={quality}
              onChange={(e) => handleQualityChange(Number(e.target.value))}
              className="w-full accent-[#00236f]"
            />
          </div>
        </div>

        {/* Right Output */}
        <div className="md:col-span-6 bg-[#f8fafc] dark:bg-[#0c182c] border border-[#e2e8f0] dark:border-[#1e324c] rounded-2xl p-5 flex flex-col items-center justify-center space-y-4">
          <span className="text-[11px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-wider">
            Resized Result
          </span>

          {resizedImage ? (
            <div className="flex flex-col items-center space-y-3">
              <img
                src={resizedImage}
                alt="Resized Preview"
                className="border-2 border-white dark:border-[#1e324c] bg-white rounded-lg shadow-md max-h-[220px] object-contain"
                style={{ width: `${Math.min(targetWidth, 240)}px` }}
              />

              <div className="text-center text-xs space-y-0.5">
                <div className="font-bold text-[#00236f] dark:text-[#38bdf8]">
                  Dimensions: {targetWidth} × {targetHeight} pixels
                </div>
                <div className={`font-black ${
                  fileSizeKb && fileSizeKb >= targetKbMin && fileSizeKb <= targetKbMax
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-[#0b1c30] dark:text-white'
                }`}>
                  Estimated File Size: ~{fileSizeKb} KB ({fileSizeKb && fileSizeKb >= targetKbMin && fileSizeKb <= targetKbMax ? '✅ Compliant' : 'Adjust Quality Slider if needed'})
                </div>
              </div>

              <a
                href={resizedImage}
                download={resizerType === 'photo' ? 'passport_photo_resized.jpg' : 'signature_resized.jpg'}
                className="bg-[#003120] hover:bg-[#004a32] text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Download Resized JPG</span>
                <span className="material-symbols-outlined text-[16px]">download</span>
              </a>
            </div>
          ) : (
            <div className="text-center text-xs text-[#64748b] dark:text-[#94a3b8] py-12">
              Upload a photo or signature to process instant resizing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
