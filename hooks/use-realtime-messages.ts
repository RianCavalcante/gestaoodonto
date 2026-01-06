"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Message } from "@/types";

export function useRealtimeMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Fetch initial messages
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        // toast.error("Erro ao carregar mensagens");
      } else {
        console.log("Mensagens carregadas:", data?.length || 0);
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();
  }, [conversationId]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          console.log("Nova mensagem realtime:", newMessage);
          setMessages((current) => [...current, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = async (content: string, phone: string) => {
    if (!conversationId) return;

    // 1. Optimistic Update (Feedback Instantâneo)
    const tempId = crypto.randomUUID();
    const optimisticMessage: Message = {
      id: tempId,
      content: content,
      sender_type: "attendant",
      created_at: new Date().toISOString(),
      conversation_id: conversationId,
      status: "sent",
      is_optimistic: true,
    } as any;

    setMessages((current) => [...current, optimisticMessage]);

    try {
      // Clean phone number
      const cleanPhone = phone.replace(/\D/g, "");

      const response = await fetch("http://localhost:3001/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: cleanPhone,
          message: content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao enviar mensagem");
      }

      // Sucesso: A mensagem real virá via Realtime em breve.
      // Opcional: Remover a otimista quando a real chegar (deduplicar por content/time)
      // Mas por enquanto, confiar que o usuário verá "instantâneo" e depois o Realtime confirma.

    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Erro ao enviar mensagem");
      // Rollback em caso de erro
      setMessages((current) => current.filter((m) => m.id !== tempId));
      throw error;
    }
  };

  return { messages, loading, sendMessage };
}
