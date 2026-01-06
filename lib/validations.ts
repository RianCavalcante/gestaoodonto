import { z } from "zod";

// ============================================
// Auth Validations
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

// ============================================
// Patient Validations
// ============================================

export const patientSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(10, "Telefone inválido"),
  channel: z.enum(["whatsapp", "facebook", "instagram", "website"]),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  estimated_value: z.number().optional(),
});

// ============================================
// Message Validations
// ============================================

export const messageSchema = z.object({
  conversation_id: z.string().uuid("ID da conversa inválido"),
  type: z.enum(["text", "image", "video", "audio", "document"]),
  content: z.string().min(1, "Mensagem não pode estar vazia"),
  media_url: z.string().url("URL inválida").optional(),
});

// ============================================
// Campaign Validations
// ============================================

export const campaignSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  channel: z.enum(["whatsapp", "facebook", "instagram", "website"]),
  start_date: z.string().or(z.date()),
  end_date: z.string().or(z.date()).optional(),
  budget: z.number().positive("Orçamento deve ser positivo").optional(),
});

// ============================================
// Type Exports
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PatientInput = z.infer<typeof patientSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;
