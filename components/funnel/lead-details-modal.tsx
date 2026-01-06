"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
    User,
    Phone,
    Envelope,
    CalendarBlank,
    Tag,
    CurrencyDollar,
    Clock,
    CheckCircle,
    TextAlignLeft,
    Paperclip,
    ChatCircle,
    Sparkle,
    CaretDown
} from "@phosphor-icons/react";
import type { Patient, LeadStatus } from "@/types";
import { getInitials } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Tradutor de Status
const STATUS_LABELS: Record<LeadStatus, string> = {
    'new': 'Novo',
    'contacted': 'Contatado',
    'qualified': 'Qualificado',
    'converted': 'Convertido',
    'lost': 'Perdido'
};

const STATUS_COLORS: Record<LeadStatus, string> = {
    'new': 'bg-blue-500',
    'contacted': 'bg-yellow-500',
    'qualified': 'bg-purple-500',
    'converted': 'bg-green-500',
    'lost': 'bg-red-500'
};

interface LeadDetailsModalProps {
    patient: Patient | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, data: Partial<Patient>) => Promise<void> | void;
}

export function LeadDetailsModal({ patient, isOpen, onClose, onSave }: LeadDetailsModalProps) {
    const [name, setName] = useState(patient?.name || "");
    const [phone, setPhone] = useState(patient?.phone || "");
    const [notes, setNotes] = useState(patient?.notes || "");
    const [currentStatus, setCurrentStatus] = useState<LeadStatus>(patient?.lead_status || 'new');
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (patient) {
            setName(patient.name);
            setPhone(patient.phone);
            setNotes(patient.notes || "");
            setCurrentStatus(patient.lead_status || 'new');
            setAttachedFiles([]); // Reset files when patient changes
        }
    }, [patient]);

    if (!patient) return null;

    const formattedValue = patient.estimated_value
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patient.estimated_value)
        : "Sem valor";

    const handleSave = async () => {
        setLoading(true);
        await onSave(patient.id, { name, phone, notes, lead_status: currentStatus });

        // TODO: Upload files to storage here
        if (attachedFiles.length > 0) {
            toast.info(`${attachedFiles.length} arquivo(s) será(ão) enviado(s) em breve`);
        }

        setLoading(false);
        onClose();
    };

    const handleStatusChange = async (newStatus: LeadStatus) => {
        setCurrentStatus(newStatus);
        await onSave(patient.id, { lead_status: newStatus });
        toast.success(`Status alterado para "${STATUS_LABELS[newStatus]}"`);
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setAttachedFiles(prev => [...prev, ...newFiles]);
            toast.success(`${newFiles.length} arquivo(s) adicionado(s)`);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        setAttachedFiles(prev => [...prev, ...droppedFiles]);
        toast.success(`${droppedFiles.length} arquivo(s) adicionado(s)`);
    };

    const handleRemoveFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
        toast.info("Arquivo removido");
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 overflow-hidden flex flex-col bg-white">
                {/* Header Style ClickUp */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium hover:underline cursor-pointer">Funil de Vendas</span>
                        <span>/</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium uppercase text-xs">
                            {STATUS_LABELS[currentStatus]}
                        </span>
                        <span>/</span>
                        <span className="truncate max-w-[200px]">{patient.id.substring(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-400 mr-6">Criado em {format(new Date(patient.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</div>
                        {/* Fecha duplicado removido, usando o nativo do Dialog */}
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Main Content (Left) */}
                    <div className="flex-1 overflow-y-auto p-8 border-r bg-white scrollbar-thin scrollbar-thumb-gray-200">
                        {/* Title Section */}
                        <div className="mb-8 group">
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                {name}
                            </h1>
                        </div>

                        {/* Description Section */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-3 text-gray-500 font-medium">
                                <TextAlignLeft size={20} />
                                <h3>Descrição</h3>
                            </div>
                            <div className="pl-7">
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Adicionar uma descrição detalhada..."
                                    className="w-full min-h-[100px] p-4 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-blue-300 focus:bg-white focus:border-blue-500 focus:outline-none transition-all resize-none text-gray-700 text-sm"
                                />
                            </div>
                        </div>

                        {/* Attachments with Drag & Drop */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-3 text-gray-500 font-medium">
                                <Paperclip size={20} />
                                <h3>Anexos</h3>
                                {attachedFiles.length > 0 && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                        {attachedFiles.length}
                                    </Badge>
                                )}
                            </div>
                            <div className="pl-7">
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`
                                        min-h-[120px] p-4 rounded-lg border-2 border-dashed transition-all
                                        ${isDragging
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 bg-gray-50/30 hover:border-blue-300 hover:bg-blue-50/50'
                                        }
                                    `}
                                >
                                    {/* File List */}
                                    {attachedFiles.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            {attachedFiles.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors group"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-gray-700 truncate">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400">
                                                            {formatFileSize(file.size)}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveFile(index)}
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <span className="text-red-500 text-sm">×</span>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upload Button */}
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleFileClick}
                                            className="border-dashed border-2 hover:border-blue-500 hover:bg-blue-50/50 transition-all"
                                        >
                                            <Paperclip className="w-4 h-4 mr-2" />
                                            Escolher Arquivos
                                        </Button>
                                        <p className="text-xs text-gray-400 mt-2">
                                            ou arraste arquivos aqui
                                        </p>
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*,.pdf,.doc,.docx"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Activity (Simplified) */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 text-gray-500 font-medium">
                                <ChatCircle size={20} />
                                <h3>Atividade</h3>
                            </div>
                            <div className="pl-7">
                                <div className="relative border-l-2 border-gray-100 pl-6 pb-6 last:pb-0">
                                    <div className="absolute -left-[9px] top-0 bg-white p-0.5">
                                        <div className="bg-blue-50 p-1.5 rounded-full ring-4 ring-white">
                                            <Sparkle className="w-3.5 h-3.5 text-blue-600" weight="fill" />
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <span className="font-semibold text-gray-900">Sistema</span> criou este lead automaticamente.
                                        <div className="text-xs text-gray-400 mt-1 font-medium">
                                            {format(new Date(patient.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar (Right) */}
                    <div className="w-[320px] bg-gray-50/50 p-6 overflow-y-auto shrink-0 border-l">
                        {/* Status Widget */}
                        <div className="mb-6">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Status</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="flex items-center justify-between p-2 bg-white border rounded-md shadow-sm hover:border-blue-300 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[currentStatus]}`} />
                                            <span className="text-sm font-medium">{STATUS_LABELS[currentStatus]}</span>
                                        </div>
                                        <CaretDown className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[280px]">
                                    {Object.entries(STATUS_LABELS).map(([status, label]) => (
                                        <DropdownMenuItem
                                            key={status}
                                            onClick={() => handleStatusChange(status as LeadStatus)}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status as LeadStatus]}`} />
                                            <span>{label}</span>
                                            {currentStatus === status && <CheckCircle className="ml-auto w-4 h-4 text-blue-600" weight="fill" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Properties Grid */}
                        <div className="space-y-4">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Propriedades</label>

                            {/* Phone */}
                            <div className="group flex items-center justify-between py-1">
                                <div className="flex items-center gap-2 text-gray-500 w-1/3">
                                    <Phone size={16} />
                                    <span className="text-sm">Telefone</span>
                                </div>
                                <div className="w-2/3">
                                    <Input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="h-8 text-sm bg-transparent border-transparent hover:border-gray-200 focus:bg-white focus:border-blue-500 transition-all px-2"
                                    />
                                </div>
                            </div>

                            {/* Value */}
                            <div className="group flex items-center justify-between py-1">
                                <div className="flex items-center gap-2 text-gray-500 w-1/3">
                                    <CurrencyDollar size={16} />
                                    <span className="text-sm">Valor</span>
                                </div>
                                <div className="w-2/3 pl-2 text-sm text-gray-900 font-medium">
                                    {formattedValue}
                                </div>
                            </div>

                            {/* Channel */}
                            <div className="group flex items-center justify-between py-1">
                                <div className="flex items-center gap-2 text-gray-500 w-1/3">
                                    <Tag size={16} />
                                    <span className="text-sm">Canal</span>
                                </div>
                                <div className="w-2/3 pl-2">
                                    <Badge variant="secondary" className="uppercase text-[10px]">{patient.channel}</Badge>
                                </div>
                            </div>

                            {/* Created At */}
                            <div className="group flex items-center justify-between py-1">
                                <div className="flex items-center gap-2 text-gray-500 w-1/3">
                                    <CalendarBlank size={16} />
                                    <span className="text-sm">Criado</span>
                                </div>
                                <div className="w-2/3 pl-2 text-sm text-gray-600">
                                    {format(new Date(patient.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={loading}>
                                {loading ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
