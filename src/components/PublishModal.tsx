import React from 'react';
import { ZipCompressedIcon, AndroidRobotIcon, IdeaSkyIcon } from './Icons';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPackZip: () => void;
  onConvertToApk: () => void;
  onUploadIdeaSky: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  onPackZip,
  onConvertToApk,
  onUploadIdeaSky,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="modal-how-to-publish"
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
        <h2 className="text-xl font-bold text-[#1f2937] mb-6">
          How to publish?
        </h2>

        <div className="space-y-3.5">
          {/* 1. Pack to Compressed File */}
          <button
            id="btn-publish-zip"
            onClick={() => {
              onClose();
              onPackZip();
            }}
            className="w-full bg-[#f0f0f2] hover:bg-[#e6e6e9] active:scale-[0.98] transition-all rounded-2xl p-4 flex items-center gap-4 text-left shadow-2xs group"
          >
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-2xs">
              <ZipCompressedIcon size={28} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-[15px] text-[#1f2937] group-hover:text-blue-600 transition-colors">
                Pack to Compressed File
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Export standard ZIP archive of all project files
              </div>
            </div>
          </button>

          {/* 2. Convert to Android Application */}
          <button
            id="btn-publish-apk"
            onClick={() => {
              onClose();
              onConvertToApk();
            }}
            className="w-full bg-[#f0f0f2] hover:bg-[#e6e6e9] active:scale-[0.98] transition-all rounded-2xl p-4 flex items-center gap-4 text-left shadow-2xs group"
          >
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-2xs">
              <AndroidRobotIcon size={28} color="#2196F3" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-[15px] text-[#1f2937] group-hover:text-blue-600 transition-colors">
                Convert to Android Application
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Configure manifest and compile real Android APK
              </div>
            </div>
          </button>

          {/* 3. Upload to ideaSky */}
          <button
            id="btn-publish-ideasky"
            onClick={() => {
              onClose();
              onUploadIdeaSky();
            }}
            className="w-full bg-[#f0f0f2] hover:bg-[#e6e6e9] active:scale-[0.98] transition-all rounded-2xl p-4 flex items-center gap-4 text-left shadow-2xs group"
          >
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-2xs">
              <IdeaSkyIcon size={26} color="#111" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-[15px] text-[#1f2937] group-hover:text-blue-600 transition-colors">
                Upload to ideaSky
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Publish website to the community explorer
              </div>
            </div>
          </button>
        </div>

        {/* Cancel Action */}
        <div className="flex justify-end pt-5">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-semibold text-sm py-2 px-2"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};
