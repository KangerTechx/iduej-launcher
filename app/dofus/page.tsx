'use client'

import BlurCard from '@/components/Home/BlurCard';
import { Button } from '@/components/ui/button';

export default function Page() {
    return (
        <div className="relative w-full h-full">
            <div className='absolute top-10 left-10'>
                <BlurCard>
                    <div className="w-fit flex flex-col items-center">
                        <div className=" w-fit flex justify-center p-10">
                            <img src="./images/dofus/bg/dofus-tag.png" alt="" className='w-full h-full' />
                        </div>
                        <div className=" bg-neutral-800/20 px-6 py-3 w-full">
                            <h3 className="text-md font-semibold text-foreground mb-2 text-right">version 2.x.x</h3>

                            <Button variant="default" className="w-full font-bold text-white hover:scale-105 transition-all ease cursor-pointer">Télécharger</Button>
                        </div>
                    </div>
                </BlurCard>
            </div>
        </div>
    )
}