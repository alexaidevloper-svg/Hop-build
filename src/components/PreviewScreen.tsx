import React, { useState, useEffect, useRef } from 'react';
import { Project, ConsoleLogMessage, NetworkLogItem } from '../types';
import { ProjectFileIcon, DevToolsFloatingIcon } from './Icons';
import { ChevronLeft, RotateCw, MoreVertical, Terminal, Layers, Wifi, Database, FileText, Info as InfoIcon, X, Trash2, Send, Search, Check, ExternalLink } from 'lucide-react';
import { executePhpCode } from '../utils/phpEngine';

interface PreviewScreenProps {
  project: Project;
  onBack: () => void;
}

type DevToolsTab = 'Console' | 'Elements' | 'Network' | 'Resources' | 'Sources' | 'Info';
type LogFilter = 'All' | 'Error' | 'Warning' | 'Info';

export const PreviewScreen: React.FC<PreviewScreenProps> = ({
  project,
  onBack,
}) => {
  const [showDevTools, setShowDevTools] = useState(false);
  const [activeTab, setActiveTab] = useState<DevToolsTab>('Console');
  const [logFilter, setLogFilter] = useState<LogFilter>('All');
  const [searchLogQuery, setSearchLogQuery] = useState('');
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogMessage[]>([]);
  const [networkLogs, setNetworkLogs] = useState<NetworkLogItem[]>([]);
  const [jsPromptInput, setJsPromptInput] = useState('');
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [domTreeHtml, setDomTreeHtml] = useState<string>('');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  // Compile final HTML for WebView
  const generatePreviewHtml = (): string => {
    // Determine homepage file
    const homeFileName = project.settings.homepage || 'index.html';
    let targetFile = project.files.find((f) => f.name.toLowerCase() === homeFileName.toLowerCase());
    
    if (!targetFile) {
      targetFile = project.files.find((f) => f.extension === 'html') || project.files[0];
    }

    if (!targetFile) {
      return `<!DOCTYPE html><html><body style="padding:20px; font-family:sans-serif;"><h3>No files in project</h3></body></html>`;
    }

    let rawHtml = targetFile.content;

    // If file is PHP or contains PHP tags, run through our real PHP interpreter
    if (targetFile.extension === 'php' || rawHtml.includes('<?php') || rawHtml.includes('<?=')) {
      rawHtml = executePhpCode(rawHtml, {
        server: {
          REQUEST_METHOD: 'GET',
          SCRIPT_NAME: `/${targetFile.name}`,
          SERVER_PORT: project.settings.phpServerPort || '57249',
        }
      });
    }

    // Embed inline linked css/js files from project if referenced
    for (const f of project.files) {
      if (f.extension === 'css') {
        const linkRegex = new RegExp(`<link[^>]*href=["']${f.name}["'][^>]*>`, 'gi');
        rawHtml = rawHtml.replace(linkRegex, `<style>${f.content}</style>`);
      } else if (f.extension === 'js') {
        const scriptRegex = new RegExp(`<script[^>]*src=["']${f.name}["'][^>]*>\\s*<\\/script>`, 'gi');
        rawHtml = rawHtml.replace(scriptRegex, `<script>${f.content}</script>`);
      }
    }

    // Inject HopWeb Eruda logging bridge script
    const bridgeScript = `
      <script>
        (function() {
          function sendToHost(type, message, data) {
            window.parent.postMessage({
              source: 'hopweb-webview',
              type: type,
              message: typeof message === 'object' ? JSON.stringify(message) : String(message),
              data: data,
              timestamp: new Date().toLocaleTimeString()
            }, '*');
          }

          var _log = console.log;
          var _warn = console.warn;
          var _error = console.error;
          var _info = console.info;

          console.log = function() {
            var args = Array.prototype.slice.call(arguments);
            sendToHost('log', args.join(' '));
            _log.apply(console, arguments);
          };

          console.warn = function() {
            var args = Array.prototype.slice.call(arguments);
            sendToHost('warn', args.join(' '));
            _warn.apply(console, arguments);
          };

          console.error = function() {
            var args = Array.prototype.slice.call(arguments);
            sendToHost('error', args.join(' '));
            _error.apply(console, arguments);
          };

          console.info = function() {
            var args = Array.prototype.slice.call(arguments);
            sendToHost('info', args.join(' '));
            _info.apply(console, arguments);
          };

          window.onerror = function(msg, url, line) {
            sendToHost('error', msg + ' at line ' + line);
          };

          // Network interceptor
          var _fetch = window.fetch;
          if (_fetch) {
            window.fetch = function() {
              var url = arguments[0];
              var startTime = Date.now();
              return _fetch.apply(this, arguments).then(function(res) {
                sendToHost('network', url, {
                  url: String(url),
                  method: 'GET',
                  status: res.status,
                  type: 'fetch',
                  duration: Date.now() - startTime
                });
                return res;
              }).catch(function(err) {
                sendToHost('network', url, {
                  url: String(url),
                  method: 'GET',
                  status: 0,
                  type: 'fetch (failed)',
                  duration: Date.now() - startTime
                });
                throw err;
              });
            };
          }

          // Initial ready signal & send DOM structure
          window.addEventListener('load', function() {
            sendToHost('info', 'Document loaded: ' + document.title);
            sendToHost('dom', document.documentElement.outerHTML);
          });
        })();
      </script>
    `;

    // Inject before </head> or </body>
    if (rawHtml.includes('</head>')) {
      return rawHtml.replace('</head>', bridgeScript + '</head>');
    } else if (rawHtml.includes('</body>')) {
      return rawHtml.replace('</body>', bridgeScript + '</body>');
    } else {
      return bridgeScript + rawHtml;
    }
  };

  // Listen for messages from inside the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === 'hopweb-webview') {
        const { type, message, data, timestamp } = event.data;

        if (type === 'dom') {
          setDomTreeHtml(message);
        } else if (type === 'network' && data) {
          setNetworkLogs((prev) => [
            ...prev,
            {
              id: 'net_' + Date.now() + Math.random(),
              url: data.url,
              method: data.method || 'GET',
              status: data.status || 200,
              type: data.type || 'xhr',
              time: timestamp || new Date().toLocaleTimeString(),
              duration: data.duration || 12,
            },
          ]);
        } else {
          setConsoleLogs((prev) => [
            ...prev,
            {
              id: 'log_' + Date.now() + Math.random(),
              type: type as any,
              message,
              timestamp: timestamp || new Date().toLocaleTimeString(),
              data,
            },
          ]);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto scroll console to bottom
  useEffect(() => {
    if (showDevTools && activeTab === 'Console') {
      consoleBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs, showDevTools, activeTab]);

  const handleReload = () => {
    setConsoleLogs([]);
    setNetworkLogs([]);
    setIframeKey((k) => k + 1);
  };

  const handleExecuteJsPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsPromptInput.trim() || !iframeRef.current?.contentWindow) return;

    const code = jsPromptInput.trim();
    setConsoleLogs((prev) => [
      ...prev,
      {
        id: 'eval_req_' + Date.now(),
        type: 'info',
        message: '> ' + code,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    try {
      // Execute in iframe context
      const result = iframeRef.current.contentWindow.eval(code);
      setConsoleLogs((prev) => [
        ...prev,
        {
          id: 'eval_res_' + Date.now(),
          type: 'log',
          message: '< ' + (typeof result === 'object' ? JSON.stringify(result) : String(result)),
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err: any) {
      setConsoleLogs((prev) => [
        ...prev,
        {
          id: 'eval_err_' + Date.now(),
          type: 'error',
          message: '< Uncaught ' + (err?.message || 'Error executing script'),
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }

    setJsPromptInput('');
  };

  const filteredLogs = consoleLogs.filter((l) => {
    if (logFilter === 'Error' && l.type !== 'error') return false;
    if (logFilter === 'Warning' && l.type !== 'warn') return false;
    if (logFilter === 'Info' && l.type !== 'info') return false;
    if (searchLogQuery) {
      return l.message.toLowerCase().includes(searchLogQuery.toLowerCase());
    }
    return true;
  });

  const titleBgColor = project.settings.titleBarColor || '#ffffff';
  const isDarkTitle = titleBgColor.startsWith('#3') || titleBgColor.startsWith('#1') || titleBgColor.startsWith('#2') || titleBgColor.toLowerCase() === '#000000';

  return (
    <div id="screen-webview-preview" className="flex flex-col h-screen w-full bg-[#f8f9fa] text-[#202124] select-none font-sans relative">
      {/* Title Bar (Screenshot 10) */}
      <header 
        className={`flex items-center justify-between px-3 py-2.5 z-20 border-b ${
          isDarkTitle ? 'text-white border-black/20' : 'text-gray-900 border-gray-200'
        }`}
        style={{ backgroundColor: titleBgColor }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            id="btn-preview-back"
            onClick={onBack}
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              isDarkTitle ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <ProjectFileIcon size={22} />
          <span className="font-bold text-sm truncate max-w-[200px]">
            {project.name}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="btn-preview-reload"
            onClick={handleReload}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDarkTitle ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
            title="Reload WebView"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              id="btn-preview-menu"
              onClick={() => setShowTopMenu(!showTopMenu)}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDarkTitle ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {showTopMenu && (
              <div 
                className="absolute right-0 top-9 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 text-xs text-gray-800"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setShowTopMenu(false);
                    handleReload();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Reload</span>
                </button>
                <button
                  onClick={() => {
                    setShowTopMenu(false);
                    setShowDevTools(true);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                >
                  <Terminal className="w-3.5 h-3.5 text-blue-600" />
                  <span>Open DevTools</span>
                </button>
                <button
                  onClick={() => {
                    setShowTopMenu(false);
                    onBack();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                >
                  <X className="w-3.5 h-3.5 text-red-500" />
                  <span>Close Preview</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main WebView Area (isolated IFrame) */}
      <main className="flex-1 bg-white relative overflow-hidden">
        <iframe
          key={iframeKey}
          ref={iframeRef}
          srcDoc={generatePreviewHtml()}
          title="HopWeb WebView"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
          className="w-full h-full border-none"
        />

        {/* Floating DevTools Trigger Button (Screenshot 10) */}
        <div className="absolute bottom-5 right-5 z-30">
          <button
            id="btn-floating-devtools"
            onClick={() => setShowDevTools(!showDevTools)}
            className="hover:scale-105 active:scale-95 transition-transform"
            title="Toggle Developer Tools Console"
          >
            <DevToolsFloatingIcon />
          </button>
        </div>
      </main>

      {/* Developer Console Bottom / Full Drawer (Screenshots 11-18) */}
      {showDevTools && (
        <div 
          id="panel-devtools-console"
          className="fixed inset-x-0 bottom-0 z-40 bg-[#252526] text-white flex flex-col shadow-2xl border-t border-[#3e3e42] h-[55vh] max-h-[85vh] animate-in slide-in-from-bottom-5 duration-150"
        >
          {/* DevTools Top Tab Bar */}
          <div className="flex items-center justify-between px-2 pt-1 bg-[#1e1e1e] border-b border-[#333333] text-xs font-sans overflow-x-auto">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {(['Console', 'Elements', 'Network', 'Resources', 'Sources', 'Info'] as DevToolsTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 font-medium transition-colors border-b-2 ${
                    activeTab === tab
                      ? 'text-[#2196F3] border-[#2196F3] bg-[#252526]'
                      : 'text-gray-400 border-transparent hover:text-gray-200'
                  }`}
                >
                  {tab}
                  {tab === 'Console' && consoleLogs.filter(l => l.type === 'error').length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px]">
                      {consoleLogs.filter(l => l.type === 'error').length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowDevTools(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-bar for Console Tab: Clear, Filter Chips, Search */}
          {activeTab === 'Console' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252526] border-b border-[#333] text-xs">
              <button
                onClick={() => setConsoleLogs([])}
                className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-white"
                title="Clear Console"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1">
                {(['All', 'Error', 'Warning', 'Info'] as LogFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLogFilter(filter)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      logFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#333] text-gray-300 hover:bg-[#444]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="flex-1 flex items-center bg-[#1e1e1e] border border-[#3f3f46] rounded px-2 py-0.5 ml-1">
                <Search className="w-3 h-3 text-gray-400 mr-1" />
                <input
                  type="text"
                  placeholder="Filter"
                  value={searchLogQuery}
                  onChange={(e) => setSearchLogQuery(e.target.value)}
                  className="w-full bg-transparent text-white text-xs focus:outline-none placeholder-gray-500"
                />
              </div>
            </div>
          )}

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto font-mono text-xs p-2 space-y-1">
            {/* 1. CONSOLE TAB */}
            {activeTab === 'Console' && (
              <div className="space-y-1 pb-2">
                {filteredLogs.length === 0 ? (
                  <div className="text-gray-500 py-6 text-center italic text-[11px]">
                    Console is empty
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`px-2 py-1 rounded flex items-start gap-2 ${
                        log.type === 'error'
                          ? 'bg-red-950/40 text-red-300 border-l-2 border-red-500'
                          : log.type === 'warn'
                          ? 'bg-yellow-950/40 text-yellow-300 border-l-2 border-yellow-500'
                          : log.type === 'info'
                          ? 'bg-blue-950/30 text-blue-300 border-l-2 border-blue-500'
                          : 'text-gray-200 border-b border-gray-800'
                      }`}
                    >
                      <span className="text-[10px] text-gray-500 flex-shrink-0 select-none">
                        {log.timestamp}
                      </span>
                      <pre className="flex-1 whitespace-pre-wrap font-mono leading-relaxed">
                        {log.message}
                      </pre>
                    </div>
                  ))
                )}
                <div ref={consoleBottomRef} />
              </div>
            )}

            {/* 2. ELEMENTS TAB */}
            {activeTab === 'Elements' && (
              <div className="p-2 text-gray-300 font-mono text-xs">
                <div className="text-xs text-blue-400 font-bold mb-2">DOM Tree Inspection</div>
                <pre className="bg-[#1e1e1e] p-3 rounded-xl border border-[#333] overflow-x-auto text-green-300">
                  {domTreeHtml || '<!DOCTYPE html>\n<html>\n  <head>...</head>\n  <body>\n    <!-- Live DOM Elements Rendered -->\n  </body>\n</html>'}
                </pre>
              </div>
            )}

            {/* 3. NETWORK TAB */}
            {activeTab === 'Network' && (
              <div className="p-1 space-y-1">
                <div className="grid grid-cols-5 text-[10px] font-bold text-gray-400 border-b border-gray-700 pb-1 px-2">
                  <span className="col-span-2">Name / URL</span>
                  <span>Status</span>
                  <span>Type</span>
                  <span className="text-right">Time</span>
                </div>
                {networkLogs.length === 0 ? (
                  <div className="text-gray-500 py-6 text-center italic text-xs">
                    No network requests recorded
                  </div>
                ) : (
                  networkLogs.map((req) => (
                    <div key={req.id} className="grid grid-cols-5 text-xs py-1.5 px-2 hover:bg-white/5 rounded border-b border-gray-800">
                      <span className="col-span-2 truncate text-blue-400">{req.url}</span>
                      <span className={req.status >= 400 ? 'text-red-400' : 'text-green-400'}>{req.status}</span>
                      <span className="text-gray-400">{req.type}</span>
                      <span className="text-right text-gray-400">{req.duration}ms</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. RESOURCES TAB */}
            {activeTab === 'Resources' && (
              <div className="p-2 space-y-3">
                <div>
                  <h4 className="text-blue-400 font-bold mb-1">Local Storage</h4>
                  <div className="bg-[#1e1e1e] p-2 rounded-lg border border-[#333] text-gray-300">
                    <div>Origin: http://localhost:57249</div>
                    <div className="text-gray-500 text-[11px] mt-1">Key-value entries initialized for current app preview session.</div>
                  </div>
                </div>
                <div>
                  <h4 className="text-blue-400 font-bold mb-1">Cookies & Session</h4>
                  <div className="bg-[#1e1e1e] p-2 rounded-lg border border-[#333] text-gray-300">
                    <div>PHPSESSID: hopweb_sess_7f2a89c</div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. SOURCES TAB */}
            {activeTab === 'Sources' && (
              <div className="p-2 space-y-2">
                <div className="text-xs text-blue-400 font-bold">Project Files:</div>
                <div className="space-y-1">
                  {project.files.map((f) => (
                    <div key={f.id} className="p-2 bg-[#1e1e1e] rounded border border-[#333] flex justify-between items-center">
                      <span className="text-gray-200">{f.name}</span>
                      <span className="text-gray-500 text-[10px]">{f.updatedAt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. INFO TAB */}
            {activeTab === 'Info' && (
              <div className="p-2 space-y-2 text-xs">
                <div className="bg-[#1e1e1e] p-3 rounded-xl border border-[#333] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Device Viewport:</span>
                    <span className="text-gray-200">{window.innerWidth} x {window.innerHeight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pixel Ratio:</span>
                    <span className="text-gray-200">{window.devicePixelRatio}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Platform:</span>
                    <span className="text-gray-200">Android WebView (HopWeb 2.1.0)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">User Agent:</span>
                    <span className="text-gray-400 text-[10px] break-all">{navigator.userAgent}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Interactive JavaScript REPL Prompt */}
          {activeTab === 'Console' && (
            <form onSubmit={handleExecuteJsPrompt} className="flex items-center gap-2 p-2 bg-[#1e1e1e] border-t border-[#333]">
              <span className="text-blue-500 font-bold text-sm select-none">{'>'}</span>
              <input
                type="text"
                value={jsPromptInput}
                onChange={(e) => setJsPromptInput(e.target.value)}
                placeholder="Execute JavaScript in WebView..."
                className="flex-1 bg-transparent text-white text-xs font-mono focus:outline-none placeholder-gray-500"
              />
              <button
                type="submit"
                className="w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
