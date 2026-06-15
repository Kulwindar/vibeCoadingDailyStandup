export interface Standup {
  id: string;
  member_name: string;
  member_email: string;
  yesterday: string;
  today: string;
  blockers: string;
  submitted_at: string;
  date: string;
  source?: string;
}

export interface Member {
  name: string;
  email: string;
}

export interface DigestLog {
  id: string;
  date: string;
  attempt_number: number;
  outcome: 'SUCCESS' | 'FAILED';
  error_reason?: string | null;
  sent_at: string;
}

export interface BlockerPrediction {
  id: string;
  standup_id: string;
  member_name: string;
  member_email: string;
  blockers: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  confidence: number;
  analysis: string | null;
  analyzed_at: string;
}

export interface Kudos {
  id: string;
  from_member: string;
  from_member_name: string;
  to_member: string;
  to_member_name: string;
  message: string;
  points: number;
  created_at: string;
}

export interface SprintAnalytics {
  sprint_id: string;
  start_date: string;
  end_date: string;
  velocity_score: number;
  completed_tasks: number;
  working_days: number;
  team_members: number;
  trend: { date: string; velocity: number }[];
}

export interface ApiResponse<T = any> {
  status: number;
  data: T;
  message: string;
}
