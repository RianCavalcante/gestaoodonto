"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { io } from "socket.io-client";
import type { Conversation } from "@/types";

export function useRealtimeConversations() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [clinicId, setClinicId] = useState<string | null>(null);
    const supabase = createClient();
    const channelRef = useRef<any>(null);

    // Fetch clinic ID once on mount
    useEffect(() => {
        const fetchClinicId = async () => {
            const { data: clinicData, error } = await supabase
                .from('clinics')
                .select('id')
                .limit(1)
                .single();
            
            if (error) {
                console.error("Erro ao buscar clínica:", error);
                setLoading(false);
                return;
            }
            
            if (clinicData?.id) {
                console.log("Clinic ID encontrado:", clinicData.id);
                setClinicId(clinicData.id);
            } else {
                console.error("Nenhuma clínica encontrada");
                setLoading(false);
            }
        };

        fetchClinicId();
    }, []);

    // Memoized fetch function
    const fetchConversations = useCallback(async () => {
        if (!clinicId) return;
        
        try {
            setLoading(true);
            console.log("Buscando conversas para clinic_id:", clinicId);

            const { data, error } = await supabase
                .from("conversations")
                .select(`
                    *,
                    patient:patients(*)
                `)
                .eq("clinic_id", clinicId)
                .order("last_message_at", { ascending: false });

            if (error) {
                console.error("Erro na query de conversas:", error);
                throw error;
            }

            console.log("Conversas encontradas:", data?.length || 0);
            setConversations(data || []);
        } catch (error) {
            console.error("Erro ao buscar conversas:", error);
        } finally {
            setLoading(false);
        }
    }, [clinicId]);

    // Socket.IO Listener (Instant Updates)
    useEffect(() => {
        const serverUrl = process.env.NEXT_PUBLIC_WHATSAPP_SERVER_URL || "http://localhost:3001";
        // @ts-ignore
        const socket = io(serverUrl);

        socket.on("connect", () => {
            console.log("ConversationList: Conectado ao Socket.IO");
        });

        socket.on("new_message", (message: any) => {
            console.log("ConversationList: Nova mensagem via Socket.IO -> Atualizando lista...");
            fetchConversations();
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchConversations]);

    // Fetch conversations when clinicId is available
    useEffect(() => {
        if (!clinicId) return;

        fetchConversations();

        // Setup realtime subscription with the correct clinic_id
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        channelRef.current = supabase
            .channel(`conversations-${clinicId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "conversations",
                    filter: `clinic_id=eq.${clinicId}`,
                },
                () => {
                    console.log("Realtime: conversa atualizada");
                    fetchConversations();
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                () => {
                    console.log("Realtime: nova mensagem");
                    fetchConversations();
                }
            )
            .subscribe((status) => {
                console.log("Realtime subscription status:", status);
            });

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [clinicId, fetchConversations]);

    // Refresh function for manual trigger
    const refresh = useCallback(() => {
        console.log("Manual refresh triggered");
        fetchConversations();
    }, [fetchConversations]);

    const markAsRead = async (conversationId: string) => {
        // Optimistic update
        setConversations(prev => prev.map(c => 
            c.id === conversationId ? { ...c, unread_count: 0 } : c
        ));

        try {
            // Usa endpoint do backend para garantir permissão (Bypass RLS)
            await fetch('http://localhost:3001/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId })
            });
        } catch (error) {
            console.error("Erro ao marcar como lida:", error);
        }
    };

    return { conversations, loading, clinicId, refresh, markAsRead };
}
