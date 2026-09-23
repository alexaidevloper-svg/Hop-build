import React, { useState, useRef, useEffect } from 'react';
import { ProjectFile } from '../types';
import { FileTypeBadgeIcon } from './Icons';
import { Undo, Redo, Save, MoreVertical, Play, X, Search, FileCode, ArrowDownRight, Check } from 'lucide-react';

interface CodeEditorProps {
  file: ProjectFile;
  openFiles: ProjectFile[];
  activeFileId: string;
  symbolsBarText: string;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
  onSaveContent: (fileId: string, newContent: string) => void;
  onRunPreview: () => void;
  onBackToWorkspace: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  openFiles,
  activeFileId,
  symbolsBarText,
  onSelectTab,
  onCloseTab,
  onSaveContent,
  onRunPreview,
  onBackToWorkspace,
}) => {
  const [content, setContent] = useState(file.content);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [history, setHistory] = useState<string[]>([file.content]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showJumpLine, setShowJumpLine] = useState(false);
  const [jumpLineNumber, setJumpLineNumber] = useState('1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync content when active file changes
  useEffect(() => {
    setContent(file.content);
    setHistory([file.content]);
    setHistoryIndex(0);
    setIsSaved(true);
  }, [file.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const updateContentWithHistory = (newVal: string) => {
    setContent(newVal);
    setIsSaved(false);
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(newVal);
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateContentWithHistory(e.target.value);
    updateCursorPosition();
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.value;
    const selStart = textareaRef.current.selectionStart;
    const lines = text.slice(0, selStart).split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    setCursorPos({ line, col });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setContent(history[nextIdx]);
      setIsSaved(false);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setContent(history[nextIdx]);
      setIsSaved(false);
    }
  };

  const handleSave = () => {
    onSaveContent(file.id, content);
    setIsSaved(true);
    showToast('File saved successfully');
  };

  // Insert symbol at cursor position
  const handleInsertSymbol = (symbol: string) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    let textToInsert = symbol;

    if (symbol === 'Func') {
      textToInsert = 'function() {\n  \n}';
    } else if (symbol === '⇄') {
      textToInsert = '  '; // Tab indent
    }

    const newContent = content.slice(0, start) + textToInsert + content.slice(end);
    updateContentWithHistory(newContent);

    setTimeout(() => {
      el.focus();
      const newPos = start + textToInsert.length;
      el.setSelectionRange(newPos, newPos);
      updateCursorPosition();
    }, 10);
  };

  // Format code
  const handleFormatCode = () => {
    setShowMenu(false);
    try {
      // Basic auto-indentation format
      const lines = content.split('\n');
      let indentLevel = 0;
      const formatted = lines.map((l) => {
        const trimmed = l.trim();
        if (trimmed.startsWith('</') || trimmed.startsWith('}') || trimmed.startsWith(']')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        const indentStr = '  '.repeat(indentLevel);
        const result = indentStr + trimmed;
        if (
          (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !trimmed.includes('</')) ||
          trimmed.endsWith('{') ||
          trimmed.endsWith('[')
        ) {
          indentLevel++;
        }
        return result;
      }).join('\n');

      updateContentWithHistory(formatted);
      showToast('Document formatted');
    } catch {
      showToast('Formatted with standard indentation');
    }
  };

  // Jump to line
  const handleJumpToLine = () => {
    setShowJumpLine(false);
    const lineNum = parseInt(jumpLineNumber, 10);
    if (!lineNum || isNaN(lineNum)) return;

    const lines = content.split('\n');
    let charOffset = 0;
    for (let i = 0; i < Math.min(lineNum - 1, lines.length); i++) {
      charOffset += lines[i].length + 1;
    }

    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(charOffset, charOffset);
      updateCursorPosition();
    }
  };

  // Find & Replace
  const handleFindNext = () => {
    if (!findText || !textareaRef.current) return;
    const startPos = textareaRef.current.selectionEnd;
    let matchPos = content.indexOf(findText, startPos);
    if (matchPos === -1) {
      matchPos = content.indexOf(findText, 0); // wrap around
    }
    if (matchPos !== -1) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(matchPos, matchPos + findText.length);
      updateCursorPosition();
    } else {
      showToast('Text not found');
    }
  };

  const handleReplaceOne = () => {
    if (!findText || !textareaRef.current) return;
    const selStart = textareaRef.current.selectionStart;
    const selEnd = textareaRef.current.selectionEnd;
    const selected = content.slice(selStart, selEnd);

    if (selected === findText) {
      const newText = content.slice(0, selStart) + replaceText + content.slice(selEnd);
      updateContentWithHistory(newText);
      setTimeout(() => {
        handleFindNext();
      }, 20);
    } else {
      handleFindNext();
    }
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    const count = content.split(findText).length - 1;
    const newContent = content.replaceAll(findText, replaceText);
    updateContentWithHistory(newContent);
    showToast(`Replaced ${count} occurrences`);
  };

  // Symbols list from settings
  const symbols = symbolsBarText.trim().split(/\s+/);

  // Line numbers calculation
  const totalLines = content.split('\n').length;
  const lineNumbersArray = Array.from({ length: totalLines }, (_, i) => i + 1);

  return (
    <div id="screen-code-editor" className="flex flex-col h-screen w-full bg-[#1e1e1e] text-[#d4d4d4] select-none font-sans">
      {/* Top Header Bar (Screenshot 9) */}
      <header className="flex items-center justify-between px-3 py-2 bg-[#252526] border-b border-[#333333] z-20">
        {/* Left: App Name & Cursor position */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToWorkspace}
            className="text-xs font-bold text-gray-300 hover:text-white px-2 py-1 bg-[#333] rounded-lg"
          >
            ← HopWeb
          </button>
          <span className="text-xs font-mono text-gray-400">
            {cursorPos.line}:{cursorPos.col}
          </span>
        </div>

        {/* Right: Undo, Redo, Save, 3-dots Menu */}
        <div className="flex items-center gap-1">
          <button
            id="btn-editor-undo"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:bg-white/10 disabled:opacity-30"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>

          <button
            id="btn-editor-redo"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:bg-white/10 disabled:opacity-30"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>

          <button
            id="btn-editor-save"
            onClick={handleSave}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isSaved ? 'text-gray-400 hover:bg-white/10' : 'text-blue-400 bg-blue-500/20 hover:bg-blue-500/30'
            }`}
            title="Save File"
          >
            <Save className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              id="btn-editor-menu"
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:bg-white/10"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* 3-dots Dropdown Menu (Screenshot 9) */}
            {showMenu && (
              <div 
                className="absolute right-0 top-10 w-44 bg-[#252526] border border-[#3f3f46] rounded-xl shadow-2xl py-1 z-50 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleFormatCode}
                  className="w-full px-3 py-2 text-left hover:bg-[#37373d] flex items-center justify-between text-gray-200"
                >
                  <span>Format</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowJumpLine(true);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#37373d] flex items-center justify-between text-gray-200"
                >
                  <span>Jump To Line</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowFindReplace(!showFindReplace);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#37373d] flex items-center justify-between text-gray-200"
                >
                  <span>Find & Replace</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onBackToWorkspace();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-[#37373d] flex items-center justify-between text-gray-200"
                >
                  <span>Close</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tabs Bar (Screenshot 9) */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181818] border-b border-[#2d2d2d] overflow-x-auto">
        {openFiles.map((f) => (
          <div
            key={f.id}
            onClick={() => onSelectTab(f.id)}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-mono cursor-pointer transition-colors ${
              f.id === activeFileId
                ? 'bg-[#2d2d2d] text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:bg-[#222222]'
            }`}
          >
            <FileTypeBadgeIcon extension={f.extension || 'txt'} size={14} />
            <span>{f.name}</span>
            {openFiles.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(f.id);
                }}
                className="hover:text-red-400 rounded p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Find & Replace Bar */}
      {showFindReplace && (
        <div className="bg-[#252526] px-3 py-2 border-b border-[#333] flex flex-wrap items-center gap-2 text-xs">
          <input
            type="text"
            placeholder="Find"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            className="px-2 py-1 bg-[#1e1e1e] border border-[#3f3f46] rounded text-white focus:outline-none"
          />
          <input
            type="text"
            placeholder="Replace"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            className="px-2 py-1 bg-[#1e1e1e] border border-[#3f3f46] rounded text-white focus:outline-none"
          />
          <button
            onClick={handleFindNext}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
          >
            Find
          </button>
          <button
            onClick={handleReplaceOne}
            className="px-2 py-1 bg-[#3a3a3c] hover:bg-[#48484a] text-white rounded font-medium"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            className="px-2 py-1 bg-[#3a3a3c] hover:bg-[#48484a] text-white rounded font-medium"
          >
            All
          </button>
          <button
            onClick={() => setShowFindReplace(false)}
            className="text-gray-400 hover:text-white ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Jump To Line Dialog */}
      {showJumpLine && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#252526] border border-gray-700 rounded-2xl p-5 w-full max-w-xs shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2">Jump To Line</h3>
            <input
              type="number"
              min="1"
              max={totalLines}
              value={jumpLineNumber}
              onChange={(e) => setJumpLineNumber(e.target.value)}
              className="w-full p-2 bg-[#1e1e1e] border border-blue-500 rounded-lg text-white font-mono text-sm focus:outline-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowJumpLine(false)}
                className="px-3 py-1 text-xs text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleJumpToLine}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
              >
                Jump
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Main Body: Line Numbers + Textarea */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers Column */}
        <div className="w-12 bg-[#1e1e1e] border-r border-[#2d2d2d] py-3 text-right pr-2 text-gray-500 font-mono text-xs select-none overflow-hidden leading-[20px]">
          {lineNumbersArray.map((num) => (
            <div
              key={num}
              className={`${num === cursorPos.line ? 'text-gray-200 font-bold' : ''}`}
            >
              {num}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          id="editor-textarea"
          value={content}
          onChange={handleTextChange}
          onKeyUp={updateCursorPosition}
          onClick={updateCursorPosition}
          spellCheck={false}
          className="flex-1 h-full p-3 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs leading-[20px] focus:outline-none resize-none overflow-auto whitespace-pre tab-size-2"
          style={{ tabSize: 2 }}
        />
      </main>

      {/* Bottom Keyboard Accessory / Symbols Bar (Screenshot 9) */}
      <footer className="h-12 bg-[#2d2d30] border-t border-[#3e3e42] flex items-center px-2 gap-1.5 z-20 overflow-x-auto">
        {/* Scrollable row of symbols */}
        <div className="flex items-center gap-1.5 flex-1 overflow-x-auto py-1 scrollbar-none">
          {symbols.map((sym, i) => (
            <button
              key={`${sym}-${i}`}
              onClick={() => handleInsertSymbol(sym)}
              className="px-2.5 py-1 bg-[#3e3e42] hover:bg-[#4e4e52] active:bg-[#5e5e62] rounded-lg text-gray-200 font-mono text-xs font-medium flex-shrink-0 transition-colors shadow-2xs"
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Rightmost: Green Play Button in gray rounded box [ ▶ ] (Screenshot 9) */}
        <button
          id="btn-editor-run-preview"
          onClick={() => {
            handleSave();
            onRunPreview();
          }}
          className="w-11 h-9 rounded-xl bg-[#e5e7eb] hover:bg-[#d1d5db] active:scale-95 text-[#2e7d32] flex items-center justify-center flex-shrink-0 ml-1 shadow-sm transition-all"
          title="Run Project in WebView Preview"
        >
          <Play className="w-5 h-5 fill-[#2e7d32] text-[#2e7d32]" />
        </button>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-white text-xs px-4 py-2 rounded-full shadow-2xl border border-gray-700">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
