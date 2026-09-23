import React, { useState } from 'react';
import { Project } from '../types';
import { IdeaSkyIcon, ProjectFileIcon } from './Icons';
import { Search, Download, Star, ExternalLink, Heart, Sparkles } from 'lucide-react';

interface IdeaSkyScreenProps {
  onImportCommunityProject: (name: string, files: any[]) => void;
}

interface CommunityProject {
  id: string;
  name: string;
  author: string;
  downloads: number;
  likes: number;
  description: string;
  category: string;
  files: any[];
}

const COMMUNITY_PROJECTS: CommunityProject[] = [
  {
    id: 'comm_crypto_tracker',
    name: 'CryptoTrack Pro',
    author: 'AlexDev',
    downloads: 1420,
    likes: 382,
    description: 'Modern real-time cryptocurrency price tracker and portfolio visualizer.',
    category: 'Finance',
    files: [
      {
        id: 'f1',
        name: 'index.html',
        type: 'file',
        extension: 'html',
        updatedAt: '2026-08-14 12:00:00',
        content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CryptoTrack Pro</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #0f172a; color: white; padding: 20px; }
    .card { background: #1e293b; padding: 16px; border-radius: 12px; margin-bottom: 12px; }
    .price { font-size: 24px; font-weight: bold; color: #10b981; }
  </style>
</head>
<body>
  <h2>Crypto Portfolio</h2>
  <div class="card">
    <div>Bitcoin (BTC)</div>
    <div class="price">$64,280.00</div>
  </div>
  <div class="card">
    <div>Ethereum (ETH)</div>
    <div class="price">$3,450.20</div>
  </div>
</body>
</html>`
      }
    ]
  },
  {
    id: 'comm_php_rest_api',
    name: 'PHP REST API Starter',
    author: 'DevEngine',
    downloads: 3890,
    likes: 891,
    description: 'Lightweight PHP REST API backend with JSON endpoints and authentication middleware.',
    category: 'Backend',
    files: [
      {
        id: 'f2',
        name: 'api.php',
        type: 'file',
        extension: 'php',
        updatedAt: '2026-08-15 09:30:00',
        content: `<?php
header('Content-Type: application/json');
$response = [
  "status" => "success",
  "message" => "HopWeb PHP Backend Active",
  "server_time" => date("Y-m-d H:i:s"),
  "version" => phpversion()
];
echo json_encode($response);
?>`
      }
    ]
  },
  {
    id: 'comm_retro_game',
    name: 'Retro Pixel Platformer',
    author: 'RetroByte',
    downloads: 2150,
    likes: 640,
    description: 'Smooth 60fps HTML5 Canvas arcade platformer with particle effects.',
    category: 'Games',
    files: [
      {
        id: 'f3',
        name: 'index.html',
        type: 'file',
        extension: 'html',
        updatedAt: '2026-08-10 14:15:00',
        content: `<!DOCTYPE html>
<html>
<head>
  <title>Retro Pixel Game</title>
  <style>
    body { background: black; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    canvas { border: 2px solid #2196F3; background: #111; }
  </style>
</head>
<body>
  <canvas id="game" width="320" height="240"></canvas>
  <script>
    const ctx = document.getElementById('game').getContext('2d');
    let x = 50;
    function loop() {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, 320, 240);
      ctx.fillStyle = '#00E676';
      ctx.fillRect(x, 100, 24, 24);
      x = (x + 2) % 300;
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`
      }
    ]
  }
];

export const IdeaSkyScreen: React.FC<IdeaSkyScreenProps> = ({
  onImportCommunityProject,
}) => {
  const [search, setSearch] = useState('');
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  const filtered = COMMUNITY_PROJECTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = (proj: CommunityProject) => {
    setDownloadedId(proj.id);
    onImportCommunityProject(proj.name, proj.files);
    setTimeout(() => setDownloadedId(null), 2000);
  };

  return (
    <div id="screen-ideasky" className="flex flex-col h-screen w-full bg-[#f8f9fa] text-[#202124] select-none font-sans pb-20">
      {/* Header */}
      <header className="px-5 pt-4 pb-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2.5 mb-3">
          <IdeaSkyIcon size={32} color="#111" />
          <h1 className="text-2xl font-bold text-[#1f2937]">ideaSky Community</h1>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search templates and published projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#f0f0f2] rounded-xl text-sm focus:outline-none focus:bg-white border border-transparent focus:border-blue-500 transition-all"
          />
        </div>
      </header>

      {/* Projects List */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-base text-gray-900">{item.name}</div>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                  {item.category}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
              <div className="text-[11px] text-gray-400 mt-2">By @{item.author}</div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>↓ {item.downloads}</span>
                <span>♥ {item.likes}</span>
              </div>

              <button
                onClick={() => handleDownload(item)}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
                  downloadedId === item.id
                    ? 'bg-green-600 text-white'
                    : 'bg-[#2196F3] hover:bg-[#1976D2] text-white'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloadedId === item.id ? 'Imported!' : 'Import Project'}</span>
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};
