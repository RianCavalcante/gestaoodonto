"use client";

import { useAnalytics } from "@/hooks/use-analytics";
import { MetricCard } from "@/components/analytics/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, MessageSquare, Target, Phone, Instagram, Facebook, Globe, RefreshCw, Database } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";
import { useState } from "react";

const COLORS = {
    new: "#3B82F6",
    contacted: "#F59E0B",
    qualified: "#F97316",
    scheduled: "#8B5CF6",
    treatment: "#06B6D4",
    converted: "#10B981",
};

const CHANNEL_COLORS = {
    whatsapp: "#25D366",
    instagram: "#E4405F",
    facebook: "#1877F2",
    website: "#6366F1",
};

const CHANNEL_ICONS = {
    whatsapp: Phone,
    instagram: Instagram,
    facebook: Facebook,
    website: Globe,
};

export default function AnalyticsPage() {
    const { data, loading } = useAnalytics();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Preparar dados para gráficos
    const statusData = Object.entries(data.leadsByStatus).map(([name, value]) => ({
        name: name === "new" ? "Novos" :
            name === "contacted" ? "Contatados" :
                name === "qualified" ? "Qualificados" :
                    name === "scheduled" ? "Agendados" :
                        name === "treatment" ? "Em Tratamento" :
                            "Convertidos",
        value,
        fill: COLORS[name as keyof typeof COLORS] || "#888",
    }));

    const channelData = Object.entries(data.leadsByChannel).map(([name, value]) => ({
        name: name === "whatsapp" ? "WhatsApp" :
            name === "instagram" ? "Instagram" :
                name === "facebook" ? "Facebook" :
                    "Website",
        value,
        fill: CHANNEL_COLORS[name as keyof typeof CHANNEL_COLORS] || "#888",
    }));

    const growthRate = data.leadsLastWeek > 0
        ? ((data.leadsThisWeek - data.leadsLastWeek) / data.leadsLastWeek) * 100
        : 100;

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Analytics</h1>
                <p className="text-gray-600 mt-1">Acompanhe as métricas do seu negócio em tempo real</p>
            </div>

            {/* Métricas principais */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total de Leads"
                    value={data.totalLeads}
                    icon={Users}
                    trend={{
                        value: Math.round(growthRate),
                        isPositive: growthRate >= 0,
                    }}
                />
                <MetricCard
                    title="Taxa de Conversão"
                    value={`${data.conversionRate.toFixed(1)}%`}
                    icon={Target}
                />
                <MetricCard
                    title="Leads Esta Semana"
                    value={data.leadsThisWeek}
                    icon={TrendingUp}
                    trend={{
                        value: Math.round(Math.abs(growthRate)),
                        isPositive: growthRate >= 0,
                    }}
                />
                <MetricCard
                    title="Canais Ativos"
                    value={Object.keys(data.leadsByChannel).length}
                    icon={MessageSquare}
                />
            </div>

            {/* Gráficos */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Leads por Status */}
                <Card className="border-blue-200">
                    <CardHeader>
                        <CardTitle>Leads por Estágio do Funil</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={statusData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Leads por Canal */}
                <Card className="border-blue-200">
                    <CardHeader>
                        <CardTitle>Leads por Canal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={channelData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    dataKey="value"
                                >
                                    {channelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Leads Recentes */}
            <Card className="border-blue-200">
                <CardHeader>
                    <CardTitle>Leads Mais Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {data.recentLeads.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-8">Nenhum lead cadastrado ainda</p>
                        ) : (
                            data.recentLeads.map((lead) => {
                                const ChannelIcon = CHANNEL_ICONS[lead.channel as keyof typeof CHANNEL_ICONS] || Globe;
                                return (
                                    <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-white border border-gray-200">
                                                <ChannelIcon className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{lead.name}</p>
                                                <p className="text-sm text-gray-500">{lead.phone}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">
                                                {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
