import React, { useState, useRef } from 'react';
import { ProjectFileIcon, BaseTemplateIcon } from './Icons';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (projectName: string) => void;
  onImportZip: (file: File) => void;
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  isOpen,
  onClose,
  onCreate,
  onImportZip,
}) => {
  const [projectName, setProjectName] = useState('My Website');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      onCreate(projectName.trim());
      onClose();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportZip(file);
      onClose();
    }
  };

  return (
    <div 
      id="dialog-create-project"
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 select-none animate-in fade-in zoom-in-95 duration-150">
        <h2 className="text-xl font-bold text-[#1f2937] mb-6">
          Create Project
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Website Icon Section */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-[#2196F3] mb-2 tracking-wide uppercase">
              Website Icon
            </label>
            <div className="w-14 h-14 rounded-2xl bg-[#f0f0f2] flex items-center justify-center border border-gray-200">
              <ProjectFileIcon size={30} />
            </div>
          </div>

          {/* Project Name Section */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#2196F3] mb-1 tracking-wide uppercase">
              Project Name
            </label>
            <input
              id="input-project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full py-1.5 border-b-2 border-[#2196F3] text-gray-900 text-base focus:outline-none bg-transparent"
              autoFocus
            />
          </div>

          {/* Template Section */}
          <div className="mb-8">
            <label className="block text-xs font-semibold text-[#2196F3] mb-2.5 tracking-wide uppercase">
              Template
            </label>
            <div className="w-28 bg-[#f5f5f7] border border-gray-200 rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-xs">
              <BaseTemplateIcon className="mb-1" />
              <span className="text-xs font-medium text-gray-800 text-center">
                Base Template
              </span>
            </div>
          </div>

          {/* Hidden file input for zip import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".zip,.tar.gz"
            className="hidden"
          />

          {/* Actions Row */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              id="btn-import-project"
              onClick={() => fileInputRef.current?.click()}
              className="text-[#2196F3] hover:text-[#1976D2] active:opacity-70 font-bold text-sm tracking-wide transition-colors py-2 px-1"
            >
              IMPORT PROJECT
            </button>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 font-semibold text-sm py-2 px-1"
              >
                CANCEL
              </button>
              <button
                type="submit"
                id="btn-confirm-create-project"
                className="text-[#2196F3] hover:text-[#1976D2] active:opacity-70 font-bold text-sm tracking-wide transition-colors py-2 px-2"
              >
                OK
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
