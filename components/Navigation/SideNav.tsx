'use client'

import { cn } from "@/lib/utils";
import Link from "next/link"
import Image from "next/image"

type Props = {
    page: string;
    setPage: any;
}

export default function SideNav(props: Props) {

    const generalLinks = [
        {
            id: 1,
            name: "dofus",
            logo: "dofus/dofus.png"
        },
        {
            id: 2,
            name: "wow",
            logo: "wow/wow.png"
        }
    ]

    return (

        <div className="flex flex-col items-center justify-between h-[calc(100vh-8px)] w-16 bg-primary/5 border-r border-primary/20">
            <div>
                <ul>
                    {generalLinks.map((link) => (
                        <li key={link.id} className="flex flex-col items-center mt-2 text-neutral-300 hover:text-white">
                            <div onClick={() => props.setPage(link.name)} className={cn(link.name === props.page ? 'bg-primary/50!' : '', "flex justify-center items-center bg-transparent w-full p-1 h-15 hover:bg-primary/10 rounded-lg")}>
                                <Image src={`./images/${link.logo}`} width={50} height={50} alt="dofus" />
                            </div>
                        </li>

                    ))}
                </ul>
            </div>
        </div>
    )
}