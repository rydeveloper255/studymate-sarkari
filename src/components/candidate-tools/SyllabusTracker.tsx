import React, { useState, useEffect } from 'react';

interface SyllabusTopic {
  id: string;
  name: string;
  subject: string;
}

interface ExamSyllabus {
  id: string;
  name: string;
  topics: SyllabusTopic[];
}

const SYLLABUS_DATA: ExamSyllabus[] = [
  {
    id: 'ssc_cgl',
    name: 'SSC CGL Tier-1 Comprehensive',
    topics: [
      // Quant
      { id: 'ssc_q1', subject: 'Quantitative Aptitude', name: 'Percentage, Profit & Loss, Discount' },
      { id: 'ssc_q2', subject: 'Quantitative Aptitude', name: 'Ratio & Proportion, Mixture & Alligation' },
      { id: 'ssc_q3', subject: 'Quantitative Aptitude', name: 'Time & Work, Pipes & Cisterns' },
      { id: 'ssc_q4', subject: 'Quantitative Aptitude', name: 'Time, Speed & Distance, Boats & Streams' },
      { id: 'ssc_q5', subject: 'Quantitative Aptitude', name: 'Algebra, Linear Equations & Polynomials' },
      { id: 'ssc_q6', subject: 'Quantitative Aptitude', name: 'Geometry (Triangles, Circles, Tangents)' },
      { id: 'ssc_q7', subject: 'Quantitative Aptitude', name: 'Trigonometry & Heights and Distances' },
      { id: 'ssc_q8', subject: 'Quantitative Aptitude', name: 'Data Interpretation (Bar, Pie, Line Graphs)' },
      // Reasoning
      { id: 'ssc_r1', subject: 'General Intelligence & Reasoning', name: 'Analogy & Classification' },
      { id: 'ssc_r2', subject: 'General Intelligence & Reasoning', name: 'Series (Number, Alphabet, Alpha-numeric)' },
      { id: 'ssc_r3', subject: 'General Intelligence & Reasoning', name: 'Coding-Decoding & Blood Relations' },
      { id: 'ssc_r4', subject: 'General Intelligence & Reasoning', name: 'Direction Sense & Syllogism' },
      { id: 'ssc_r5', subject: 'General Intelligence & Reasoning', name: 'Non-Verbal Reasoning (Paper Folding, Mirror Images)' },
      // English
      { id: 'ssc_e1', subject: 'English Comprehension', name: 'Spotting the Error & Sentence Improvement' },
      { id: 'ssc_e2', subject: 'English Comprehension', name: 'Idioms, Phrases & One Word Substitution' },
      { id: 'ssc_e3', subject: 'English Comprehension', name: 'Synonyms, Antonyms & Spelling Errors' },
      { id: 'ssc_e4', subject: 'English Comprehension', name: 'Cloze Test & Reading Comprehension' },
      // GA
      { id: 'ssc_g1', subject: 'General Awareness', name: 'Indian Polity & Articles of Constitution' },
      { id: 'ssc_g2', subject: 'General Awareness', name: 'Indian History (Ancient, Medieval, Modern & INM)' },
      { id: 'ssc_g3', subject: 'General Awareness', name: 'Geography (Indian & Physical Geography)' },
      { id: 'ssc_g4', subject: 'General Awareness', name: 'General Science (Physics, Chemistry, Biology)' },
      { id: 'ssc_g5', subject: 'General Awareness', name: 'Monthly Current Affairs (Last 6 Months)' },
    ],
  },
  {
    id: 'rrb_ntpc',
    name: 'RRB NTPC (CBT 1 & 2)',
    topics: [
      { id: 'rrb_m1', subject: 'Mathematics', name: 'Number System, Decimals & Fractions' },
      { id: 'rrb_m2', subject: 'Mathematics', name: 'LCM & HCF, Ratio & Proportion' },
      { id: 'rrb_m3', subject: 'Mathematics', name: 'Simple & Compound Interest, Profit & Loss' },
      { id: 'rrb_m4', subject: 'Mathematics', name: 'Mensuration, Time & Work, Time & Distance' },
      { id: 'rrb_r1', subject: 'General Intelligence', name: 'Analogies, Completion of Number and Alphabetical Series' },
      { id: 'rrb_r2', subject: 'General Intelligence', name: 'Venn Diagrams, Puzzle, Data Sufficiency' },
      { id: 'rrb_g1', subject: 'General Awareness', name: 'Current Events of National and International Importance' },
      { id: 'rrb_g2', subject: 'General Awareness', name: 'Indian Railways Facts & History' },
      { id: 'rrb_g3', subject: 'General Awareness', name: 'General Scientific and Technological Developments' },
    ],
  },
  {
    id: 'up_police',
    name: 'UP Police Constable 2025',
    topics: [
      { id: 'up_h1', subject: 'General Hindi', name: 'हिंदी वर्णमाला, तद्भव-तत्सम, पर्यायवाची, विलोम' },
      { id: 'up_h2', subject: 'General Hindi', name: 'संधि, समास, उपसर्ग-प्रत्यय, मुहावरे एवं लोकोक्तियां' },
      { id: 'up_g1', subject: 'General Knowledge', name: 'उत्तर प्रदेश की शिक्षा, संस्कृति और सामाजिक प्रथाएं' },
      { id: 'up_g2', subject: 'General Knowledge', name: 'भारतीय संविधान, मानवाधिकार, आंतरिक सुरक्षा' },
      { id: 'up_m1', subject: 'Numerical & Mental Ability', name: 'संख्या पद्धति, सरलीकरण, औसत, प्रतिशत, कार्य-समय' },
      { id: 'up_r1', subject: 'Mental Aptitude & Reasoning', name: 'दिशा ज्ञान, रक्त संबंध, समरूपता, प्रत्यक्ष ज्ञान बोध' },
    ],
  },
];

