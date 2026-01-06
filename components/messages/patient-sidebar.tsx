"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Envelope,
    Phone,
    MapPin,
    CalendarBlank,
    CurrencyDollar,
    Tag,
    Clock,
    User,
    ChatCircleText,
    NotePencil,
    CalendarPlus,
} from "@phosphor-icons/react";
import { ChannelBadge } from "./channel-badge";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";
import type { Conversation } from "@/types";

interface PatientSidebarProps {
    conversation: Conversation;
}

export function PatientSidebar({ conversation }: PatientSidebarProps) {
    const patient = conversation.patient;

    if (!patient) return null;

    // Useos dados reais do paciente, fallback para mock apenas se necessário ou nulo
    const contactInfo = {
        phone: patient.phone.replace(/^(\d{2})(\d{2})(\d{5})(\d{4}).*/, "+$1 ($2) $3-$4").replace(/^(\d{2})(\d{2})(\d{4,5})(\d{4}).*/, "+$1 ($2) $3-$4"), // Formatação básica BR
        email: patient.email || null, // Apenas mostra se tiver
        address: null, // Address não vem no patient type
    };

    const leadStatusConfig = {
        new: { label: "Novo Lead", className: "bg-blue-100 text-blue-700" },
        contacted: { label: "Contatado", className: "bg-yellow-100 text-yellow-700" },
        qualified: { label: "Qualificado", className: "bg-green-100 text-green-700" },
        converted: { label: "Convertido", className: "bg-purple-100 text-purple-700" },
        lost: { label: "Perdido", className: "bg-red-100 text-red-700" },
    };

    const statusInfo = leadStatusConfig[patient.lead_status as keyof typeof leadStatusConfig] || leadStatusConfig.new;

    return (
        <div className="flex flex-col h-full overflow-y-auto bg-gradient-to-b from-white to-blue-50/30">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-white border-b border-blue-200">
                <div className="flex flex-col items-center text-center">
                    <Avatar className="w-20 h-20 mb-3">
                        <AvatarImage src={patient.avatar_url} />
                        <AvatarFallback className="text-2xl">{getInitials(patient.name)}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-lg text-gray-900">{patient.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <ChannelBadge channel={patient.channel} size="sm" showLabel />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Status */}
                <Card className="p-4 bg-white border-blue-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" weight="duotone" />
                        Status do Lead
                    </h4>
                    <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                </Card>

                {/* Informações de Contato */}
                <Card className="p-4 bg-white border-blue-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <ChatCircleText className="w-4 h-4 text-blue-600" weight="duotone" />
                        Informações de Contato
                    </h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <Phone className="w-4 h-4 text-gray-400" weight="duotone" />
                            <span className="text-gray-700">{contactInfo.phone || patient.phone}</span>
                        </div>
                        {contactInfo.email && (
                            <div className="flex items-center gap-3 text-sm">
                                <Envelope className="w-4 h-4 text-gray-400" weight="duotone" />
                                <span className="text-gray-700">{contactInfo.email}</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Informações Comerciais */}
                <Card className="p-4 bg-white border-blue-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <CurrencyDollar className="w-4 h-4 text-blue-600" weight="duotone" />
                        Informações Comerciais
                    </h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4" weight="duotone" />
                                <span>Primeiro Contato</span>
                            </div>
                            <span className="text-gray-900 font-medium">
                                {formatDate(patient.created_at, "dd/MM/yyyy")}
                            </span>
                        </div>
                        {patient.estimated_value && (
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <CurrencyDollar className="w-4 h-4" weight="duotone" />
                                    <span>Valor Estimado</span>
                                </div>
                                <span className="text-gray-900 font-semibold">
                                    {formatCurrency(patient.estimated_value)}
                                </span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Tags */}
                {patient.tags && patient.tags.length > 0 && (
                    <Card className="p-4 bg-white border-blue-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-blue-600" weight="duotone" />
                            Tags
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {patient.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Observações */}
                {patient.notes && (
                    <Card className="p-4 bg-white border-blue-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <NotePencil className="w-4 h-4 text-blue-600" weight="duotone" />
                            Observações
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{patient.notes}</p>
                    </Card>
                )}

                {/* Ações */}
                <div className="space-y-2 pt-2">
                    <Button variant="outline" className="w-full justify-start text-gray-700 hover:bg-blue-50 hover:text-blue-700 border-blue-200">
                        <CalendarPlus className="w-4 h-4 mr-2" weight="duotone" />
                        Agendar Consulta
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-gray-700 hover:bg-blue-50 hover:text-blue-700 border-blue-200">
                        <User className="w-4 h-4 mr-2" weight="duotone" />
                        Ver Perfil Completo
                    </Button>
                </div>
            </div>
        </div>
    );
}
