import { ShieldCheck } from "lucide-react";
import { Badge } from "../ui/badge";

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container flex h-16 items-center justify-between mx-auto px-4 max-w-6xl">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                        <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-900">
                        Equa<span className="text-blue-600 animate-cursor-blink font-extrabold">|</span>CV
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                        <a href="#" className="hover:text-slate-900 transition-colors">Inicio</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Privacidad</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Contacto</a>
                    </nav>
                    <div className="hidden sm:flex items-center pl-6 border-l border-slate-200">
                        <Badge variant="secondary" className="gap-1.5 font-normal">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            Client-Side Secure
                        </Badge>
                    </div>
                </div>
            </div>
        </header>
    );
}
