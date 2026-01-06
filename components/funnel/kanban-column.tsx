"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { LeadCard } from "./lead-card";
import type { Patient } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
    id: string;
    title: string;
    patients: Patient[];
    color?: string;
    onCardClick?: (patient: Patient) => void;
}

export function KanbanColumn({ id, title, patients, color = "bg-gray-100", onCardClick }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id: id,
        data: {
            type: "Column",
            columnId: id
        }
    });

    const totalValue = patients.length * 1500; // Valor médio fictício para demo

    return (
        <div className="flex flex-col h-full min-w-[280px] w-[280px] bg-gray-50/50 rounded-xl border border-gray-200">
            {/* Header */}
            <div className={cn("p-3 rounded-t-xl border-b flex items-center justify-between sticky top-0 bg-white z-10",
                id === "new" ? "border-blue-200" :
                    id === "contacted" ? "border-yellow-200" :
                        id === "qualified" ? "border-orange-200" :
                            id === "converted" ? "border-green-200" : "border-gray-200"
            )}>
                <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full",
                        id === "new" ? "bg-blue-500" :
                            id === "contacted" ? "bg-yellow-500" :
                                id === "qualified" ? "bg-orange-500" :
                                    id === "converted" ? "bg-green-500" : "bg-gray-500"
                    )} />
                    <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
                    <Badge variant="secondary" className="text-xs px-1.5 h-5 min-w-[20px] justify-center">
                        {patients.length}
                    </Badge>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-2 overflow-y-auto custom-scrollbar">
                <SortableContext items={patients.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    <div ref={setNodeRef} className="min-h-[150px]">
                        {patients.map((patient, index) => (
                            <LeadCard
                                key={patient.id}
                                patient={patient}
                                index={index}
                                onClick={() => onCardClick?.(patient)}
                            />
                        ))}
                        {patients.length === 0 && (
                            <div className="h-full flex items-center justify-center text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-lg py-8">
                                Arraste leads aqui
                            </div>
                        )}
                    </div>
                </SortableContext>
            </div>

            {/* Footer Totals */}
            <div className="p-2 border-t text-right bg-white rounded-b-xl text-xs text-gray-500">
                Total: <span className="font-semibold text-gray-700">R$ {totalValue.toLocaleString('pt-BR')}</span>
            </div>
        </div>
    );
}
