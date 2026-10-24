#!/usr/bin/env bash
# Builds the Wrist Band Windows app and its WristBand-Setup.exe installer.
# Works on Linux/macOS (needs Node 20+, and makensis from NSIS 3) or Windows (Git Bash + NSIS).
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION="3.0.0"
OUT="${OUT_DIR:-desktop-release}"
STAGE="$OUT/stage"

echo "1/4  Building offline app files"
npx vite build --config ./vite.desktop.config.ts

echo "2/4  Staging production files only"
rm -rf "$STAGE" && mkdir -p "$STAGE"
cp -r desktop/dist desktop/electron desktop/build "$STAGE"/
cat > "$STAGE/package.json" <<JSON
{
  "name": "wrist-band",
  "productName": "Wrist Band",
  "version": "$VERSION",
  "description": "Wrist Band - Bluetooth-based women safety system",
  "author": "Wrist Band",
  "license": "UNLICENSED",
  "main": "electron/main.cjs"
}
JSON

echo "3/4  Packaging the Windows (x64) app"
ELECTRON_VERSION="$(node -p "require('electron/package.json').version")"
npx @electron/packager "$STAGE" "Wrist Band" \
  --platform=win32 --arch=x64 \
  --electron-version="$ELECTRON_VERSION" \
  --icon=desktop/build/icon.ico \
  --app-version="$VERSION" --build-version="$VERSION" \
  --app-copyright="Wrist Band" \
  --win32metadata.CompanyName="Wrist Band" \
  --win32metadata.ProductName="Wrist Band" \
  --win32metadata.FileDescription="Wrist Band" \
  --win32metadata.InternalName="Wrist Band" \
  --win32metadata.OriginalFilename="Wrist Band.exe" \
  --asar --out="$OUT" --overwrite

echo "4/4  Creating the installer"
ABS_OUT="$(cd "$OUT" && pwd)"
makensis -V2 -DVERSION="$VERSION" -DAPPDIR="$ABS_OUT/Wrist Band-win32-x64" -DOUTFILE="$ABS_OUT/WristBand-Setup.exe" desktop/installer/installer.nsi
ls -lh "$OUT/WristBand-Setup.exe"
