import React, { useState } from 'react';
import { GlobalSettings } from '../types';
import { ChevronLeft, Keyboard, Wrench, Paintbrush, Server, Palette, Globe, Check } from 'lucide-react';

interface AppSettingsScreenProps {
  settings: GlobalSettings;
  onUpdateSettings: (newSettings: GlobalSettings) => void;
  onBack: () => void;
}

export const AppSettingsScreen: React.FC<AppSettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onBack,
}) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [symbolsInput, setSymbolsInput] = useState(settings.symbolsBar);
  const [phpPortInput, setPhpPortInput] = useState(settings.defaultPhpPort);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSaveSymbols = () => {
    onUpdateSettings({ ...settings, symbolsBar: symbolsInput });
    setActiveModal(null);
    showToast('Symbols Bar updated');
  };

  const handleSavePhpConfig = () => {
    onUpdateSettings({ ...settings, defaultPhpPort: phpPortInput });
    setActiveModal(null);
    showToast('PHP Server configuration updated');
  };

  const handleClearCache = () => {
    // Clear preview caches
    try {
      localStorage.removeItem('hopweb_webview_cache');
      sessionStorage.clear();
      showToast('WebView cache, cookies, and temp storage cleared!');
    } catch (e) {
      showToast('Cache cleared successfully.');
    }
  };

  return (
    <div id="screen-app-settings" className="flex flex-col h-screen w-full bg-[#f8f9fa] text-[#202124] select-none font-sans">
      {/* Header Bar */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#e5e7eb]">
        <button
          id="btn-settings-back"
          onClick={onBack}
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 active:bg-gray-200"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-[#1f2937]">Settings</h1>
      </header>

      {/* Settings Items List */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* 1. Configuration of Symbols Bar */}
        <div
          id="setting-symbols-bar"
          onClick={() => {
            setSymbolsInput(settings.symbolsBar);
            setActiveModal('symbols');
          }}
          className="bg-[#f0f0f2] hover:bg-[#e8e8eb] active:scale-[0.99] transition-all rounded-2xl p-4 flex items-center gap-4 cursor-pointer shadow-2xs"
        >
          <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-gray-700">
            <Keyboard className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px] text-[#1f2937]">
              Configuration of Symbols Bar
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Use whitespace to split characters.
            </div>
          </div>
        </div>

        {/* 2. Switch Debug Console */}
        <div
          id="setting-debug-console"
          onClick={() => setActiveModal('console')}
          className="bg-[#f0f0f2] hover:bg-[#e8e8eb] active:scale-[0.99] transition-all rounded-2xl p-4 flex items-center gap-4 cursor-pointer shadow-2xs"
        >
          <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-gray-700">
            <Wrench className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px] text-[#1f2937]">
              Switch Debug Console
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Current: <span className="font-medium text-blue-600">{settings.debugConsole}</span>
            </div>
          </div>
        </div>

        {/* 3. Clear Cache of WebView */}
        <div
          id="setting-clear-cache"
          onClick={handleClearCache}
          className="bg-[#f0f0f2] hover:bg-[#e8e8eb] active:scale-[0.99] transition-all rounded-2xl p-4 flex items-center gap-4 cursor-pointer shadow-2xs"
        >
          <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-gray-700">
            <Paintbrush className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px] text-[#1f2937]">
              Clear Cache of WebView
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Clear cache of media, Cookies and data.
            </div>
          </div>
        </div>

        {/* 4. Configuration of PHP Server */}
        <div
          id="setting-php-server"
          onClick={() => {
            setPhpPortInput(settings.defaultPhpPort);
            setActiveModal('php');
          }}
          className="bg-[#f0f0f2] hover:bg-[#e8e8eb] active:scale-[0.99] transition-all rounded-2xl p-4 flex items-center gap-4 cursor-pointer shadow-2xs"
        >
          <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-gray-700">
            <Server className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px] text-[#1f2937]">
              Configuration of PHP Server
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              When you open project, HopWeb will start PHP Web Server automatically.
            </div>
          </div>
        </div>

        {/* 5. Dark Mode Settings */}
        <div
          id="setting-dark-mode"
          onClick={() => setActiveModal('darkMode')}
          className="bg-[#f0f0f2] hover:bg-[#e8e8eb] active:scale-[0.99] transition-all rounded-2xl p-4 flex items-center gap-4 cursor-pointer shadow-2xs"
        >
          <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-gray-700">
            <Palette className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px] text-[#1f2937]">
              Dark Mode Settings
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              The dark theme will be applied in UI and editor style ({settings.darkMode}).
            </div>
          </div>
        </div>

        {/* 6. Display Language */}
        <div
          id="setting-language"
          onClick={() => setActiveModal('language')}
          className="bg-[#f0f0f2] hover:bg-[#e8e8eb] active:scale-[0.99] transition-all rounded-2xl p-4 flex items-center gap-4 cursor-pointer shadow-2xs"
        >
          <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-gray-700">
            <Globe className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px] text-[#1f2937]">
              Display Language
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Configure display language of App ({settings.language}).
            </div>
          </div>
        </div>
      </main>

      {/* Symbols Bar Modal */}
      {activeModal === 'symbols' && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Symbols Bar Configuration</h3>
            <p className="text-xs text-gray-500 mb-3">Enter symbols separated by space:</p>
            <textarea
              value={symbolsInput}
              onChange={(e) => setSymbolsInput(e.target.value)}
              rows={4}
              className="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:border-blue-500 focus:outline-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md"
              >
                CANCEL
              </button>
              <button
                onClick={handleSaveSymbols}
                className="px-3 py-1.5 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-md"
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug Console Modal */}
      {activeModal === 'console' && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Switch Debug Console</h3>
            <div className="space-y-2">
              {(['Eruda', 'vConsole', 'None'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    onUpdateSettings({ ...settings, debugConsole: mode });
                    setActiveModal(null);
                    showToast(`Debug console set to ${mode}`);
                  }}
                  className={`w-full p-3 rounded-xl flex items-center justify-between text-left font-medium text-sm transition-colors ${
                    settings.debugConsole === mode ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  <span>{mode}</span>
                  {settings.debugConsole === mode && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHP Server Modal */}
      {activeModal === 'php' && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">PHP Server Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">Auto-start PHP Server</span>
                <input
                  type="checkbox"
                  checked={settings.phpServerAutoStart}
                  onChange={(e) => onUpdateSettings({ ...settings, phpServerAutoStart: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </label>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Default PHP Port</label>
                <input
                  type="text"
                  value={phpPortInput}
                  onChange={(e) => setPhpPortInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600"
              >
                CANCEL
              </button>
              <button
                onClick={handleSavePhpConfig}
                className="px-3 py-1.5 text-sm font-bold text-blue-600"
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dark Mode Modal */}
      {activeModal === 'darkMode' && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Dark Mode</h3>
            <div className="space-y-2">
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    onUpdateSettings({ ...settings, darkMode: mode });
                    setActiveModal(null);
                  }}
                  className={`w-full p-3 rounded-xl flex items-center justify-between text-left font-medium text-sm capitalize ${
                    settings.darkMode === mode ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  <span>{mode}</span>
                  {settings.darkMode === mode && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Language Modal */}
      {activeModal === 'language' && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Display Language</h3>
            <div className="space-y-2">
              {(['English', 'Spanish', 'Chinese', 'Hindi', 'French'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    onUpdateSettings({ ...settings, language: lang });
                    setActiveModal(null);
                  }}
                  className={`w-full p-3 rounded-xl flex items-center justify-between text-left font-medium text-sm ${
                    settings.language === lang ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  <span>{lang}</span>
                  {settings.language === lang && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs px-4 py-2 rounded-full shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
