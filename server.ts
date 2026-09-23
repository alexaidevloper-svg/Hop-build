import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { compileRealApk, ApkCompileOptions } from './server/apkCompiler';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Real Android APK Compilation Endpoint
  app.post('/api/build-real-apk', async (req, res) => {
    try {
      const options: ApkCompileOptions = req.body;
      if (!options || !options.appName) {
        res.status(400).json({ error: 'Missing app configuration' });
        return;
      }

      console.log(`[APK Builder] Starting native build for ${options.appName} (${options.packageName})...`);
      const apkBuffer = await compileRealApk(options);
      console.log(`[APK Builder] Successfully built signed APK (${apkBuffer.length} bytes)`);

      const safeFilename = `${(options.appName || 'app').replace(/[^a-zA-Z0-9_-]/g, '_')}.apk`;
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.setHeader('Content-Length', apkBuffer.length);
      res.send(apkBuffer);
    } catch (err: any) {
      console.error('[APK Builder] Build error:', err);
      res.status(500).json({
        error: 'Failed to compile APK',
        details: err?.message || String(err)
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
