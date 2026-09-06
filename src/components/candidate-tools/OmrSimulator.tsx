import React, { useState, useEffect } from 'react';

export const OmrSimulator: React.FC = () => {
  const [totalQuestions, setTotalQuestions] = useState<number>(50);
  const [answers, setAnswers] = useState<{ [qIndex: number]: string }>({});
  const [isExamRunning, setIsExamRunning] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30 * 60);
  const [evaluationResult, setEvaluationResult] = useState<{
    attempted: number;
    score: number;
    correct: number;
    wrong: number;
  } | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (isExamRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isExamRunning) {
      setIsExamRunning(false);
      evaluateSheet();
    }
    return () => clearInterval(interval);
  }, [isExamRunning, secondsRemaining]);

  const handleBubbleClick = (qIndex: number, option: string) => {
    if (!isExamRunning && secondsRemaining > 0) {
      setIsExamRunning(true);
    }
    setAnswers((prev) => {
      if (prev[qIndex] === option) {
        const next = { ...prev };
        delete next[qIndex];
        return next;
      }
      return { ...prev, [qIndex]: option };
    });
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all marked OMR bubbles?')) {
      setAnswers({});
      setEvaluationResult(null);
    }
  };

  const handleStartTimer = (mins: number) => {
    setSecondsRemaining(mins * 60);
    setIsExamRunning(true);
    setAnswers({});
    setEvaluationResult(null);
  };

  const evaluateSheet = () => {
    setIsExamRunning(false);
    let correct = 0;
    let wrong = 0;
    const attempted = Object.keys(answers).length;

    for (let i = 1; i <= totalQuestions; i++) {
      const marked = answers[i];
      if (marked) {
        const simulatedCorrect = i % 3 === 0 ? 'A' : i % 2 === 0 ? 'B' : 'C';
        if (marked === simulatedCorrect) {
          correct++;
        } else {
          wrong++;
        }
      }
    }

    const score = correct * 1 - wrong * 0.25;
    setEvaluationResult({
      attempted,
      correct,
      wrong,
      score: Math.max(0, score),
    });
  };

  const handlePrintBlankOmr = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let rowsHtml = '';
    for (let i = 1; i <= totalQuestions; i++) {
      rowsHtml += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; border-bottom: 1px dashed #ddd; font-family: sans-serif; font-size: 12px;">
          <span style="font-weight: bold; width: 30px;">${i}.</span>
          <div style="display: flex; gap: 12px;">
            <div style="width: 18px; height: 18px; border: 1.5px solid #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">A</div>
            <div style="width: 18px; height: 18px; border: 1.5px solid #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">B</div>
            <div style="width: 18px; height: 18px; border: 1.5px solid #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">C</div>
            <div style="width: 18px; height: 18px; border: 1.5px solid #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">D</div>
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>StudyMate Sarkari - Official Practice OMR Sheet</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: Arial, sans-serif; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; }
            .grid-container { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0; text-transform: uppercase;">StudyMate Sarkari - Standard OMR Response Sheet</h2>
            <p style="margin: 4px 0 0; font-size: 11px;">Fill only with Black / Blue Ball Point Pen • Darken the circle completely</p>
            <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 11px; border: 1px solid #000; padding: 6px;">
              <span><strong>Roll No:</strong> ____________________</span>
              <span><strong>Test Booklet No:</strong> ____________________</span>
              <span><strong>Date:</strong> ___/___/202___</span>
            </div>
          </div>
          <div class="grid-container">
            ${rowsHtml}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-[#070e1e] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] dark:border-[#1e324c] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[#00236f] dark:text-[#38bdf8]">
            <span className="material-symbols-outlined text-[24px]">radio_button_checked</span>
            <h2 className="font-display font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-white">
              OMR Sheet Simulator &amp; Printable Sheet
            </h2>
          </div>
          <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-1">
            Simulate real offline exam bubble darkening speed with live countdown timer and printable A4 sheet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintBlankOmr}
            className="px-3 py-2 bg-slate-100 dark:bg-[#0f1d33] hover:bg-slate-200 dark:hover:bg-[#1e324c] rounded-xl text-xs font-bold text-[#0b1c30] dark:text-white flex items-center gap-1.5 border border-[#cbd5e1] dark:border-[#1e324c] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Print A4 OMR
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-red-200 dark:border-red-800 transition-all cursor-pointer"
          >
            Clear Sheet
          </button>
        </div>
      </div>

      {/* Timer & Controls Bar */}
      <div className="bg-[#eff4ff] dark:bg-[#0c182c] border border-[#d3e4fe] dark:border-[#1e324c] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#475569] dark:text-[#94a3b8]">Questions:</span>
          <div className="flex gap-1">
            {[30, 50, 100].map((count) => (
              <button
                key={count}
                onClick={() => { setTotalQuestions(count); setAnswers({}); setEvaluationResult(null); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  totalQuestions === count
                    ? 'bg-[#00236f] text-white'
                    : 'bg-white dark:bg-[#070e1e] text-[#475569] dark:text-[#cbd5e1] border border-[#cbd5e1] dark:border-[#1e324c]'
                }`}
              >
                {count} Qs
              </button>
            ))}
          </div>
        </div>

        {/* Live Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#070e1e] border border-[#cbd5e1] dark:border-[#1e324c] px-3 py-1.5 rounded-xl">
            <span className="material-symbols-outlined text-[18px] text-red-500 animate-pulse">timer</span>
            <span className="font-mono font-black text-sm text-[#0b1c30] dark:text-white">
              {formatTimer(secondsRemaining)}
            </span>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => handleStartTimer(30)}
              className="px-2.5 py-1.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold transition-all"
            >
              30m Test
            </button>
            <button
              onClick={() => handleStartTimer(60)}
              className="px-2.5 py-1.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-lg text-xs font-bold transition-all"
            >
              60m Test
            </button>
            {isExamRunning ? (
              <button
                onClick={() => setIsExamRunning(false)}
                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={() => setIsExamRunning(true)}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
              >
                Resume
              </button>
            )}
            <button
              onClick={evaluateSheet}
              className="px-3 py-1.5 bg-[#003120] hover:bg-[#004a32] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              Submit &amp; Evaluate
            </button>
          </div>
        </div>
      </div>

      {/* Evaluation Result Alert */}
      {evaluationResult && (
        <div className="bg-gradient-to-r from-[#003120] to-[#00236f] text-white p-4 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-[#85f8c4] block">Evaluation Scorecard</span>
            <div className="text-xl font-black mt-0.5">
              Score: {evaluationResult.score.toFixed(2)} / {totalQuestions}
            </div>
          </div>
          <div className="flex gap-4 text-xs">
            <div>Attempted: <strong>{evaluationResult.attempted}</strong></div>
            <div className="text-emerald-300">Correct: <strong>{evaluationResult.correct}</strong></div>
            <div className="text-red-300">Wrong: <strong>{evaluationResult.wrong}</strong></div>
          </div>
        </div>
      )}

      {/* OMR Bubble Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: totalQuestions }).map((_, idx) => {
          const qNum = idx + 1;
          const currentAnswer = answers[qNum];
          return (
            <div
              key={qNum}
              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                currentAnswer
                  ? 'bg-[#eff4ff] dark:bg-[#0c182c] border-[#00236f] dark:border-[#38bdf8]'
                  : 'bg-white dark:bg-[#070e1e] border-[#e2e8f0] dark:border-[#1e324c]'
              }`}
            >
              <span className="font-bold text-xs text-[#475569] dark:text-[#94a3b8] w-7">
                {qNum.toString().padStart(2, '0')}.
              </span>
              <div className="flex gap-2">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const isSelected = currentAnswer === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleBubbleClick(qNum, opt)}
                      className={`w-7 h-7 rounded-full text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'bg-[#00236f] dark:bg-[#38bdf8] text-white dark:text-[#0b1c30] shadow-sm scale-110'
                          : 'border-2 border-[#94a3b8] dark:border-[#475569] text-[#475569] dark:text-[#cbd5e1] hover:border-[#00236f]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
