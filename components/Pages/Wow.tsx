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
            'expansion3.zip',
            'Config.wtf'
        ];
    
        const GDRIVE_FILES: [string, string][] = [
            ["expansion1.zip", "https://drive.google.com/uc?id=1YhqqJZkTN15J7RGll-6_N01EyZhmxjCX&export=download"],
            ["expansion2.zip", "https://drive.google.com/uc?id=1izfVUEHkniBb276C9LhsMCLAHafgr5jQ&export=download"],
            ["expansion4.zip", "https://drive.google.com/uc?id=1jaMgOaTFKx0xqdp04efa68kqDOl2rmfh&export=download"],
            ["model.zip", "https://drive.google.com/uc?id=1M9s-UhdYS1AIwP3LD_QkBZiDHsErApb6&export=download"],
            ["sound.zip", "https://drive.google.com/uc?id=1mNH9LYM79t_cq_pQLRs531MrXwbf0zcZ&export=download"],
            ["texture.zip", "https://drive.google.com/uc?id=1Z19VWMxvpDSgPZp8ll7FHDvp7MiEsBoh&export=download"],
            ["world.zip", "https://drive.google.com/uc?id=1hxBAkIU-sBSgGIxL5XuTKrA5Oi3f-VHq&export=download"]
        ];
    
    /*
    const GITHUB_FILES = ['wow-5.4.8.zip', 'Wow.zip'];

    const GDRIVE_FILES: [string, string][] = [
        ["expansion1.zip", "https://drive.google.com/uc?id=1YhqqJZkTN15J7RGll-6_N01EyZhmxjCX&export=download"],
        ["expansion2.zip", "https://drive.google.com/uc?id=1izfVUEHkniBb276C9LhsMCLAHafgr5jQ&export=download"]
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
    const gdriveList = GDRIVE_FILES.map(([name, url]) => ({ url, name, targetRelative: EXTRACT_STRUCTURE[name] || '' }));

    const filesToDownload = [...githubList, ...gdriveList];

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
            setProgress({ phase: data.phase, percent: data.percent || 0, index: data.index, total: data.total, filename: data.filename });
            setStatus('downloading');
        });

        window.electronAPI.onInstallComplete((res) => {
            if (res.success) {
                setStatus('installed');
                if (res.dest) setDest(res.dest);
                setProgress({ percent: 100, phase: 'done' });
            } else {
                setStatus('error');
            }
        });

        // Initialize files array length for reference (not used to render multiple progress bars)
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