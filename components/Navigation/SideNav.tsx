'use client'

import { cn } from "@/lib/utils";
import Link from "next/link"
import { usePathname } from "next/navigation";
import Image from "next/image"

export default function SideNav() {

    const router = usePathname();

    const generalLinks = [
        {
            id: 1,
            slug: "dofus",
            path: "./dofus",
            logo: "dofus/dofus.png"
        },
        {
            id: 2,
            slug: "wow",
            path: "./wow",
            logo: "wow/wow.png"
        }
    ]

    return (

        <div className="flex flex-col items-center justify-between h-[calc(100vh-8px)] w-16 bg-primary/5 border-r border-primary/20">
            <div>
                <ul>
                    {generalLinks.map((link) => ( 
                        <li key={link.id} className="flex flex-col items-center mt-2 text-neutral-300 hover:text-white">
                            <Link href={`${link.path}`} className={cn(router.includes(link.slug) ? 'bg-primary/50!' :'', "flex justify-center items-center bg-transparent w-full p-1 h-15 hover:bg-primary/10 rounded-lg")}>
                                <Image src={`./images/${link.logo}`} width={50} height={50} alt="dofus"/>
                            </Link>
                        </li>
                        
                    ))}
                </ul>
            </div>
        </div>
    )
}