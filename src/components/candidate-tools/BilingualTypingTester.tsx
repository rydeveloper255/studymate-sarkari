import React, { useState, useEffect, useRef } from 'react';

const ENGLISH_PASSAGES = [
  "The Union Public Service Commission conducts competitive examinations for recruitment to various civil services and posts of the Government of India. The Staff Selection Commission is an attached office of the Department of Personnel and Training that recruits staff for various Group B and Group C non-technical posts across diverse central ministries, departments, and subordinate offices.",
  "Railway Recruitment Boards function under the administrative control of the Ministry of Railways. Candidates must prepare methodically for computer based tests, psychometric assessment, physical efficiency tests, and document verification to secure appointments in Indian Railways.",
  "Public sector banking examinations require intense discipline in quantitative aptitude, reasoning reasoning ability, English comprehension, and general financial awareness. Time management and high accuracy are crucial to clear both preliminary and mains examination stages."
];

const HINDI_PASSAGES = [
  "कर्मचारी चयन आयोग भारत सरकार के विभिन्न मंत्रालयों और विभागों में अराजपत्रित पदों के लिए भर्ती परीक्षाएं आयोजित करता है। उम्मीदवारों को परीक्षा में सफलता प्राप्त करने के लिए नियमित अभ्यास और समय प्रबंधन पर विशेष ध्यान देना चाहिए।",
  "भारतीय प्रशासनिक सेवा और राज्य लोक सेवा आयोग की परीक्षाएं देश की सबसे प्रतिष्ठित परीक्षाओं में से एक हैं। इन परीक्षाओं में सफलता हेतु सामान्य ज्ञान और निरंतर लेखन शैली का विकास अत्यंत आवश्यक है।"
];

