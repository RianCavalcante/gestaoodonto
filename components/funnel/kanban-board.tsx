"use client";

import { useMemo, useState } from "react";
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { LeadDetailsModal } from "./lead-details-modal";
import { LeadCard } from "./lead-card";
import { Button } from "@/components/ui/button";
import { Plus, Funnel } from "@phosphor-icons/react";
import type { Patient } from "@/types";
import { toast } from "sonner";
import { useLeads } from "@/hooks/use-leads";

// Mock data inicial
// Dados carregados via useLeads hook

const columns = [
    { id: "new", title: "Novos Leads" },
    { id: "contacted", title: "Contatados" },
    { id: "qualified", title: "Qualificados" },
    { id: "scheduled", title: "Agendados" },
    { id: "treatment", title: "Em Tratamento" },
    { id: "converted", title: "Convertidos" },
];

export function KanbanBoard() {
    const { leads: patients, updateLeadStatus, updateLead } = useLeads();
    const [activePatient, setActivePatient] = useState<Patient | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    // ...



    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Previne drag acidental ao clicar
            },
        })
    );

    const patientsByColumn = useMemo(() => {
        const data: Record<string, Patient[]> = {};
        columns.forEach(col => data[col.id] = []);
        patients.forEach(patient => {
            const status = patient.lead_status || "new";
            if (data[status]) {
                data[status].push(patient);
            } else {
                // Fallback or ignore
            }
        });
        return data;
    }, [patients]);

    const onDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === "Patient") {
            setActivePatient(event.active.data.current.patient);
        }
    };

    const onDragEnd = async (event: DragEndEvent) => {
        setActivePatient(null);
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Se soltou sobre uma coluna (vazia ou não) - lida com mudança de status
        // A lógica simplificada aqui assume que 'over.id' pode ser uma coluna ou um card
        // Se for card, pegamos o status desse card. Se for coluna, pegamos o ID da coluna.

        // NOTA: Para este exemplo simples, vamos assumir drag apenas entre colunas ou posições
        // A implementação robusta requer lidar com SortableStrategy complexa

        // Vamos simplificar: se mudou de coluna visualmente, atualizamos o status
        // O dnd-kit lida com "over" sendo o container droppable
    };

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Encontrar o paciente ativo
        const activeIndex = patients.findIndex(p => p.id === activeId);
        if (activeIndex === -1) return;
        const activePatient = patients[activeIndex];

        // Verificar se 'over' é uma coluna
        const isOverColumn = columns.some(col => col.id === overId);

        // Verificar se 'over' é outro card
        const overIndex = patients.findIndex(p => p.id === overId);
        const overPatient = patients[overIndex];

        let newStatus = activePatient.lead_status;

        if (isOverColumn) {
            newStatus = overId as any;
        } else if (overPatient) {
            newStatus = overPatient.lead_status;
        }

        // Se o status mudou (moveu para outra coluna)
        if (newStatus !== activePatient.lead_status) {
            // Chama o hook que já lida com update otimista e Supabase
            updateLeadStatus(activeId, newStatus!);
        }
    };

    const handleCardClick = (patient: Patient) => {
        setActivePatient(null); // Clear drag state just in case
        setSelectedPatient(patient);
    };

    const handleSaveLead = async (id: string, data: Partial<Patient>) => {
        await updateLead(id, data);
        // toast handles success/error inside hook
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b bg-white">
                <h2 className="text-xl font-bold text-gray-800">Funil de Vendas</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Funnel className="w-4 h-4 mr-2" />
                        Filtrar
                    </Button>
                    <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Lead
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 bg-gray-100">
                <DndContext
                    sensors={sensors}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDragOver={onDragOver}
                >
                    <div className="flex h-full gap-4 min-w-max">
                        {columns.map((col) => (
                            <KanbanColumn
                                key={col.id}
                                id={col.id}
                                title={col.title}
                                patients={patientsByColumn[col.id] || []}
                                onCardClick={handleCardClick}
                            />
                        ))}
                    </div>

                    <DragOverlay>
                        {activePatient ? (
                            <LeadCard patient={activePatient} index={0} />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <LeadDetailsModal
                patient={selectedPatient}
                isOpen={!!selectedPatient}
                onClose={() => setSelectedPatient(null)}
                onSave={handleSaveLead}
            />
        </div>
    );
}
