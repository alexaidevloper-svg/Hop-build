import React, { useState } from 'react';
import { Project } from '../types';
import { Server, CheckCircle2, RefreshCw, Power, Terminal, Globe } from 'lucide-react';
import { executePhpCode } from '../utils/phpEngine';

interface PhpServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onToggleServer: (running: boolean) => void;
}

export const PhpServerModal: React.FC<PhpServerModalProps> = ({
  isOpen,
  onClose,
  project,
  onToggleServer,
}) => {
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(project.phpServerRunning ?? true);

  if (!isOpen) return null;

  const handleTestCurl = () => {
    // Find first PHP file or index.html
    const phpFile = project.files.find(f => f.extension === 'php') || project.files[0];
    if (phpFile) {
      const output = executePhpCode(phpFile.content, {
        server: {
          REQUEST_METHOD: 'GET',
          SCRIPT_NAME: `/${phpFile.name}`,
          SERVER_PORT: project.settings.phpServerPort || '57249',
        }
      });
      setTestOutput(output);
    } else {
      setTestOutput('No PHP or HTML files found in current project directory.');
    }
  };

  const handleToggle = () => {
    const nextState = !isRunning;
    setIsRunning(nextState);
    onToggleServer(nextState);
  };

  return (
    <div 
      id="modal-php-server"
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">PHP Server Console</h2>
              <p className="text-xs text-gray-500">Android-compatible embedded PHP 8.2 runtime</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            isRunning ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {isRunning ? 'RUNNING' : 'STOPPED'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Server status details */}
          <div className="bg-[#f0f0f2] rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Local Binding:</span>
              <span className="font-mono font-medium text-gray-800">http://127.0.0.1:{project.settings.phpServerPort || '57249'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Document Root:</span>
              <span className="font-mono font-medium text-gray-800">/data/user/0/com.hopweb.app/files/www/{project.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Engine Type:</span>
              <span className="font-mono font-medium text-green-700">PHP CLI Embedded Engine (Native ARM64/Vite)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Auto-Restart:</span>
              <span className="font-mono font-medium text-gray-800">Enabled</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleToggle}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors ${
                isRunning ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isRunning ? 'Stop Server' : 'Start Server'}</span>
            </button>
            <button
              onClick={handleTestCurl}
              className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Terminal className="w-4 h-4" />
              <span>Test PHP Request</span>
            </button>
          </div>

          {/* Output console log box */}
          {testOutput && (
            <div className="border border-gray-200 rounded-2xl p-3 bg-gray-900 text-green-400 font-mono text-xs overflow-x-auto max-h-48">
              <div className="text-[10px] text-gray-400 mb-1">HTTP/1.1 200 OK • Content-Type: text/html</div>
              <pre className="whitespace-pre-wrap">{testOutput}</pre>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-sm text-blue-600 hover:bg-blue-50 rounded-xl"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
