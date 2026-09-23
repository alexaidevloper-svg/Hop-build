import { Project, GlobalSettings, ProjectFile } from '../types';

const STORAGE_KEY_PROJECTS = 'hopweb_projects_v1';
const STORAGE_KEY_SETTINGS = 'hopweb_settings_v1';

export const DEFAULT_SYMBOLS = 'Func ⇄ < > { } [ ] ( ) ; " \' = / + - * ! ? : , . & | $ # _ ~ ` ^ % \\';

export const DEFAULT_SETTINGS: GlobalSettings = {
  symbolsBar: DEFAULT_SYMBOLS,
  debugConsole: 'Eruda',
  phpServerAutoStart: true,
  defaultPhpPort: '57249',
  darkMode: 'light',
  language: 'English',
};

const DEFAULT_INDEX_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" id="viewport" content="width=device-width, initial-scale=1">
    <link rel="shortcut icon" href="favicon.png">
    <title>My Website</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        margin: 0;
        padding: 24px;
        background: #ffffff;
        color: #111827;
      }
      h1 {
        font-size: 32px;
        font-weight: 700;
        margin-top: 0;
        margin-bottom: 12px;
      }
      .content-box {
        font-size: 18px;
        line-height: 1.6;
        color: #374151;
      }
      .btn {
        display: inline-block;
        margin-top: 16px;
        padding: 10px 20px;
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <h1>My Website</h1>
    <div class="content-box">
      Hello World!
    </div>
    <button class="btn" onclick="sayHello()">Click Me</button>

    <script>
      function sayHello() {
        console.log("Button clicked from HopWeb live WebView!");
        alert("Hello from HopWeb!");
      }
      console.log("Project loaded successfully in HopWeb WebView.");
    </script>
  </body>
</html>`;

const DEFAULT_PHP_INDEX = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PHP Website</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    .badge { background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1><?php echo "Welcome to PHP on HopWeb"; ?></h1>
  <p>PHP Server Status: <span class="badge">Running</span></p>
  <p>Current Server Time: <strong><?php echo date("Y-m-d H:i:s"); ?></strong></p>
  <p>PHP Version: <strong><?php echo phpversion(); ?></strong></p>
  
  <?php
    $items = array("Fast Development", "Embedded PHP Engine", "APK Packaging", "Eruda DevConsole");
    echo "<h3>Key Features:</h3><ul>";
    foreach ($items as $item) {
      echo "<li>" . htmlspecialchars($item) . "</li>";
    }
    echo "</ul>";
  ?>
</body>
</html>`;

const DEFAULT_PROJECTS: Project[] = [];

export function getStoredProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any legacy sample projects (my website, Plix4Uhub, tuj, nep h, earn99)
        const filtered = parsed.filter(
          (p) =>
            p &&
            !['proj_plix4uhub', 'proj_tuj', 'proj_nep_h', 'proj_earn99'].includes(p.id) &&
            !['plix4uhub', 'tuj', 'nep h', 'earn99', 'my website'].includes(
              (p.name || '').trim().toLowerCase()
            )
        );
        return filtered;
      }
    }
  } catch (e) {
    console.error('Failed to load projects from storage:', e);
  }
  return [];
}

export function saveStoredProjects(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects to storage:', e);
  }
}

export function getStoredSettings(): GlobalSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings: GlobalSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function formatCurrentTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
}

export function createNewProject(name: string, templateType = 'base'): Project {
  const time = formatCurrentTimestamp();
  const id = 'proj_' + Date.now();
  const sanitizedName = name.trim() || 'My Website';
  const pkgName = 'com.hopweb.' + sanitizedName.toLowerCase().replace(/[^a-z0-9]/g, '');

  const baseFiles: ProjectFile[] = [
    {
      id: 'file_' + Date.now() + '_fav',
      name: 'favicon.png',
      type: 'file',
      extension: 'png',
      content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAE3wH3Bf+3fAAAAABJRU5ErkJggg==',
      updatedAt: time,
    },
    {
      id: 'file_' + Date.now() + '_index',
      name: 'index.html',
      type: 'file',
      extension: 'html',
      content: `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" id="viewport" content="width=device-width, initial-scale=1">
    <link rel="shortcut icon" href="favicon.png">
    <title>${sanitizedName}</title>
  </head>
  <body>
    <h1>${sanitizedName}</h1>
    <div>
      Hello World!
    </div>
  </body>
</html>`,
      updatedAt: time,
    },
  ];

  return {
    id,
    name: sanitizedName,
    createdAt: time,
    updatedAt: time,
    phpServerRunning: false,
    settings: {
      appName: sanitizedName,
      packageName: pkgName,
      versionName: '1.0.0',
      versionCode: '1',
      titleBarColor: '#3F51B5',
      screenRotation: 'Auto Rotate',
      homepage: 'index.html',
      carryPhpEnvironment: false,
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
    files: baseFiles,
  };
}
