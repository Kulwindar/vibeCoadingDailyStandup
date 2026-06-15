import { StandupRepository } from '../repositories/standup.repository';
import { Standup, Member } from '../types';
import membersRaw from '../config/members.json';
import { BlockerPredictionService } from './blocker-prediction.service';

const members = membersRaw as Member[];

export class StandupService {
  private standupRepo = new StandupRepository();
  private blockerService = new BlockerPredictionService();

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
    source?: string;
  }): Standup {
    const todayStr = this.getLocalDateString();
    
    const isConfigured = members.some(
      m => m.email.toLowerCase() === payload.member_email.toLowerCase()
    );
    if (!isConfigured) {
      const err = new Error('No team member found with this name and email. Please contact your manager.');
      (err as any).statusCode = 404;
      (err as any).errorCode = 'MEMBER_NOT_FOUND';
      throw err;
    }

    const existing = this.standupRepo.getByEmailAndDate(payload.member_email, todayStr);
    if (existing) {
      const err = new Error(`${payload.member_name} has already submitted a standup for today (${todayStr}).`);
      (err as any).statusCode = 409;
      (err as any).errorCode = 'DUPLICATE_SUBMISSION';
      throw err;
    }

    const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const source = payload.source || 'web';
    const newStandup: Standup = {
      id: uuid,
      member_name: payload.member_name,
      member_email: payload.member_email,
      yesterday: payload.yesterday.trim(),
      today: payload.today.trim(),
      blockers: payload.blockers.trim(),
      submitted_at: new Date().toISOString(),
      date: todayStr,
      source
    };

    this.standupRepo.createWithSource({
      id: newStandup.id,
      member_name: newStandup.member_name,
      member_email: newStandup.member_email,
      yesterday: newStandup.yesterday,
      today: newStandup.today,
      blockers: newStandup.blockers,
      submitted_at: newStandup.submitted_at,
      date: newStandup.date,
      source
    });
    
    if (payload.blockers && payload.blockers.trim().toLowerCase() !== 'none') {
      this.blockerService.analyzeBlockers(uuid, payload.blockers, payload.member_name, payload.member_email);
    }
    
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

  submitFromSlack(payload: {
    slack_user_id: string;
    slack_user_email: string;
    slack_user_real_name: string;
    yesterday: string;
    today: string;
    blockers: string;
  }): Standup {
    return this.submitStandup({
      member_name: payload.slack_user_real_name,
      member_email: payload.slack_user_email,
      yesterday: payload.yesterday,
      today: payload.today,
      blockers: payload.blockers,
      source: 'slack'
    });
  }
}
