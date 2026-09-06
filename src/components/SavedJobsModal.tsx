import React from 'react';
import { JobItem } from '../types';

export interface SavedJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedJobs: JobItem[];
  onRemoveBookmark: (jobId: string) => void;
  onSelectJob: (jobId: string) => void;
}

export const SavedJobsModal: React.FC<SavedJobsModalProps> = ({
  isOpen,
  onClose,
  savedJobs,
  onRemoveBookmark,
  onSelectJob,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl border border-[#d3e4fe] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#dce1ff] text-[#00236f] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">bookmark</span>
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#00236f]">Aspirant Zone: Saved Jobs</h3>
              <p className="text-[11px] text-[#757682]">{savedJobs.length} Bookmarked Vacancies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#757682] hover:text-[#0b1c30] rounded-lg hover:bg-[#eff4ff]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {savedJobs.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-[#757682] mb-2">bookmark_border</span>
              <p className="text-xs font-bold text-[#0b1c30]">No saved vacancies yet</p>
              <p className="text-[11px] text-[#757682] mt-0.5">Click the bookmark icon on any job to save it here.</p>
            </div>
          ) : (
            savedJobs.map((job) => (
              <div
                key={job.id}
                className="p-3.5 bg-[#eff4ff] rounded-xl border border-[#d3e4fe] hover:bg-[#dce9ff] transition-all flex items-start justify-between gap-3"
              >
                <div
                  onClick={() => {
                    onSelectJob(job.id);
                    onClose();
                  }}
                  className="cursor-pointer flex-1"
                >
                  <span className="bg-[#dce1ff] text-[#00164e] text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                    {job.category}
                  </span>
                  <h4 className="font-bold text-xs text-[#00236f] mt-1 leading-snug">
                    {job.shortTitle || job.title}
                  </h4>
                  <p className="text-[11px] text-[#444651] mt-0.5">
                    Last Date: <strong className="text-[#904d00]">{job.lastDate.split('(')[0]}</strong> • {job.vacanciesFormatted} Posts
                  </p>
                </div>

                <button
                  onClick={() => onRemoveBookmark(job.id)}
                  className="text-[#757682] hover:text-[#ba1a1a] p-1 rounded hover:bg-white"
                  title="Remove bookmark"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-[#eff4ff] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold px-4 py-2 rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
