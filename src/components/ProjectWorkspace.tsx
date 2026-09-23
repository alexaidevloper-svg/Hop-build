import React, { useState, useRef } from 'react';
import { Project, ProjectFile } from '../types';
import { FileTypeBadgeIcon, GitBranchIcon } from './Icons';
import { X, Search, Plus, FileUp, MoreVertical, Trash2, Edit2, Download, CheckCircle2, UploadCloud, Code } from 'lucide-react';

interface ProjectWorkspaceProps {
  project: Project;
  onClose: () => void;
  onOpenFile: (file: ProjectFile) => void;
  onOpenCreateFile: () => void;
  onOpenPublish: () => void;
  onOpenPhpServer: () => void;
  onOpenGitModal: () => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onImportFiles: (files: FileList) => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  project,
  onClose,
  onOpenFile,
  onOpenCreateFile,
  onOpenPublish,
  onOpenPhpServer,
  onOpenGitModal,
  onDeleteFile,
  onRenameFile,
  onImportFiles,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [contextMenuFileId, setContextMenuFileId] = useState<string | null>(null);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameFileName, setRenameFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = project.files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartRename = (file: ProjectFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenuFileId(null);
    setRenamingFileId(file.id);
    setRenameFileName(file.name);
  };

  const handleConfirmRename = (fileId: string) => {
    if (renameFileName.trim()) {
      onRenameFile(fileId, renameFileName.trim());
    }
    setRenamingFileId(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportFiles(e.target.files);
    }
  };

  return (
    <div id="screen-project-workspace" className="flex flex-col h-screen w-full bg-[#f8f9fa] text-[#202124] select-none font-sans">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-5 pt-4 pb-3">
        <h1 className="text-2xl font-bold text-[#1f2937] tracking-tight truncate max-w-[260px]">
          {project.name}
        </h1>
        <button
          id="btn-workspace-close"
          onClick={onClose}
          className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 active:bg-gray-300 transition-colors"
          title="Close Project"
        >
          <X className="w-6 h-6" strokeWidth={2.2} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 pb-8 space-y-5">
        {/* Top 2 Action Cards Side by Side (Screenshot 5) */}
        <div className="grid grid-cols-2 gap-3.5 pt-1">
          {/* Green Card: PHP Server Ready */}
          <div
            id="card-php-server-ready"
            onClick={onOpenPhpServer}
            className="bg-[#2e7d32] hover:bg-[#256628] active:scale-[0.98] transition-all rounded-2xl p-4 flex flex-col justify-between min-h-[105px] text-white shadow-xs cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="font-bold text-sm tracking-wide leading-tight mt-3">
              PHP Server Ready
            </div>
          </div>

          {/* Orange Card: Publish Your Website */}
          <div
            id="card-publish-website"
            onClick={onOpenPublish}
            className="bg-[#e65100] hover:bg-[#c94600] active:scale-[0.98] transition-all rounded-2xl p-4 flex flex-col justify-between min-h-[105px] text-white shadow-xs cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-white" />
            </div>
            <div className="font-bold text-sm tracking-wide leading-tight mt-3">
              Publish Your Website
            </div>
          </div>
        </div>

        {/* Website Section Header with Action Buttons */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2.5">
            <h2 className="text-xl font-bold text-[#1f2937]">Website</h2>
            <div className="flex items-center gap-1">
              {/* Search Toggle Button */}
              <button
                id="btn-workspace-search"
                onClick={() => setShowSearch(!showSearch)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  showSearch ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-200'
                }`}
                title="Search Files"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Git Branch Button */}
              <button
                id="btn-workspace-git"
                onClick={onOpenGitModal}
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                title="Git Repository"
              >
                <GitBranchIcon size={17} />
              </button>

              {/* Create File (+) Button */}
              <button
                id="btn-workspace-create-file"
                onClick={onOpenCreateFile}
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                title="Create New File"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Import Files Button */}
              <button
                id="btn-workspace-import-file"
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                title="Import File"
              >
                <FileUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search bar input if active */}
          {showSearch && (
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search file name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 shadow-2xs"
                autoFocus
              />
            </div>
          )}

          {/* File List in Rounded Gray Container */}
          <div className="bg-[#f0f0f2] rounded-2xl p-2 divide-y divide-gray-200/60 shadow-2xs">
            {filteredFiles.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No files found
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div
                  key={file.id}
                  id={`file-item-${file.id}`}
                  onClick={() => onOpenFile(file)}
                  className="relative flex items-center justify-between p-3 hover:bg-[#e8e8eb] active:bg-[#dedee2] rounded-xl transition-colors cursor-pointer"
                >
                  {/* Left: File Badge Icon + Name & Timestamp */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <FileTypeBadgeIcon extension={file.extension || 'txt'} size={28} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-[#1f2937] truncate">
                        {file.name}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                        {file.updatedAt}
                      </div>
                    </div>
                  </div>

                  {/* Right: 3 dots menu button */}
                  <button
                    id={`btn-file-menu-${file.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenuFileId(contextMenuFileId === file.id ? null : file.id);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-black/5"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* File Context Dropdown Menu */}
                  {contextMenuFileId === file.id && (
                    <div 
                      className="absolute top-10 right-3 z-30 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 min-w-[130px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenuFileId(null);
                          onOpenFile(file);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Code className="w-3.5 h-3.5 text-blue-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={(e) => handleStartRename(file, e)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                        <span>Rename</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenuFileId(null);
                          onDeleteFile(file.id);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Hidden File Input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        className="hidden"
      />

      {/* Rename File Dialog Modal */}
      {renamingFileId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Rename File</h3>
            <input
              type="text"
              value={renameFileName}
              onChange={(e) => setRenameFileName(e.target.value)}
              className="w-full px-3 py-2 border-b-2 border-blue-500 focus:outline-none text-gray-800 text-base"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmRename(renamingFileId);
              }}
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setRenamingFileId(null)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md"
              >
                CANCEL
              </button>
              <button
                onClick={() => handleConfirmRename(renamingFileId)}
                className="px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-md"
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
