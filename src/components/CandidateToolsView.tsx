import React, { useState } from 'react';
import { PhotoDateAdder } from './candidate-tools/PhotoDateAdder';
import { AgeRelaxationCalculator } from './candidate-tools/AgeRelaxationCalculator';
import { NegativeMarkingCalculator } from './candidate-tools/NegativeMarkingCalculator';
import { ApplicationFeeCalculator } from './candidate-tools/ApplicationFeeCalculator';
import { OmrSimulator } from './candidate-tools/OmrSimulator';
import { BilingualTypingTester } from './candidate-tools/BilingualTypingTester';
import { SyllabusTracker } from './candidate-tools/SyllabusTracker';
import { DocumentVerificationChecker } from './candidate-tools/DocumentVerificationChecker';
import { ExamTravelPlanner } from './candidate-tools/ExamTravelPlanner';
import { ZonePreferenceComparator } from './candidate-tools/ZonePreferenceComparator';
import { PhotoResizer } from './candidate-tools/PhotoResizer';
import { CbtMarksNormalizer } from './candidate-tools/CbtMarksNormalizer';

export interface CandidateToolsViewProps {
  onNavigate: (tab: string) => void;
}

interface ToolDefinition {
  id: string;
  name: string;
  category: 'form' | 'exam' | 'prep';
  icon: string;
  tagline: string;
}

const TOOLS: ToolDefinition[] = [
  { id: 'photo-date', name: 'Photo Name & Date Adder', category: 'form', icon: 'badge', tagline: 'Add DOP and Candidate name on photo strip' },
  { id: 'age-eligibility', name: 'Age Relaxation & Eligibility', category: 'prep', icon: 'cake', tagline: 'OBC/SC/ST/PwD cutoff age calculator' },
  { id: 'negative-marking', name: 'Negative Marking & Raw Score', category: 'exam', icon: 'calculate', tagline: '1/3rd, 1/4th penalty & accuracy score' },
  { id: 'fee-calculator', name: 'Application Fee & Exemption', category: 'form', icon: 'payments', tagline: 'Category & gender fee waiver breakdown' },
  { id: 'omr-simulator', name: 'OMR Practice Simulator', category: 'exam', icon: 'radio_button_checked', tagline: 'Live bubble darkening test & printable A4 OMR' },
  { id: 'typing-test', name: 'Bilingual Typing Speed Test', category: 'prep', icon: 'keyboard', tagline: 'English & Hindi (Mangal/Kruti Dev) WPM tester' },
  { id: 'syllabus-tracker', name: 'Syllabus Topic Checklist', category: 'prep', icon: 'checklist', tagline: 'Chapter-by-chapter revision & completion bar' },
  { id: 'dv-checker', name: 'DV & Certificate Validity', category: 'form', icon: 'verified_user', tagline: 'EWS/OBC-NCL rules & 11-point dossier list' },
  { id: 'travel-planner', name: 'Center Distance & Travel Planner', category: 'prep', icon: 'directions_transit', tagline: 'Route ETA, gate closure timing & travel kit' },
  { id: 'zone-preferences', name: 'Zone & Vacancy Comparator', category: 'prep', icon: 'reorder', tagline: 'RRB/SSC State preferences & vacancy ranking' },
  { id: 'photo-resizer', name: 'Photo & Signature Resizer', category: 'form', icon: 'crop', tagline: 'Exact px and 10-20KB / 20-50KB compressor' },
  { id: 'normalization', name: 'CBT Marks Normalizer', category: 'exam', icon: 'functions', tagline: 'Multi-shift percentile standard normalizer' },
];

