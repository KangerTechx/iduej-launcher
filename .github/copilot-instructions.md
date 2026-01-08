# Iduej Launcher - AI Copilot Instructions

## Project Overview
Iduej is a **Next.js + Electron hybrid desktop application** - a game launcher with auto-update capabilities. The app uses Next.js with static export (`output: 'export'`) compiled to `out/` and loaded by Electron in production.

## Architecture & Key Concepts

### Dual Process Model
- **Electron Main Process** (`electron/main.js`): Creates loader window for auto-updates, then main app window
- **Next.js Frontend** (`app/` + `components/`): React 19 app running in renderer process
- **IPC Communication**: preload.js exposes safe bridge via `window.ipc` and `window.electronAPI`

### Development vs Production
- **Dev**: `npm run dev` → Concurrently runs `next dev --turbopack` (localhost:3000) + `electron .`
- **Prod**: Next.js builds to `out/`, Electron loads `out/index.html` directly
- **Distribution**: `npm run dist:win/mac/linux` builds installers via electron-builder

### Window Management
- **Loader Window**: 420×325, frameless, transparent, shows during auto-updates (minimum 10s in dev)
- **Main Window**: 1280×720 min, frameless, auto-hiding menu bar, custom title bar with minimize/maximize/close buttons
- All windows use context isolation + preload for security

## Code Patterns & Conventions

### Component Structure
- **Pages**: `components/Pages/` - Full-page components (Home.tsx, Dofus.tsx, Wow.tsx)
- **Navigation**: `components/Navigation/` - Nav (top bar), SideNav (sidebar), Tools (Settings, Theme)
- **UI Primitives**: `components/ui/` - Reusable shadcn/ui components (button, sheet)
- **Home Cards**: `components/Home/` - BlurCard, Dev components
- **Naming**: PascalCase exports, use `'use client'` directive for interactive components

### IPC Patterns
Renderer → Main communication via `window.ipc.send(channel, data)`:
```tsx
// Valid channels only: 'minimize', 'maximize', 'close'
const minimize = () => window.ipc.send('minimize', null);
```
Main process listeners in main.js at bottom (lines 120-141). Add new channels to both `validChannels` array and ipcMain handlers.

### Styling & Theming
- **Framework**: Tailwind CSS v4 with Next.js Turbopack
- **Theme**: next-themes integration in `theme-provider.tsx` (client-side)
- **Colors**: CSS variables (`:root`) + Tailwind, custom colors via `components/Navigation/Tools/Theme.tsx`
- **Class Utils**: `cn()` utility (clsx + tailwind-merge) in `lib/utils.ts` - always use for conditional classes

### Typography
- **Custom Fonts**: Matemasie (decorative), Roboto (body) loaded via Google Fonts in layout.tsx
- **Sans Variable**: --font-sans from FontSans (Inter), applied to body

## Build & Development Commands

```bash
npm run dev              # Dev: Next.js + Electron concurrent
npm run dev:next        # Next.js only (port 3000, Turbopack)
npm run dev:electron    # Electron only (waits for localhost:3000)
npm run build           # Next.js build to out/
npm run build:all       # Clean + build Next.js + create distributable
npm run dist:win        # Build Windows NSIS installer
npm run dist:mac        # Build macOS DMG/ZIP
npm run dist:linux      # Build Linux AppImage/deb
npm run lint            # ESLint check
npm run clean           # Remove dist/ and out/ directories
```

## Project-Specific Patterns

### Path Aliases
- `@/*` = workspace root (tsconfig.json) - use for all imports

### Static Export Config
- `output: 'export'` in next.config.ts (no API routes, static only)
- `assetPrefix: './'` for relative paths in Electron
- `unoptimized: true` for images (no Next.js optimization)

### Electron Resources
- Icons: `electron/resources/icon.ico` (Windows), `.icns` (Mac), `.ico` (Linux)
- Loader HTML: `electron/loader.html` - shown during update check
- App ID: `com.kangertechx.iduejlauncher` (electron-builder config)

### Auto-Update Flow
1. Loader window appears immediately
2. Main process checks for updates (GitHub releases)
3. If update available: show download progress on loader
4. If no update: wait 10s minimum, then load main window
5. In dev mode: skip checks, wait 10s then load

## Critical Files Reference

| File | Purpose |
|------|---------|
| [electron/main.js](electron/main.js) | Window creation, auto-updater orchestration |
| [electron/preload.js](electron/preload.js) | IPC bridge exposure |
| [app/layout.tsx](app/layout.tsx) | Root layout, theme provider, navigation |
| [components/Navigation/Nav.tsx](components/Navigation/Nav.tsx) | Top bar + window controls |
| [components/providers/theme-provider.tsx](components/providers/theme-provider.tsx) | next-themes setup |
| [lib/utils.ts](lib/utils.ts) | cn() utility for class merging |
| [types/global.d.ts](types/global.d.ts) | Window type declarations (electronAPI, ipc) |

## Common Tasks

- **Add new page**: Create in `components/Pages/`, wire in main page router (check how Home/Dofus/Wow are used)
- **Add IPC handler**: Edit main.js ipcMain listeners AND preload.js validChannels array
- **Update theme colors**: Modify CSS vars or add to Theme.tsx color picker
- **Change window size**: Edit width/height in createMainWindow() and createLoaderWindow()
- **Add new UI component**: Use shadcn pattern with CVA (class-variance-authority) for variants
