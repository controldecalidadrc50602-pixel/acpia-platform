
export enum AuditType {
  VOICE = 'VOICE',
  CHAT = 'CHAT'
}

export enum AuditStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum Perception {
  OPTIMAL = 'Optimal',
  ACCEPTABLE = 'Acceptable',
  POOR = 'Poor'
}

export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MIXED';

export type AgentTrend = 'DECLINING' | 'IMPROVING' | 'RISK' | 'STABLE';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  color: string;
  features: string[];
  aiLimit: string;
  recommended?: boolean;
}

export interface RubricItem {
  id: string;
  label: string;
  category: 'soft' | 'hard' | 'compliance';
  isActive: boolean;
  type: AuditType | 'BOTH';
}

export interface Audit {
  id: string;
  readableId: string;
  interactionId?: string;
  agentName: string;
  project: string;
  date: string;
  type: AuditType;
  status: AuditStatus;
  csat: number;
  qualityScore: number;
  notes?: string;
  aiNotes?: string;
  customData?: Record<string, boolean>;
  sentiment?: Sentiment;
  isAiGenerated?: boolean;
  tokenUsage?: number;
}

export interface VoiceAudit extends Audit {
    duration: number;
    perception: Perception;
}

export interface ChatAudit extends Audit {
    chatTime: string;
    resolutionTime: string;
    responseUnder5Min: boolean;
    initialResponseTime: string;
}

export interface AppSettings {
  companyName: string;
  logoBase64?: string;
  preferredLanguage?: Language;
  usage?: UsageStats;
  chatbotName?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  CRM = 'CRM',
  NEW_AUDIT = 'NEW_AUDIT',
  SMART_AUDIT = 'SMART_AUDIT', 
  REPORTS = 'REPORTS',
  MANAGEMENT = 'MANAGEMENT',
  SETTINGS = 'SETTINGS',
  AGENT_PROFILE = 'AGENT_PROFILE',
  PROJECT_PROFILE = 'PROJECT_PROFILE',
  COPILOT_PAGE = 'COPILOT_PAGE'
}

export type Language = 'en' | 'es';
export type Theme = 'light' | 'dark';

// Mejoras en Agente
export interface Agent { 
  id: string; 
  name: string; 
  projectId?: string; // Proyecto al que pertenece
  auditChannel?: 'VOICE' | 'CHAT' | 'BOTH'; // Qué se le audita
}

export interface ProjectTargets {
  score: number;
  csat: number;
}

export interface Project { 
  id: string; 
  name: string; 
  targets?: ProjectTargets;
  rubricIds?: string[];
}

export enum UserRole { ADMIN = 'ADMIN', AUDITOR = 'AUDITOR' }

export interface User { 
  id: string; 
  name: string; 
  role: UserRole; 
  pin: string; 
  organizationId?: string; 
  email?: string;
  supabaseId?: string;
}

export interface UsageStats {
    aiAuditsCount: number;
    estimatedTokens: number;
    estimatedCost: number;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface SmartAnalysisResult {
  score: number;
  csat: number;
  notes: string;
  customData: Record<string, boolean>;
  sentiment?: Sentiment;
}

export interface CoachingPlan {
  id: string;
  date: string;
  topic: string;
  tasks: string[];
  status: 'pending' | 'completed';
}

export interface ChatSession {
  id: string;
  title: string;
  date: number;
  messages: Message[];
}
