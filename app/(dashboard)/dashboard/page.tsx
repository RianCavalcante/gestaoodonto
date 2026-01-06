"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    ChatCircleText,
    Funnel,
    CurrencyDollar,
    ArrowUp,
    ArrowDown
} from "@phosphor-icons/react";

export default function DashboardPage() {
    const stats = [
        {
            title: "Novos Leads",
            value: "156",
            change: "+12.5%",
            trend: "up",
            icon: Users,
            iconColor: "text-blue-600",
            bgGradient: "from-blue-50 to-cyan-50",
        },
        {
            title: "Taxa de Conversão",
            value: "32.8%",
            change: "+4.2%",
            trend: "up",
            icon: Funnel,
            iconColor: "text-green-600",
            bgGradient: "from-green-50 to-emerald-50",
        },
        {
            title: "Mensagens Hoje",
            value: "284",
            change: "-2.1%",
            trend: "down",
            icon: ChatCircleText,
            iconColor: "text-purple-600",
            bgGradient: "from-purple-50 to-pink-50",
        },
        {
            title: "Valor em Negociação",
            value: "R$ 45.2k",
            change: "+18.3%",
            trend: "up",
            icon: CurrencyDollar,
            iconColor: "text-orange-600",
            bgGradient: "from-orange-50 to-amber-50",
        },
    ];

    return (
        <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
            {/* Header - Mais compacto */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Visão geral da sua clínica
                    </p>
                </div>
            </div>

            {/* Stats Grid - Cards menores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    const TrendIcon = stat.trend === "up" ? ArrowUp : ArrowDown;

                    return (
                        <Card
                            key={stat.title}
                            className="group relative overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer bg-white"
                        >
                            {/* Subtle hover background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                            <CardContent className="p-4 relative">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 mb-1">
                                            {stat.title}
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 group-hover:scale-105 transition-transform duration-200">
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.bgGradient} transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                                        <Icon className={`w-5 h-5 ${stat.iconColor}`} weight="fill" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <TrendIcon
                                        className={cn(
                                            "w-3.5 h-3.5",
                                            stat.trend === "up" ? "text-green-600" : "text-red-600"
                                        )}
                                        weight="bold"
                                    />
                                    <span
                                        className={cn(
                                            "text-xs font-semibold",
                                            stat.trend === "up" ? "text-green-600" : "text-red-600"
                                        )}
                                    >
                                        {stat.change}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        vs. mês anterior
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Quick Actions & Activity - Mais compactos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
                            Ações Rápidas
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500">
                            Acesse as funcionalidades principais
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-center py-8 text-gray-400">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <ChatCircleText className="w-6 h-6 text-gray-400" weight="fill" />
                            </div>
                            <p className="text-sm font-medium">Em desenvolvimento</p>
                            <p className="text-xs mt-1 text-gray-400">
                                Mensagens, funil e analytics em breve
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                            Atividade Recente
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500">
                            Últimas interações com pacientes
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-center py-8 text-gray-400">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <Users className="w-6 h-6 text-gray-400" weight="fill" />
                            </div>
                            <p className="text-sm font-medium">Nenhuma atividade</p>
                            <p className="text-xs mt-1 text-gray-400">
                                Conecte seu WhatsApp para começar
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
