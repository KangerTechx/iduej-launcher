'use client'

import Nav from "@/components/Navigation/Nav";
import SideNav from "@/components/Navigation/SideNav";
import Dofus from "@/components/Pages/Dofus";
import Home from "@/components/Pages/Home";
import Wow from "@/components/Pages/Wow";
import { useEffect, useState } from "react";


export default function Page() {

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
            <Home />
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
