import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export interface CommentItem {
  id: string;
  author: string;
  category: string;
  badge?: string;
  timestamp: string;
  content: string;
  tag: string;
  upvotes: number;
  replies?: CommentItem[];
}

export interface JobDiscussionForumProps {
  jobId: string;
  jobTitle: string;
}

const DEFAULT_COMMENTS: { [key: string]: CommentItem[] } = {
  'ssc-cgl-2025': [
    {
      id: 'c-1',
      author: 'Aman Sharma (Tier-1 Aspirant)',
      category: 'OBC',
      badge: 'Verified Aspirant',
      timestamp: '2 hours ago',
      content:
        'Does the photo upload require date of photograph printed on it, or plain passport size is accepted as per new SSC notification format?',
      tag: '#PhotoGuidelines',
      upvotes: 14,
      replies: [
        {
          id: 'c-1-r1',
          author: 'Vikram Singh (StudyMate Mentor)',
          category: 'Mentor',
          badge: 'Expert',
          timestamp: '1 hour ago',
          content:
            'As per SSC live portal update, live webcam photograph is captured with plain background. No date printing needed on the live captured photo.',
          tag: '#PhotoGuidelines',
          upvotes: 21,
        },
      ],
    },
    {
      id: 'c-2',
      author: 'Priya Meena',
      category: 'ST',
      badge: 'Verified Aspirant',
      timestamp: '4 hours ago',
      content:
        'What is the cutoff date for OBC-NCL and EWS certificate financial year validity for CGL 2025?',
      tag: '#CertificateValidity',
      upvotes: 9,
    },
  ],
  default: [
    {
      id: 'cd-1',
      author: 'Rahul Verma',
      category: 'UR',
      badge: 'Aspirant',
      timestamp: 'Today, 11:30 AM',
      content:
        'Has anyone verified whether the examination centers for Phase-1 will be allocated within home division or outside state?',
      tag: '#ExamCenter',
      upvotes: 7,
    },
    {
      id: 'cd-2',
      author: 'Deepak Kumar',
      category: 'OBC',
      badge: 'StudyMate Moderator',
      timestamp: 'Today, 01:15 PM',
      content:
        'Exam city intimation slips are usually released 10-12 days prior to exam date on respective regional commission portals.',
      tag: '#CitySlip',
      upvotes: 12,
    },
  ],
};

