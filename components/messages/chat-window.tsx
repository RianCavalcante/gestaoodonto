"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    PaperPlaneRight,
    Paperclip,
    Smiley,
    DotsThreeVertical,
    Trash,
    UserMinus,
    SidebarSimple,
    List
} from "@phosphor-icons/react";
import { ChannelBadge } from "./channel-badge";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import type { Conversation } from "@/types";
import { cn } from "@/lib/utils";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { createClient } from "@/lib/supabase/client";
import { AudioPlayer } from "./audio-player";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ChatWindowProps {
    conversation: Conversation | null;
    onToggleSidebar?: () => void;
    isSidebarOpen?: boolean;
    onToggleList?: () => void;
    isListOpen?: boolean;
}

export function ChatWindow({ conversation, onToggleSidebar, isSidebarOpen = true, onToggleList, isListOpen = true }: ChatWindowProps) {
    const { messages, loading, sendMessage } = useRealtimeMessages(conversation?.id || null);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        // Get current user ID
        const getUser = async () => {
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();
            if (data.user) {
                setCurrentUserId(data.user.id);
            }
        };
        getUser();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleDeleteConversation = async () => {
        if (!conversation || !confirm("Tem certeza que deseja apagar esta conversa? O histórico será perdido.")) return;

        const supabase = createClient();
        try {
            const { error } = await supabase
                .from('conversations')
                .delete()
                .eq('id', conversation.id);

            if (error) throw error;
            toast.success("Conversa apagada com sucesso");
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao apagar conversa");
        }
    };

    const handleDeleteLead = async () => {
        if (!conversation?.patient_id || !confirm("Tem certeza que deseja apagar este contato/lead? Tudo será perdido.")) return;

        const supabase = createClient();
        try {
            const { error } = await supabase
                .from('patients')
                .delete()
                .eq('id', conversation.patient_id);

            if (error) throw error;
            toast.success("Contato apagado com sucesso");
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao apagar contato");
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !conversation || !conversation.patient?.phone) {
            if (!conversation?.patient?.phone) toast.error("Erro: Contato sem telefone.");
            return;
        }

        try {
            await sendMessage(newMessage, conversation.patient.phone);
            setNewMessage("");
        } catch (error) {
            // Error handled in hook
        }
    };

    if (!conversation) {
        return (
            <div className="flex items-center justify-center h-full bg-white">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                        <PaperPlaneRight className="w-10 h-10 text-blue-600" weight="duotone" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Nenhuma conversa selecionada
                    </h3>
                    <p className="text-sm text-gray-500">
                        Selecione uma conversa para começar a atender
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Chat Header */}
            <div className="p-4 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {onToggleList && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggleList}
                                className={cn("text-gray-600 hover:text-blue-600 mr-1", !isListOpen && "bg-blue-100/50 text-blue-600")}
                                title={isListOpen ? "Ocultar Conversas" : "Ver Conversas"}
                            >
                                <List className="w-5 h-5" weight={isListOpen ? "regular" : "fill"} />
                            </Button>
                        )}
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={conversation.patient?.avatar_url} />
                            <AvatarFallback>{getInitials(conversation.patient?.name || "?")}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">{conversation.patient?.name}</h3>
                                <ChannelBadge channel={conversation.channel} size="sm" />
                            </div>
                            <p className="text-sm text-gray-600">{conversation.patient?.phone}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {onToggleSidebar && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggleSidebar}
                                className={cn("text-gray-600 hover:text-blue-600", isSidebarOpen && "bg-blue-100/50 text-blue-600")}
                                title={isSidebarOpen ? "Ocultar Detalhes" : "Ver Detalhes"}
                            >
                                <SidebarSimple className="w-5 h-5" weight={isSidebarOpen ? "fill" : "regular"} />
                            </Button>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-600 hover:text-blue-600">
                                    <DotsThreeVertical className="w-5 h-5" weight="bold" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem onClick={handleDeleteConversation} className="text-red-600 focus:text-red-600 gap-2 cursor-pointer">
                                    <Trash className="h-4 w-4" weight="duotone" />
                                    Apagar Conversa
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDeleteLead} className="text-red-600 focus:text-red-600 gap-2 cursor-pointer">
                                    <UserMinus className="h-4 w-4" weight="duotone" />
                                    Apagar Lead/Contato
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-blue-50/30">
                {loading ? (
                    <div className="flex justify-center p-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        Nenhuma mensagem ainda. Inicie a conversa!
                    </div>
                ) : (
                    messages.map((message) => {
                        const isFromPatient = message.sender_type === "patient";

                        return (
                            <div
                                key={message.id}
                                className={cn("flex items-end gap-2", isFromPatient ? "justify-start" : "justify-end")}
                            >
                                {isFromPatient && (
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={conversation.patient?.avatar_url} />
                                        <AvatarFallback>{getInitials(conversation.patient?.name || "?")}</AvatarFallback>
                                    </Avatar>
                                )}

                                <div
                                    className={cn(
                                        "max-w-[70%] rounded-lg px-4 py-2 shadow-sm",
                                        isFromPatient
                                            ? "bg-white border border-gray-200"
                                            : "bg-gradient-to-r from-blue-600 to-blue-500 text-white"
                                    )}
                                >
                                    {(() => {
                                        // Lógica de Renderização Híbrida (Legado + Novo JSON)
                                        // Cast para any para evitar erro de TS enquanto colunas nativas não são oficializadas no type
                                        const msgAny = message as any;
                                        let displayType = msgAny.message_type;
                                        let displayUrl = msgAny.media_url;
                                        let displayText = message.content;

                                        // Tentar parsear JSON no content se parecer um JSON de mídia
                                        // Aceitamos parsear mesmo se o tipo for 'text', pois o backend agora salva como 'text' para compatibilidade

                                        // CASO 1: O Supabase já entregou parseado como Objeto
                                        if (message.content && typeof message.content === 'object') {
                                            const contentObj = message.content as any;
                                            if (contentObj.isMedia || (contentObj.type && contentObj.url)) {
                                                console.log("Conteúdo já veio como Objeto:", contentObj);
                                                displayType = contentObj.type;
                                                displayUrl = contentObj.url;
                                                displayText = contentObj.text;
                                            }
                                        }

                                        // CASO 2: É uma string (precisa de parse ou regex)
                                        else if (message.content && typeof message.content === 'string' && message.content.includes('"isMedia":true')) {
                                            let parsedSuccess = false;
                                            try {
                                                console.log("Tentando parsear mídia:", message.content);
                                                let parsed = JSON.parse(message.content);

                                                // Se foi salvo como string duas vezes (escapado), parseia de novo
                                                if (typeof parsed === 'string') {
                                                    try { parsed = JSON.parse(parsed); } catch (e) { }
                                                }

                                                // Só aplicamos se o parse funcionar e tiver as chaves
                                                if (parsed && typeof parsed === 'object' && parsed.type && parsed.url) {
                                                    displayType = parsed.type;
                                                    displayUrl = parsed.url;
                                                    displayText = parsed.text;
                                                    parsedSuccess = true;
                                                }
                                            } catch (e) {
                                                console.error("Erro ao parsear mídia (JSON):", e);
                                            }

                                            // Fallback: REGEX (Blindagem contra JSON mal formatado)
                                            if (!parsedSuccess) {
                                                console.log("Tentando fallback REGEX para mídia...");

                                                // 1. Tenta padrão limpar: "url":"..."
                                                let urlMatch = message.content.match(/"url"\s*:\s*"([^"]+)"/);
                                                let typeMatch = message.content.match(/"type"\s*:\s*"([^"]+)"/);

                                                // 2. Se falhar, tenta padrão escapado: \"url\":\"...\"
                                                if (!urlMatch) {
                                                    urlMatch = message.content.match(/\\"url\\"\s*:\s*\\"([^"]+)\\"/);
                                                }
                                                if (!typeMatch) {
                                                    typeMatch = message.content.match(/\\"type\\"\s*:\s*\\"([^"]+)\\"/);
                                                }

                                                if (urlMatch && urlMatch[1]) {
                                                    displayUrl = urlMatch[1];
                                                    // Limpeza brutal de escapes
                                                    displayUrl = displayUrl.replace(/\\/g, '');

                                                    displayType = typeMatch ? typeMatch[1] : 'image';
                                                    // Limpeza de escapes no tipo também
                                                    displayType = displayType.replace(/\\/g, '');

                                                    displayText = '[Mídia Recuperada]';
                                                    console.log("Mídia recuperada via Regex:", displayUrl);
                                                } else {
                                                    console.log("Falha no Regex também. Content:", message.content);
                                                }
                                            }
                                        }

                                        // Renderização baseada nos dados extraídos
                                        if (displayType === 'image' && displayUrl) {
                                            return (
                                                <div className="mb-2">
                                                    <img
                                                        src={displayUrl}
                                                        alt="Imagem"
                                                        className="rounded-md max-w-[250px] max-h-[300px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                        onClick={() => window.open(displayUrl as string, '_blank')}
                                                    />
                                                    {displayText && displayText !== '[Imagem]' && (
                                                        <p className="text-sm mt-1">{displayText}</p>
                                                    )}
                                                </div>
                                            );
                                        }

                                        if (displayType === 'audio' && displayUrl) {
                                            const isSent = !message.sender_type || message.sender_type === 'attendant';
                                            return (
                                                <div className="mt-1 mb-1">
                                                    <AudioPlayer
                                                        src={displayUrl}
                                                        variant={isSent ? 'sent' : 'received'}
                                                    />
                                                </div>
                                            );
                                        }

                                        if (displayType === 'document' && displayUrl) {
                                            return (
                                                <div className="flex items-center gap-3 bg-black/5 p-3 rounded-md min-w-[200px] cursor-pointer hover:bg-black/10 transition-colors"
                                                    onClick={() => window.open(displayUrl as string, '_blank')}
                                                >
                                                    <div className="bg-red-100 p-2 rounded-full text-red-600">
                                                        <Paperclip className="w-5 h-5" weight="duotone" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate max-w-[150px]">{displayText}</p>
                                                        <p className="text-xs opacity-70">Toque para baixar</p>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Debug final para saber porque caiu no fallback
                                        console.log("[DEBUG] Fallback Text. DisplayType:", displayType, "URL:", displayUrl);
                                        console.log("[DEBUG] Original Content Type:", typeof message.content);
                                        console.log("[DEBUG] Original Content:", message.content);

                                        // PREVENÇÃO FINAL DE CÓDIGO FEIO:
                                        // Se o texto parece ser nosso JSON mas chegou aqui (falha no render), 
                                        // não mostre o código cru.
                                        if (typeof displayText === 'string' && displayText.includes('"isMedia":true')) {
                                            return (
                                                <div className="text-red-500 text-xs italic bg-red-50 p-2 rounded border border-red-200">
                                                    ⚠️ Erro ao renderizar mídia (Fallback). <br />
                                                    Type: {String(displayType)} <br />
                                                    URL: {String(displayUrl ? 'Presente' : 'Ausente')}
                                                </div>
                                            );
                                        }

                                        return (
                                            <div>
                                                {/* <div className="text-[8px] text-gray-300">v2.0</div> */}
                                                <p className="text-sm whitespace-pre-wrap break-words">{displayText}</p>
                                            </div>
                                        );
                                    })()}
                                    <p
                                        className={cn(
                                            "text-xs mt-1",
                                            isFromPatient ? "text-gray-500" : "text-blue-100"
                                        )}
                                    >
                                        {formatRelativeTime(message.created_at)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-blue-200 bg-white">
                <div className="flex items-end gap-2">
                    <Button variant="ghost" size="icon" className="text-gray-600 hover:text-blue-600">
                        <Paperclip className="w-5 h-5" weight="duotone" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-600 hover:text-blue-600">
                        <Smiley className="w-5 h-5" weight="duotone" />
                    </Button>

                    <div className="flex-1">
                        <Input
                            placeholder="Digite sua mensagem..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            className="resize-none"
                        />
                    </div>

                    <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                    >
                        <PaperPlaneRight className="w-5 h-5" weight="fill" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
