'use client'

import { RiAlibabaCloudLine, RiCheckboxMultipleBlankLine, RiCloseFill } from "@remixicon/react"
import Image from "next/image"
import Settings from "@/components/Navigation/Tools/Settings"
import { Button } from "@/components/ui/button"

type Props = {
    page: string;
    setPage: any;
}
export default function GeneralSideNav(props: Props) {



    const minimize = () => {
        // L'argument 'value' est une valeur qui peut être n'importe quoi, ici on envoie juste une valeur vide
        window.ipc.send('minimize', null) // Canal 'minimize', avec une valeur nulle
    }

    const maximize = () => {
        window.ipc.send('maximize', null) // Canal 'maximize', avec une valeur nulle
    }

    const close = () => {
        window.ipc.send('close', null) // Canal 'close', avec une valeur nulle
    }

    return (
        <div id="drag-region" className="w-full flex justify-between items-center px-1 py-3 h-10 border-b border-primary cursor-grab">
            <div className="flex items-center">
                <div className="no-drag" onClick={() => props.setPage("home")}>
                    <Image src={"./images/logo.png"} width={50} height={50} alt="logo" className="pointer-none"/>
                </div>
                <h1 className="text-2xl font-extrabold mb-2"><span className="text-primary">I</span>due<span className="text-primary">j</span></h1>
            </div>
            <div className="flex gap-3 self-start h-full">
                <div className="flex items-center gap-3">
                    <Settings />
                </div>
                <div className="flex items-start border border-primary h-fit rounded-br-xl rounded-bl-xl overflow-hidden -translate-y-3">
                    <Button className="w-5 h-4 px-6 py-2 rounded-none bg-transparent hover:bg-primary text-foreground border-r cursor-pointer" onClick={minimize}><RiAlibabaCloudLine /></Button>
                    <Button className="w-5 h-4 px-6 py-2 rounded-none bg-transparent hover:bg-primary text-foreground border-r cursor-pointer" onClick={maximize}><RiCheckboxMultipleBlankLine /></Button>
                    <Button className="w-5 h-4 px-6 py-2 rounded-none bg-transparent hover:bg-primary text-foreground cursor-pointer" onClick={close}><RiCloseFill /></Button>
                </div>
            </div>
        </div>
    )
}