import React, { useState, useRef, useEffect } from 'react';

export const PhotoDateAdder: React.FC = () => {
  const [candidateName, setCandidateName] = useState('Rahul Sharma');
  const [photoDate, setPhotoDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [dateLabel, setDateLabel] = useState('DOP:');
  const [includeName, setIncludeName] = useState(true);
  const [includeDate, setIncludeDate] = useState(true);
  const [stripHeight, setStripHeight] = useState(48);
  const [fontSize, setFontSize] = useState(14);
  const [fontColor, setFontColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [targetWidth, setTargetWidth] = useState(350);
  const [targetHeight, setTargetHeight] = useState(450);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    if (selectedImage) {
      const img = new Image();
      img.src = selectedImage;
      img.onload = () => {
        // Draw main image
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Draw bottom text strip if requested
        if (includeName || includeDate) {
          const effectiveStripH = Math.max(stripHeight, (includeName && includeDate ? 52 : 36));
          const stripY = targetHeight - effectiveStripH;

          ctx.fillStyle = bgColor;
          ctx.fillRect(0, stripY, targetWidth, effectiveStripH);
          ctx.strokeStyle = '#cccccc';
          ctx.lineWidth = 1;
          ctx.strokeRect(0, stripY, targetWidth, effectiveStripH);

          ctx.fillStyle = fontColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (includeName && includeDate) {
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillText(candidateName.toUpperCase(), targetWidth / 2, stripY + effectiveStripH * 0.32);

            ctx.font = `600 ${fontSize - 1}px sans-serif`;
            const formattedDate = photoDate.split('-').reverse().join('-');
            ctx.fillText(`${dateLabel} ${formattedDate}`, targetWidth / 2, stripY + effectiveStripH * 0.72);
          } else if (includeName) {
            ctx.font = `bold ${fontSize + 1}px sans-serif`;
            ctx.fillText(candidateName.toUpperCase(), targetWidth / 2, stripY + effectiveStripH * 0.5);
          } else if (includeDate) {
            ctx.font = `bold ${fontSize}px sans-serif`;
            const formattedDate = photoDate.split('-').reverse().join('-');
            ctx.fillText(`${dateLabel} ${formattedDate}`, targetWidth / 2, stripY + effectiveStripH * 0.5);
          }
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setProcessedImage(dataUrl);
      };
    } else {
      // Draw placeholder
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(4, 4, targetWidth - 8, targetHeight - 8);

      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Upload Photo to Preview', targetWidth / 2, targetHeight / 2 - 20);

      if (includeName || includeDate) {
        const effectiveStripH = 50;
        const stripY = targetHeight - effectiveStripH;
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, stripY, targetWidth, effectiveStripH);
        ctx.fillStyle = fontColor;
        if (includeName) {
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillText(candidateName.toUpperCase(), targetWidth / 2, stripY + 20);
        }
        if (includeDate) {
          ctx.font = `600 ${fontSize - 1}px sans-serif`;
          const formattedDate = photoDate.split('-').reverse().join('-');
          ctx.fillText(`${dateLabel} ${formattedDate}`, targetWidth / 2, stripY + 38);
        }
      }
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setProcessedImage(dataUrl);
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [candidateName, photoDate, dateLabel, includeName, includeDate, stripHeight, fontSize, fontColor, bgColor, selectedImage, targetWidth, targetHeight]);

  return (
    <div className="bg-white dark:bg-[#070e1e] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[#e2e8f0] dark:border-[#1e324c] pb-4">
        <div className="flex items-center gap-2 text-[#00236f] dark:text-[#38bdf8]">
          <span className="material-symbols-outlined text-[24px]">badge</span>
          <h2 className="font-display font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-white">
            Photo Name &amp; Date Adder (SSC / UPSC / UP Police Spec)
          </h2>
        </div>
        <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-1">
          Add official Candidate Name and Date of Photograph (DOP) on a crisp white bottom footer banner as mandated by Govt recruiting bodies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-7 space-y-4 text-xs">
          {/* File Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#00236f]/30 dark:border-sky-500/30 hover:border-[#00236f] dark:hover:border-sky-400 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-[#eff4ff]/50 dark:bg-[#0c182c]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="material-symbols-outlined text-3xl text-[#00236f] dark:text-[#38bdf8] mb-1">
              add_photo_alternate
            </span>
            <p className="font-bold text-[#0b1c30] dark:text-white">
              {selectedImage ? 'Click to Change Photo' : 'Select or Drop Candidate Passport Photo'}
            </p>
            <p className="text-[11px] text-[#64748b] dark:text-[#94a3b8]">
              Supports JPG, PNG, WEBP (Processed 100% locally in browser)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
                Candidate Name
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. AMIT KUMAR"
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-[#0b1c30] dark:text-white focus:outline-none focus:border-[#00236f]"
              />
            </div>

            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
                Date of Photo (DOP)
              </label>
              <input
                type="date"
                value={photoDate}
                onChange={(e) => setPhotoDate(e.target.value)}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-[#0b1c30] dark:text-white focus:outline-none focus:border-[#00236f]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
                Date Prefix Label
              </label>
              <select
                value={dateLabel}
                onChange={(e) => setDateLabel(e.target.value)}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2 rounded-xl font-semibold text-[#0b1c30] dark:text-white"
              >
                <option value="DOP:">DOP: (Date of Photo)</option>
                <option value="DOB:">DOB: (Date of Birth)</option>
                <option value="Date:">Date:</option>
                <option value="">No Prefix</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
                Photo Width (px)
              </label>
              <input
                type="number"
                value={targetWidth}
                onChange={(e) => setTargetWidth(Number(e.target.value))}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2 rounded-xl font-semibold text-[#0b1c30] dark:text-white"
              />
            </div>

            <div>
              <label className="font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
                Photo Height (px)
              </label>
              <input
                type="number"
                value={targetHeight}
                onChange={(e) => setTargetHeight(Number(e.target.value))}
                className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2 rounded-xl font-semibold text-[#0b1c30] dark:text-white"
              />
            </div>
          </div>

          {/* Checkbox toggles */}
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-[#334155] dark:text-[#cbd5e1]">
              <input
                type="checkbox"
                checked={includeName}
                onChange={(e) => setIncludeName(e.target.checked)}
                className="rounded accent-[#00236f]"
              />
              <span>Include Name on Strip</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-[#334155] dark:text-[#cbd5e1]">
              <input
                type="checkbox"
                checked={includeDate}
                onChange={(e) => setIncludeDate(e.target.checked)}
                className="rounded accent-[#00236f]"
              />
              <span>Include Date on Strip</span>
            </label>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-[11px] font-bold text-[#64748b] dark:text-[#94a3b8] self-center">Presets:</span>
            <button
              onClick={() => { setTargetWidth(350); setTargetHeight(450); setFontSize(14); }}
              className="px-2.5 py-1 bg-slate-100 dark:bg-[#0f1d33] hover:bg-slate-200 dark:hover:bg-[#1e324c] rounded-lg text-[11px] font-bold text-[#0b1c30] dark:text-white transition-all"
            >
              SSC CGL (3.5 x 4.5 cm)
            </button>
            <button
              onClick={() => { setTargetWidth(200); setTargetHeight(230); setFontSize(12); }}
              className="px-2.5 py-1 bg-slate-100 dark:bg-[#0f1d33] hover:bg-slate-200 dark:hover:bg-[#1e324c] rounded-lg text-[11px] font-bold text-[#0b1c30] dark:text-white transition-all"
            >
              UPPSC / UP Police (200x230)
            </button>
            <button
              onClick={() => { setTargetWidth(300); setTargetHeight(400); setFontSize(13); }}
              className="px-2.5 py-1 bg-slate-100 dark:bg-[#0f1d33] hover:bg-slate-200 dark:hover:bg-[#1e324c] rounded-lg text-[11px] font-bold text-[#0b1c30] dark:text-white transition-all"
            >
              Railway RRB (300x400)
            </button>
          </div>
        </div>

        {/* Right Live Preview Canvas */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#0c182c] border border-[#e2e8f0] dark:border-[#1e324c] rounded-2xl p-4">
          <span className="text-[11px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-wider mb-2">
            Live Stamped Preview
          </span>

          <canvas ref={canvasRef} className="hidden" />

          {processedImage && (
            <div className="relative group">
              <img
                src={processedImage}
                alt="Stamped Output"
                className="max-h-[280px] w-auto object-contain border-2 border-white dark:border-[#1e324c] rounded-lg shadow-md"
              />
            </div>
          )}

          <div className="mt-4 w-full space-y-2">
            {processedImage && (
              <a
                href={processedImage}
                download={`${candidateName.replace(/\s+/g, '_')}_DOP_Photo.jpg`}
                className="w-full bg-[#003120] hover:bg-[#004a32] text-white text-xs font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Download Stamped Photo (JPG)</span>
              </a>
            )}
            <p className="text-center text-[10px] text-[#64748b] dark:text-[#94a3b8]">
              Ready for upload on SSC, UPSC, NTA, Railway &amp; State PSC portals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
