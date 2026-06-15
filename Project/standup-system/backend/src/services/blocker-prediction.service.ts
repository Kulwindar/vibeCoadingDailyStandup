import { BlockerPredictionRepository } from '../repositories/blocker-prediction.repository';
import { StandupRepository } from '../repositories/standup.repository';
import { BlockerPrediction } from '../types';
import { db } from '../config/db';

export class BlockerPredictionService {
  private predictionRepo = new BlockerPredictionRepository();
  private standupRepo = new StandupRepository();

  analyzeBlockers(standupId: string, blockers: string, memberName: string, memberEmail: string): BlockerPrediction {
    const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const severity = this.determineSeverity(blockers);
    const confidence = this.calculateConfidence(blockers);
    
    const prediction: BlockerPrediction = {
      id: uuid,
      standup_id: standupId,
      member_name: memberName,
      member_email: memberEmail,
      blockers,
      severity,
      confidence,
      analysis: this.generateAnalysis(blockers, severity),
      analyzed_at: new Date().toISOString()
    };

    this.predictionRepo.create(prediction);
    return prediction;
  }

  private determineSeverity(blockers: string): 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' {
    if (!blockers || blockers.toLowerCase() === 'none' || blockers.trim() === '') {
      return 'NONE';
    }

    const blockerLower = blockers.toLowerCase();
    
    const highKeywords = ['blocked', 'blocked by', 'waiting on', 'cannot proceed', 'unable to', 'dependency', 'api down', 'server down'];
    const mediumKeywords = ['delayed', 'waiting for', 'pending', 'blocked by review', 'design review'];
    const lowKeywords = ['minor', 'small issue', 'minor blocker'];

    if (highKeywords.some(k => blockerLower.includes(k))) {
      return 'HIGH';
    }
    if (mediumKeywords.some(k => blockerLower.includes(k))) {
      return 'MEDIUM';
    }
    if (lowKeywords.some(k => blockerLower.includes(k))) {
      return 'LOW';
    }

    if (blockerLower.includes('none') || blockerLower.length < 10) {
      return 'NONE';
    }

    return 'LOW';
  }

  private calculateConfidence(blockers: string): number {
    if (!blockers || blockers.toLowerCase() === 'none') {
      return 0.99;
    }

    const severity = this.determineSeverity(blockers);
    const baseConfidence = {
      HIGH: 0.95,
      MEDIUM: 0.85,
      LOW: 0.75,
      NONE: 0.90
    }[severity];

    const lengthFactor = Math.min(1, blockers.length / 100);
    return Math.round(baseConfidence * (0.7 + 0.3 * lengthFactor) * 100) / 100;
  }

  private generateAnalysis(blockers: string, severity: string): string | null {
    if (severity === 'NONE') return null;
    
    const analysisMap: Record<string, string> = {
      HIGH: 'Critical blocker requiring immediate attention. Team progress halted.',
      MEDIUM: 'Moderate blocker impacting some tasks. Resolution recommended within 24 hours.',
      LOW: 'Minor blocker. Workaround available. Can be addressed in planned timeline.'
    };

    return analysisMap[severity] || null;
  }

  getByDate(date: string, severity?: string): BlockerPrediction[] {
    return this.predictionRepo.getByDate(date, severity);
  }
}