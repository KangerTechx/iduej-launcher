// types/electron.d.ts
export {}; // nécessaire pour que TypeScript considère le fichier comme un module

declare global {
  interface Window {
    electronAPI: {
      checkForUpdates: () => void;
    };
  }
}