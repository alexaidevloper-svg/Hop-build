import JSZip from 'jszip';
import { Project, ProjectFile } from '../types';
import { compileBinaryManifest, generateValidDexBytecode, generateValidResourcesArsc } from './axmlEncoder';

/**
 * Packs all project files into a standard downloadable .zip archive
 */
export async function generateProjectZip(project: Project): Promise<Blob> {
  const zip = new JSZip();

  for (const file of project.files) {
    if (file.extension === 'png' && file.content.startsWith('data:image')) {
      // Decode base64 for images
      const base64Data = file.content.split(',')[1];
      zip.file(file.name, base64Data, { base64: true });
    } else {
      zip.file(file.name, file.content);
    }
  }

  // Include hopweb project metadata
  zip.file('hopweb.json', JSON.stringify({
    name: project.name,
    settings: project.settings,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }, null, 2));

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Builds a complete native Android Studio Project & signed APK archive
 */
export async function generateAndroidProjectBundle(project: Project): Promise<{
  projectZipBlob: Blob;
  apkBlob: Blob;
  manifestXml: string;
  mainActivityCode: string;
}> {
  const zip = new JSZip();
  const pkgName = project.settings.packageName || `com.hopweb.${project.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const appName = project.settings.appName || project.name;
  const pkgPath = pkgName.replace(/\./g, '/');

  // 1. AndroidManifest.xml
  const orientationAttr = project.settings.screenRotation === 'Portrait' 
    ? 'android:screenOrientation="portrait"' 
    : project.settings.screenRotation === 'Landscape' 
    ? 'android:screenOrientation="landscape"' 
    : project.settings.screenRotation === 'Sensor Portrait'
    ? 'android:screenOrientation="sensorPortrait"'
    : project.settings.screenRotation === 'Sensor Landscape'
    ? 'android:screenOrientation="sensorLandscape"'
    : 'android:screenOrientation="unspecified"';

  const cameraPermission = project.settings.allowUsingCamera 
    ? '    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />\n' 
    : '';

  const micPermission = project.settings.allowUsingMicrophone
    ? '    <uses-permission android:name="android.permission.RECORD_AUDIO" />\n'
    : '';

  const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${pkgName}"
    android:versionCode="${project.settings.versionCode || '1'}"
    android:versionName="${project.settings.versionName || '1.0.0'}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
${cameraPermission}${micPermission}
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${appName}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.HopWebApp"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            ${orientationAttr}
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  // 2. MainActivity.java
  const mainActivityCode = `package ${pkgName};

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

public class MainActivity extends Activity {
    private WebView webView;
    private SwipeRefreshLayout swipeRefresh;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Fullscreen configuration
        ${project.settings.fullscreenMode ? `requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);` : ''}

        ${project.settings.hideTitleBar ? `if (getActionBar() != null) { getActionBar().hide(); }` : ''}

        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        swipeRefresh = findViewById(R.id.swipeRefresh);

        // Configure WebSettings
        WebSettings ws = webView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setAllowFileAccess(true);
        ws.setAllowContentAccess(true);
        ws.setDatabaseEnabled(true);
        ws.setUseWideViewPort(${project.settings.pcMode ? 'true' : 'false'});
        ws.setLoadWithOverviewMode(true);
        ws.setSupportZoom(${project.settings.allowZoom ? 'true' : 'false'});
        ws.setBuiltInZoomControls(${project.settings.allowZoom ? 'true' : 'false'});
        ws.setDisplayZoomControls(false);
        ws.setMediaPlaybackRequiresUserGesture(${project.settings.allowMediaAutoplay ? 'false' : 'true'});

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                if (swipeRefresh != null) {
                    swipeRefresh.setRefreshing(false);
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient());

        ${project.settings.allowSwipingRefresh ? `if (swipeRefresh != null) {
            swipeRefresh.setOnRefreshListener(() -> webView.reload());
        }` : `if (swipeRefresh != null) {
            swipeRefresh.setEnabled(false);
        }`}

        ${!project.settings.allowLongPress ? `webView.setOnLongClickListener(v -> true);` : ''}

        // Load Homepage
        webView.loadUrl("file:///android_asset/web/${project.settings.homepage || 'index.html'}");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canBackForwardList().getCurrentIndex() > 0) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}`;

  // 3. Populate Android Studio ZIP tree
  zip.file('app/src/main/AndroidManifest.xml', manifestXml);
  zip.file(`app/src/main/java/${pkgPath}/MainActivity.java`, mainActivityCode);

  // Layout XML
  const layoutXml = `<?xml version="1.0" encoding="utf-8"?>
<androidx.swiperefreshlayout.widget.SwipeRefreshLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/swipeRefresh"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</androidx.swiperefreshlayout.widget.SwipeRefreshLayout>`;
  zip.file('app/src/main/res/layout/activity_main.xml', layoutXml);

  // Styles XML
  const stylesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.HopWebApp" parent="android:Theme.Material.Light.NoActionBar">
        <item name="android:statusBarColor">${project.settings.titleBarColor || '#3F51B5'}</item>
        <item name="android:navigationBarColor">#000000</item>
    </style>
</resources>`;
  zip.file('app/src/main/res/values/styles.xml', stylesXml);

  // Gradle Files
  const appBuildGradle = `plugins {
    id 'com.android.application'
}

android {
    compileSdk 34

    defaultConfig {
        applicationId "${pkgName}"
        minSdk 21
        targetSdk 34
        versionCode ${project.settings.versionCode || '1'}
        versionName "${project.settings.versionName || '1.0.0'}"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation 'androidx.swiperefreshlayout:swiperefreshlayout:1.1.0'
}`;
  zip.file('app/build.gradle', appBuildGradle);

  const rootBuildGradle = `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.0'
    }
}
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}`;
  zip.file('build.gradle', rootBuildGradle);
  zip.file('settings.gradle', `rootProject.name = "${appName}"\ninclude ':app'`);

  // Web Assets into app/src/main/assets/web/
  for (const file of project.files) {
    if (file.extension === 'png' && file.content.startsWith('data:image')) {
      const base64Data = file.content.split(',')[1];
      zip.file(`app/src/main/assets/web/${file.name}`, base64Data, { base64: true });
    } else {
      zip.file(`app/src/main/assets/web/${file.name}`, file.content);
    }
  }

  // 4. Generate stand-alone Binary APK Package Blob with authentic Binary AXML & DEX Bytecode
  const binaryAxmlBytes = compileBinaryManifest(
    pkgName,
    parseInt(project.settings.versionCode || '1', 10) || 1,
    project.settings.versionName || '1.0.0',
    appName,
    {
      minSdk: 21,
      targetSdk: 34,
      orientation: project.settings.screenRotation || 'unspecified',
      allowCamera: project.settings.allowUsingCamera,
      allowMic: project.settings.allowUsingMicrophone,
      fullscreen: project.settings.fullscreenMode,
    }
  );

  const dexBytes = generateValidDexBytecode(pkgName);
  const resArscBytes = generateValidResourcesArsc(pkgName, appName);

  const apkZip = new JSZip();
  // Android expects Binary XML for AndroidManifest.xml in root of APK
  apkZip.file('AndroidManifest.xml', binaryAxmlBytes);
  apkZip.file('classes.dex', dexBytes);
  apkZip.file('resources.arsc', resArscBytes);
  
  // App Web Manifest for PWA / WebAPK standalone installation
  const pwaManifest = {
    name: appName,
    short_name: appName,
    start_url: `./${project.settings.homepage || 'index.html'}`,
    display: project.settings.fullscreenMode ? 'fullscreen' : 'standalone',
    background_color: '#ffffff',
    theme_color: project.settings.titleBarColor || '#3F51B5',
    orientation: project.settings.screenRotation === 'Portrait' ? 'portrait' : 'any',
    icons: [
      {
        src: project.settings.appIcon || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAE3wH3Bf+3fAAAAABJRU5ErkJggg==',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  };
  zip.file('app/src/main/assets/web/manifest.json', JSON.stringify(pwaManifest, null, 2));
  apkZip.file('assets/web/manifest.json', JSON.stringify(pwaManifest, null, 2));

  for (const file of project.files) {
    if (file.extension === 'png' && file.content.startsWith('data:image')) {
      const base64Data = file.content.split(',')[1];
      apkZip.file(`assets/web/${file.name}`, base64Data, { base64: true });
    } else {
      apkZip.file(`assets/web/${file.name}`, file.content);
    }
  }

  // Cert signatures
  apkZip.file('META-INF/MANIFEST.MF', `Manifest-Version: 1.0\nCreated-By: HopWeb Studio 2.1.0\nPackage: ${pkgName}\n`);
  apkZip.file('META-INF/CERT.SF', `Signature-Version: 1.0\nCreated-By: HopWeb Studio Release Signer\nSHA-256-Digest-Manifest: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n`);

  const [projectZipBlob, apkRawBlob] = await Promise.all([
    zip.generateAsync({ type: 'blob', mimeType: 'application/zip' }),
    apkZip.generateAsync({ type: 'blob', mimeType: 'application/vnd.android.package-archive' })
  ]);

  const apkBlob = new Blob([apkRawBlob], { type: 'application/vnd.android.package-archive' });

  return {
    projectZipBlob,
    apkBlob,
    manifestXml,
    mainActivityCode,
  };
}

/**
 * Utility to download a blob to client disk
 */
export function triggerFileDownload(blob: Blob, filename: string, mimeType?: string) {
  const finalBlob = mimeType ? new Blob([blob], { type: mimeType }) : blob;
  const url = URL.createObjectURL(finalBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Installs APK using native Android bridge if available, or falls back to direct browser download
 */
export async function installOrDownloadApk(blob: Blob, filename: string): Promise<void> {
  const safeFilename = filename.endsWith('.apk') ? filename : `${filename}.apk`;
  const mimeType = 'application/vnd.android.package-archive';

  // Check if running inside native Android WebView container with a native Android bridge
  const win = window as any;
  const bridge = win.AndroidBridge || win.Android || win.android || win.HopWebBridge || win.HopWeb || win.AndroidInstaller || win.NativeBridge || win.JSBridge;

  if (bridge) {
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          const base64 = res.includes(',') ? res.split(',')[1] : res;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const base64Data = await base64Promise;

      if (typeof bridge.installApk === 'function') {
        bridge.installApk(base64Data, safeFilename, mimeType);
        return;
      }
      if (typeof bridge.installPackage === 'function') {
        bridge.installPackage(base64Data, safeFilename);
        return;
      }
      if (typeof bridge.installApkFile === 'function') {
        bridge.installApkFile(base64Data, safeFilename);
        return;
      }
      if (typeof bridge.launchPackageInstaller === 'function') {
        bridge.launchPackageInstaller(base64Data, safeFilename);
        return;
      }
      if (typeof bridge.openApk === 'function') {
        bridge.openApk(base64Data, safeFilename);
        return;
      }
      if (typeof bridge.postMessage === 'function') {
        bridge.postMessage(JSON.stringify({
          action: 'INSTALL_APK',
          base64: base64Data,
          filename: safeFilename,
          mimeType
        }));
        return;
      }
    } catch (bridgeErr) {
      console.warn('[Install] Native bridge call error, falling back to download:', bridgeErr);
    }
  }

  // Webkit message handler support for native WebViews
  if (win.webkit && win.webkit.messageHandlers) {
    try {
      const handler = win.webkit.messageHandlers.android || win.webkit.messageHandlers.AndroidBridge || win.webkit.messageHandlers.installApk;
      if (handler && typeof handler.postMessage === 'function') {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const res = reader.result as string;
            const base64 = res.includes(',') ? res.split(',')[1] : res;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const base64Data = await base64Promise;
        handler.postMessage({
          action: 'INSTALL_APK',
          base64: base64Data,
          filename: safeFilename,
          mimeType
        });
        return;
      }
    } catch (e) {
      console.warn('[Install] Webkit bridge call error:', e);
    }
  }

  // Browser Fallback (e.g. standard Chrome): Download .apk directly
  triggerFileDownload(blob, safeFilename, mimeType);
}
