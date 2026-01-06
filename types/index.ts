// ============================================
// Database Types
// ============================================

export type ChannelType = 'whatsapp' | 'facebook' | 'instagram' | 'website';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type Priority = 'urgent' | 'high' | 'normal' | 'low';
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// ============================================
// User & Clinic
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  clinic_id: string;
  role: 'admin' | 'manager' | 'attendant';
  created_at: string;
  updated_at: string;
}

export interface Clinic {
  id: string;
  name: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Patients & Leads
// ============================================

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  email?: string;
  phone: string;
  avatar_url?: string;
  channel: ChannelType;
  lead_status: LeadStatus;
  priority?: Priority;
  funnel_stage_id?: string;
  estimated_value?: number;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  last_contact_at?: string;
}

export interface FunnelStage {
  id: string;
  clinic_id: string;
  name: string;
  order: number;
  color: string;
  created_at: string;
}

// ============================================
// Messages & Conversations
// ============================================

export interface Conversation {
  id: string;
  clinic_id: string;
  patient_id: string;
  channel: ChannelType;
  last_message_at: string;
  unread_count: number;
  assigned_to?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations
  patient?: Patient;
  assigned_user?: User;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'patient' | 'attendant' | 'system';
  sender_id?: string;
  type: MessageType;
  content: string;
  media_url?: string;
  status: MessageStatus;
  created_at: string;
  
  // Relations
  sender?: User;
}

// ============================================
// WhatsApp Integration
// ============================================

export interface WhatsAppSession {
  id: string;
  clinic_id: string;
  phone_number: string;
  is_connected: boolean;
  qr_code?: string;
  last_connected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConfig {
  sessionId: string;
  phoneNumber?: string;
  isConnected: boolean;
  qrCode?: string;
  status: 'initializing' | 'qr_ready' | 'connected' | 'disconnected' | 'error';
  error?: string;
}

// ============================================
// Campaigns & Analytics
// ============================================

export interface Campaign {
  id: string;
  clinic_id: string;
  name: string;
  channel: ChannelType;
  start_date: string;
  end_date?: string;
  budget?: number;
  leads_generated: number;
  conversions: number;
  cost_per_lead?: number;
  roi?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsMetrics {
  total_leads: number;
  leads_variation: number;
  conversion_rate: number;
  conversion_variation: number;
  avg_response_time: number;
  response_time_variation: number;
  total_value: number;
  value_variation: number;
}

export interface ChannelPerformance {
  channel: ChannelType;
  leads: number;
  conversions: number;
  conversion_rate: number;
  revenue: number;
}

export interface FunnelMetrics {
  stage_id: string;
  stage_name: string;
  leads_count: number;
  conversion_rate: number;
}

export interface TimelineData {
  date: string;
  leads: number;
  conversions: number;
  revenue: number;
}

// ============================================
// UI Components
// ============================================

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface FilterState {
  channel?: ChannelType;
  status?: LeadStatus;
  dateRange?: {
    from: Date;
    to: Date;
  };
  search?: string;
}

// ============================================
// API Responses
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
