"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    MagnifyingGlass,
    ChatCircleText,
    ArrowsClockwise,
    Users,
    User,
    Trash,
    UserMinus,
    DotsThreeVertical
} from "@phosphor-icons/react";
import { ChannelBadge } from "./channel-badge";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import type { Conversation, ChannelType } from "@/types";
import { useRealtimeConversations } from "@/hooks/use-realtime-conversations";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ConversationListProps {
    selectedId?: string;
    onSelectConversation: (conversation: Conversation) => void;
}

// Mock data - será substituído por dados reais do Supabase
const mockConversations: Conversation[] = [
    {
        id: "1",
        clinic_id: "1",
        patient_id: "1",
        channel: "whatsapp",
        last_message_at: new Date().toISOString(),
        unread_count: 3,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        patient: {
            id: "1",
            clinic_id: "1",
            name: "Maria Silva",
            phone: "11987654321",
            channel: "whatsapp",
            lead_status: "contacted",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        last_message: {
            id: "1",
            conversation_id: "1",
            sender_type: "patient",
            type: "text",
            content: "Gostaria de agendar uma consulta",
            status: "read",
            created_at: new Date().toISOString(),
        },
    },
    {
        id: "2",
        clinic_id: "1",
        patient_id: "2",
        channel: "instagram",
        last_message_at: new Date(Date.now() - 3600000).toISOString(),
        unread_count: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        patient: {
            id: "2",
            clinic_id: "1",
            name: "João Santos",
            phone: "11976543210",
            channel: "instagram",
            lead_status: "new",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        last_message: {
            id: "2",
            conversation_id: "2",
            sender_type: "attendant",
            type: "text",
            content: "Olá! Em que posso ajudar?",
            status: "read",
            created_at: new Date(Date.now() - 3600000).toISOString(),
        },
    },
    {
        id: "3",
        clinic_id: "1",
        patient_id: "3",
        channel: "facebook",
        last_message_at: new Date(Date.now() - 7200000).toISOString(),
        unread_count: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        patient: {
            id: "3",
            clinic_id: "1",
            name: "Ana Costa",
            phone: "11965432109",
            channel: "facebook",
            lead_status: "qualified",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        last_message: {
            id: "3",
            conversation_id: "3",
            sender_type: "patient",
            type: "text",
            content: "Quanto custa o tratamento de canal?",
            status: "delivered",
            created_at: new Date(Date.now() - 7200000).toISOString(),
        },
    },
];

export function ConversationList({ selectedId, onSelectConversation }: ConversationListProps) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<ChannelType | "all">("all");
    // Use Realtime Hook
    // TODO: Get real clinic_id from auth context. Using "1" for MVP or fetching dynamic?
    // User is assumed to be logged in. server.js uses clinic_id from patients.
    // Let's fetch the first clinic ID or assume "1" if not available yet, or use a prop.
    // Ideally we pass clinic_id to this component or context.
    // For now, let's hardcode "1" or try to fetch user's clinic.
    // Since this is client side, let's just query.
    // But `useRealtimeConversations` needs an ID. 
    // Let's modify the hook to handle null id or fetch inside?
    // Actually, in `layout.tsx` we saw session check.

    // Better: let's assume clinic_id is available or fetch it. 
    // For speed, let's assume we can pass a dummy ID or the hook handles it?
    // The previous code in server.js used `getFirstClinicId`.
    // Let's assume clinic_id="1" for testing as per seed data usually.

    // Waiting for clinic_id might delay render.
    // Let's just use the hook and hardcode "1" for now to unblock the user testing.
    // The seed data uses clinic_id "1" (from seed-test-data route presumably).

    const [showGroups, setShowGroups] = useState(false);

    const { conversations: realConversations, loading, refresh, markAsRead } = useRealtimeConversations();
    // const [conversations] = useState<Conversation[]>(mockConversations); // REMOVED MOCK
    const conversations = realConversations;

    const supabase = createClient();

    const handleSelectConversation = (conversation: Conversation) => {
        if (conversation.unread_count > 0) {
            markAsRead(conversation.id);
        }
        onSelectConversation(conversation);
    };

    const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
        e.stopPropagation(); // Prevent opening the chat
        if (!confirm("Tem certeza que deseja apagar esta conversa? O histórico será perdido.")) return;

        try {
            const { error } = await supabase
                .from('conversations')
                .delete()
                .eq('id', conversationId);

            if (error) throw error;
            toast.success("Conversa apagada com sucesso");
            refresh();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao apagar conversa");
        }
    };

    const handleDeleteLead = async (e: React.MouseEvent, patientId: string) => {
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja apagar este contato/lead? Tudo será perdido.")) return;

        try {
            // First delete conversations (optional, but safer if no cascade)
            // Assuming cascade delete is ON in DB, but let's just delete patient
            const { error } = await supabase
                .from('patients')
                .delete()
                .eq('id', patientId);

            if (error) throw error;
            toast.success("Contato apagado com sucesso");
            refresh();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao apagar contato");
        }
    };

    const filteredConversations = conversations.filter((conv) => {
        const matchesSearch = conv.patient?.name.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === "all" || conv.channel === filter;

        // Lógica de filtro de grupo:
        // Se showGroups for true, mostra APENAS grupos (tags contém 'group' ou ID longo de grupo)
        // Se showGroups for false, mostra APENAS individuais (tags NÃO contém 'group')
        // *Assumindo que o backend salva tags=['group'] ou o ID termina com @g.us (mas aqui só temos o numero limpo no phone)*
        // *Vamos usar uma heurística simples se tags não estiverem populadas: IDs de grupo geralmente começam com 12036...*

        const isGroup = conv.patient?.tags?.includes('group') || conv.patient?.phone?.startsWith('12036');
        const matchesGroupFilter = showGroups ? isGroup : !isGroup;

        return matchesSearch && matchesFilter && matchesGroupFilter;
    });

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Conversas</h2>
                    <div className="flex gap-2">
                        <Button
                            variant={showGroups ? "default" : "outline"}
                            size="icon"
                            onClick={() => setShowGroups(!showGroups)}
                            title={showGroups ? "Ver Conversas Pessoais" : "Ver Grupos"}
                            className={showGroups ? "bg-blue-600 hover:bg-blue-700" : ""}
                        >
                            {showGroups ? <Users className="w-4 h-4" weight="duotone" /> : <User className="w-4 h-4" weight="duotone" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={refresh}
                            disabled={loading}
                            title="Atualizar conversas"
                        >
                            <ArrowsClockwise className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} weight="duotone" />
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" weight="duotone" />
                    <Input
                        placeholder="Buscar conversas..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                    <Badge
                        variant={filter === "all" ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setFilter("all")}
                    >
                        Todas
                    </Badge>
                    <Badge
                        variant={filter === "whatsapp" ? "whatsapp" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setFilter("whatsapp")}
                    >
                        WhatsApp
                    </Badge>
                    <Badge
                        variant={filter === "instagram" ? "instagram" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setFilter("instagram")}
                    >
                        Instagram
                    </Badge>

                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                        <ChatCircleText className="w-12 h-12 mb-3 text-gray-400" weight="duotone" />
                        <p className="text-sm text-center">Nenhuma conversa encontrada</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredConversations.map((conversation) => (
                            <div
                                key={conversation.id}
                                onClick={() => handleSelectConversation(conversation)}
                                className={`p-4 cursor-pointer transition-colors hover:bg-blue-50 ${selectedId === conversation.id ? "bg-blue-50 border-l-4 border-blue-600" : ""
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="relative">
                                        <Avatar>
                                            <AvatarImage src={conversation.patient?.avatar_url} />
                                            <AvatarFallback>
                                                {getInitials(conversation.patient?.name || "?")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1">
                                            <ChannelBadge channel={conversation.channel} size="sm" />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-gray-900 truncate">
                                                {conversation.patient?.name}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500 flex-shrink-0">
                                                    {formatRelativeTime(conversation.last_message_at)}
                                                </span>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 p-0 hover:bg-transparent">
                                                            <DotsThreeVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" weight="bold" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={(e) => handleDeleteConversation(e, conversation.id)} className="text-red-600 focus:text-red-600 gap-2 cursor-pointer">
                                                            <Trash className="h-4 w-4" weight="duotone" />
                                                            Apagar Conversa
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => handleDeleteLead(e, conversation.patient_id)} className="text-red-600 focus:text-red-600 gap-2 cursor-pointer">
                                                            <UserMinus className="h-4 w-4" weight="duotone" />
                                                            Apagar Lead/Contato
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm text-gray-600 truncate">
                                                {conversation.last_message?.content}
                                            </p>
                                            {conversation.unread_count > 0 && (
                                                <Badge variant="default" className="bg-blue-600 text-white min-w-[20px] h-5 flex items-center justify-center flex-shrink-0 px-1 rounded-full text-[10px]">
                                                    {conversation.unread_count}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