export const CandidateToolsView: React.FC<CandidateToolsViewProps> = ({ onNavigate }) => {
  const [activeToolId, setActiveToolId] = useState<string>('photo-date');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'form' | 'exam' | 'prep'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTools = TOOLS.filter((t) => {
    const matchesCat = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const renderActiveTool = () => {
    switch (activeToolId) {
      case 'photo-date':
        return <PhotoDateAdder />;
      case 'age-eligibility':
        return <AgeRelaxationCalculator />;
      case 'negative-marking':
        return <NegativeMarkingCalculator />;
      case 'fee-calculator':
        return <ApplicationFeeCalculator />;
      case 'omr-simulator':
        return <OmrSimulator />;
      case 'typing-test':
        return <BilingualTypingTester />;
      case 'syllabus-tracker':
        return <SyllabusTracker />;
      case 'dv-checker':
        return <DocumentVerificationChecker />;
      case 'travel-planner':
        return <ExamTravelPlanner />;
      case 'zone-preferences':
        return <ZonePreferenceComparator />;
      case 'photo-resizer':
        return <PhotoResizer />;
      case 'normalization':
        return <CbtMarksNormalizer />;
      default:
        return <PhotoDateAdder />;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans w-full max-w-7xl mx-auto">
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#757682] dark:text-[#94a3b8]">
        <button
          onClick={() => onNavigate('home')}
          className="hover:text-[#00236f] dark:hover:text-white flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">home</span> Home
        </button>
        <span>/</span>
        <span className="text-[#0b1c30] dark:text-white font-bold">12 High-Utility Candidate Tools</span>
      </nav>

      {/* 2. Top Banner */}
      <div className="bg-gradient-to-r from-[#00236f] via-[#1e3a8a] to-[#003120] rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-[#85f8c4] text-[#002114] text-[11px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
              100% Free Aspirant Toolkit
            </span>
            <span className="bg-white/10 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">
              12 Active Utilities
            </span>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
            Official Candidate Tools &amp; Self-Service Suite
          </h1>
          <p className="text-white/80 text-xs md:text-sm mt-2 max-w-2xl leading-relaxed">
            From automated photo name/date stamping and category age relaxation to OMR simulators, typing speed tests, and syllabus progress tracking.
          </p>
        </div>
      </div>

      {/* 3. Category Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#070e1e] p-2.5 rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] shadow-xs">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-[#00236f] text-white shadow-xs'
                : 'text-[#475569] dark:text-[#94a3b8] hover:bg-[#eff4ff] dark:hover:bg-[#0c182c]'
            }`}
          >
            All Tools (12)
          </button>
          <button
            onClick={() => setCategoryFilter('form')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'form'
                ? 'bg-[#00236f] text-white shadow-xs'
                : 'text-[#475569] dark:text-[#94a3b8] hover:bg-[#eff4ff] dark:hover:bg-[#0c182c]'
            }`}
          >
            Form Filling &amp; Docs
          </button>
          <button
            onClick={() => setCategoryFilter('exam')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'exam'
                ? 'bg-[#00236f] text-white shadow-xs'
                : 'text-[#475569] dark:text-[#94a3b8] hover:bg-[#eff4ff] dark:hover:bg-[#0c182c]'
            }`}
          >
            Exam &amp; Scoring
          </button>
          <button
            onClick={() => setCategoryFilter('prep')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === 'prep'
                ? 'bg-[#00236f] text-white shadow-xs'
                : 'text-[#475569] dark:text-[#94a3b8] hover:bg-[#eff4ff] dark:hover:bg-[#0c182c]'
            }`}
          >
            Preparation &amp; Travel
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#94a3b8] text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search candidate tool..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] rounded-xl text-xs text-[#0b1c30] dark:text-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00236f]"
          />
        </div>
      </div>

      {/* 4. Horizontal Scrollable / Grid of Tools */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {filteredTools.map((tool) => {
          const isSelected = activeToolId === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => {
                setActiveToolId(tool.id);
                window.scrollTo({ top: 320, behavior: 'smooth' });
              }}
              className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer group ${
                isSelected
                  ? 'bg-[#00236f] dark:bg-[#0c1f3d] border-[#00236f] dark:border-[#38bdf8] text-white shadow-md scale-[1.02]'
                  : 'bg-white dark:bg-[#070e1e] border-[#e2e8f0] dark:border-[#1e324c] hover:border-[#00236f]/50 text-[#0b1c30] dark:text-[#f1f5f9] hover:bg-[#eff4ff]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isSelected ? 'bg-white/20 text-[#85f8c4]' : 'bg-[#eff4ff] dark:bg-[#0c182c] text-[#00236f] dark:text-[#38bdf8]'
                }`}>
                  <span className="material-symbols-outlined text-[20px]">{tool.icon}</span>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined text-[16px] text-[#85f8c4]">check_circle</span>
                )}
              </div>

              <div>
                <span className={`text-xs font-bold leading-tight line-clamp-2 ${
                  isSelected ? 'text-white' : 'text-[#0b1c30] dark:text-white'
                }`}>
                  {tool.name}
                </span>
                <span className={`text-[10px] line-clamp-1 mt-0.5 ${
                  isSelected ? 'text-white/70' : 'text-[#64748b] dark:text-[#94a3b8]'
                }`}>
                  {tool.tagline}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 5. Render Selected Tool */}
      <div className="mt-4">
        {renderActiveTool()}
      </div>
    </div>
  );
};
