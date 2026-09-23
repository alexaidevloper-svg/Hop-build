import React, { useState } from 'react';
import { Project } from '../types';
import { HopWebLogo, ProjectFileIcon, GitBranchIcon, IdeaSkyIcon } from './Icons';
import { Info, Settings, Plus, MoreVertical, Trash2, Edit2, Download, Play } from 'lucide-react';

interface HomeScreenProps {
  projects: Project[];
  activeBottomTab: 'home' | 'ideaSky';
  onSelectBottomTab: (tab: 'home' | 'ideaSky') => void;
  onOpenProject: (project: Project) => void;
  onOpenCreateDialog: () => void;
  onOpenGitCloneDialog: () => void;
  onOpenSettings: () => void;
  onOpenInfo: () => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  projects,
  activeBottomTab,
  onSelectBottomTab,
  onOpenProject,
  onOpenCreateDialog,
  onOpenGitCloneDialog,
  onOpenSettings,
  onOpenInfo,
  onDeleteProject,
  onRenameProject,
}) => {
  const [contextMenuProjectId, setContextMenuProjectId] = useState<string | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleStartRename = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenuProjectId(null);
    setRenamingProjectId(project.id);
    setRenameValue(project.name);
  };

  const handleConfirmRename = (id: string) => {
    if (renameValue.trim()) {
      onRenameProject(id, renameValue.trim());
    }
    setRenamingProjectId(null);
  };

  return (
    <div id="screen-home" className="flex flex-col h-screen w-full bg-[#f8f9fa] text-[#202124] select-none font-sans">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="w-10"></div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-2">
          {/* Info Button */}
          <button 
            id="btn-home-info"
            onClick={onOpenInfo}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-gray-200 active:bg-gray-300 transition-colors"
            title="About HopWeb"
          >
            <div className="w-5 h-5 rounded-full border-[1.8px] border-current flex items-center justify-center font-serif font-bold text-xs">
              i
            </div>
          </button>
          {/* Settings Button */}
          <button 
            id="btn-home-settings"
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-gray-200 active:bg-gray-300 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 pb-20">
        {/* Brand Banner: Logo + HopWeb Title */}
        <div className="flex items-center gap-3 pt-2 pb-5 px-1">
          <HopWebLogo size={42} />
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1a1a] font-sans">
            HopWeb
          </h1>
        </div>

        {/* Action Row: "+ Create Project" button & "Git" button */}
        <div className="flex items-center gap-3 mb-6">
          <button
            id="btn-home-create-project"
            onClick={onOpenCreateDialog}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#d2d6dc] bg-white hover:bg-gray-50 active:bg-gray-100 text-[#3c4043] font-medium text-sm shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 text-[#5f6368]" strokeWidth={2.5} />
            <span>Create Project</span>
          </button>

          <button
            id="btn-home-git-clone"
            onClick={onOpenGitCloneDialog}
            className="w-10 h-10 rounded-full border border-[#d2d6dc] bg-white hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center text-[#3c4043] shadow-xs transition-all"
            title="Clone Git Repository"
          >
            <GitBranchIcon size={18} />
          </button>
        </div>

        {/* Projects Grid: 2 columns matching screenshots */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#eef0f4] flex items-center justify-center mb-3 text-gray-400">
              <ProjectFileIcon size={34} />
            </div>
            <h3 className="text-base font-semibold text-gray-700">No Projects</h3>
            <p className="text-xs text-gray-500 max-w-xs mt-1">
              Click <strong>+ Create Project</strong> or clone a Git repo to start building.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {projects.map((project) => (
              <div
                key={project.id}
                id={`project-card-${project.id}`}
                onClick={() => onOpenProject(project)}
                className="relative bg-[#f0f0f2] hover:bg-[#e8e8eb] active:scale-[0.98] transition-all rounded-2xl p-4 flex flex-col justify-between min-h-[140px] cursor-pointer shadow-xs group"
              >
                {/* Top Row: Icon and 3-dots Menu */}
                <div className="flex items-start justify-between">
                  {project.settings?.appIcon || project.icon ? (
                    <img 
                      src={project.settings?.appIcon || project.icon} 
                      alt={project.name} 
                      className="w-9 h-9 rounded-xl object-cover shadow-xs border border-gray-300/80 bg-white"
                    />
                  ) : (
                    <ProjectFileIcon size={34} />
                  )}
                  <button
                    id={`btn-card-menu-${project.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenuProjectId(contextMenuProjectId === project.id ? null : project.id);
                    }}
                    className="w-7 h-7 -mr-2 -mt-1 rounded-full flex items-center justify-center text-gray-500 hover:bg-black/5 active:bg-black/10"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Context Dropdown Menu */}
                {contextMenuProjectId === project.id && (
                  <div 
                    className="absolute top-10 right-2 z-30 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 min-w-[130px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenuProjectId(null);
                        onOpenProject(project);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5 text-blue-500" />
                      <span>Open</span>
                    </button>
                    <button
                      onClick={(e) => handleStartRename(project, e)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                      <span>Rename</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenuProjectId(null);
                        onDeleteProject(project.id);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}

                {/* Bottom Details: Project Title & Timestamp */}
                <div className="mt-4">
                  <div className="font-semibold text-[15px] text-[#111827] truncate">
                    {project.name}
                  </div>
                  <div className="text-[11px] text-[#71767c] font-mono mt-0.5 tracking-tight">
                    {project.createdAt || project.updatedAt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Rename Dialog Modal */}
      {renamingProjectId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Rename Project</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full px-3 py-2 border-b-2 border-blue-500 focus:outline-none text-gray-800 text-base"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmRename(renamingProjectId);
              }}
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setRenamingProjectId(null)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md"
              >
                CANCEL
              </button>
              <button
                onClick={() => handleConfirmRename(renamingProjectId)}
                className="px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-md"
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#e5e7eb] flex items-center justify-around z-20">
        {/* Home Tab */}
        <button
          id="nav-tab-home"
          onClick={() => onSelectBottomTab('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeBottomTab === 'home' ? 'text-[#2196F3]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {/* Blue House Icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill={activeBottomTab === 'home' ? '#2196F3' : 'none'} stroke={activeBottomTab === 'home' ? '#2196F3' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-[11px] font-medium mt-1">Home</span>
        </button>

        {/* ideaSky Tab */}
        <button
          id="nav-tab-ideasky"
          onClick={() => onSelectBottomTab('ideaSky')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            activeBottomTab === 'ideaSky' ? 'text-[#2196F3]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <IdeaSkyIcon size={22} color={activeBottomTab === 'ideaSky' ? '#2196F3' : '#9ca3af'} />
          <span className="text-[11px] font-medium mt-1">ideaSky</span>
        </button>
      </nav>
    </div>
  );
};
