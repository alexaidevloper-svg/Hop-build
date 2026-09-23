import React, { useState } from 'react';
import { Project } from '../types';
import { GitBranchIcon } from './Icons';
import { GitCommit, GitPullRequest, GitMerge, Check, UploadCloud } from 'lucide-react';

interface GitBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const GitBranchModal: React.FC<GitBranchModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [commitMsg, setCommitMsg] = useState('');
  const [activeBranch, setActiveBranch] = useState('main');
  const [statusText, setStatusText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMsg.trim()) return;
    setStatusText(`Committed ${project.files.length} files to '${activeBranch}' branch.`);
    setCommitMsg('');
    setTimeout(() => setStatusText(null), 3000);
  };

  return (
    <div 
      id="modal-git-branch"
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <GitBranchIcon size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Git Version Control</h2>
            <div className="text-xs text-gray-500">Branch: <span className="font-mono text-blue-600 font-bold">{activeBranch}</span></div>
          </div>
        </div>

        <form onSubmit={handleCommit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Commit Message
            </label>
            <input
              type="text"
              placeholder="e.g. Update index.html and style"
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!commitMsg.trim()}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <GitCommit className="w-4 h-4" />
              <span>Commit Changes</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusText('Pushed latest commits to origin/' + activeBranch);
                setTimeout(() => setStatusText(null), 3000);
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-xs flex items-center gap-1"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Push</span>
            </button>
          </div>
        </form>

        {statusText && (
          <div className="mt-3 p-2.5 bg-green-50 text-green-700 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>{statusText}</span>
          </div>
        )}

        <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
