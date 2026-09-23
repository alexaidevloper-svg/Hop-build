export interface ProjectFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  content: string;
  updatedAt: string; // e.g. "2026-08-15 16:54:58"
  size?: number;
}

export interface ProjectSettings {
  titleBarColor: string; // e.g. "#3F51B5"
  screenRotation: 'Auto Rotate' | 'Portrait' | 'Landscape' | 'Sensor Portrait' | 'Sensor Landscape';
  homepage: string; // e.g. "index.html"
  carryPhpEnvironment: boolean;
  phpServerPort: string; // e.g. "57249"
  splashPageImage?: string;
  appIcon?: string;
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: string;
  
  // More options toggles
  fullscreenMode: boolean;
  hideTitleBar: boolean;
  allowLongPress: boolean;
  showLoadingUi: boolean;
  allowZoom: boolean;
  pcMode: boolean;
  allowMediaAutoplay: boolean;
  allowSwipingRefresh: boolean;
  allowUsingCamera: boolean;
  allowUsingMicrophone: boolean;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  icon?: string;
  files: ProjectFile[];
  settings: ProjectSettings;
  phpServerRunning?: boolean;
}

export interface GlobalSettings {
  symbolsBar: string;
  debugConsole: 'Eruda' | 'vConsole' | 'None';
  phpServerAutoStart: boolean;
  defaultPhpPort: string;
  darkMode: 'light' | 'dark' | 'system';
  language: 'English' | 'Spanish' | 'Chinese' | 'Hindi' | 'French';
}

export interface ConsoleLogMessage {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: string;
  data?: any;
}

export interface NetworkLogItem {
  id: string;
  url: string;
  method: string;
  status: number;
  type: string;
  time: string;
  duration: number;
}

export type ActiveScreen = 
  | 'home'
  | 'settings'
  | 'ideaSky'
  | 'workspace'
  | 'editor'
  | 'preview'
  | 'apk_converter';
