import { StandupRepository } from '../repositories/standup.repository';
import { Standup, Member } from '../types';
import membersRaw from '../config/members.json';

const members = membersRaw as Member[];

export class StandupService {
  private standupRepo = new StandupRepository();

  private getLocalDateString(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getMembers(dateStr?: string) {
    const targetDate = dateStr || this.getLocalDateString();
    const submissions = this.standupRepo.getByDate(targetDate);
    
    const statusList = members.map(m => {
      const sub = submissions.find(s => s.member_email.toLowerCase() === m.email.toLowerCase());
      return {
        name: m.name,
        email: m.email,
        submitted: !!sub,
        submitted_at: sub ? sub.submitted_at : null
      };
    });

    return {
      date: targetDate,
      members: statusList
    };
  }

  submitStandup(payload: {
    member_name: string;
    member_email: string;
    yesterday: string;
    today: string;
    blockers: string;
  }): Standup {
    const todayStr = this.getLocalDateString();
    
    // Check if member is configured
    const isConfigured = members.some(
      m => m.email.toLowerCase() === payload.member_email.toLowerCase()
    );
    if (!isConfigured) {
      const err = new Error('No team member found with this name and email. Please contact your manager.');
      (err as any).statusCode = 404;
      (err as any).errorCode = 'MEMBER_NOT_FOUND';
      throw err;
    }

    // Check duplicate
    const existing = this.standupRepo.getByEmailAndDate(payload.member_email, todayStr);
    if (existing) {
      const err = new Error(`${payload.member_name} has already submitted a standup for today (${todayStr}).`);
      (err as any).statusCode = 409;
      (err as any).errorCode = 'DUPLICATE_SUBMISSION';
      throw err;
    }

    const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newStandup: Standup = {
      id: uuid,
      member_name: payload.member_name,
      member_email: payload.member_email,
      yesterday: payload.yesterday.trim(),
      today: payload.today.trim(),
      blockers: payload.blockers.trim(),
      submitted_at: new Date().toISOString(),
      date: todayStr
    };

    this.standupRepo.create(newStandup);
    return newStandup;
  }

  getDigest(dateStr?: string) {
    const targetDate = dateStr || this.getLocalDateString();
    const submissions = this.standupRepo.getByDate(targetDate);
    
    const pendingList: any[] = [];
    members.forEach(m => {
      const submitted = submissions.some(s => s.member_email.toLowerCase() === m.email.toLowerCase());
      if (!submitted) {
        pendingList.push({
          member_name: m.name,
          member_email: m.email,
          status: 'AWAITING_SUBMISSION'
        });
      }
    });

    return {
      date: targetDate,
      total_members: members.length,
      submitted_count: submissions.length,
      pending_count: pendingList.length,
      submissions,
      pending: pendingList
    };
  }
}