export const SyllabusTracker: React.FC = () => {
  const [selectedExamId, setSelectedExamId] = useState('ssc_cgl');
  const [completedTopicIds, setCompletedTopicIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('studymate_syllabus_progress');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [filterSubject, setFilterSubject] = useState<string>('all');

  useEffect(() => {
    try {
      localStorage.setItem('studymate_syllabus_progress', JSON.stringify(completedTopicIds));
    } catch (e) {
      console.error(e);
    }
  }, [completedTopicIds]);

  const currentExam = SYLLABUS_DATA.find((e) => e.id === selectedExamId) || SYLLABUS_DATA[0];

  const toggleTopic = (topicId: string) => {
    setCompletedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  const subjects = Array.from(new Set(currentExam.topics.map((t) => t.subject)));

  const totalExamTopics = currentExam.topics.length;
  const completedExamTopics = currentExam.topics.filter((t) => completedTopicIds.includes(t.id)).length;
  const progressPercent = totalExamTopics > 0 ? Math.round((completedExamTopics / totalExamTopics) * 100) : 0;

  const visibleTopics = filterSubject === 'all'
    ? currentExam.topics
    : currentExam.topics.filter((t) => t.subject === filterSubject);

  return (
    <div className="bg-white dark:bg-[#070e1e] rounded-2xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-xs max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[#e2e8f0] dark:border-[#1e324c] pb-4">
        <div className="flex items-center gap-2 text-[#00236f] dark:text-[#38bdf8]">
          <span className="material-symbols-outlined text-[24px]">checklist</span>
          <h2 className="font-display font-extrabold text-lg sm:text-xl text-[#0b1c30] dark:text-white">
            Syllabus Topic-Wise Checklist &amp; Revision Tracker
          </h2>
        </div>
        <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-1">
          Track syllabus preparation chapter-by-chapter with automated completion bars saved to your device.
        </p>
      </div>

      {/* Top Selector & Overall Progress */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-6">
          <label className="text-xs font-bold text-[#475569] dark:text-[#94a3b8] block mb-1">
            Choose Target Exam Syllabus:
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              setFilterSubject('all');
            }}
            className="w-full bg-[#f8fafc] dark:bg-[#0c182c] border border-[#cbd5e1] dark:border-[#1e324c] p-2.5 rounded-xl font-bold text-sm text-[#0b1c30] dark:text-white"
          >
            {SYLLABUS_DATA.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-6 bg-[#eff4ff] dark:bg-[#0c182c] p-3.5 rounded-xl border border-[#d3e4fe] dark:border-[#1e324c]">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-[#00236f] dark:text-[#38bdf8]">Overall Syllabus Coverage</span>
            <span className="text-[#0b1c30] dark:text-white">{completedExamTopics} / {totalExamTopics} Topics ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#00236f] to-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterSubject('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterSubject === 'all'
              ? 'bg-[#00236f] text-white shadow-xs'
              : 'bg-[#f8fafc] dark:bg-[#0c182c] text-[#475569] dark:text-[#cbd5e1] border border-[#cbd5e1] dark:border-[#1e324c]'
          }`}
        >
          All Subjects ({totalExamTopics})
        </button>
        {subjects.map((sub) => {
          const subTopics = currentExam.topics.filter((t) => t.subject === sub);
          const subCompleted = subTopics.filter((t) => completedTopicIds.includes(t.id)).length;
          return (
            <button
              key={sub}
              onClick={() => setFilterSubject(sub)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterSubject === sub
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'bg-[#f8fafc] dark:bg-[#0c182c] text-[#475569] dark:text-[#cbd5e1] border border-[#cbd5e1] dark:border-[#1e324c]'
              }`}
            >
              {sub} ({subCompleted}/{subTopics.length})
            </button>
          );
        })}
      </div>

      {/* Topics Checklist */}
      <div className="space-y-2">
        {visibleTopics.map((topic) => {
          const isDone = completedTopicIds.includes(topic.id);
          return (
            <div
              key={topic.id}
              onClick={() => toggleTopic(topic.id)}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                isDone
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-[#070e1e] border-[#e2e8f0] dark:border-[#1e324c] hover:border-[#00236f]'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => {}}
                  className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                />
                <div>
                  <span className={`text-xs font-bold block ${isDone ? 'line-through text-[#64748b] dark:text-[#94a3b8]' : 'text-[#0b1c30] dark:text-white'}`}>
                    {topic.name}
                  </span>
                  <span className="text-[10px] text-[#64748b] dark:text-[#94a3b8]">
                    {topic.subject}
                  </span>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                isDone ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' : 'bg-slate-100 dark:bg-[#0f1d33] text-[#64748b]'
              }`}>
                {isDone ? 'Completed' : 'Pending'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
