const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

const isDev = !app.isPackaged;

function resolveIndexHtml() {
  const candidates = [
    path.join(app.getAppPath(), "desktop-out", "index.html"),
    path.join(process.resourcesPath || "", "app.asar", "desktop-out", "index.html"),
    path.join(__dirname, "..", "desktop-out", "index.html")
  ];

  const match = candidates.find((candidate) => candidate && fs.existsSync(candidate));
  if (!match) {
    throw new Error(`Static export bulunamadı. Önce "npm run build:desktop" çalıştırılmalı.`);
  }

  return match;
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    title: "Modern Web Atölyesi",
    backgroundColor: "#14202a",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs")
    }
  });

  mainWindow.removeMenu();

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }

    return { action: "deny" };
  });

  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl) => {
    console.error(`[electron] load failed ${errorCode}: ${errorDescription} (${validatedUrl})`);
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error(`[electron] render process gone: ${details.reason}`);
  });

  if (isDev && process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(resolveIndexHtml());
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
