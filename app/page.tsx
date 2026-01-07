'use client'

import BlurCard from "@/components/Home/BlurCard";
import Dev from "@/components/Home/Dev";
import Nav from "@/components/Navigation/Nav";
import SideNav from "@/components/Navigation/SideNav";
import Dofus from "@/components/Pages/Dofus";
import Wow from "@/components/Pages/Wow";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { RiDiscordFill } from "react-icons/ri";

export default function Home() {

  const [page, setPage] = useState('home')

  useEffect(() => {
    const savedColor = localStorage.getItem('primary-color');
    if (savedColor) {
      document.documentElement.dataset.color = savedColor
    }
  }, []);


  return (

    <section className="bg-transparent">
      <Nav page={page} setPage={setPage} />
      <div className="flex w-full">
        <SideNav page={page} setPage={setPage} />
        <div className="rounded-lg w-full h-[calc(100vh-40px)] overflow-hidden">
          {page === 'home' && (
            <div className="relative flex justify-between w-full h-full">
              <div className="p-8">
                <BlurCard>
                  <div className="w-full flex flex-col items-center">
                    <div className=" w-full flex justify-center">
                      <RiDiscordFill className="w-32 h-auto" />
                    </div>
                    <div className="px-6 py-3 w-full">
                      <h3 className="text-lg font-semibold text-foreground mb-2">Discord</h3>
                      <a href="">
                        <Button variant="default" className="w-full font-bold text-white hover:scale-105 transition-all ease cursor-pointer">Rejoindre</Button>
                      </a>
                    </div>
                  </div>
                </BlurCard>
              </div>
              <div className="flex flex-col items-center justify-between w-1/3 h-full  p-5">
                <div className="w-full flex flex-col items-center">
                  <img src="./images/logo.png" className="w-37.5 h-auto " />
                  <h2 className="fond-bold text-xl">Bienvenue</h2>
                </div>
                <div className="flex flex-col items-center w-97.5]">
                  <Dev />
                  <p className="font-semibold text-xs mt-4">Yapa - Pah - Badaa - Kanger</p>
                </div>
              </div>
              <div className="absolute top-0 left-0 -z-10 w-full h-full">
                <img src="./images/home.png" alt="" className='w-full h-full object-cover' />
              </div>
            </div>
          )}

          {page === 'dofus' && (
            <Dofus />
          )}

          {page === 'wow' && (
            <Wow />
          )}


        </div>
      </div>
    </section>


  );
}
