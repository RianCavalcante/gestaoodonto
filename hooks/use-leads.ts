"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Patient } from "@/types";
import { toast } from "sonner";

export function useLeads() {
  const [leads, setLeads] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  // Track recent optimistic updates to prevent Realtime override
  const recentUpdatesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchLeads();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("leads-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "patients",
        },
        (payload) => {
          // Skip realtime update if we just made an optimistic update
          if (payload.eventType === 'UPDATE' && recentUpdatesRef.current.has(payload.new.id)) {
            console.log('Skipping realtime update for recent optimistic change:', payload.new.id);
            // Remove from tracking after 2 seconds
            setTimeout(() => recentUpdatesRef.current.delete(payload.new.id), 2000);
            return;
          }
          
          if (payload.eventType === 'INSERT') {
              setLeads(prev => [...prev, payload.new as Patient]);
          } else if (payload.eventType === 'UPDATE') {
              setLeads(prev => prev.map(p => p.id === payload.new.id ? (payload.new as Patient) : p));
          } else if (payload.eventType === 'DELETE') {
              setLeads(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("patients") // leads são pacientes
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      toast.error("Erro ao carregar leads");
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (id: string, newStatus: Patient['lead_status']) => {
    // Otimistic update
    setLeads(prev => prev.map(p => p.id === id ? { ...p, lead_status: newStatus } : p));

    try {
      const { error } = await supabase
        .from("patients")
        .update({ lead_status: newStatus })
        .eq("id", id);

      if (error) {
          throw error;
          // Revert on error? Para simplificar, deixamos o realtime corrigir ou o user dar refresh
      }
      toast.success("Status atualizado!");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao mover lead");
      fetchLeads(); // Revert
    }
  };

  const updateLead = async (id: string, data: Partial<Patient>) => {
    // Mark this ID as recently updated (prevents Realtime override)
    recentUpdatesRef.current.add(id);
    
    console.log('🔵 BEFORE UPDATE - Leads count:', leads.length);
    console.log('🔵 Updating lead:', id, 'with data:', data);
    
    // ⚡ INSTANT UI UPDATE with NEW object reference for React to detect
    setLeads(prev => {
      const updated = prev.map(p => 
        p.id === id 
          ? { ...p, ...data } // Create completely new object
          : p
      );
      console.log('🟢 AFTER UPDATE - Leads count:', updated.length);
      console.log('🟢 Updated lead:', updated.find(p => p.id === id));
      return updated;
    });

    // 🔥 Fire database update in background (don't wait)
    supabase
      .from("patients")
      .update(data)
      .eq("id", id)
      .select()
      .single()
      .then(({ error }) => {
        if (error) {
          console.error("Erro ao salvar no banco:", error);
          toast.error("Erro ao salvar. Revertendo...");
          recentUpdatesRef.current.delete(id);
          fetchLeads(); // Revert on error
        }
      })
      .catch((err: unknown) => {
        console.error("Erro crítico:", err);
        recentUpdatesRef.current.delete(id);
        fetchLeads(); // Revert
      });
    
    // Show success immediately (optimistic)
    toast.success("Atualizado!");
  };

  const deleteLead = async (id: string) => {
    // Otimistic update
    setLeads(prev => prev.filter(p => p.id !== id));

    try {
      const { error } = await supabase
        .from("patients") // leads são pacientes
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Lead excluído!");
    } catch (error) {
      console.error("Erro ao excluir lead:", error);
      toast.error("Erro ao excluir lead");
      fetchLeads(); // Revert
    }
  };

  return {
    leads,
    loading,
    updateLeadStatus,
    updateLead,
    deleteLead
  };
}
