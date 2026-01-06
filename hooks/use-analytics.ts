"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Patient } from "@/types";

interface AnalyticsData {
  totalLeads: number;
  leadsByStatus: Record<string, number>;
  leadsByChannel: Record<string, number>;
  conversionRate: number;
  leadsThisWeek: number;
  leadsLastWeek: number;
  recentLeads: Patient[];
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    totalLeads: 0,
    leadsByStatus: {},
    leadsByChannel: {},
    conversionRate: 0,
    leadsThisWeek: 0,
    leadsLastWeek: 0,
    recentLeads: [],
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Buscar todos os pacientes/leads
      const { data: patients, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!patients) {
        setLoading(false);
        return;
      }

      // Agregações
      const leadsByStatus: Record<string, number> = {};
      const leadsByChannel: Record<string, number> = {};
      
      patients.forEach((patient) => {
        // Por status
        const status = patient.lead_status || "new";
        leadsByStatus[status] = (leadsByStatus[status] || 0) + 1;

        // Por canal
        const channel = patient.channel || "website";
        leadsByChannel[channel] = (leadsByChannel[channel] || 0) + 1;
      });

      // Calcular leads da semana
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const leadsThisWeek = patients.filter(
        (p) => new Date(p.created_at) >= weekAgo
      ).length;

      const leadsLastWeek = patients.filter(
        (p) =>
          new Date(p.created_at) >= twoWeeksAgo &&
          new Date(p.created_at) < weekAgo
      ).length;

      // Taxa de conversão (convertidos / total)
      const converted = leadsByStatus["converted"] || 0;
      const conversionRate = patients.length > 0 ? (converted / patients.length) * 100 : 0;

      setData({
        totalLeads: patients.length,
        leadsByStatus,
        leadsByChannel,
        conversionRate,
        leadsThisWeek,
        leadsLastWeek,
        recentLeads: patients.slice(0, 5),
      });
    } catch (error) {
      console.error("Erro ao buscar analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, refresh: fetchAnalytics };
}
