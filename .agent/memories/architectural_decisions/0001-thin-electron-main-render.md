# Decision: Thin Electron + main-process render

Status: Active  
ADR: `docs/adr/0001-thin-electron-main-render.md`

Tradeoff: Electron weight vs Tauri size; choose ship speed and existing Windows Electron muscle. Render in main to avoid renderer bundler for CJS markdown stack.
