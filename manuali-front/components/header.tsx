"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";
import { NavMenu } from "./nav-menu"
import { SearchBar } from "./searchbar";
import { ResponsiveCart } from "./cart";



export function VisitantHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-stone-200/80 bg-white backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                <NavMenu />

                <Link href="/comprador" className="hidden md:flex items-center gap-2.5 group shrink-0">
                    <Logo />
                </Link>
                <nav className="hidden items-center gap-6 md:flex">
                    <Link href="#" className="text-sm font-medium text-marrom-escuro hover:text-terracota transition-colors">
                        Acervo completo
                    </Link>
                    <Link href="#" className="text-sm font-medium text-marrom-escuro hover:text-terracota transition-colors">
                        Artesãos
                    </Link>
                    <Link href="#" className="text-sm font-medium text-marrom-escuro hover:text-terracota transition-colors">
                        Sobre nós
                    </Link>
                </nav>
                <div className="flex gap-2">
                <ResponsiveCart></ResponsiveCart>
                <SearchBar/>
                <UserMenu/>
                </div>
            </div>
        </header>
    );
}