export const BilingualTypingTester: React.FC = () => {
  const [language, setLanguage] = useState<'english' | 'hindi'>('english');
  const [durationSecs, setDurationSecs] = useState<number>(60);
  const [passageIndex, setPassageIndex] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [allowBackspace, setAllowBackspace] = useState<boolean>(true);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const passages = language === 'english' ? ENGLISH_PASSAGES : HINDI_PASSAGES;
  const currentPassage = passages[passageIndex % passages.length];

  // Timer
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setIsFinished(true);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleStart = (secs: number) => {
    setDurationSecs(secs);
    setTimeLeft(secs);
    setInputVal('');
    setIsActive(true);
    setIsFinished(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsFinished(false);
    setTimeLeft(durationSecs);
    setInputVal('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isActive && !isFinished) {
      setIsActive(true);
    }
    setInputVal(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!allowBackspace && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
    }
  };

  // Metrics computation
  const elapsedSecs = durationSecs - timeLeft;
  const effectiveMinutes = (elapsedSecs > 0 ? elapsedSecs : 1) / 60;
  const totalTypedChars = inputVal.length;

  let correctChars = 0;
  for (let i = 0; i < inputVal.length; i++) {
    if (i < currentPassage.length && inputVal[i] === currentPassage[i]) {
      correctChars++;
    }
  }

  const grossWpm = Math.round((totalTypedChars / 5) / effectiveMinutes) || 0;
  const netWpm = Math.round((correctChars / 5) / effectiveMinutes) || 0;
  const accuracy = totalTypedChars > 0 ? Math.round((correctChars / totalTypedChars) * 100) : 100;

  return (
    <div className="bg-white dark:bg-[#070e1e] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[#e2e8f0] dark:border-[#1e324c] pb-4">
        <div className="flex items-center gap-2 text-[#00236f] dark:text-[#38bdf8]">
          <span className="material-symbols-outlined text-[24px]">keyboard</span>
          <h2 className="font-display font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-white">
            Bilingual Typing Speed &amp; Accuracy Tester
          </h2>
        </div>
        <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-1">
          Test English (35 WPM SSC standard) and Hindi (30 WPM Kruti Dev / Mangal Inscript) typing speed with real-time accuracy and error tracking.
        </p>
      </div>

      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#eff4ff] dark:bg-[#0c182c] p-3.5 rounded-xl border border-[#d3e4fe] dark:border-[#1e324c]">
        {/* Language Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setLanguage('english'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              language === 'english'
                ? 'bg-[#00236f] text-white'
                : 'bg-white dark:bg-[#070e1e] text-[#475569] dark:text-[#cbd5e1]'
            }`}
          >
            English Typing
          </button>
          <button
            onClick={() => { setLanguage('hindi'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              language === 'hindi'
                ? 'bg-[#00236f] text-white'
                : 'bg-white dark:bg-[#070e1e] text-[#475569] dark:text-[#cbd5e1]'
            }`}
          >
            Hindi Typing (हिंदी)
          </button>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <span className="text-[#475569] dark:text-[#94a3b8]">Duration:</span>
          {[60, 120, 300].map((s) => (
            <button
              key={s}
              onClick={() => handleStart(s)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                durationSecs === s
                  ? 'bg-[#00236f] text-white'
                  : 'bg-white dark:bg-[#070e1e] text-[#475569] dark:text-[#cbd5e1] border border-[#cbd5e1] dark:border-[#1e324c]'
              }`}
            >
              {s / 60}m
            </button>
          ))}
        </div>

        {/* Backspace Toggle */}
        <label className="flex items-center gap-1.5 text-xs font-bold text-[#475569] dark:text-[#94a3b8] cursor-pointer">
          <input
            type="checkbox"
            checked={allowBackspace}
            onChange={(e) => setAllowBackspace(e.target.checked)}
            className="rounded accent-[#00236f]"
          />
          <span>Allow Backspace</span>
        </label>
      </div>

      {/* Live Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-[#f8fafc] dark:bg-[#0c182c] border border-[#e2e8f0] dark:border-[#1e324c] p-3 rounded-xl">
          <span className="text-[10px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase block">Timer</span>
          <span className="font-mono font-black text-2xl text-red-600 dark:text-red-400">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
        <div className="bg-[#f8fafc] dark:bg-[#0c182c] border border-[#e2e8f0] dark:border-[#1e324c] p-3 rounded-xl">
          <span className="text-[10px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase block">Net Speed</span>
          <span className="font-display font-black text-2xl text-[#00236f] dark:text-[#38bdf8]">
            {netWpm} <span className="text-xs font-normal">WPM</span>
          </span>
        </div>
        <div className="bg-[#f8fafc] dark:bg-[#0c182c] border border-[#e2e8f0] dark:border-[#1e324c] p-3 rounded-xl">
          <span className="text-[10px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase block">Accuracy</span>
          <span className="font-display font-black text-2xl text-emerald-600 dark:text-emerald-400">
            {accuracy}%
          </span>
        </div>
        <div className="bg-[#f8fafc] dark:bg-[#0c182c] border border-[#e2e8f0] dark:border-[#1e324c] p-3 rounded-xl">
          <span className="text-[10px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase block">Gross Speed</span>
          <span className="font-display font-black text-2xl text-[#334155] dark:text-[#cbd5e1]">
            {grossWpm} <span className="text-xs font-normal">WPM</span>
          </span>
        </div>
      </div>

      {/* Passage Display Box */}
      <div className="p-4 bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] rounded-2xl leading-relaxed text-sm font-serif select-none">
        {currentPassage.split('').map((char, index) => {
          let charClass = 'text-[#64748b] dark:text-[#94a3b8]';
          if (index < inputVal.length) {
            if (inputVal[index] === char) {
              charClass = 'text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50';
            } else {
              charClass = 'text-red-600 dark:text-red-400 font-bold bg-red-100 dark:bg-red-950 underline';
            }
          } else if (index === inputVal.length) {
            charClass = 'bg-[#00236f] text-white px-0.5 rounded-xs animate-pulse';
          }
          return (
            <span key={index} className={charClass}>
              {char}
            </span>
          );
        })}
      </div>

      {/* Typing Input Area */}
      <div className="space-y-3">
        <textarea
          ref={inputRef}
          value={inputVal}
          disabled={isFinished}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Click here and start typing the passage above..."
          rows={4}
          className="w-full p-4 bg-white dark:bg-[#070e1e] border-2 border-[#00236f]/40 focus:border-[#00236f] dark:border-[#1e324c] dark:focus:border-[#38bdf8] rounded-2xl text-sm font-sans focus:outline-none shadow-xs resize-none"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPassageIndex((prev) => prev + 1);
                handleReset();
              }}
              className="px-3 py-1.5 bg-slate-100 dark:bg-[#0f1d33] hover:bg-slate-200 dark:hover:bg-[#1e324c] text-xs font-bold rounded-xl transition-all"
            >
              🔄 Change Passage
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-100 dark:bg-[#0f1d33] hover:bg-slate-200 dark:hover:bg-[#1e324c] text-xs font-bold rounded-xl transition-all"
            >
              Reset Test
            </button>
          </div>

          <div className="text-xs font-bold text-[#475569] dark:text-[#94a3b8]">
            {language === 'english' ? '🎯 SSC Target: 35 WPM (Eng)' : '🎯 Allahabad HC Target: 25-30 WPM (Hin)'}
          </div>
        </div>
      </div>

      {/* Finished Summary Banner */}
      {isFinished && (
        <div className="bg-gradient-to-r from-[#003120] to-[#00236f] text-white p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase text-[#85f8c4] tracking-widest block">
              Official Speed Certificate Card
            </span>
            <div className="text-xl font-black mt-1">
              Net Speed: {netWpm} WPM • Accuracy: {accuracy}%
            </div>
            <p className="text-xs text-white/80 mt-1">
              {netWpm >= 35 && accuracy >= 95
                ? '🏆 Qualified! You have cleared SSC CGL / CHSL & Railway typing standard speed.'
                : 'Keep practicing to increase words per minute and error-free strokes.'}
            </p>
          </div>
          <button
            onClick={() => handleStart(durationSecs)}
            className="px-4 py-2.5 bg-[#fe932c] hover:bg-[#fe932c]/90 text-[#2f1500] font-black text-xs rounded-xl shadow-md cursor-pointer"
          >
            Retake Test
          </button>
        </div>
      )}
    </div>
  );
};
