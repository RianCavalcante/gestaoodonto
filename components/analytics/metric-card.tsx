"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
}

export function MetricCard({ title, value, icon: Icon, trend, className }: MetricCardProps) {
    return (
        <Card className={cn("border-blue-200 hover:shadow-md transition-shadow", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
                <div className="p-2 rounded-lg bg-blue-50">
                    <Icon className="w-4 h-4 text-blue-600" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                {trend && (
                    <p className={cn(
                        "text-xs mt-1",
                        trend.isPositive ? "text-green-600" : "text-red-600"
                    )}>
                        {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% vs semana passada
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
