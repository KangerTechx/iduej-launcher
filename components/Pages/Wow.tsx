'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Autoplay } from 'swiper/modules';
import BlurCard from '@/components/Home/BlurCard';
import { Button } from '@/components/ui/button';
import ProgressRow from '@/components/progress-row';
import { useEffect, useState } from 'react';

// ProgressRow component moved to components/ui/progress-row.tsx

export default function Wow() {

    const [dest, setDest] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'downloading' | 'installed' | 'error'>('idle');
    const [files, setFiles] = useState<any[]>([]);
    const [progress, setProgress] = useState<{ phase?: string; percent: number; index?: number; total?: number; filename?: string }>({ percent: 0 });

    // Configuration fournie
    const GITHUB_OWNER = 'KangerTechx';
    const GITHUB_REPO = 'wow-5.4.8';
    const GITHUB_RELEASE_TAG = 'client-mop-5.4.8';
    
    // fichiers github release à ajouter (fichier < 2Gb)
    const GITHUB_FILES = [
        'wow-5.4.8.zip',
        'Wow.zip',
        'Wow-64.zip',
        '_Wow.zip',
        '_Wow-64.zip',
        'Interface.zip',
        'Data-Cache.zip',
        'Data-Interface.zip',
        'enUS.zip',
        'frFR.zip',
        'Data-1.zip',
        'Data-2.zip',
        'Data-3.zip',
        'expansion1.zip',
        'expansion3.zip',
        'expansion4.zip',
        'model.zip',
        'Config.wtf'
    ];

    // fichiers S3 à ajouter (fichier > 2Gb)
    const S3_FILES: [string, string][] = [
        ["expansion2.zip", "https://s3.eu-north-1.amazonaws.com/wow-5.4.8/expansion2.zip"],
        ["sound.zip", "https://s3.eu-north-1.amazonaws.com/wow-5.4.8/sound.zip"],
        ["texture.zip", "https://s3.eu-north-1.amazonaws.com/wow-5.4.8/texture.zip"],
        ["world.zip", "https://s3.eu-north-1.amazonaws.com/wow-5.4.8/world.zip"]
    ];
    

    // Pour test sans devoir downlload toute la llistte
    /*
    const GITHUB_FILES = [
        'wow-5.4.8.zip'
    ];

    const S3_FILES: [string, string][] = [
        ["expansion2.zip", "https://s3.eu-north-1.amazonaws.com/wow-5.4.8/expansion2.zip"]
    ];
    */
    const EXTRACT_STRUCTURE: Record<string, string> = {
        'wow-5.4.8.zip': '.',
        'Wow.zip': 'wow-5.4.8',
        'Wow-64.zip': 'wow-5.4.8',
        '_Wow.zip': 'wow-5.4.8',
        '_Wow-64.zip': 'wow-5.4.8',
        'Interface.zip': 'wow-5.4.8',
        'Data-Cache.zip': 'wow-5.4.8/Data',
        'Data-Interface.zip': 'wow-5.4.8/Data',
        'enUS.zip': 'wow-5.4.8/Data',
        'frFR.zip': 'wow-5.4.8/Data',
        'Data-1.zip': 'wow-5.4.8/Data',
        'Data-2.zip': 'wow-5.4.8/Data',
        'Data-3.zip': 'wow-5.4.8/Data',
        'expansion1.zip': 'wow-5.4.8/Data',
        'expansion2.zip': 'wow-5.4.8/Data',
        'expansion3.zip': 'wow-5.4.8/Data',
        'expansion4.zip': 'wow-5.4.8/Data',
        'model.zip': 'wow-5.4.8/Data',
        'sound.zip': 'wow-5.4.8/Data',
        'texture.zip': 'wow-5.4.8/Data',
        'world.zip': 'wow-5.4.8/Data',
        'Config.wtf': 'wow-5.4.8/WTF'
    };

    // Build download list: all github files (direct download URL pattern) then gdrive files
    const githubBase = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${GITHUB_RELEASE_TAG}`;
    const githubList = GITHUB_FILES.map((name) => ({ url: `${githubBase}/${name}`, name, targetRelative: EXTRACT_STRUCTURE[name] || '' }));
    const s3List = S3_FILES.map(([name, url]) => ({ url, name, targetRelative: EXTRACT_STRUCTURE[name] || '' }));

    const filesToDownload = [...githubList, ...s3List];

    useEffect(() => {
        // Load saved install path from main (persisted) for this game
        (async () => {
            try {
                const saved = await window.electronAPI.getInstallPath(GITHUB_REPO);
                if (saved) {
                    setDest(saved);
                    // Check if game is actually installed by checking for key files
                    // For WoW, check if the main directory structure exists
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
        localStorage.setItem('wowInstallPath', chosen);
        try { await window.electronAPI.saveInstallPath(GITHUB_REPO, chosen); } catch (e) { console.warn('saveInstallPath failed', e); }

        // start install
        window.electronAPI.startInstall({ dest: chosen, files: filesToDownload });
        setStatus('downloading');
    };

    const handlePlay = () => {
        if (!dest) return;
        // Example exe path — adjust to actual exe relative location
        const exe = pathJoin(dest, 'wow-5.4.8', 'Wow-64.exe');
        window.electronAPI.startGame(exe);
    };

    // helper to build path for renderer (string concat; main will receive full path)
    const pathJoin = (...parts: string[]) => parts.join('\\');

    // Check if game files actually exist at the destination
    const checkGameInstalled = async (destPath: string): Promise<boolean> => {
        try {
            // Ici, le "gameType" correspond à ton identifiant dans main.js
            const exists = await window.electronAPI.checkGameInstalled(destPath, 'wow-5.4.8');
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
                    autoplay={{ delay: 36000, disableOnInteraction: false }}
                    modules={[Autoplay]}
                >
                    <SwiperSlide>
                        <img src="./images/wow/bg/bg3.jpg" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="./images/wow/bg/bg1.webp" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="./images/wow/bg/bg2.jpg" alt="" className='w-full h-full' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src="./images/wow/bg/bg4.webp" alt="" className='w-full h-full' />
                    </SwiperSlide>

                </Swiper>
            </div>
            <div className="relative w-full h-full">
                <div className='absolute top-10 left-10'>
                    <BlurCard>
                        <div className="w-fit flex flex-col items-center">
                            <div className=" w-fit flex justify-center py-12">
                                <img src="./images/wow/bg/mop-tag.png" alt="" className='w-85 h-full' />
                            </div>
                            <div className=" bg-neutral-800/20 px-6 py-3 w-full">
                                <h3 className="text-md font-semibold text-foreground mb-2 text-right">version 5.4.8</h3>

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