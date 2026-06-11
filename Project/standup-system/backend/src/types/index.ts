export interface Standup {
  id: string;
  member_name: string;
  member_email: string;
  yesterday: string;
  today: string;
  blockers: string;
  submitted_at: string;
  date: string;
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

export interface ApiResponse<T = any> {
  status: number;
  data: T;
  message: string;
}
