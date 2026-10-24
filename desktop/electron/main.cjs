// Wrist Band — desktop main process.
const { app, BrowserWindow, Menu, dialog, net, protocol, session, shell } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const APP_ID = "com.wristband.desktop";
const DIST = path.join(__dirname, "..", "dist");

// Pages are served from a private app:// scheme (ES modules can't load from file://).
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

if (!app.requestSingleInstanceLock()) app.quit();
app.setAppUserModelId(APP_ID);

let win = null;

function serveApp() {
  protocol.handle("app", (req) => {
    const { pathname } = new URL(req.url);
    let rel = decodeURIComponent(pathname).replace(/^\/+/, "") || "index.html";
    const file = path.normalize(path.join(DIST, rel));
    if (!file.startsWith(DIST)) return new Response("Forbidden", { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
}

function setupPermissions() {
  const ses = session.defaultSession;
  const allowed = new Set(["bluetooth", "geolocation", "notifications", "media", "clipboard-sanitized-write"]);
  ses.setPermissionRequestHandler((_wc, permission, cb) => cb(allowed.has(permission)));
  ses.setPermissionCheckHandler((_wc, permission) => allowed.has(permission));
  ses.setDevicePermissionHandler((d) => d.deviceType === "bluetooth");
}

// Web Bluetooth device chooser: collect nearby bands for a few seconds, then let the user pick.
function setupBluetoothChooser(w) {
  let pending = null;
  w.webContents.on("select-bluetooth-device", (event, devices, callback) => {
    event.preventDefault();
    if (!pending) {
      pending = { callback, devices: new Map() };
      setTimeout(async () => {
        const p = pending;
        pending = null;
        const list = [...p.devices.values()];
        if (!list.length) {
          await dialog.showMessageBox(w, {
            type: "info",
            title: "Wrist Band",
            message: "No wrist band found",
            detail: "Make sure Bluetooth is on and the band is sharing heart rate, then try again.",
          });
          return p.callback("");
        }
        const shown = list.slice(0, 8);
        const { response } = await dialog.showMessageBox(w, {
          type: "question",
          title: "Wrist Band",
          message: "Choose your wrist band",
          buttons: [...shown.map((d) => d.deviceName || `Unknown device (${d.deviceId})`), "Cancel"],
          cancelId: shown.length,
          noLink: true,
        });
        p.callback(response < shown.length ? shown[response].deviceId : "");
      }, 4000);
    }
    for (const d of devices) pending.devices.set(d.deviceId, d);
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 380,
    minHeight: 560,
    title: "Wrist Band",
    backgroundColor: "#0d0c1d",
    icon: path.join(__dirname, "..", "build", "icon.ico"),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  setupBluetoothChooser(win);
  win.once("ready-to-show", () => win.show());

  // Keep navigation inside the app; open any outside link in the default browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("app://")) e.preventDefault();
  });

  win.loadURL("app://wristband/index.html#/");
}

app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  serveApp();
  setupPermissions();
  createWindow();
});

app.on("window-all-closed", () => app.quit());
