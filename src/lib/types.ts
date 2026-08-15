// Core types for AI Co-Founder

export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  threadId: string;
  isRead: boolean;
}

export type EmailCategory = 'Investor' | 'Customer' | 'Urgent/Deadline' | 'Noise';

export interface TriageResult {
  emailId: string;
  email: Email;
  category: EmailCategory;
  priority: number; // 1 (highest) to 5 (lowest)
  deadline: string | null;
  actionRequired: boolean;
  summary: string;
  status: 'open' | 'draft_created' | 'sent' | 'resolved';
}

export interface DraftResult {
  triageId: string;
  tone: 'direct' | 'warm' | 'formal';
  draftText: string;
  createdAt: string;
}

export interface WeeklyUpdate {
  emailContent: string;
  slides: Slide[];
  weekStart: string;
  weekEnd: string;
  createdAt: string;
}

export interface Slide {
  title: string;
  content: string;
  metrics?: { label: string; value: string; change?: string }[];
  bulletPoints?: string[];
}

export interface DashboardStats {
  totalEmails: number;
  openLoops: number;
  urgentCount: number;
  investorCount: number;
  customerCount: number;
  noiseCount: number;
  deadlines: { emailId: string; subject: string; deadline: string; daysLeft: number }[];
  categoryTrends: { date: string; Investor: number; Customer: number; 'Urgent/Deadline': number; Noise: number }[];
}
