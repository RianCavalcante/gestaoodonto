"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MoreHorizontal, FileDown } from "lucide-react";
import { ChannelBadge } from "@/components/messages/channel-badge";
import { getInitials, formatDate } from "@/lib/utils";
import type { Patient } from "@/types";

// Mock data (será substituído pelo Supabase)
const mockPatients: Partial<Patient>[] = [
    {
        id: "1",
        name: "Maria Silva",
        email: "maria.silva@email.com",
        phone: "11987654321",
        channel: "whatsapp",
        lead_status: "contacted",
        created_at: new Date().toISOString(),
    },
    {
        id: "2",
        name: "João Santos",
        email: "joao.santos@email.com",
        phone: "11976543210",
        channel: "instagram",
        lead_status: "new",
        created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: "3",
        name: "Ana Costa",
        email: "ana.costa@email.com",
        phone: "11965432109",
        channel: "facebook",
        lead_status: "qualified",
        created_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
        id: "4",
        name: "Pedro Oliveira",
        email: "pedro.o@email.com",
        phone: "11954321098",
        channel: "website",
        lead_status: "converted",
        created_at: new Date(Date.now() - 259200000).toISOString(),
    },
    {
        id: "5",
        name: "Lucia Ferreira",
        email: "lucia.f@email.com",
        phone: "11943210987",
        channel: "whatsapp",
        lead_status: "lost",
        created_at: new Date(Date.now() - 345600000).toISOString(),
    },
];

const statusConfig = {
    new: { label: "Novo", className: "bg-blue-100 text-blue-700" },
    contacted: { label: "Contatado", className: "bg-yellow-100 text-yellow-700" },
    qualified: { label: "Qualificado", className: "bg-green-100 text-green-700" },
    converted: { label: "Convertido", className: "bg-purple-100 text-purple-700" },
    lost: { label: "Perdido", className: "bg-red-100 text-red-700" },
};

export default function PatientsPage() {
    const [search, setSearch] = useState("");
    const [patients] = useState(mockPatients);

    const filteredPatients = patients.filter((patient) =>
        patient.name?.toLowerCase().includes(search.toLowerCase()) ||
        patient.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Pacientes</h1>
                    <p className="text-gray-600 mt-1">
                        Gerencie seus leads e pacientes
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                        <FileDown className="w-4 h-4 mr-2" />
                        Exportar
                    </Button>
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/30">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Paciente
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nome ou email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 border-blue-100 focus:border-blue-300"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-blue-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-blue-50/50">
                        <TableRow>
                            <TableHead>Paciente</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Canal</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Cadastro</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPatients.map((patient) => (
                            <TableRow key={patient.id} className="hover:bg-blue-50/30">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={patient.avatar_url} />
                                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                                {getInitials(patient.name || "?")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-gray-900">{patient.name}</p>
                                            <p className="text-xs text-gray-500">ID: {patient.id?.substring(0, 8)}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-600">{patient.email}</p>
                                        <p className="text-xs text-gray-500">{patient.phone}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <ChannelBadge channel={patient.channel!} size="sm" showLabel />
                                </TableCell>
                                <TableCell>
                                    <Badge className={statusConfig[patient.lead_status!].className}>
                                        {statusConfig[patient.lead_status!].label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-gray-600">
                                    {formatDate(patient.created_at || "")}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-600">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
