"use client"

import { RiSunLine, RiMoonLine } from "react-icons/ri";
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils";


export function Theme() {
  const { theme, setTheme } = useTheme()

  return (
    <div>
        <p>Thème :</p>
        <div className="grid grid-cols-2 gap-2 mt-4">
            <Button variant="outline" className={cn( theme == 'light' ? 'border-2 border-primary' : '', "w-full h-20 p-4")} onClick={() => setTheme("light")}>
                <RiSunLine className="w-6! h-auto!" />
            </Button>
            <Button variant="outline" className={cn( theme == 'dark' ? 'border-2 border-primary' : '', "w-full h-20 p-4")} onClick={() => setTheme("dark")}>
                <RiMoonLine className="w-6! h-auto!" />
            </Button>
        </div>
    </div>
  )
}
