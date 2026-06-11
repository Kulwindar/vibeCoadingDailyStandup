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

export interface MemberStatus {
  name: string;
  email: string;
  submitted: boolean;
  submitted_at: string | null;
}

export interface PendingMember {
  member_name: string;
  member_email: string;
  status: string;
}

export interface DigestData {
  date: string;
  total_members: number;
  submitted_count: number;
  pending_count: number;
  submissions: Standup[];
  pending: PendingMember[];
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}
