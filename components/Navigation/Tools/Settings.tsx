import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "@/components/ui/sheet"
  import { RiSettings3Line } from "react-icons/ri";

  import { Theme } from './Theme'
import SetColor from "./SetColor";


  export default function Settings() {

    return(
        <Sheet>
            <SheetTrigger className="flex items-center justify-center w-8 h-8 border-2 border-primary rounded-full hover:bg-primary mb-2 cursor-pointer">
                <RiSettings3Line />
            </SheetTrigger>
            <SheetContent className="w-75 overflow-y-auto px-2" side="right">
                <SheetHeader>
                    <SheetTitle>Paramètres</SheetTitle>
                </SheetHeader>
                <div className="mt-12">
                    <Theme />
                    <SetColor />
                </div>
            </SheetContent>
        </Sheet>
    )
  }