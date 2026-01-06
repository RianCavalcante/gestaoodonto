"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    SquaresFour,
    ChatCircleText,
    Users,
    Funnel,
    ChartLineUp,
    Gear,
    SignOut,
    Smiley,
    Tooth
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: SquaresFour },
    { name: "Mensagens", href: "/messages", icon: ChatCircleText },
    { name: "Pacientes", href: "/patients", icon: Users },
    { name: "Funil", href: "/funnel", icon: Funnel },
    { name: "Analytics", href: "/analytics", icon: ChartLineUp },
    { name: "Configurações", href: "/settings/whatsapp", icon: Gear },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <div className="w-64 bg-white border-r border-blue-200 flex flex-col shadow-lg">
            {/* Logo */}
            <div className="p-6 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 shadow-lg shadow-blue-500/30">
                        <Tooth className="w-6 h-6 text-white" weight="fill" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-gradient">GestãoOdonto</h1>
                        <p className="text-xs text-blue-600">Gestão Completa</p>
                    </div>
                </div>
            </div>
            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            prefetch={true}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium",
                                isActive
                                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
                                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                            )}
                        >
                            <Icon className="w-5 h-5" weight={isActive ? "fill" : "duotone"} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-blue-200 space-y-2 bg-blue-50/50">
                <div className="flex items-center gap-3 px-2 py-2">
                    <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900">Admin</p>
                        <p className="text-xs text-blue-600 truncate">
                            admin@gestaoodonto.com
                        </p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
                    onClick={handleLogout}
                >
                    <SignOut className="w-4 h-4 mr-2" weight="duotone" />
                    Sair
                </Button>
            </div>
        </div>
    );
}
