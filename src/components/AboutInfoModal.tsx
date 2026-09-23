import React from 'react';
import { HopWebLogo } from './Icons';

interface AboutInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutInfoModal: React.FC<AboutInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      id="modal-about-hopweb"
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-150">
        <HopWebLogo size={56} className="mx-auto mb-3" />
        <h2 className="text-2xl font-extrabold text-[#1a1a1a]">HopWeb Studio</h2>
        <div className="text-xs font-semibold text-[#2196F3] mt-0.5">Version 2.1.0 (Android Engine)</div>
        
        <div className="mt-4 text-xs text-gray-600 space-y-2 bg-[#f5f5f7] p-3.5 rounded-2xl text-left">
          <p>• Fast local Mobile Web Development & IDE</p>
          <p>• Real-time HTML5, CSS3, JavaScript WebView harness</p>
          <p>• Native PHP 8.2 interpreter with local server support</p>
          <p>• Eruda / vConsole interactive developer tools</p>
          <p>• Instant 1-click signed Android APK generator</p>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#2196F3] hover:bg-[#1976D2] text-white rounded-xl font-bold text-sm"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
};