export const JobDiscussionForum: React.FC<JobDiscussionForumProps> = ({
  jobId,
  jobTitle,
}) => {
  const { language } = useLanguage();
  const storageKey = `studymate_forum_${jobId}`;

  const [comments, setComments] = useState<CommentItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_COMMENTS[jobId] || DEFAULT_COMMENTS['default'];
  });

  const [authorName, setAuthorName] = useState('');
  const [newComment, setNewComment] = useState('');
  const [selectedTag, setSelectedTag] = useState('#General');
  const [activeReplyToId, setActiveReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(comments));
    } catch {
      // ignore
    }
  }, [comments, storageKey]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newItem: CommentItem = {
      id: `c-${Date.now()}`,
      author: authorName.trim() || 'Aspirant (Candidate)',
      category: 'General',
      badge: 'Verified Aspirant',
      timestamp: 'Just now',
      content: newComment.trim(),
      tag: selectedTag,
      upvotes: 1,
      replies: [],
    };

    setComments([newItem, ...comments]);
    setNewComment('');
  };

  const handleUpvote = (id: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, upvotes: c.upvotes + 1 };
        }
        if (c.replies && c.replies.length > 0) {
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r
            ),
          };
        }
        return c;
      })
    );
  };

  const handlePostReply = (parentId: string) => {
    if (!replyText.trim()) return;

    const newReply: CommentItem = {
      id: `r-${Date.now()}`,
      author: authorName.trim() || 'Fellow Aspirant',
      category: 'General',
      badge: 'Community Reply',
      timestamp: 'Just now',
      content: replyText.trim(),
      tag: selectedTag,
      upvotes: 1,
    };

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === parentId) {
          return { ...c, replies: [...(c.replies || []), newReply] };
        }
        return c;
      })
    );

    setActiveReplyToId(null);
    setReplyText('');
  };

  const tags = ['#General', '#AdmitCard', '#CutOff', '#ExamCenter', '#Eligibility', '#Syllabus'];

  return (
    <div className="bg-white dark:bg-[#101b2c] rounded-3xl border border-[#d3e4fe] dark:border-[#1e324c] p-6 shadow-sm space-y-6">
      {/* Forum Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#eff4ff] dark:border-[#1e324c]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#00236f] dark:bg-[#1e3a8a] text-white flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[22px] text-amber-300">
              forum
            </span>
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-[#0b1c30] dark:text-white">
              {language === 'hi' ? 'अभ्यर्थी चर्चा एवं संदेह समाधान' : 'Candidate Discussion & Doubt Forum'}
            </h3>
            <p className="text-xs text-[#757682] dark:text-[#94a3b8]">
              {language === 'hi'
                ? `साथी अभ्यर्थियों एवं मेंटर्स के साथ चर्चा करें • ${jobTitle}`
                : `Connect with peers and mentors • Discuss form filling, shifts, and cutoffs`}
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-[#00236f] dark:text-[#93c5fd] bg-[#eff4ff] dark:bg-[#070e1e] px-3 py-1.5 rounded-full self-start sm:self-auto border border-[#d3e4fe]/60 dark:border-[#1e324c]">
          {comments.length} {language === 'hi' ? 'चर्चाएं' : 'Queries'}
        </span>
      </div>

      {/* Post New Query Form */}
      <form onSubmit={handlePostComment} className="p-4 rounded-2xl bg-[#eff4ff] dark:bg-[#070e1e] border border-[#d3e4fe] dark:border-[#1e324c] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold text-[#444651] dark:text-[#cbd5e1] mb-1">
              {language === 'hi' ? 'आपका नाम (वैकल्पिक)' : 'Your Name (Optional)'}
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="e.g. Ankit Sharma"
              className="w-full bg-white dark:bg-[#101b2c] border border-[#d3e4fe] dark:border-[#1e324c] rounded-xl px-3 py-2 text-xs text-[#0b1c30] dark:text-white focus:ring-2 focus:ring-[#00236f]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#444651] dark:text-[#cbd5e1] mb-1">
              {language === 'hi' ? 'विषय टैग' : 'Topic Tag'}
            </label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full bg-white dark:bg-[#101b2c] border border-[#d3e4fe] dark:border-[#1e324c] rounded-xl px-3 py-2 text-xs font-bold text-[#0b1c30] dark:text-white focus:ring-2 focus:ring-[#00236f]"
            >
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block font-bold text-[#444651] dark:text-[#cbd5e1] text-xs mb-1">
            {language === 'hi' ? 'अपना सवाल या सुझाव लिखें' : 'Ask Question, Share Exam Center Info or Tips'}
          </label>
          <textarea
            rows={2}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'फॉर्म भरने, परीक्षा केंद्र, कट-ऑफ या सिलेबस से संबंधित प्रश्न पूछें...'
                : 'Ask doubts about photo specs, OBC validity, normalization shifts, exam center...'
            }
            className="w-full bg-white dark:bg-[#101b2c] border border-[#d3e4fe] dark:border-[#1e324c] rounded-xl p-3 text-xs text-[#0b1c30] dark:text-white focus:ring-2 focus:ring-[#00236f]"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#757682] dark:text-[#94a3b8]">
            ⚡ 100% Free & Peer-to-Peer Verified
          </span>
          <button
            type="submit"
            className="px-4 py-2 bg-[#00236f] hover:bg-[#00174c] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>{language === 'hi' ? 'पोस्ट करें' : 'Post Query'}</span>
            <span className="material-symbols-outlined text-[15px]">send</span>
          </button>
        </div>
      </form>

      {/* Discussion Threads List */}
      <div className="space-y-4">
        {comments.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl border border-[#eff4ff] dark:border-[#1e324c] bg-white dark:bg-[#070e1e] space-y-3"
          >
            {/* Header with avatar, author, tag, time */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#dce1ff] dark:bg-[#1e3a8a] text-[#00236f] dark:text-[#93c5fd] flex items-center justify-center font-bold text-xs">
                  {item.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-[#0b1c30] dark:text-white">
                      {item.author}
                    </span>
                    {item.badge && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#85f8c4] text-[#002114]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#757682] dark:text-[#94a3b8]">
                    {item.timestamp}
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-extrabold text-[#00236f] dark:text-[#38bdf8] bg-[#eff4ff] dark:bg-[#101b2c] px-2 py-0.5 rounded-full border border-[#d3e4fe]/50 dark:border-[#1e324c]">
                {item.tag}
              </span>
            </div>

            {/* Comment Body */}
            <p className="text-xs text-[#444651] dark:text-[#cbd5e1] leading-relaxed">
              {item.content}
            </p>

            {/* Actions: Upvote & Reply Button */}
            <div className="flex items-center gap-3 pt-1 text-xs">
              <button
                onClick={() => handleUpvote(item.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#eff4ff] dark:bg-[#101b2c] hover:bg-[#dce9ff] text-[#00236f] dark:text-[#93c5fd] font-bold text-[11px] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">thumb_up</span>
                <span>{item.upvotes}</span>
              </button>

              <button
                onClick={() => setActiveReplyToId(activeReplyToId === item.id ? null : item.id)}
                className="text-[#757682] dark:text-[#94a3b8] hover:text-[#00236f] dark:hover:text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">reply</span>
                <span>{language === 'hi' ? 'जवाब दें' : 'Reply'}</span>
              </button>
            </div>

            {/* Reply Input Box */}
            {activeReplyToId === item.id && (
              <div className="pl-6 pt-2 border-l-2 border-[#d3e4fe] dark:border-[#1e324c] space-y-2">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={language === 'hi' ? 'अपना जवाब लिखें...' : 'Write your reply...'}
                  className="w-full bg-[#eff4ff] dark:bg-[#101b2c] border border-[#d3e4fe] dark:border-[#1e324c] rounded-xl p-2.5 text-xs text-[#0b1c30] dark:text-white"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePostReply(item.id)}
                    className="px-3 py-1.5 bg-[#00236f] text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    {language === 'hi' ? 'जवाब भेजें' : 'Submit Reply'}
                  </button>
                  <button
                    onClick={() => setActiveReplyToId(null)}
                    className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Nested Replies */}
            {item.replies && item.replies.length > 0 && (
              <div className="pl-6 space-y-2 border-l-2 border-[#d3e4fe] dark:border-[#1e324c]">
                {item.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="p-3 rounded-xl bg-[#eff4ff]/60 dark:bg-[#101b2c] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#0b1c30] dark:text-white">
                          {reply.author}
                        </span>
                        {reply.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#00236f] text-white">
                            {reply.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#757682] dark:text-[#94a3b8]">
                        {reply.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-[#444651] dark:text-[#cbd5e1]">{reply.content}</p>
                    <button
                      onClick={() => handleUpvote(reply.id)}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#00236f] dark:text-[#93c5fd] mt-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">thumb_up</span>
                      <span>{reply.upvotes} Helpful</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
