"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhatsappLogo, Trash, Flag, DotsThree } from "@phosphor-icons/react";
import { getInitials } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLeads } from "@/hooks/use-leads";
import type { Patient, Priority } from "@/types";
import { toast } from "sonner";

interface LeadCardProps {
    patient: Patient;
    index: number;
    onClick?: () => void;
}

export function LeadCard({ patient, index, onClick }: LeadCardProps) {
    const { deleteLead } = useLeads();

    // ⚡ Local state for INSTANT priority updates (front-end only, no database)
    const [localPriority, setLocalPriority] = useState<Priority | null>(patient.priority || null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: patient.id,
        data: {
            type: "Patient",
            patient,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-50 bg-blue-50 border-2 border-blue-500 rounded-2xl h-[160px]"
            />
        );
    }

    const formattedValue = patient.estimated_value
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patient.estimated_value)
        : null;

    const treatmentTag = patient.tags?.[0] || "Geral";

    const handlePriorityChange = (priority: Priority | null) => {
        // Instant UI update!
        setLocalPriority(priority);

        const labels = { urgent: 'Urgente', high: 'Alta', normal: 'Normal', low: 'Baixa' };
        if (priority) {
            toast.success(`Prioridade: ${labels[priority]}`);
        } else {
            toast.info("Prioridade removida");
        }
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card
                onClick={onClick}
                className="mb-3 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all border-none shadow-sm ring-1 ring-gray-100 rounded-2xl overflow-hidden group bg-white"
            >
                <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm bg-blue-100">
                            <AvatarImage src={patient.avatar_url} />
                            <AvatarFallback className="text-blue-600 font-bold">
                                {getInitials(patient.name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-gray-900 truncate text-[15px]">
                                    {patient.name || patient.phone}
                                </h3>
                                {patient.channel === 'whatsapp' && (
                                    <div className="bg-green-100 p-0.5 rounded-full">
                                        <WhatsappLogo className="w-3.5 h-3.5 text-green-600" weight="fill" />
                                    </div>
                                )}
                                {localPriority && (
                                    <div className={`p-0.5 rounded-sm ${localPriority === 'urgent' ? 'bg-red-100' :
                                            localPriority === 'high' ? 'bg-yellow-100' :
                                                localPriority === 'normal' ? 'bg-blue-100' :
                                                    'bg-gray-100'
                                        }`}>
                                        <Flag
                                            className={`w-3 h-3 ${localPriority === 'urgent' ? 'text-red-600' :
                                                    localPriority === 'high' ? 'text-yellow-600' :
                                                        localPriority === 'normal' ? 'text-blue-600' :
                                                            'text-gray-600'
                                                }`}
                                            weight="fill"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-1">
                        {formattedValue && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-[11px] px-2 py-0.5 font-semibold rounded-md border-0">
                                {formattedValue}
                            </Badge>
                        )}
                        <Badge variant="outline" className="text-gray-500 border-gray-200 text-[11px] px-2 py-0.5 font-medium rounded-md">
                            {treatmentTag}
                        </Badge>
                    </div>
                </CardContent>

                <div className="h-[1px] bg-gray-50 mx-4" />

                <CardFooter className="p-2 flex justify-between items-center bg-white">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-medium hover:bg-gray-50 gap-1.5">
                                {localPriority ? (
                                    <>
                                        <Flag
                                            className={`w-3.5 h-3.5 ${localPriority === 'urgent' ? 'text-red-500' :
                                                    localPriority === 'high' ? 'text-yellow-500' :
                                                        localPriority === 'normal' ? 'text-blue-500' :
                                                            'text-gray-400'
                                                }`}
                                            weight="fill"
                                        />
                                        <span className="text-gray-700">
                                            {localPriority === 'urgent' ? 'Urgente' :
                                                localPriority === 'high' ? 'Alta' :
                                                    localPriority === 'normal' ? 'Normal' :
                                                        'Baixa'}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-gray-400">Sem prioridade</span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-44">
                            {[
                                { value: 'urgent' as Priority, label: 'Urgente', color: 'text-red-500' },
                                { value: 'high' as Priority, label: 'Alta', color: 'text-yellow-500' },
                                { value: 'normal' as Priority, label: 'Normal', color: 'text-blue-500' },
                                { value: 'low' as Priority, label: 'Baixa', color: 'text-gray-400' },
                            ].map((priority) => (
                                <DropdownMenuItem
                                    key={priority.value}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePriorityChange(priority.value);
                                    }}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Flag className={`w-3.5 h-3.5 ${priority.color}`} weight="fill" />
                                    <span>{priority.label}</span>
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePriorityChange(null);
                                }}
                                className="flex items-center gap-2 cursor-pointer text-gray-500"
                            >
                                <span className="w-3.5 h-3.5" />
                                <span>Limpar</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                                <DotsThree className="w-4 h-4" weight="bold" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Tem certeza que deseja excluir este lead?")) {
                                        deleteLead(patient.id);
                                    }
                                }}
                            >
                                <Trash className="w-4 h-4 mr-2" />
                                Excluir Lead
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardFooter>
            </Card>
        </div>
    );
}
