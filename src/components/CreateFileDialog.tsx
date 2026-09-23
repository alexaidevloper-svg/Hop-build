import React, { useState } from 'react';

interface CreateFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (fileName: string, initialContent: string) => void;
}

type FileTypeOption = 
  | 'Folder' 
  | 'Empty File' 
  | 'HTML File' 
  | 'CSS File' 
  | 'JS File' 
  | 'PHP File' 
  | 'PHP Webpage' 
  | 'XML File' 
  | 'JSON File';

const FILE_TEMPLATES: Record<FileTypeOption, { defaultName: string; ext: string; content: string }> = {
  'Folder': { defaultName: 'New Folder', ext: '', content: '' },
  'Empty File': { defaultName: 'New File', ext: '.txt', content: '' },
  'HTML File': { 
    defaultName: 'New File', 
    ext: '.html', 
    content: `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>New Page</title>
  </head>
  <body>
    <h1>New Page</h1>
    <p>Created with HopWeb</p>
  </body>
</html>` 
  },
  'CSS File': { 
    defaultName: 'style', 
    ext: '.css', 
    content: `/* HopWeb Stylesheet */
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: sans-serif;
}` 
  },
  'JS File': { 
    defaultName: 'app', 
    ext: '.js', 
    content: `// HopWeb Script
console.log("HopWeb application initialized.");` 
  },
  'PHP File': { 
    defaultName: 'New File', 
    ext: '.php', 
    content: `<?php
echo "Hello from HopWeb PHP runtime!";
?>` 
  },
  'PHP Webpage': { 
    defaultName: 'index', 
    ext: '.php', 
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PHP Webpage</title>
</head>
<body>
  <h1><?php echo "Welcome to HopWeb PHP"; ?></h1>
  <p>Current Time: <?php echo date("Y-m-d H:i:s"); ?></p>
</body>
</html>` 
  },
  'XML File': { 
    defaultName: 'data', 
    ext: '.xml', 
    content: `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item id="1">HopWeb Data</item>
</root>` 
  },
  'JSON File': { 
    defaultName: 'config', 
    ext: '.json', 
    content: `{\n  "name": "HopWeb Project",\n  "version": "1.0.0"\n}` 
  },
};

export const CreateFileDialog: React.FC<CreateFileDialogProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [selectedType, setSelectedType] = useState<FileTypeOption>('HTML File');
  const [fileNameInput, setFileNameInput] = useState('New File.html');

  if (!isOpen) return null;

  const handleSelectType = (type: FileTypeOption) => {
    setSelectedType(type);
    const tmpl = FILE_TEMPLATES[type];
    setFileNameInput(tmpl.defaultName + tmpl.ext);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fileNameInput.trim()) {
      const tmpl = FILE_TEMPLATES[selectedType];
      onCreate(fileNameInput.trim(), tmpl.content);
      onClose();
    }
  };

  const typesList: FileTypeOption[] = [
    'Folder',
    'Empty File',
    'HTML File',
    'CSS File',
    'JS File',
    'PHP File',
    'PHP Webpage',
    'XML File',
    'JSON File',
  ];

  return (
    <div 
      id="dialog-create-file"
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
        <h2 className="text-xl font-bold text-[#1f2937] mb-5">
          Create
        </h2>

        {/* Type selection pills grid */}
        <div className="flex flex-wrap gap-2 mb-6">
          {typesList.map((type) => {
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleSelectType(type)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#2196F3] text-white shadow-xs'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          {/* File Name Input */}
          <div className="mb-6">
            <input
              id="input-new-file-name"
              type="text"
              value={fileNameInput}
              onChange={(e) => setFileNameInput(e.target.value)}
              className="w-full py-1.5 border-b-2 border-[#2196F3] text-gray-900 text-base focus:outline-none bg-transparent"
              autoFocus
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 font-semibold text-sm py-2 px-2"
            >
              CANCEL
            </button>
            <button
              type="submit"
              id="btn-confirm-create-file"
              className="text-[#2196F3] hover:text-[#1976D2] active:opacity-70 font-bold text-sm tracking-wide py-2 px-2"
            >
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
