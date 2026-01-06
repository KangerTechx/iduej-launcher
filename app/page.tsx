'use client'
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.checkForUpdates();
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1>Hello iduej Launcher</h1>
        <p>salut les moches v 1.0.2</p>
      </main>
    </div>
  );
}
