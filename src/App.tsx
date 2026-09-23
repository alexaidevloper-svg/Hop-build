import React, { useState, useEffect } from 'react';
import { Project, ProjectFile, GlobalSettings, ActiveScreen } from './types';
import { 
  getStoredProjects, 
  saveStoredProjects, 
  getStoredSettings, 
  saveStoredSettings, 
  createNewProject, 
  formatCurrentTimestamp 
} from './utils/storage';
import { generateProjectZip, triggerFileDownload } from './utils/apkBuilder';

import { HomeScreen } from './components/HomeScreen';
import { AppSettingsScreen } from './components/AppSettingsScreen';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { CodeEditor } from './components/CodeEditor';
import { PreviewScreen } from './components/PreviewScreen';
import { ApkConverterScreen } from './components/ApkConverterScreen';
import { IdeaSkyScreen } from './components/IdeaSkyScreen';

import { CreateProjectDialog } from './components/CreateProjectDialog';
import { GitCloneDialog } from './components/GitCloneDialog';
import { CreateFileDialog } from './components/CreateFileDialog';
import { PublishModal } from './components/PublishModal';
import { PhpServerModal } from './components/PhpServerModal';
import { AboutInfoModal } from './components/AboutInfoModal';
import { GitBranchModal } from './components/GitBranchModal';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>(getStoredSettings());
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'ideaSky'>('home');

  // Currently active project & files
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [openFileIds, setOpenFileIds] = useState<string[]>([]);

  // Dialog / Modal Visibility States
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isGitCloneOpen, setIsGitCloneOpen] = useState(false);
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isPhpServerOpen, setIsPhpServerOpen] = useState(false);
  const [isAboutInfoOpen, setIsAboutInfoOpen] = useState(false);
  const [isGitBranchModalOpen, setIsGitBranchModalOpen] = useState(false);

  // Initialize projects on mount
  useEffect(() => {
    const loadedProjects = getStoredProjects();
    setProjects(loadedProjects);
  }, []);

  // Save projects whenever they change
  const updateProjects = (newProjects: Project[]) => {
    setProjects(newProjects);
    saveStoredProjects(newProjects);
  };

  const updateGlobalSettings = (newSettings: GlobalSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const activeFile = activeProject?.files.find((f) => f.id === activeFileId);
  const openFiles = activeProject?.files.filter((f) => openFileIds.includes(f.id)) || [];

  // Project Actions
  const handleCreateProject = (name: string) => {
    const newProj = createNewProject(name);
    const updated = [newProj, ...projects];
    updateProjects(updated);
    setActiveProjectId(newProj.id);
    setActiveScreen('workspace');
  };

  const handleImportZip = async (file: File) => {
    const projectName = file.name.replace(/\.[^/.]+$/, '');
    const newProj = createNewProject(projectName);
    const updated = [newProj, ...projects];
    updateProjects(updated);
    setActiveProjectId(newProj.id);
    setActiveScreen('workspace');
  };

  const handleGitClone = (repoUrl: string, dirName: string) => {
    const newProj = createNewProject(dirName);
    const updated = [newProj, ...projects];
    updateProjects(updated);
    setActiveProjectId(newProj.id);
    setActiveScreen('workspace');
  };

  const handleDeleteProject = (projectId: string) => {
    const updated = projects.filter((p) => p.id !== projectId);
    updateProjects(updated);
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
      setActiveScreen('home');
    }
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    const updated = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          name: newName,
          updatedAt: formatCurrentTimestamp(),
          settings: {
            ...p.settings,
            appName: newName,
          },
        };
      }
      return p;
    });
    updateProjects(updated);
  };

  const handleOpenProject = (project: Project) => {
    setActiveProjectId(project.id);
    setActiveScreen('workspace');
  };

  // File Actions
  const handleOpenFile = (file: ProjectFile) => {
    if (!openFileIds.includes(file.id)) {
      setOpenFileIds((prev) => [...prev, file.id]);
    }
    setActiveFileId(file.id);
    setActiveScreen('editor');
  };

  const handleCreateFile = (fileName: string, content: string) => {
    if (!activeProject) return;
    const ext = fileName.split('.').pop() || 'txt';
    const newFile: ProjectFile = {
      id: 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: fileName,
      type: 'file',
      extension: ext,
      content,
      updatedAt: formatCurrentTimestamp(),
    };

    const updatedProjects = projects.map((p) => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          updatedAt: formatCurrentTimestamp(),
          files: [...p.files, newFile],
        };
      }
      return p;
    });

    updateProjects(updatedProjects);
    handleOpenFile(newFile);
  };

  const handleDeleteFile = (fileId: string) => {
    if (!activeProject) return;
    const updatedProjects = projects.map((p) => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          files: p.files.filter((f) => f.id !== fileId),
        };
      }
      return p;
    });
    updateProjects(updatedProjects);
    setOpenFileIds((prev) => prev.filter((id) => id !== fileId));
    if (activeFileId === fileId) {
      setActiveFileId(null);
      setActiveScreen('workspace');
    }
  };

  const handleRenameFile = (fileId: string, newName: string) => {
    if (!activeProject) return;
    const ext = newName.split('.').pop() || 'txt';
    const updatedProjects = projects.map((p) => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          files: p.files.map((f) => {
            if (f.id === fileId) {
              return { ...f, name: newName, extension: ext, updatedAt: formatCurrentTimestamp() };
            }
            return f;
          }),
        };
      }
      return p;
    });
    updateProjects(updatedProjects);
  };

  const handleImportFiles = (fileList: FileList) => {
    if (!activeProject) return;
    Array.from(fileList).forEach((f) => {
      const reader = new FileReader();
      const isImg = f.type.startsWith('image/');
      reader.onload = () => {
        const ext = f.name.split('.').pop() || '';
        const newFile: ProjectFile = {
          id: 'file_imp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: f.name,
          type: 'file',
          extension: ext,
          content: reader.result as string,
          updatedAt: formatCurrentTimestamp(),
        };

        const updatedProjects = projects.map((p) => {
          if (p.id === activeProject.id) {
            return {
              ...p,
              files: [...p.files, newFile],
            };
          }
          return p;
        });
        updateProjects(updatedProjects);
      };

      if (isImg) {
        reader.readAsDataURL(f);
      } else {
        reader.readAsText(f);
      }
    });
  };

  const handleSaveFileContent = (fileId: string, newContent: string) => {
    if (!activeProject) return;
    const updatedProjects = projects.map((p) => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          files: p.files.map((f) => {
            if (f.id === fileId) {
              return { ...f, content: newContent, updatedAt: formatCurrentTimestamp() };
            }
            return f;
          }),
        };
      }
      return p;
    });
    updateProjects(updatedProjects);
  };

  const handleSaveProjectSettings = (newSettings: any) => {
    if (!activeProject) return;
    const updatedProjects = projects.map((p) => {
      if (p.id === activeProject.id) {
        return { ...p, settings: newSettings, updatedAt: formatCurrentTimestamp() };
      }
      return p;
    });
    updateProjects(updatedProjects);
  };

  const handleTogglePhpServer = (running: boolean) => {
    if (!activeProject) return;
    const updatedProjects = projects.map((p) => {
      if (p.id === activeProject.id) {
        return { ...p, phpServerRunning: running };
      }
      return p;
    });
    updateProjects(updatedProjects);
  };

  const handlePackZip = async () => {
    if (!activeProject) return;
    try {
      const blob = await generateProjectZip(activeProject);
      triggerFileDownload(blob, `${activeProject.name}.zip`);
    } catch (e) {
      console.error('Failed to generate ZIP:', e);
    }
  };

  const handleImportCommunityProject = (name: string, files: any[]) => {
    const time = formatCurrentTimestamp();
    const newProj: Project = {
      id: 'proj_comm_' + Date.now(),
      name,
      createdAt: time,
      updatedAt: time,
      phpServerRunning: true,
      settings: {
        appName: name,
        packageName: `com.hopweb.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        versionName: '1.0.0',
        versionCode: '1',
        titleBarColor: '#3F51B5',
        screenRotation: 'Auto Rotate',
        homepage: files[0]?.name || 'index.html',
        carryPhpEnvironment: files.some((f: any) => f.extension === 'php'),
        phpServerPort: '57249',
        fullscreenMode: false,
        hideTitleBar: false,
        allowLongPress: true,
        showLoadingUi: true,
        allowZoom: true,
        pcMode: false,
        allowMediaAutoplay: false,
        allowSwipingRefresh: true,
        allowUsingCamera: false,
        allowUsingMicrophone: false,
      },
      files: files.map((f: any) => ({
        ...f,
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      })),
    };

    updateProjects([newProj, ...projects]);
    setActiveProjectId(newProj.id);
    setActiveScreen('workspace');
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-[#f8f9fa] font-sans antialiased text-[#202124]">
      {/* 1. HOME SCREEN / IDEASKY BOTTOM TABS */}
      {activeScreen === 'home' && (
        <>
          {activeBottomTab === 'home' ? (
            <HomeScreen
              projects={projects}
              activeBottomTab={activeBottomTab}
              onSelectBottomTab={setActiveBottomTab}
              onOpenProject={handleOpenProject}
              onOpenCreateDialog={() => setIsCreateProjectOpen(true)}
              onOpenGitCloneDialog={() => setIsGitCloneOpen(true)}
              onOpenSettings={() => setActiveScreen('settings')}
              onOpenInfo={() => setIsAboutInfoOpen(true)}
              onDeleteProject={handleDeleteProject}
              onRenameProject={handleRenameProject}
            />
          ) : (
            <div className="flex flex-col h-screen">
              <IdeaSkyScreen onImportCommunityProject={handleImportCommunityProject} />
              {/* Bottom Nav */}
              <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#e5e7eb] flex items-center justify-around z-20">
                <button
                  onClick={() => setActiveBottomTab('home')}
                  className="flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-gray-600"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span className="text-[11px] font-medium mt-1">Home</span>
                </button>
                <button
                  onClick={() => setActiveBottomTab('ideaSky')}
                  className="flex flex-col items-center justify-center flex-1 h-full text-[#2196F3]"
                >
                  <span className="w-5 h-5 rounded-full bg-[#2196F3] text-white flex items-center justify-center font-bold text-[10px]">☁</span>
                  <span className="text-[11px] font-medium mt-1">ideaSky</span>
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* 2. APP SETTINGS SCREEN */}
      {activeScreen === 'settings' && (
        <AppSettingsScreen
          settings={settings}
          onUpdateSettings={updateGlobalSettings}
          onBack={() => setActiveScreen('home')}
        />
      )}

      {/* 3. PROJECT WORKSPACE / FILE EXPLORER */}
      {activeScreen === 'workspace' && activeProject && (
        <ProjectWorkspace
          project={activeProject}
          onClose={() => {
            setActiveProjectId(null);
            setActiveScreen('home');
          }}
          onOpenFile={handleOpenFile}
          onOpenCreateFile={() => setIsCreateFileOpen(true)}
          onOpenPublish={() => setIsPublishOpen(true)}
          onOpenPhpServer={() => setIsPhpServerOpen(true)}
          onOpenGitModal={() => setIsGitBranchModalOpen(true)}
          onDeleteFile={handleDeleteFile}
          onRenameFile={handleRenameFile}
          onImportFiles={handleImportFiles}
        />
      )}

      {/* 4. CODE EDITOR */}
      {activeScreen === 'editor' && activeProject && activeFile && (
        <CodeEditor
          file={activeFile}
          openFiles={openFiles}
          activeFileId={activeFile.id}
          symbolsBarText={settings.symbolsBar}
          onSelectTab={(fId) => setActiveFileId(fId)}
          onCloseTab={(fId) => {
            const nextOpen = openFileIds.filter((id) => id !== fId);
            setOpenFileIds(nextOpen);
            if (nextOpen.length > 0) {
              setActiveFileId(nextOpen[nextOpen.length - 1]);
            } else {
              setActiveScreen('workspace');
            }
          }}
          onSaveContent={handleSaveFileContent}
          onRunPreview={() => setActiveScreen('preview')}
          onBackToWorkspace={() => setActiveScreen('workspace')}
        />
      )}

      {/* 5. WEBVIEW PREVIEW & ERUDA DEVTOOLS */}
      {activeScreen === 'preview' && activeProject && (
        <PreviewScreen
          project={activeProject}
          onBack={() => {
            if (activeFileId) {
              setActiveScreen('editor');
            } else {
              setActiveScreen('workspace');
            }
          }}
        />
      )}

      {/* 6. CONVERT TO ANDROID APPLICATION (APK CONVERTER) */}
      {activeScreen === 'apk_converter' && activeProject && (
        <ApkConverterScreen
          project={activeProject}
          onSaveSettings={handleSaveProjectSettings}
          onBack={() => setActiveScreen('workspace')}
        />
      )}

      {/* DIALOGS AND MODALS */}
      <CreateProjectDialog
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreate={handleCreateProject}
        onImportZip={handleImportZip}
      />

      <GitCloneDialog
        isOpen={isGitCloneOpen}
        onClose={() => setIsGitCloneOpen(false)}
        onClone={handleGitClone}
      />

      <CreateFileDialog
        isOpen={isCreateFileOpen}
        onClose={() => setIsCreateFileOpen(false)}
        onCreate={handleCreateFile}
      />

      <PublishModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        onPackZip={handlePackZip}
        onConvertToApk={() => setActiveScreen('apk_converter')}
        onUploadIdeaSky={() => {
          setActiveScreen('home');
          setActiveBottomTab('ideaSky');
        }}
      />

      {activeProject && (
        <>
          <PhpServerModal
            isOpen={isPhpServerOpen}
            onClose={() => setIsPhpServerOpen(false)}
            project={activeProject}
            onToggleServer={handleTogglePhpServer}
          />

          <GitBranchModal
            isOpen={isGitBranchModalOpen}
            onClose={() => setIsGitBranchModalOpen(false)}
            project={activeProject}
          />
        </>
      )}

      <AboutInfoModal
        isOpen={isAboutInfoOpen}
        onClose={() => setIsAboutInfoOpen(false)}
      />
    </div>
  );
}
