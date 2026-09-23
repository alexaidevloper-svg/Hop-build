import React from 'react';

// The signature HopWeb logo: A smooth rounded document in blue with a white dot circle in the bottom corner
export const HopWebLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 48 }) => {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="2" y="2" width="44" height="52" rx="10" fill="#2196F3" />
      {/* Sleek subtle top-right sheen */}
      <rect x="2" y="2" width="44" height="52" rx="10" stroke="#1E88E5" strokeWidth="1.5" />
      {/* White circle dot at bottom-left corner like HopWeb icon */}
      <circle cx="16" cy="40" r="6" fill="white" />
    </svg>
  );
};

// Small project / file icon as seen on project cards
export const ProjectFileIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 32 }) => {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="1" y="1" width="30" height="36" rx="6" fill="#3897F0" />
      <circle cx="10" cy="28" r="4.5" fill="white" />
    </svg>
  );
};

// ideaSky icon (Black circle with stylized dual wave/arcs)
export const IdeaSkyIcon: React.FC<{ className?: string; size?: number; color?: string }> = ({ 
  className = '', 
  size = 28,
  color = 'currentColor'
}) => {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="14" fill={color} />
      <path d="M16 8C20.4183 8 24 11.5817 24 16C24 17.5 23 18.5 21.5 18.5H12C9.79086 18.5 8 16.7091 8 14.5C8 10.9101 11.5817 8 16 8Z" fill="white" />
      <path d="M16 24C11.5817 24 8 20.4183 8 16C8 14.5 9 13.5 10.5 13.5H20C22.2091 13.5 24 15.2909 24 17.5C24 21.0899 20.4183 24 16 24Z" fill="white" />
    </svg>
  );
};

// Git branch / fork icon inside circle
export const GitBranchIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 22 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
};

// Base template layer icon with green checkmark
export const BaseTemplateIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* 3D stacked wireframe layer */}
      <svg width="72" height="50" viewBox="0 0 72 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M36 4L66 18L36 32L6 18L36 4Z" fill="#555" stroke="#777" strokeWidth="2" />
        <path d="M6 26L36 40L66 26" stroke="#666" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 34L36 48L66 34" stroke="#666" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {/* Bright green checkmark circle overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-[#00C853] flex items-center justify-center shadow-lg">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Document with badge for file types in file explorer
export const FileTypeBadgeIcon: React.FC<{ extension: string; className?: string; size?: number }> = ({ 
  extension, 
  className = '', 
  size = 32 
}) => {
  const ext = extension.toLowerCase();
  
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'svg' || ext === 'webp' || ext === 'gif') {
    return <ProjectFileIcon size={size} className={className} />;
  }
  
  let badgeText = '';
  let isGlobe = false;
  
  if (ext === 'html' || ext === 'htm') {
    isGlobe = true;
  } else if (ext === 'php') {
    badgeText = 'php';
  } else if (ext === 'css') {
    badgeText = 'css';
  } else if (ext === 'js') {
    badgeText = 'js';
  } else if (ext === 'json') {
    badgeText = '{}';
  } else if (ext === 'xml') {
    badgeText = '<>';
  }

  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* File outline */}
      <path d="M4 2C2.89543 2 2 2.89543 2 4V34C2 35.1046 2.89543 36 4 36H28C29.1046 36 30 35.1046 30 34V12L20 2H4Z" fill="#374151" />
      <path d="M20 2V12H30L20 2Z" fill="#1F2937" />
      
      {isGlobe ? (
        // Globe emblem for HTML files
        <g transform="translate(10, 18)">
          <circle cx="6" cy="6" r="5" stroke="white" strokeWidth="1.2" fill="none" />
          <ellipse cx="6" cy="6" rx="2.2" ry="5" stroke="white" strokeWidth="1" fill="none" />
          <line x1="1" y1="6" x2="11" y2="6" stroke="white" strokeWidth="1" />
        </g>
      ) : badgeText ? (
        // Text badge inside file
        <text x="16" y="27" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
          {badgeText}
        </text>
      ) : null}
    </svg>
  );
};

// Android Robot Icon
export const AndroidRobotIcon: React.FC<{ className?: string; size?: number; color?: string }> = ({
  className = '',
  size = 32,
  color = '#2196F3'
}) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Android Head */}
      <path d="M7 9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9H7Z" fill={color} />
      {/* Antennas */}
      <line x1="8.5" y1="4.5" x2="6.5" y2="2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15.5" y1="4.5" x2="17.5" y2="2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Eyes */}
      <circle cx="10" cy="7" r="0.8" fill="white" />
      <circle cx="14" cy="7" r="0.8" fill="white" />
      {/* Body */}
      <rect x="7" y="10" width="10" height="9" rx="1.5" fill={color} />
      {/* Left arm */}
      <rect x="4.5" y="10.5" width="1.8" height="6.5" rx="0.9" fill={color} />
      {/* Right arm */}
      <rect x="17.7" y="10.5" width="1.8" height="6.5" rx="0.9" fill={color} />
      {/* Legs */}
      <rect x="9" y="19" width="1.8" height="3" rx="0.9" fill={color} />
      <rect x="13.2" y="19" width="1.8" height="3" rx="0.9" fill={color} />
    </svg>
  );
};

// Zipper / Pack to Compressed File Icon
export const ZipCompressedIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 32 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
      <rect x="10" y="3" width="4" height="2" />
      <rect x="10" y="7" width="4" height="2" />
      <rect x="10" y="11" width="4" height="2" />
      <rect x="9" y="15" width="6" height="5" rx="1" fill="#222" />
    </svg>
  );
};

// Eruda Developer Tools floating gear & wrench icon
export const DevToolsFloatingIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 44 }) => {
  return (
    <div className={`w-[44px] h-[44px] rounded-xl bg-[#8E8E93]/80 hover:bg-[#8E8E93] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 ${className}`}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        <circle cx="18" cy="18" r="3" />
      </svg>
    </div>
  );
};
