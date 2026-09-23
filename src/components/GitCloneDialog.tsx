import React, { useState } from 'react';
import { GitBranchIcon } from './Icons';

interface GitCloneDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onClone: (repoUrl: string, dirName: string) => void;
}

export const GitCloneDialog: React.FC<GitCloneDialogProps> = ({
  isOpen,
  onClose,
  onClone,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remoteUri, setRemoteUri] = useState('');
  const [branch, setBranch] = useState('');
  const [directoryName, setDirectoryName] = useState('');
  const [isCloning, setIsCloning] = useState(false);

  if (!isOpen) return null;

  const handleRemoteUriChange = (val: string) => {
    setRemoteUri(val);
    if (!directoryName) {
      // Auto deduce project name from URL e.g. https://github.com/user/my-repo.git -> my-repo
      const match = val.match(/\/([a-zA-Z0-9_-]+?)(?:\.git|\/)?$/);
      if (match && match[1]) {
        setDirectoryName(match[1]);
      }
    }
  };

  const handleCloneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteUri.trim()) return;

    setIsCloning(true);
    setTimeout(() => {
      const finalDir = directoryName.trim() || 'cloned-repo';
      onClone(remoteUri.trim(), finalDir);
      setIsCloning(false);
      onClose();
    }, 600);
  };

  return (
    <div 
      id="dialog-git-clone"
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
        <h2 className="text-xl font-bold text-[#1f2937] mb-5">
          Clone Git Repository
        </h2>

        {/* Link to GitHub pill button */}
        <div className="mb-5">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-xs font-semibold text-gray-700 shadow-2xs"
          >
            {/* GitHub Octocat Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>Link to GitHub</span>
          </button>
        </div>

        <form onSubmit={handleCloneSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-[11px] font-semibold text-[#2196F3] tracking-wide">
              Username
            </label>
            <input
              type="text"
              placeholder="Optional"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full py-1 border-b-2 border-[#2196F3] text-gray-800 text-sm focus:outline-none placeholder-gray-400 bg-transparent"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-semibold text-[#2196F3] tracking-wide">
              Password
            </label>
            <input
              type="password"
              placeholder="Optional"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-1 border-b-2 border-[#2196F3] text-gray-800 text-sm focus:outline-none placeholder-gray-400 bg-transparent"
            />
          </div>

          {/* Remote URI */}
          <div>
            <label className="block text-[11px] font-semibold text-[#2196F3] tracking-wide">
              Remote URI
            </label>
            <input
              type="text"
              placeholder="https://github.com/user/repo.git"
              value={remoteUri}
              onChange={(e) => handleRemoteUriChange(e.target.value)}
              className="w-full py-1 border-b-2 border-[#2196F3] text-gray-800 text-sm focus:outline-none bg-transparent"
              required
            />
          </div>

          {/* Branch */}
          <div>
            <label className="block text-[11px] font-semibold text-[#2196F3] tracking-wide">
              Branch:Default is main branch.
            </label>
            <input
              type="text"
              placeholder="Optional"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full py-1 border-b-2 border-[#2196F3] text-gray-800 text-sm focus:outline-none placeholder-gray-400 bg-transparent"
            />
          </div>

          {/* Local Project Directory Name */}
          <div>
            <label className="block text-[11px] font-semibold text-[#2196F3] tracking-wide">
              Local Project Directory Name
            </label>
            <input
              type="text"
              value={directoryName}
              onChange={(e) => setDirectoryName(e.target.value)}
              className="w-full py-1 border-b-2 border-[#2196F3] text-gray-800 text-sm focus:outline-none bg-transparent"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 font-semibold text-sm py-2 px-2"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isCloning}
              id="btn-confirm-git-clone"
              className="text-[#2196F3] hover:text-[#1976D2] font-bold text-sm tracking-wide py-2 px-2 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isCloning ? 'CLONING...' : 'CLONE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
