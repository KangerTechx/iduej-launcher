'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Autoplay } from 'swiper/modules';
import BlurCard from '@/components/Home/BlurCard';
import { Button } from '@/components/ui/button';
import ProgressRow from '../progress-row';
import { useEffect, useState } from 'react';

export default function Dofus() {

    const [dest, setDest] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'downloading' | 'installed' | 'error'>('idle');
    const [files, setFiles] = useState<any[]>([]);
    const [progress, setProgress] = useState<{ phase?: string; percent: number; index?: number; total?: number; filename?: string }>({ percent: 0 });

    const GITHUB_OWNER = "KangerTechx"
    const GITHUB_REPO = "dofus-2.51.4"
    const GITHUB_RELEASE_TAG = "client-2.51.4"

    const GITHUB_FILES = [
        "dofus-2.51.4.zip",
        "gfx.zip",
        "config.xml"
    ];

    const EXTRACT_STRUCTURE: Record<string, string> = {
        "dofus-2.51.4.zip": ".",
        "gfx.zip": "dofus-2.51.4/content",
        "config.xml": "dofus-2.51.4"
    };

    // Build download list: all github files (direct download URL pattern) then gdrive files
    const githubBase = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${GITHUB_RELEASE_TAG}`;
    const githubList = GITHUB_FILES.map((name) => ({ url: `${githubBase}/${name}`, name, targetRelative: EXTRACT_STRUCTURE[name] || '' }));

    const filesToDownload = [...githubList];

    useEffect(() => {
        // Load saved install path from main (persisted) for this game
        (async () => {
            try {
                const saved = await window.electronAPI.getInstallPath(GITHUB_REPO);
                if (saved) {
                    setDest(saved);
                    // Check if game is actually installed by checking for key files
                    // For Dofus, check if the main directory structure exists
                    // This is a simple check - you could expand it to check for specific files
                    const isInstalled = await checkGameInstalled(saved);
                    if (isInstalled) {
                        setStatus('installed');
                    }
                }
            } catch (e) {
                console.error('Failed to read saved install path', e);
            }
        })();

        // Listen to progress events from main (single overall progress bar)
        window.electronAPI.onInstallProgress((data) => {
            // Log de debug pour chaque étape reçue
            console.log('[INSTALL_PROGRESS]', data);
            setProgress((prev) => ({
                ...prev,
                phase: data.phase,
                percent: typeof data.percent === 'number' ? data.percent : prev.percent,
                index: data.index,
                total: data.total,
                filename: data.filename || prev.filename
            }));
            setStatus('downloading');
        });

        window.electronAPI.onInstallComplete((res) => {
            console.log('[INSTALL_COMPLETE]', res);
            if (res.success) {
                setStatus('installed');
                if (res.dest) setDest(res.dest);
                setProgress({ percent: 100, phase: 'done' });
            } else {
                setStatus('error');
            }
        });

        // Initialisation pour la barre de progression (affichage du fichier courant)
        setFiles(filesToDownload.map((f) => ({ filename: f.name || '', percent: 0 })));
    }, []);

    const chooseAndStart = async () => {
        const chosen = await window.electronAPI.chooseDirectory();
        if (!chosen) return;
        setDest(chosen);
        // persist choice so user can relaunch later
        // persist choice locally and in main config per-game
        localStorage.setItem('dofusInstallPath', chosen);
        try { await window.electronAPI.saveInstallPath(GITHUB_REPO, chosen); } catch (e) { console.warn('saveInstallPath failed', e); }

        // start install
        window.electronAPI.startInstall({ dest: chosen, files: filesToDownload });
        setStatus('downloading');
    };

    const handlePlay = () => {
        if (!dest) {
            console.warn('[handlePlay] Pas de chemin d\'installation (dest)');
            return;
        }
        const exe = pathJoin(dest, 'dofus-2.51.4', 'Dofus.exe');
        console.log('[handlePlay] exePath envoyé à Electron:', exe);
        window.electronAPI.startGame(exe);
    };

    // helper to build path for renderer (string concat; main will receive full path)
    const pathJoin = (...parts: string[]) => parts.join('\\');
    // Pour debug : log le dest à chaque render
    useEffect(() => {
        console.log('[Dofus.tsx] dest:', dest);
    }, [dest]);

    // Check if game files actually exist at the destination
    const checkGameInstalled = async (destPath: string): Promise<boolean> => {
        try {
            // Ici, le "gameType" correspond à ton identifiant dans main.js
            const exists = await window.electronAPI.checkGameInstalled(destPath, 'dofus-2.51.4');
            return exists;
        } catch (e) {
            console.error('Error checking game installation', e);
            return false;
        }
    };

    return (
        <section className="relative w-full h-full">
            <div className="w-full h-auto absolute top-0 left-0 -z-10 pointer-none">
                <Swiper
                    slidesPerView={1}
                    spaceBetween={0}
                    loop={true}
                    autoplay={{ delay: 6000, disableOnInteraction: false }}
                    modules={[Autoplay]}
                >
                    <SwiperSlide>
                        <img src="./images/dofus/bg/bg.webp" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="./images/dofus/bg/bg2.png" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="./images/dofus/bg/bg1.webp" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="./images/dofus/bg/bg3.webp" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="./images/dofus/bg/bg4.jpg" alt="" className='w-full h-full' />
                    </SwiperSlide>
                </Swiper>
            </div>
            <div className="relative w-full h-full">
                <div className='absolute top-10 left-10'>
                    <BlurCard>
                        <div className="w-fit flex flex-col items-center">
                            <div className=" w-fit flex justify-center p-10">
                                <img src="./images/dofus/bg/dofus-tag.png" alt="" className='w-full h-full' />
                            </div>
                            <div className=" bg-neutral-800/20 px-6 py-3 w-full">
                                <h3 className="text-md font-semibold text-foreground mb-2 text-right">version 2.51.4</h3>
                                {status === 'idle' && (
                                    <Button variant="default" className="w-full font-bold text-white" onClick={chooseAndStart}>Télécharger</Button>
                                )}

                                {status === 'downloading' && (
                                    <div className="w-full">
                                        <div className="mb-2 text-sm text-right">{progress.phase === 'download' ? 'Téléchargement' : progress.phase === 'extract' ? 'Extraction' : progress.phase === 'clean' ? 'Nettoyage' : ''} {/*progress.index}/{progress.total*/}</div>
                                        <ProgressRow file={{ filename: progress.filename || filesToDownload[(progress.index || 1) - 1]?.name, percent: progress.percent }} index={progress.index || 0} total={progress.total || filesToDownload.length || 1} />
                                    </div>
                                )}

                                {status === 'installed' && (
                                    <div className="flex gap-2">
                                        <Button variant="default" className="w-full font-bold text-white" onClick={handlePlay}>Jouer</Button>
                                    </div>
                                )}

                                {status === 'error' && (
                                    <Button variant="outline" className="w-full" onClick={chooseAndStart}>Réparer</Button>
                                )}
                            </div>
                        </div>
                    </BlurCard>
                </div>
            </div>
        </section>
    )
}