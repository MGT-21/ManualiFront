import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button"

export function NavMenu() {
    return (
        <Sheet>
            <SheetTrigger className="md:hidden">
                <Menu />
            </SheetTrigger>
            <SheetContent side="left">
                <SheetHeader>
                    <SheetTitle><Logo /></SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col">
                    <a href="" className={buttonVariants({ variant: "secondary", size: "lg"})}>
                        Acervo completo
                    </a>
                    <a href="" className={buttonVariants({ variant: "secondary", size: "lg", className: "Justify-start" })}>
                        Artesãos
                    </a>
                    <a href="" className={buttonVariants({ variant: "secondary", size: "lg", className: "Justify-start" })}>
                        Sobre nós
                    </a>
                </nav>
            </SheetContent>

        </Sheet>
    );
}

