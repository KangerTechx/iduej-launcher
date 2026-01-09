// types/electron.d.ts
export {}; // nécessaire pour que TypeScript considère le fichier comme un module

declare global {
  interface Window {
    electronAPI: {
      // Choisir un dossier
      chooseDirectory: () => Promise<string | null>;

      // Démarrer l'installation
      startInstall: (payload: any) => void;

      // Recevoir la progression de l'installation
      onInstallProgress: (callback: (data: {
        phase: 'download' | 'extract' | 'clean' | string;
        index: number;
        total: number;
        percent: number;
        overall?: number;
        filename: string;
        extractedTo?: string;
      }) => void) => void;

      // Recevoir l'événement de fin d'installation
      onInstallComplete: (callback: (data: { success: boolean; dest?: string; error?: string }) => void) => void;

      // Lancer le jeu
      startGame: (exePath: string) => void;

      // Persistance du chemin d'installation
      saveInstallPath: (gameId: string, p: string) => Promise<{ success: boolean; error?: string }>;
      getInstallPath: (gameId: string) => Promise<string | null>;

      // Vérifier si le jeu est installé
      checkGameInstalled: (dest: string, gameType: string) => Promise<boolean>;

      // Mise à jour automatique
      checkForUpdates: () => void;

      // Notifications de mise à jour
      onUpdateAvailable: (callback: () => void) => void;
      onUpdateNotAvailable: (callback: () => void) => void;

      // Progression de téléchargement (optionnel)
      onDownloadProgress: (callback: (percent: number) => void) => void;
    };

    // Pour les actions de fenêtre (minimize/maximize/close)
    ipc: {
      send: (channel: 'minimize' | 'maximize' | 'close', data?: any) => void;
    };
  }
}
