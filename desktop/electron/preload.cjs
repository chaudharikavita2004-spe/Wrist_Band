// Minimal, isolated bridge — the page gets no Node.js access.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("wristBandDesktop", { platform: process.platform, isDesktop: true });
