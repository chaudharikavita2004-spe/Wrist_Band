# Wrist Band for Windows

Wrist Band is a Bluetooth-based women's safety system. This folder turns the existing web app into a
standalone Windows 10 / 11 (64-bit) desktop app and builds a real installer, `WristBand-Setup.exe`.

## Install (end users)

1. Run `WristBand-Setup.exe`. Accept the administrator prompt.
   Windows SmartScreen may say "Windows protected your PC" because the installer is not code-signed.
   Click **More info → Run anyway**.
2. Choose whether to add a **desktop shortcut** (optional, ticked by default).
3. Pick the install folder (default `C:\Program Files\Wrist Band`) and click **Install**.
4. Launch from the finish page, the Start Menu (**Wrist Band**) or the desktop shortcut.

Silent install: `WristBand-Setup.exe /S` (custom folder: `/S /D=C:\Apps\Wrist Band`).

## Uninstall

**Settings → Apps → Installed apps → Wrist Band → Uninstall**, or Start Menu → **Wrist Band →
Uninstall Wrist Band**. Silent: `"C:\Program Files\Wrist Band\Uninstall.exe" /S`.
This removes the program files, shortcuts and registry entries.

## What works on the desktop

Every screen and feature of the web app: SOS with cancel and duress PIN, risk score, devices, pulse
analysis, escalation ladder and tracking map, disguise screens, evidence vault, travel safety,
analytics with CSV export, English and Hindi. It runs fully offline. The fonts are bundled and no
online services are used.

**Real wrist band:** open **Devices → Connect wrist band**. Windows searches for about 4 seconds and
then lists nearby bands to choose from. The band must advertise the standard Bluetooth Heart Rate
service. Battery and buzzer are used when the band offers them. The PC needs Bluetooth Low Energy
(Bluetooth 4.0 or newer).

**Limits on a PC:** shake detection needs a motion sensor, so on a PC use the on-screen
"Simulate shake" button. Location usually isn't available on desktop, so the tracking map falls
back to demo positions.

## Build it yourself

Requirements: Node.js 20+, the project's dependencies, and NSIS 3 (`makensis`).

```bash
npm install                       # or: bun install
# Windows: install NSIS from https://nsis.sourceforge.io and run in Git Bash
# Linux:   sudo apt install nsis       macOS: brew install makensis
bash desktop/build-windows.sh
```

Output goes to `desktop-release/`:
- `Wrist Band-win32-x64/` – the unpacked app (`Wrist Band.exe`)
- `WristBand-Setup.exe` – the installer

Optional code signing (removes the SmartScreen warning) uses your own certificate:
`signtool sign /fd SHA256 /f cert.pfx /p <password> /tr http://timestamp.digicert.com /td SHA256 desktop-release\WristBand-Setup.exe`

## Files

| File | Purpose |
| --- | --- |
| `vite.desktop.config.ts` (project root) | Offline build of the app pages into `desktop/dist` |
| `desktop/main.tsx`, `desktop/index.html` | Desktop start page (hash links, bundled fonts, strict content policy) |
| `desktop/electron/main.cjs` | Window, private `app://` loader, Bluetooth device chooser, permissions, single instance |
| `desktop/electron/preload.cjs` | Isolated bridge (no Node.js access for the page) |
| `desktop/installer/installer.nsi` | Installer: folder choice, Start Menu + optional desktop shortcut, uninstaller, Apps list entry, Windows 10/11 x64 check |
| `desktop/build/icon.ico` | App and installer icon |
| `desktop/build-windows.sh` | One-command build |

## Security

The app has no API keys or secrets. Nothing secret is bundled. The page runs sandboxed, with context
isolation, no Node.js access and a strict content policy. Links to outside websites open in your
normal browser.
